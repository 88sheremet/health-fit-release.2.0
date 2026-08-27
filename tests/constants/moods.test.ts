import { describe, it, expect } from "vitest";
import { moodEmojis, moodOptions } from "~/constants/moods";

describe("moodEmojis", () => {
  it("has entries for mood 1-5", () => {
    expect(moodEmojis[1]).toBeDefined();
    expect(moodEmojis[2]).toBeDefined();
    expect(moodEmojis[3]).toBeDefined();
    expect(moodEmojis[4]).toBeDefined();
    expect(moodEmojis[5]).toBeDefined();
  });

  it("each value is a string", () => {
    for (const emoji of Object.values(moodEmojis)) {
      expect(typeof emoji).toBe("string");
    }
  });

  it("mood 1 is angry emoji", () => {
    expect(moodEmojis[1]).toBe("😡");
  });

  it("mood 5 is happy emoji", () => {
    expect(moodEmojis[5]).toBe("😄");
  });
});

describe("moodOptions", () => {
  it("has 5 options", () => {
    expect(moodOptions).toHaveLength(5);
  });

  it("is sorted from best to worst (5 to 1)", () => {
    const values = moodOptions.map((o) => o.value);
    expect(values).toEqual([5, 4, 3, 2, 1]);
  });

  it("each option has value, emoji, and labelKey", () => {
    for (const option of moodOptions) {
      expect(typeof option.value).toBe("number");
      expect(typeof option.emoji).toBe("string");
      expect(typeof option.labelKey).toBe("string");
      expect(option.labelKey).toMatch(/^moods\./);
    }
  });

  it("emojis match moodEmojis map", () => {
    for (const option of moodOptions) {
      expect(option.emoji).toBe(moodEmojis[option.value]);
    }
  });
});
