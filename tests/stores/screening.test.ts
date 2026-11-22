import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useScreeningStore } from "~/stores/screening";
import { DominantProblem } from "~/enums/DominantProblem.enum";
import { useSupabaseClient } from "../setup";

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("screening store", () => {
  describe("blocks", () => {
    it("has 3 blocks", () => {
      const store = useScreeningStore();
      expect(store.blocks).toHaveLength(3);
    });

    it("block 1 has 9 physical questions", () => {
      const store = useScreeningStore();
      expect(store.blocks[0].questions).toHaveLength(9);
      expect(store.blocks[0].id).toBe(1);
    });

    it("block 2 has 9 food questions", () => {
      const store = useScreeningStore();
      expect(store.blocks[1].questions).toHaveLength(9);
      expect(store.blocks[1].id).toBe(2);
    });

    it("block 3 has 9 mind questions", () => {
      const store = useScreeningStore();
      expect(store.blocks[2].questions).toHaveLength(9);
      expect(store.blocks[2].id).toBe(3);
    });
  });

  describe("currentBlockData", () => {
    it("returns first block at start", () => {
      const store = useScreeningStore();
      expect(store.currentBlockData.id).toBe(1);
    });

    it("returns second block after advance", () => {
      const store = useScreeningStore();
      store.currentBlock = 1;
      expect(store.currentBlockData.id).toBe(2);
    });

    it("returns third block at last index", () => {
      const store = useScreeningStore();
      store.currentBlock = 2;
      expect(store.currentBlockData.id).toBe(3);
    });
  });

  describe("progress", () => {
    it("returns 1/3 at start", () => {
      const store = useScreeningStore();
      expect(store.progress).toBeCloseTo(1 / 3);
    });

    it("returns 2/3 at block 1", () => {
      const store = useScreeningStore();
      store.currentBlock = 1;
      expect(store.progress).toBeCloseTo(2 / 3);
    });

    it("returns 1 at last block", () => {
      const store = useScreeningStore();
      store.currentBlock = 2;
      expect(store.progress).toBe(1);
    });
  });

  describe("dominantProblem", () => {
    it("returns Physical when physical score is highest", () => {
      const store = useScreeningStore();
      store.blockScores = { 1: 10, 2: 5, 3: 3 };
      expect(store.dominantProblem).toBe(DominantProblem.Physical);
    });

    it("returns Food when food score is highest", () => {
      const store = useScreeningStore();
      store.blockScores = { 1: 5, 2: 10, 3: 3 };
      expect(store.dominantProblem).toBe(DominantProblem.Food);
    });

    it("returns Mind when mind score is highest", () => {
      const store = useScreeningStore();
      store.blockScores = { 1: 5, 2: 3, 3: 10 };
      expect(store.dominantProblem).toBe(DominantProblem.Mind);
    });

    it("defaults to Physical on tie", () => {
      const store = useScreeningStore();
      store.blockScores = { 1: 10, 2: 10, 3: 10 };
      expect(store.dominantProblem).toBe(DominantProblem.Physical);
    });

    it("defaults to Physical when all scores are 0", () => {
      const store = useScreeningStore();
      store.blockScores = {};
      expect(store.dominantProblem).toBe(DominantProblem.Physical);
    });

    it("defaults to Physical when only food is set", () => {
      const store = useScreeningStore();
      store.blockScores = { 2: 5 };
      expect(store.dominantProblem).toBe(DominantProblem.Food);
    });
  });

  describe("setAnswer", () => {
    it("stores answer for a question", () => {
      const store = useScreeningStore();
      store.setAnswer(101, 3);
      expect(store.answers[101]).toBe(3);
    });

    it("overwrites previous answer", () => {
      const store = useScreeningStore();
      store.setAnswer(101, 3);
      store.setAnswer(101, 5);
      expect(store.answers[101]).toBe(5);
    });
  });

  describe("validateCurrentBlock", () => {
    it("returns false when questions are unanswered", () => {
      const store = useScreeningStore();
      expect(store.validateCurrentBlock()).toBe(false);
    });

    it("returns true when all questions are answered", () => {
      const store = useScreeningStore();
      for (const q of store.currentBlockData.questions) {
        store.setAnswer(q.id, 3);
      }
      expect(store.validateCurrentBlock()).toBe(true);
    });

    it("returns false when only some questions are answered", () => {
      const store = useScreeningStore();
      store.setAnswer(101, 3);
      store.setAnswer(102, 2);
      expect(store.validateCurrentBlock()).toBe(false);
    });
  });

  describe("calculateCurrentBlockScore", () => {
    it("sums answers for current block", () => {
      const store = useScreeningStore();
      for (const q of store.currentBlockData.questions) {
        store.setAnswer(q.id, 2);
      }
      store.calculateCurrentBlockScore();
      expect(store.blockScores[1]).toBe(18);
    });

    it("treats missing answers as 0", () => {
      const store = useScreeningStore();
      store.setAnswer(101, 5);
      store.calculateCurrentBlockScore();
      expect(store.blockScores[1]).toBe(5);
    });
  });

  describe("nextBlock", () => {
    it("advances to next block", () => {
      const store = useScreeningStore();
      store.nextBlock();
      expect(store.currentBlock).toBe(1);
    });

    it("does not go beyond last block", () => {
      const store = useScreeningStore();
      store.currentBlock = 2;
      store.nextBlock();
      expect(store.currentBlock).toBe(2);
    });

    it("calculates score before advancing", () => {
      const store = useScreeningStore();
      store.setAnswer(101, 3);
      store.nextBlock();
      expect(store.blockScores[1]).toBe(3);
    });
  });

  describe("isLastBlock", () => {
    it("returns false at start", () => {
      const store = useScreeningStore();
      expect(store.isLastBlock()).toBe(false);
    });

    it("returns true at last block", () => {
      const store = useScreeningStore();
      store.currentBlock = 2;
      expect(store.isLastBlock()).toBe(true);
    });
  });

  describe("resetScreening", () => {
    it("resets all state", () => {
      const store = useScreeningStore();
      store.screeningCompleted = true;
      store.currentBlock = 2;
      store.answers = { 101: 3 };
      store.blockScores = { 1: 5 };
      store.error = "some error";

      store.resetScreening();

      expect(store.screeningCompleted).toBe(false);
      expect(store.currentBlock).toBe(0);
      expect(store.answers).toEqual({});
      expect(store.blockScores).toEqual({});
      expect(store.error).toBeNull();
    });
  });

  describe("screening type", () => {
    it("defaults to initial screening and its table", () => {
      const store = useScreeningStore();

      expect(store.screeningType).toBe("initial");
      expect(store.getTableName()).toBe("screening_results");
    });

    it("switches to the final screening table", () => {
      const store = useScreeningStore();
      store.screeningType = "final";

      expect(store.getTableName()).toBe("final_screening_results");
    });

    it("startScreening sets the type and clears previous answers", () => {
      const store = useScreeningStore();
      store.answers = { 101: 5 };
      store.blockScores = { 1: 5 };
      store.currentBlock = 2;
      store.screeningCompleted = true;

      store.startScreening("final");

      expect(store.screeningType).toBe("final");
      expect(store.getTableName()).toBe("final_screening_results");
      expect(store.answers).toEqual({});
      expect(store.blockScores).toEqual({});
      expect(store.currentBlock).toBe(0);
      expect(store.screeningCompleted).toBe(false);
    });

    it("startScreening can switch back to initial", () => {
      const store = useScreeningStore();
      store.startScreening("final");
      store.startScreening("initial");

      expect(store.screeningType).toBe("initial");
      expect(store.getTableName()).toBe("screening_results");
    });

    it("resetScreening preserves the selected type", () => {
      const store = useScreeningStore();
      store.startScreening("final");
      store.answers = { 101: 3 };

      store.resetScreening();

      expect(store.screeningType).toBe("final");
      expect(store.getTableName()).toBe("final_screening_results");
      expect(store.answers).toEqual({});
    });
  });
});

