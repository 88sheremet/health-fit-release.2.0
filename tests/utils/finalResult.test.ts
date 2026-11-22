import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  getTotalScore,
  getChangeStatus,
  getChangeIcon,
  getOverallChangeText,
  getScoreComparisons,
} from "~/utils/finalResult";
import type { ScreeningScoreRow } from "~/utils/finalResult";

const t = vi.fn((key: string, values?: Record<string, any>) =>
  values?.value === undefined ? key : `${key}:${values.value}`
);

beforeEach(() => {
  t.mockClear();
});

describe("getTotalScore", () => {
  it("returns 0 when there is no result", () => {
    expect(getTotalScore(null)).toBe(0);
  });

  it("sums the three directions", () => {
    const row: ScreeningScoreRow = {
      physical_score: 20,
      food_score: 15,
      mind_score: 10,
    };

    expect(getTotalScore(row)).toBe(45);
  });

  it("coerces string scores and treats null as zero", () => {
    const row: ScreeningScoreRow = {
      physical_score: "12",
      food_score: null,
      mind_score: "8",
    };

    expect(getTotalScore(row)).toBe(20);
  });
});

describe("getChangeStatus", () => {
  it("marks a positive improvement", () => {
    expect(getChangeStatus(5)).toBe("improved");
  });

  it("marks a decline", () => {
    expect(getChangeStatus(-5)).toBe("declined");
  });

  it("marks no change", () => {
    expect(getChangeStatus(0)).toBe("unchanged");
  });
});

describe("getChangeIcon", () => {
  it("maps statuses to trends", () => {
    expect(getChangeIcon("improved")).toBe("trending_down");
    expect(getChangeIcon("declined")).toBe("trending_up");
    expect(getChangeIcon("unchanged")).toBe("trending_flat");
  });
});

describe("getOverallChangeText", () => {
  it("uses the improvement key and positive delta", () => {
    expect(getOverallChangeText(12, t)).toBe("program.overallImproved:12");
    expect(t).toHaveBeenCalledWith("program.overallImproved", { value: 12 });
  });

  it("uses the decline key with an absolute delta", () => {
    expect(getOverallChangeText(-9, t)).toBe("program.overallDeclined:9");
    expect(t).toHaveBeenCalledWith("program.overallDeclined", { value: 9 });
  });

  it("uses the unchanged key without values", () => {
    expect(getOverallChangeText(0, t)).toBe("program.overallUnchanged");
    expect(t).toHaveBeenCalledWith("program.overallUnchanged");
  });
});

describe("getScoreComparisons", () => {
  const initial: ScreeningScoreRow = {
    physical_score: 30,
    food_score: 20,
    mind_score: 10,
  };
  const final: ScreeningScoreRow = {
    physical_score: 20,
    food_score: 25,
    mind_score: 10,
  };

  it("returns no comparisons without both results", () => {
    expect(getScoreComparisons(null, final, t)).toEqual([]);
    expect(getScoreComparisons(initial, null, t)).toEqual([]);
  });

  it("builds a comparison for each direction", () => {
    const result = getScoreComparisons(initial, final, t);

    expect(result).toHaveLength(3);
    expect(result.map((item) => item.key)).toEqual([
      "physical",
      "food",
      "mind",
    ]);
    expect(result.map((item) => item.label)).toEqual([
      "program.physical",
      "program.food",
      "program.mind",
    ]);
    expect(result.map((item) => item.initial)).toEqual([30, 20, 10]);
    expect(result.map((item) => item.final)).toEqual([20, 25, 10]);
  });

  it("maps improved, declined and unchanged directions", () => {
    const result = getScoreComparisons(initial, final, t);

    expect(result[0]).toMatchObject({
      improvement: 10,
      status: "improved",
      icon: "trending_down",
      changeText: "program.improvedBy:10",
      insight: "program.directionImproved",
    });
    expect(result[1]).toMatchObject({
      improvement: -5,
      status: "declined",
      icon: "trending_up",
      changeText: "program.declinedBy:5",
      insight: "program.directionDeclined",
    });
    expect(result[2]).toMatchObject({
      improvement: 0,
      status: "unchanged",
      icon: "trending_flat",
      changeText: "program.noChange",
      insight: "program.directionUnchanged",
    });
  });

  it("coerces numeric strings in direction scores", () => {
    const result = getScoreComparisons(
      { physical_score: "30", food_score: "20", mind_score: "10" },
      { physical_score: "10", food_score: "20", mind_score: "30" },
      t
    );

    expect(result.map((item) => item.improvement)).toEqual([20, 0, -20]);
    expect(result[2].changeText).toBe("program.declinedBy:20");
  });
});
