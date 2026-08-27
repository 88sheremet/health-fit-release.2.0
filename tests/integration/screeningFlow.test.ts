import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useScreeningStore } from "~/stores/screening";
import { DominantProblem } from "~/enums/DominantProblem.enum";

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("screening flow integration", () => {
  it("completes full screening: answer all blocks, dominantProblem matches highest", () => {
    const store = useScreeningStore();

    // --- Block 1 (physical) ---
    expect(store.currentBlockData.id).toBe(1);
    for (const q of store.blocks[0].questions) {
      store.setAnswer(q.id, 4); // high
    }
    expect(store.validateCurrentBlock()).toBe(true);
    store.nextBlock();

    // --- Block 2 (food) ---
    expect(store.currentBlockData.id).toBe(2);
    for (const q of store.blocks[1].questions) {
      store.setAnswer(q.id, 2); // low
    }
    expect(store.validateCurrentBlock()).toBe(true);
    store.nextBlock();

    // --- Block 3 (mind) ---
    expect(store.currentBlockData.id).toBe(3);
    expect(store.isLastBlock()).toBe(true);
    for (const q of store.blocks[2].questions) {
      store.setAnswer(q.id, 3); // medium
    }
    expect(store.validateCurrentBlock()).toBe(true);
    store.calculateCurrentBlockScore();

    // Verify scores
    expect(store.blockScores[1]).toBe(36); // 9 * 4
    expect(store.blockScores[2]).toBe(18); // 9 * 2
    expect(store.blockScores[3]).toBe(27); // 9 * 3

    // Physical highest → dominant = Physical
    expect(store.dominantProblem).toBe(DominantProblem.Physical);
  });

  it("determines Food as dominant when food answers are highest", () => {
    const store = useScreeningStore();

    // Block 1: low
    for (const q of store.blocks[0].questions) {
      store.setAnswer(q.id, 1);
    }
    store.nextBlock();

    // Block 2: high
    for (const q of store.blocks[1].questions) {
      store.setAnswer(q.id, 5);
    }
    store.nextBlock();

    // Block 3: medium
    for (const q of store.blocks[2].questions) {
      store.setAnswer(q.id, 3);
    }
    store.calculateCurrentBlockScore();

    expect(store.blockScores[1]).toBe(9);
    expect(store.blockScores[2]).toBe(45);
    expect(store.blockScores[3]).toBe(27);
    expect(store.dominantProblem).toBe(DominantProblem.Food);
  });

  it("determines Mind as dominant when mind answers are highest", () => {
    const store = useScreeningStore();

    for (const q of store.blocks[0].questions) {
      store.setAnswer(q.id, 2);
    }
    store.nextBlock();

    for (const q of store.blocks[1].questions) {
      store.setAnswer(q.id, 2);
    }
    store.nextBlock();

    for (const q of store.blocks[2].questions) {
      store.setAnswer(q.id, 5);
    }
    store.calculateCurrentBlockScore();

    expect(store.blockScores[1]).toBe(18);
    expect(store.blockScores[2]).toBe(18);
    expect(store.blockScores[3]).toBe(45);
    expect(store.dominantProblem).toBe(DominantProblem.Mind);
  });

  it("progress goes from 1/3 → 2/3 → 1 through blocks", () => {
    const store = useScreeningStore();
    const progressValues: number[] = [];

    progressValues.push(store.progress);
    for (const q of store.blocks[0].questions) store.setAnswer(q.id, 3);
    store.nextBlock();

    progressValues.push(store.progress);
    for (const q of store.blocks[1].questions) store.setAnswer(q.id, 3);
    store.nextBlock();

    progressValues.push(store.progress);

    expect(progressValues).toEqual([1 / 3, 2 / 3, 1]);
  });

  it("resetScreening clears all accumulated data for re-take", () => {
    const store = useScreeningStore();

    // Complete first block
    for (const q of store.blocks[0].questions) store.setAnswer(q.id, 4);
    store.nextBlock();
    expect(store.currentBlock).toBe(1);
    expect(store.blockScores[1]).toBe(36);

    // Reset
    store.resetScreening();
    expect(store.currentBlock).toBe(0);
    expect(store.answers).toEqual({});
    expect(store.blockScores).toEqual({});
    expect(store.screeningCompleted).toBe(false);
    expect(store.currentBlockData.id).toBe(1);
  });

  it("can advance through all blocks and re-take", () => {
    const store = useScreeningStore();

    // First pass
    for (let i = 0; i < 3; i++) {
      for (const q of store.blocks[i].questions) store.setAnswer(q.id, 3);
      if (i < 2) store.nextBlock();
    }
    store.calculateCurrentBlockScore();
    expect(store.blockScores[3]).toBe(27);

    // Re-take
    store.resetScreening();
    for (let i = 0; i < 3; i++) {
      for (const q of store.blocks[i].questions) store.setAnswer(q.id, 5);
      if (i < 2) store.nextBlock();
    }
    store.calculateCurrentBlockScore();
    expect(store.blockScores[1]).toBe(45);
  });
});
