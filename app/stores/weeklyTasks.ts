import { defineStore } from "pinia";

import { useTaskStore } from "./dailyTasks";

import { getWeeklyTasks } from "~/services/weeklyTask.service";

import type { WeeklyTask } from "../interfaces/WeeklyTask.interface";
import type { WeeklyState } from "../interfaces/WeeklyState.interface";

export const useWeeklyTaskStore = defineStore("weeklyTasks", {
  state: (): WeeklyState => ({
    completed: {},
    tasks: [],
    tasksLoaded: false,
  }),

  getters: {
    currentWeek(): number {
      const dailyStore = useTaskStore();

      if (!dailyStore.startDate) {
        return 1;
      }

      const diffDays = Math.floor(
        (Date.now() - new Date(dailyStore.startDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      return Math.floor(diffDays / 7) + 1;
    },

    currentDayWithinWeek(): number {
      const dailyStore = useTaskStore();

      if (!dailyStore.startDate) {
        return 1;
      }

      const diffDays = Math.floor(
        (Date.now() - new Date(dailyStore.startDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      return (diffDays % 7) + 1;
    },

    currentTask(state): WeeklyTask {
      const weekIndex = this.currentWeek - 1;

      if (state.tasksLoaded && state.tasks.length) {
        const row =
          state.tasks.find((task) => task.week === this.currentWeek) ??
          state.tasks[weekIndex % state.tasks.length];

        return {
          nameProgram: row.title,
          whatDoing: row.what_doing,
          whyDoing: row.why_doing,
        };
      }

      return weeklyTasks.weeklyTasks[
        weekIndex % weeklyTasks.weeklyTasks.length
      ];
    },

    canComplete(): boolean {
      return this.currentDayWithinWeek >= 6 && this.currentDayWithinWeek <= 7;
    },
  },

  actions: {
    async loadTasks() {
      try {
        this.tasks = await getWeeklyTasks();
      } catch (error) {
        console.error("Не удалось загрузить weekly_tasks", error);
      } finally {
        this.tasksLoaded = true;
      }
    },

    async init() {
      if (!this.tasksLoaded) {
        await this.loadTasks();
      }
    },

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

  persist: {
    paths: ["completed"],
  },
});
