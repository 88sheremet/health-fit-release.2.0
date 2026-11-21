
import { computed, ref } from "vue";

import { useTaskStore } from "~/stores/dailyTasks";
import {
  completeMorningRoutineDay,
  getMorningRoutineCompletions,
} from "~/services/morningRoutine.service";
import { getDayIndex } from "~/utils/taskEngine";

const CHALLENGE_START_DAY = 22;
const CHALLENGE_DURATION = 7;
const REQUIRED_COMPLETIONS = 5;

export type MorningRoutineStatus =
  | "upcoming"
  | "active"
  | "success"
  | "failed";

export function useMorningRoutine() {
  const dailyStore = useTaskStore();

  const completedDays = ref<number[]>([]);
  const currentChallengeDay = ref(0);

  const isLoading = ref(false);
  const isSubmitting = ref(false);
  const error = ref<string | null>(null);

  // День 22 основного трекера — первый день челленджа.
  function updateCurrentDay() {
    if (!dailyStore.startDate) {
      currentChallengeDay.value = 0;
      return;
    }

    const dayIndex = getDayIndex(dailyStore.startDate);

    currentChallengeDay.value = dayIndex - CHALLENGE_START_DAY + 1;
  }

  const completedCount = computed(() => completedDays.value.length);

  const missedDays = computed(() => {
    const elapsedDays = Math.min(
      Math.max(currentChallengeDay.value, 0),
      CHALLENGE_DURATION,
    );

    return Math.max(0, elapsedDays - completedCount.value);
  });

  const status = computed<MorningRoutineStatus>(() => {
    if (currentChallengeDay.value < 1) {
      return "upcoming";
    }

    if (currentChallengeDay.value <= CHALLENGE_DURATION) {
      return "active";
    }

    return completedCount.value >= REQUIRED_COMPLETIONS
      ? "success"
      : "failed";
  });

  const canCompleteToday = computed(() => {
    return (
      status.value === "active" &&
      !completedDays.value.includes(currentChallengeDay.value)
    );
  });

  const isTodayCompleted = computed(() => {
    return completedDays.value.includes(currentChallengeDay.value);
  });

  const isRewardEligible = computed(() => {
    return status.value === "success";
  });

  async function loadProgress() {
    isLoading.value = true;
    error.value = null;

    try {
      updateCurrentDay();

      completedDays.value = await getMorningRoutineCompletions();
    } catch (err) {
      console.error("Failed to load morning routine progress:", err);
      error.value = "weekly.morningRoutine.errors.load";
    } finally {
      isLoading.value = false;
    }
  }

  async function completeToday() {
    if (!canCompleteToday.value || isSubmitting.value) {
      return false;
    }

    isSubmitting.value = true;
    error.value = null;

    try {
      // Повторно перевіряємо поточну дату перед записом.
      updateCurrentDay();

      if (!canCompleteToday.value) {
        return false;
      }

      const dayNumber = currentChallengeDay.value;

      const success = await completeMorningRoutineDay(dayNumber);

      if (!success) {
        await loadProgress();
        return false;
      }

      completedDays.value = [...completedDays.value, dayNumber].sort(
        (a, b) => a - b,
      );

      return true;
    } catch (err) {
      console.error("Failed to complete morning routine day:", err);
      error.value = "weekly.morningRoutine.errors.save";
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  return {
    completedDays,
    completedCount,
    missedDays,
    currentChallengeDay,

    status,
    canCompleteToday,
    isTodayCompleted,
    isRewardEligible,

    isLoading,
    isSubmitting,
    error,

    loadProgress,
    completeToday,
  };
}
