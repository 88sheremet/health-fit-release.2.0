import { describe, it, expect, vi, afterEach } from "vitest";
import {
  DAY_COUNT,
  MILLISECONDS_IN_DAY,
  getDaysSince,
  getTodayKey,
  getDayIndex,
  isRestDayByDate,
  isRestDay,
} from "~/utils/taskEngine";

afterEach(() => {
  vi.useRealTimers();
});

describe("constants", () => {
  it("DAY_COUNT is 30", () => {
    expect(DAY_COUNT).toBe(30);
  });

  it("MILLISECONDS_IN_DAY is 86400000", () => {
    expect(MILLISECONDS_IN_DAY).toBe(86400000);
  });
});

describe("getDaysSince", () => {
  it("returns 0 for today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));

    expect(getDaysSince("2026-06-15")).toBe(0);
  });

  it("returns 1 for yesterday", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));

    expect(getDaysSince("2026-06-14")).toBe(1);
  });

  it("returns 30 for 30 days ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T12:00:00"));

    expect(getDaysSince("2026-06-15")).toBe(30);
  });

  it("accepts Date objects", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-20T12:00:00"));

    expect(getDaysSince(new Date("2026-06-18"))).toBe(2);
  });
});

describe("getTodayKey", () => {
  it("returns YYYY-MM-DD format", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-05T10:00:00"));

    expect(getTodayKey()).toBe("2026-03-05");
  });

  it("pads single-digit month and day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-09T10:00:00"));

    expect(getTodayKey()).toBe("2026-01-09");
  });
});

describe("getDayIndex", () => {
  it("returns 1 on start date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00"));

    expect(getDayIndex("2026-06-15")).toBe(1);
  });

  it("returns 2 on second day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-16T12:00:00"));

    expect(getDayIndex("2026-06-15")).toBe(2);
  });

  it("returns 30 on day 30", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-14T12:00:00"));

    expect(getDayIndex("2026-06-15")).toBe(30);
  });

  it("returns 31 on day 31 (beyond cycle)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T12:00:00"));

    expect(getDayIndex("2026-06-15")).toBe(31);
  });

  it("ignores time of day — uses local midnight", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-16T01:00:00"));

    expect(getDayIndex("2026-06-15")).toBe(2);
  });
});

describe("isRestDayByDate", () => {
  it("returns true for Sunday", () => {
    expect(isRestDayByDate(new Date("2026-06-14"))).toBe(true); // Sunday
  });

  it("returns false for Monday", () => {
    expect(isRestDayByDate(new Date("2026-06-15"))).toBe(false); // Monday
  });

  it("returns false for Saturday", () => {
    expect(isRestDayByDate(new Date("2026-06-13"))).toBe(false); // Saturday
  });
});

describe("isRestDay", () => {
  it("returns true for multiples of 7", () => {
    expect(isRestDay(7)).toBe(true);
    expect(isRestDay(14)).toBe(true);
    expect(isRestDay(21)).toBe(true);
  });

  it("returns false for non-multiples of 7", () => {
    expect(isRestDay(1)).toBe(false);
    expect(isRestDay(6)).toBe(false);
    expect(isRestDay(8)).toBe(false);
  });
});
