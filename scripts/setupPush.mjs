import { execSync } from "node:child_process";
import "dotenv/config";

const required = [
  "NUXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  "CRON_SECRET",
  "SUPABASE_URL",
];

const missing = required.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error(`Missing in .env: ${missing.join(", ")}`);
  process.exit(1);
}

function quote(value) {
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

function run(args) {
  execSync(`npx --yes supabase ${args.map(quote).join(" ")}`, {
    stdio: "inherit",
  });
}

run([
  "secrets",
  "set",
  `VAPID_PUBLIC_KEY=${process.env.NUXT_PUBLIC_VAPID_PUBLIC_KEY}`,
  `VAPID_PRIVATE_KEY=${process.env.VAPID_PRIVATE_KEY}`,
  `VAPID_SUBJECT=${process.env.VAPID_SUBJECT}`,
  `CRON_SECRET=${process.env.CRON_SECRET}`,
]);

run([
  "functions",
  "deploy",
  "send-push-notifications",
  "--no-verify-jwt",
]);

console.log("\nNow run this in Supabase SQL Editor:");
console.log(
  `select vault.create_secret('${process.env.SUPABASE_URL}', 'push_notifications_project_url');`,
);
console.log(
  "select vault.create_secret('<CRON_SECRET>', 'push_notifications_cron_secret');",
);
console.log("Then apply supabase/migrations/20261128120000_push_notifications.sql");
