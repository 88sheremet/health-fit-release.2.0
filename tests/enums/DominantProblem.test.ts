import { describe, it, expect } from "vitest";
import { DominantProblem } from "~/enums/DominantProblem.enum";

describe("DominantProblem enum", () => {
  it("has Physical value", () => {
    expect(DominantProblem.Physical).toBe("physical");
  });

  it("has Food value", () => {
    expect(DominantProblem.Food).toBe("food");
  });

  it("has Mind value", () => {
    expect(DominantProblem.Mind).toBe("mind");
  });

  it("has exactly 3 members", () => {
    const keys = Object.keys(DominantProblem);
    expect(keys).toHaveLength(3);
  });

  it("string values are lowercase", () => {
    for (const key of Object.keys(DominantProblem)) {
      expect(DominantProblem[key as keyof typeof DominantProblem]).toBe(
        DominantProblem[key as keyof typeof DominantProblem].toLowerCase(),
      );
    }
  });
});
