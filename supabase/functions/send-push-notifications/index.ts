
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import {
  ApplicationServer,
  importVapidKeys,
  PushMessageError,
  Urgency,
} from "jsr:@negrel/webpush@0.5.0";

type NotificationSettings = {
  user_id: string;
  enabled: boolean;
  reminder_time: string;
  days_of_week: number[];
  timezone: string;
  last_sent_local_date: string | null;
};

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function decodeBase64Url(value: string): Uint8Array {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");

  const binary = atob(base64);

  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function encodeBase64Url(value: Uint8Array): string {
  let binary = "";

  for (const byte of value) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function createVapidKeys() {
  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");

  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys are not configured");
  }

  const publicBytes = decodeBase64Url(publicKey);
  const privateBytes = decodeBase64Url(privateKey);

  if (publicBytes.length !== 65 || publicBytes[0] !== 4) {
    throw new Error("Invalid VAPID public key");
  }

  if (privateBytes.length !== 32) {
    throw new Error("Invalid VAPID private key");
  }

  const x = encodeBase64Url(publicBytes.slice(1, 33));
  const y = encodeBase64Url(publicBytes.slice(33, 65));
  const d = encodeBase64Url(privateBytes);

  return await importVapidKeys({
    publicKey: {
      kty: "EC",
      crv: "P-256",
      x,
      y,
      ext: true,
      key_ops: ["verify"],
    },
    privateKey: {
      kty: "EC",
      crv: "P-256",
      x,
      y,
      d,
      ext: true,
      key_ops: ["sign"],
    },
  });
}

function getLocalDateTime(timezone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  const date = `${values.year}-${values.month}-${values.day}`;
  const time = `${values.hour}:${values.minute}`;

  const utcDay = new Date(`${date}T00:00:00Z`).getUTCDay();
  const isoDay = utcDay === 0 ? 7 : utcDay;

  return {
    date,
    time,
    day: isoDay,
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return Response.json(
      { error: "Method not allowed" },
      { status: 405 },
    );
  }

  // Function is called only by our scheduled server-side job.
  const cronSecret = Deno.env.get("CRON_SECRET");

  if (
    !cronSecret ||
    req.headers.get("x-cron-secret") !== cronSecret
  ) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT");

    if (!supabaseUrl || !serviceRoleKey || !vapidSubject) {
      throw new Error("Supabase or VAPID environment variables are missing");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const vapidKeys = await createVapidKeys();

    const applicationServer = await ApplicationServer.new({
      contactInformation: vapidSubject,
      vapidKeys,
    });

    const { data: settingsRows, error: settingsError } = await supabase
      .from("notification_settings")
      .select(
        "user_id, enabled, reminder_time, days_of_week, timezone, last_sent_local_date",
      )
      .eq("enabled", true);

    if (settingsError) throw settingsError;

    const settings = (settingsRows || []) as NotificationSettings[];

    if (settings.length === 0) {
      return Response.json({
        success: true,
        message: "No enabled notification settings",
        sent: 0,
      });
    }

    const userIds = settings.map((item) => item.user_id);

    const { data: subscriptionRows, error: subscriptionsError } =
      await supabase
        .from("push_subscriptions")
        .select("id, user_id, endpoint, p256dh, auth")
        .in("user_id", userIds);

    if (subscriptionsError) throw subscriptionsError;

    const subscriptions = (subscriptionRows ||
      []) as PushSubscriptionRow[];

    const subscriptionsByUser = new Map<string, PushSubscriptionRow[]>();

    for (const subscription of subscriptions) {
      const current =
        subscriptionsByUser.get(subscription.user_id) || [];

      current.push(subscription);

      subscriptionsByUser.set(subscription.user_id, current);
    }

    let sent = 0;
    let removed = 0;
    let failed = 0;

    for (const setting of settings) {
      let local;

      try {
        local = getLocalDateTime(setting.timezone || "UTC");
      } catch (error) {
        console.error(
          `Invalid timezone for user ${setting.user_id}:`,
          error,
        );
        continue;
      }

      const reminderTime = setting.reminder_time.slice(0, 5);

      if (local.time !== reminderTime) continue;
      if (!setting.days_of_week.includes(local.day)) continue;

      if (setting.last_sent_local_date === local.date) continue;

      const userSubscriptions =
        subscriptionsByUser.get(setting.user_id) || [];

      if (userSubscriptions.length === 0) continue;

      // Claim this user's notification date to avoid duplicate sends
      // if two scheduled invocations overlap.
      const { data: claimed, error: claimError } = await supabase
        .from("notification_settings")
        .update({
          last_sent_local_date: local.date,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", setting.user_id)
        .eq("enabled", true)
        .or(
          `last_sent_local_date.is.null,last_sent_local_date.neq.${local.date}`,
        )
        .select("user_id")
        .maybeSingle();

      if (claimError) {
        console.error("Could not claim notification:", claimError);
        failed++;
        continue;
      }

      if (!claimed) continue;

      let userSent = false;

      for (const subscription of userSubscriptions) {
        try {
          await applicationServer
            .subscribe({
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            })
            .pushTextMessage(
              JSON.stringify({
                title: "Health Fit",
                body: "Пора уделить немного времени своему здоровью. Твои ежедневные задания ждут тебя!",
                url: "/daily",
              }),
              {
                urgency: Urgency.High,
                ttl: 3600,
              },
            );

          userSent = true;
          sent++;
        } catch (error) {
          const status =
            error instanceof PushMessageError
              ? error.response.status
              : null;

          console.error(
            `Push failed for subscription ${subscription.id}:`,
            status ?? error,
          );

          if (status === 404 || status === 410) {
            const { error: deleteError } = await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", subscription.id);

            if (deleteError) {
              console.error("Could not delete expired subscription:", deleteError);
            } else {
              removed++;
            }
          } else {
            failed++;
          }
        }
      }

      // If all sends failed, allow another attempt on the next Cron run.
      if (!userSent) {
        const { error: rollbackError } = await supabase
          .from("notification_settings")
          .update({
            last_sent_local_date: setting.last_sent_local_date,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", setting.user_id)
          .eq("last_sent_local_date", local.date);

        if (rollbackError) {
          console.error("Could not roll back notification claim:", rollbackError);
        }
      }
    }

    return Response.json({
      success: true,
      sent,
      removed,
      failed,
    });
  } catch (error) {
    console.error("Push notification function failed:", error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
});
