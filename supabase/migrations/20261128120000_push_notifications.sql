create table if not exists public.notification_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  enabled boolean not null default false,
  reminder_time text not null default '09:30',
  days_of_week integer[] not null default array[1, 2, 3, 4, 5, 6],
  timezone text not null default 'UTC',
  last_sent_local_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  expiration_time timestamptz,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_settings enable row level security;
alter table public.push_subscriptions enable row level security;

drop policy if exists "Users manage own notification settings" on public.notification_settings;
create policy "Users manage own notification settings"
  on public.notification_settings
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own push subscriptions" on public.push_subscriptions;
create policy "Users manage own push subscriptions"
  on public.push_subscriptions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.notification_settings to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if to_regclass('vault.decrypted_secrets') is null then
    raise notice 'Vault is unavailable: send-push-notifications cron job was not scheduled';
    return;
  end if;

  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'send-push-notifications';

  perform cron.schedule(
    'send-push-notifications',
    '* * * * *',
    $job$
    with secrets as (
      select
        max(decrypted_secret) filter (
          where name = 'push_notifications_project_url'
        ) as project_url,
        max(decrypted_secret) filter (
          where name = 'push_notifications_cron_secret'
        ) as cron_secret
      from vault.decrypted_secrets
    )
    select
      case
        when project_url is null or cron_secret is null then null
        else net.http_post(
          url := project_url || '/functions/v1/send-push-notifications',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cron-secret', cron_secret
          ),
          body := '{}'::jsonb,
          timeout_milliseconds := 10000
        )
      end
    from secrets
    $job$
  );
end $$;