type QueryResult = { data: any; error: any };

function mockScreeningTables(tables: Record<string, QueryResult>) {
  const chains: Record<string, any> = {};

  const from = vi.fn((table: string) => {
    const result = tables[table] ?? { data: null, error: null };
    const chain: any = Promise.resolve(result);

    ["select", "eq", "maybeSingle", "upsert"].forEach((method) => {
      chain[method] = vi.fn().mockReturnValue(chain);
    });

    chains[table] = chain;
    return chain;
  });

  vi.mocked(useSupabaseClient).mockReturnValue({
    auth: {
      getUser: vi
        .fn()
        .mockResolvedValue({ data: { user: { id: "u1" } }, error: null }),
    },
    from,
  } as any);

  return { from, chains };
}

describe("screening persistence by type", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("loads the initial result from screening_results", async () => {
    const { from } = mockScreeningTables({
      screening_results: {
        data: {
          answers: { 101: 3 },
          physical_score: 12,
          food_score: 8,
          mind_score: 4,
          dominant_problem: "physical",
          completed_at: "2026-11-01T00:00:00.000Z",
          updated_at: "2026-11-01T00:00:00.000Z",
        },
        error: null,
      },
    });
    const store = useScreeningStore();

    await store.loadScreening();

    expect(from).toHaveBeenCalledWith("screening_results");
    expect(from).not.toHaveBeenCalledWith("final_screening_results");
    expect(store.answers).toEqual({ 101: 3 });
    expect(store.blockScores).toEqual({ 1: 12, 2: 8, 3: 4 });
    expect(store.screeningCompleted).toBe(true);
    expect(store.loading).toBe(false);
  });

  it("loads the final result from final_screening_results", async () => {
    const { from } = mockScreeningTables({
      final_screening_results: {
        data: {
          answers: { 201: 1 },
          physical_score: 6,
          food_score: 5,
          mind_score: 3,
          dominant_problem: "physical",
          completed_at: "2026-11-20T00:00:00.000Z",
          updated_at: "2026-11-20T00:00:00.000Z",
        },
        error: null,
      },
    });
    const store = useScreeningStore();
    store.startScreening("final");

    await store.loadScreening();

    expect(from).toHaveBeenCalledWith("final_screening_results");
    expect(from).not.toHaveBeenCalledWith("screening_results");
    expect(store.blockScores).toEqual({ 1: 6, 2: 5, 3: 3 });
    expect(store.screeningCompleted).toBe(true);
  });

  it("keeps results empty when the final table has no row", async () => {
    mockScreeningTables({
      final_screening_results: { data: null, error: null },
    });
    const store = useScreeningStore();
    store.startScreening("final");
    store.answers = { 101: 4 };

    await store.loadScreening();

    expect(store.answers).toEqual({});
    expect(store.screeningCompleted).toBe(false);
    expect(store.error).toBeNull();
  });

  it("saves an initial result into screening_results", async () => {
    const { chains } = mockScreeningTables({
      screening_results: { data: null, error: null },
    });
    const store = useScreeningStore();
    store.answers = { 101: 1 };
    store.blockScores = { 1: 9, 2: 18, 3: 27 };

    await store.saveScreening();

    expect(chains["screening_results"].upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "u1",
        physical_score: 9,
        food_score: 18,
        mind_score: 27,
        dominant_problem: DominantProblem.Mind,
      }),
      { onConflict: "user_id" },
    );
    expect(store.screeningCompleted).toBe(true);
  });

  it("saves a final result into final_screening_results", async () => {
    const { from, chains } = mockScreeningTables({
      final_screening_results: { data: null, error: null },
    });
    const store = useScreeningStore();
    store.startScreening("final");
    store.blockScores = { 1: 5, 2: 10, 3: 15 };

    await store.saveScreening();

    expect(from).toHaveBeenCalledWith("final_screening_results");
    expect(chains["final_screening_results"].upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "u1",
        physical_score: 5,
        food_score: 10,
        mind_score: 15,
        dominant_problem: DominantProblem.Mind,
        completed_at: expect.any(String),
        updated_at: expect.any(String),
      }),
      { onConflict: "user_id" },
    );
    expect(store.error).toBeNull();
  });

  it("completeScreening includes the last block before saving a final result", async () => {
    const { chains } = mockScreeningTables({
      final_screening_results: { data: null, error: null },
    });
    const store = useScreeningStore();
    store.startScreening("final");
    store.currentBlock = 2;
    for (const question of store.currentBlockData.questions) {
      store.setAnswer(question.id, 3);
    }

    await store.completeScreening();

    expect(store.blockScores[3]).toBe(27);
    expect(chains["final_screening_results"].upsert).toHaveBeenCalledWith(
      expect.objectContaining({ mind_score: 27 }),
      { onConflict: "user_id" },
    );
  });

  it("reports save errors without changing the completed flag", async () => {
    mockScreeningTables({
      final_screening_results: {
        data: null,
        error: new Error("save failed"),
      },
    });
    const store = useScreeningStore();
    store.startScreening("final");

    await expect(store.saveScreening()).rejects.toThrow("save failed");

    expect(store.error).toBe("save failed");
    expect(store.screeningCompleted).toBe(false);
    expect(store.loading).toBe(false);
  });
});
