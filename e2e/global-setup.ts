import { chromium, type FullConfig } from "@playwright/test";

const ROUTES = [
  "/",
  "/login",
  "/register",
  "/daily",
  "/weekly",
  "/journal",
  "/journal-chart",
  "/journal-archive",
  "/menu",
  "/welcome",
  "/screening",
  "/questions",
];

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || "http://localhost:3100";
  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const route of ROUTES) {
    for (let attempt = 1; attempt <= 30; attempt++) {
      try {
        await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(250);
        const text = await page.locator("#__nuxt").innerText().catch(() => "");
        if (text.trim().length > 0) break;
      } catch {
        // dev server still warming up
      }
    }
  }

  await browser.close();
}
