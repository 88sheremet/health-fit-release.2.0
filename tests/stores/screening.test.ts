import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useScreeningStore } from "~/stores/screening";
import { DominantProblem } from "~/enums/DominantProblem.enum";

vi.mock("#imports", () => ({
  useSupabaseClient: vi.fn(),
}));

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
});
