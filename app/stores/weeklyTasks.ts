import { defineStore } from "pinia";

import { useTaskStore } from "./dailyTasks";

import {
  getWeeklyTasks,
  getWeeklyCompletions,
  completeWeeklyTask as saveWeeklyCompletion,
} from "~/services/weeklyTask.service";

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
          id: task.id,
          nameProgram: task.title,
          whatDoing: task.what_doing,
          whyDoing: task.why_doing,
        };
      }

      return {
        id: "",
        nameProgram: "",
        whatDoing: "",
        whyDoing: "",
      };
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
        console.error(
          "[WeeklyTasks] Не удалось загрузить weekly_tasks:",
          error,
        );
      } finally {
        this.tasksLoaded = true;
      }
    },

    async loadCompletions() {
      try {
        const weeks = await getWeeklyCompletions();

        this.completed = {};

        weeks.forEach((week) => {
          this.completed[week] = true;
        });
      } catch (error) {
        console.error(
          "[WeeklyTasks] Не удалось загрузить weekly completions:",
          error,
        );
      }
    },

    async init() {
      await Promise.all([this.loadTasks(), this.loadCompletions()]);
    },

    async completeCurrentTask() {
      if (this.isCompleted()) {
        return;
      }

      const task = this.currentTask;

      if (!task.id) {
        console.error("[WeeklyTasks] Не удалось определить ID задания");

        return;
      }

      try {
        await saveWeeklyCompletion(task.id, this.currentWeek);

        this.completed[this.currentWeek] = true;

        const dailyStore = useTaskStore();

        await dailyStore.addEnergy(100);

        console.log("[WeeklyTasks] Задание выполнено:", {
          week: this.currentWeek,
          taskId: task.id,
          reward: 100,
        });
      } catch (error) {
        console.error("[WeeklyTasks] Ошибка выполнения задания:", error);

        throw error;
      }
    },

    isCompleted(): boolean {
      return !!this.completed[this.currentWeek];
    },
  },
});
