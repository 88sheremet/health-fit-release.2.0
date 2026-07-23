import { defineStore } from "pinia";
import weeklyTasks from "~/mocks/weeklyTasks/weeklyTasks.json";
import { useTaskStore } from "./dailyTasks";

import type { WeeklyTask } from "../interfaces/WeeklyTask.interface";
import type { WeeklyState } from "../interfaces/WeeklyState.interface";

export const useWeeklyTaskStore = defineStore("weeklyTasks", {
  state: (): WeeklyState => ({
    completed: {},
  }),

  getters: {
    currentTask(): WeeklyTask {
      const weekIndex = this.currentWeek - 1;

      return weeklyTasks.weeklyTasks[
        weekIndex % weeklyTasks.weeklyTasks.length
      ];
    },

    currentWeek(): number {
      const startDate = localStorage.getItem("recovery-start-date");

      if (!startDate) {
        return 1;
      }

      const diffDays = Math.floor(
        (Date.now() - new Date(startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return Math.floor(diffDays / 7) + 1;
    },

    currentDayWithinWeek(): number {
      const startDate = localStorage.getItem("recovery-start-date");

      if (!startDate) {
        return 1;
      }

      const diffDays = Math.floor(
        (Date.now() - new Date(startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return (diffDays % 7) + 1;
    },

    canComplete(): boolean {
      return (
        this.currentDayWithinWeek >= 6 &&
        this.currentDayWithinWeek <= 7
      );
    },
  },

  actions: {
    completeCurrentTask() {
      this.completed[this.currentWeek] = true;
    },

    isCompleted(): boolean {
      return !!this.completed[this.currentWeek];
    },

    rewardEnergy() {
      const dailyStore = useTaskStore();

      dailyStore.energy += 100;
    },
  },

  persist: true,
});