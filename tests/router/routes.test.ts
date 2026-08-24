import { describe, it, expect } from "vitest";
import { routes } from "~/router/routes";

describe("routes", () => {
  it("has all onboarding routes", () => {
    expect(routes.onboarding.screening).toBe("/screening");
    expect(routes.onboarding.questions).toBe("/questions");
    expect(routes.onboarding.welcome).toBe("/welcome");
  });

  it("has all auth routes", () => {
    expect(routes.auth.login).toBe("/login");
    expect(routes.auth.register).toBe("/register");
    expect(routes.auth.forgotPassword).toBe("/forgot-password");
    expect(routes.auth.resetPassword).toBe("/reset-password");
  });

  it("has all result routes", () => {
    expect(routes.results.physical).toBe("/physical-result");
    expect(routes.results.food).toBe("/food-result");
    expect(routes.results.mind).toBe("/mind-result");
  });

  it("has all recovery routes", () => {
    expect(routes.recovery.menu).toBe("/menu");
    expect(routes.recovery.daily).toBe("/daily");
    expect(routes.recovery.weekly).toBe("/weekly");
    expect(routes.recovery.journal).toBe("/journal");
    expect(routes.recovery.journalArchive).toBe("/journal-archive");
    expect(routes.recovery.journalChart).toBe("/journal-chart");
  });

  it("has settings route", () => {
    expect(routes.settings).toBe("/settings");
  });

  it("all routes start with /", () => {
    const flat = Object.values(routes).flatMap((group) =>
      typeof group === "string" ? [group] : Object.values(group),
    );

    for (const route of flat) {
      expect(route).toMatch(/^\//);
    }
  });

  it("no route has trailing slash", () => {
    const flat = Object.values(routes).flatMap((group) =>
      typeof group === "string" ? [group] : Object.values(group),
    );

    for (const route of flat) {
      expect(route).not.toMatch(/\/$/);
    }
  });

  it("all routes are unique", () => {
    const flat = Object.values(routes).flatMap((group) =>
      typeof group === "string" ? [group] : Object.values(group),
    );

    expect(new Set(flat).size).toBe(flat.length);
  });
});
