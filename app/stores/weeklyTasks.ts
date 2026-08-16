import { defineStore } from "pinia";

import { useTaskStore } from "./dailyTasks";

import { getWeeklyTasks } from "~/services/weeklyTask.service";

import { getDaysSince } from "~/utils/taskEngine";

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

      return Math.floor(getDaysSince(dailyStore.startDate) / 7) + 1;
    },

    currentDayWithinWeek(): number {
      const dailyStore = useTaskStore();

      if (!dailyStore.startDate) {
        return 1;
      }

      return (getDaysSince(dailyStore.startDate) % 7) + 1;
    },

    currentTask(state): WeeklyTask {
      const weekIndex = this.currentWeek - 1;

      if (state.tasksLoaded && state.tasks.length) {
        const currentWeekTask = state.tasks.find(
          (task) => task.week === this.currentWeek,
        );

        const fallbackTask = state.tasks[weekIndex % state.tasks.length];

        const task = currentWeekTask ?? fallbackTask;

        return {
          nameProgram: task.title,
          whatDoing: task.what_doing,
          whyDoing: task.why_doing,
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
    pick: ["completed"],
  },
});
