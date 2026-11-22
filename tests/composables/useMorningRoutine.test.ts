import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";

import { useTaskStore } from "~/stores/dailyTasks";
import {
  completeMorningRoutineDay,
  getMorningRoutineCompletions,
} from "~/services/morningRoutine.service";
import { useMorningRoutine } from "~/composables/useMorningRoutine";

vi.mock("~/services/morningRoutine.service", () => ({
  getMorningRoutineCompletions: vi.fn(),
  completeMorningRoutineDay: vi.fn(),
}));

const NOW = new Date("2026-06-30T12:00:00");

function startDateForChallengeDay(day: number) {
  const date = new Date(
    NOW.getFullYear(),
    NOW.getMonth(),
    NOW.getDate() - (day + 20)
  );

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${dayOfMonth}T00:00:00`;
}

async function setup(challengeDay: number | null = 1, completions: number[] = []) {
  const dailyStore = useTaskStore();
  dailyStore.startDate =
    challengeDay === null ? "" : startDateForChallengeDay(challengeDay);

  vi.mocked(getMorningRoutineCompletions).mockResolvedValue(completions);

  const routine = useMorningRoutine();
  await routine.loadProgress();

  return { dailyStore, routine };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.clearAllMocks();
  setActivePinia(createPinia());
});

afterEach(() => {
  vi.useRealTimers();
});

describe("morning routine status", () => {
  it("is upcoming before the challenge starts", async () => {
    const { routine } = await setup(null);

    expect(routine.currentChallengeDay.value).toBe(0);
    expect(routine.status.value).toBe("upcoming");
    expect(routine.canCompleteToday.value).toBe(false);
    expect(routine.missedDays.value).toBe(0);
    expect(routine.isRewardEligible.value).toBe(false);
  });

  it("is active on the first and last challenge days", async () => {
    for (const day of [1, 7]) {
      const { routine } = await setup(day);
      expect(routine.currentChallengeDay.value).toBe(day);
      expect(routine.status.value).toBe("active");
      expect(routine.canCompleteToday.value).toBe(true);
      expect(routine.isRewardEligible.value).toBe(false);
    }
  });

  it("cannot complete a day that is already completed", async () => {
    const { routine } = await setup(2, [1, 2, 3]);

    expect(routine.isTodayCompleted.value).toBe(true);
    expect(routine.canCompleteToday.value).toBe(false);
  });

  it("is a success after the challenge with at least 5 completions", async () => {
    const { routine } = await setup(8, [1, 2, 3, 4, 5]);

    expect(routine.status.value).toBe("success");
    expect(routine.isRewardEligible.value).toBe(true);
    expect(routine.completedCount.value).toBe(5);
    expect(routine.missedDays.value).toBe(2);
    expect(routine.canCompleteToday.value).toBe(false);
  });

  it("is a failure after the challenge with fewer than 5 completions", async () => {
    const { routine } = await setup(8, [1, 2, 3, 4]);

    expect(routine.status.value).toBe("failed");
    expect(routine.isRewardEligible.value).toBe(false);
    expect(routine.missedDays.value).toBe(3);
  });

  it("caps missed days at the challenge duration", async () => {
    const { routine } = await setup(30, [1, 2]);

    expect(routine.currentChallengeDay.value).toBe(30);
    expect(routine.missedDays.value).toBe(5);
    expect(routine.status.value).toBe("failed");
  });
});

describe("loadProgress", () => {
  it("loads completed days and refreshes the current challenge day", async () => {
    const { routine } = await setup(3, [1, 3]);
    vi.mocked(getMorningRoutineCompletions).mockClear();

    await routine.loadProgress();

    expect(getMorningRoutineCompletions).toHaveBeenCalledOnce();
    expect(routine.completedDays.value).toEqual([1, 3]);
    expect(routine.completedCount.value).toBe(2);
    expect(routine.currentChallengeDay.value).toBe(3);
    expect(routine.isLoading.value).toBe(false);
    expect(routine.error.value).toBeNull();
  });

  it("uses the load error key and stops loading on failure", async () => {
    const { routine } = await setup(1);
    vi.mocked(getMorningRoutineCompletions).mockRejectedValue(
      new Error("load failed")
    );

    await routine.loadProgress();

    expect(routine.error.value).toBe("weekly.morningRoutine.errors.load");
    expect(routine.completedDays.value).toEqual([]);
    expect(routine.isLoading.value).toBe(false);
  });
});

describe("completeToday", () => {
  it("does nothing when the challenge has not started", async () => {
    const { routine } = await setup(null);

    await expect(routine.completeToday()).resolves.toBe(false);

    expect(completeMorningRoutineDay).not.toHaveBeenCalled();
  });

  it("does nothing when today is already completed", async () => {
    const { routine } = await setup(2, [1, 2]);

    await expect(routine.completeToday()).resolves.toBe(false);

    expect(completeMorningRoutineDay).not.toHaveBeenCalled();
  });

  it("does nothing while another submission is in flight", async () => {
    const { routine } = await setup(1);
    routine.isSubmitting.value = true;

    await expect(routine.completeToday()).resolves.toBe(false);

    expect(completeMorningRoutineDay).not.toHaveBeenCalled();
  });

  it("saves the current day and keeps completed days sorted", async () => {
    const { routine } = await setup(3, [1, 5]);
    vi.mocked(completeMorningRoutineDay).mockResolvedValue(true);

    await expect(routine.completeToday()).resolves.toBe(true);

    expect(completeMorningRoutineDay).toHaveBeenCalledWith(3);
    expect(routine.completedDays.value).toEqual([1, 3, 5]);
    expect(routine.isTodayCompleted.value).toBe(true);
    expect(routine.isSubmitting.value).toBe(false);
  });

  it("reloads progress when the day was already saved concurrently", async () => {
    const { routine } = await setup(2, [1]);
    vi.mocked(completeMorningRoutineDay).mockResolvedValue(false);
    vi.mocked(getMorningRoutineCompletions).mockClear();

    await expect(routine.completeToday()).resolves.toBe(false);

    expect(getMorningRoutineCompletions).toHaveBeenCalledOnce();
    expect(routine.completedDays.value).toEqual([1]);
    expect(routine.error.value).toBeNull();
  });

  it("rechecks the current day before writing", async () => {
    const { dailyStore, routine } = await setup(7);
    dailyStore.startDate = startDateForChallengeDay(8);
    vi.mocked(completeMorningRoutineDay).mockResolvedValue(true);

    await expect(routine.completeToday()).resolves.toBe(false);

    expect(completeMorningRoutineDay).not.toHaveBeenCalled();
    expect(routine.completedDays.value).toEqual([]);
    expect(routine.status.value).toBe("failed");
  });

  it("uses the save error key and resets submitting on failure", async () => {
    const { routine } = await setup(1);
    vi.mocked(completeMorningRoutineDay).mockRejectedValue(
      new Error("save failed")
    );

    await expect(routine.completeToday()).resolves.toBe(false);

    expect(routine.error.value).toBe("weekly.morningRoutine.errors.save");
    expect(routine.isSubmitting.value).toBe(false);
    expect(routine.completedDays.value).toEqual([]);
  });
});
