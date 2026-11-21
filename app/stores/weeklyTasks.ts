import { defineStore } from "pinia";

import { useTaskStore } from "./dailyTasks";

import {
  getWeeklyTasks,
  getWeeklyCompletions,
  completeWeeklyTask as saveWeeklyCompletion,
  getWeeklyZoneProgress,
  saveWeeklyZoneProgress,
} from "~/services/weeklyTask.service";

import { getDaysSince } from "~/utils/taskEngine";

import type { WeeklyTask } from "../interfaces/WeeklyTask.interface";
import type {
  WeeklyState,
  WeeklyZoneKey,
} from "../interfaces/WeeklyState.interface";

const PROGRAM_WEEKS = 4;
const PROGRAM_DAYS = PROGRAM_WEEKS * 7;

const WEEKLY_ZONE_KEYS: WeeklyZoneKey[] = [
  "desk",
  "wardrobe",
  "nightstand",
  "shelves",
  "drawers",
];

const SPACE_CLEANUP_TASK_ID = "ac671c82-1240-4548-a661-2f67cebad9ae";

export const GEOMETRY_WEEK_TASK_ID = "b41ff541-7ea1-46a1-8bc2-38722b19bccb";

const GEOMETRY_WEEK_MIN_COMPLETED = 5;

export const useWeeklyTaskStore = defineStore("weeklyTasks", {
  state: (): WeeklyState => ({
    completed: {},
    tasks: [],
    tasksLoaded: false,
    zoneProgress: {},
  }),

  getters: {
    daysSinceStart(): number {
      const dailyStore = useTaskStore();

      if (!dailyStore.startDate) return 0;

      return getDaysSince(dailyStore.startDate);
    },

    isProgramFinished(): boolean {
      return this.daysSinceStart >= PROGRAM_DAYS;
    },

    currentWeek(): number {
      return Math.min(Math.floor(this.daysSinceStart / 7) + 1, PROGRAM_WEEKS);
    },

    currentDayWithinWeek(): number {
      if (this.isProgramFinished) return 7;

      return (this.daysSinceStart % 7) + 1;
    },

    currentTask(state): WeeklyTask {
      if (!state.tasksLoaded || state.tasks.length === 0) {
        return {
          id: "",
          nameProgram: "",
          whatDoing: "",
          whyDoing: "",
        };
      }

      const task = state.tasks.find((item) => item.week === this.currentWeek);

      if (!task) {
        return {
          id: "",
          nameProgram: "",
          whatDoing: "",
          whyDoing: "",
        };
      }

      return {
        id: task.id,
        nameProgram: task.title,
        whatDoing: task.what_doing,
        whyDoing: task.why_doing,
      };
    },

    isSpaceCleanupTask(): boolean {
      return this.currentTask.id === SPACE_CLEANUP_TASK_ID;
    },

    isGeometryTask(): boolean {
      return this.currentTask.id === GEOMETRY_WEEK_TASK_ID;
    },

    canComplete(): boolean {
      if (this.isProgramFinished) return false;

      if (this.isSpaceCleanupTask) {
        return this.currentDayWithinWeek >= 3;
      }

      return this.currentDayWithinWeek >= 6 && this.currentDayWithinWeek <= 7;
    },

    zoneCount(): number {
      return WEEKLY_ZONE_KEYS.length;
    },

    completedZoneCount(): number {
      if (!this.isSpaceCleanupTask) return 0;

      return WEEKLY_ZONE_KEYS.filter(
        (zoneKey) => this.zoneProgress[zoneKey] === true,
      ).length;
    },

    allZonesCompleted(): boolean {
      return this.completedZoneCount === this.zoneCount;
    },

    zoneProgressPercent(): number {
      return Math.round((this.completedZoneCount / this.zoneCount) * 100);
    },
  },

  actions: {
    async loadTasks(locale = "ru") {
      try {
        this.tasksLoaded = false;
        this.tasks = await getWeeklyTasks(locale);
      } catch (error) {
        console.error(
          "[WeeklyTasks] Не удалось загрузить weekly_tasks:",
          error,
        );
        throw error;
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
        throw error;
      }
    },

    async loadZoneProgress(week?: number) {
      const targetWeek = week ?? this.currentWeek;

      if (!this.isSpaceCleanupTask) {
        this.zoneProgress = {};
        return;
      }

      try {
        this.zoneProgress = await getWeeklyZoneProgress(targetWeek);
      } catch (error) {
        console.error(
          "[WeeklyTaskStore] Не удалось загрузить прогресс зон:",
          error,
        );
        throw error;
      }
    },

    async init(locale = "ru") {
      await Promise.all([this.loadTasks(locale), this.loadCompletions()]);

      if (this.isSpaceCleanupTask && !this.isProgramFinished) {
        await this.loadZoneProgress();
      } else {
        this.zoneProgress = {};
      }
    },

    async toggleZone(zoneKey: WeeklyZoneKey) {
      if (!WEEKLY_ZONE_KEYS.includes(zoneKey)) {
        throw new Error(`Неизвестная зона: ${zoneKey}`);
      }

      if (
        this.isProgramFinished ||
        !this.isSpaceCleanupTask ||
        this.isCompleted()
      ) {
        return;
      }

      const nextValue = this.zoneProgress[zoneKey] !== true;
      const week = this.currentWeek;

      await saveWeeklyZoneProgress(week, zoneKey, nextValue);

      if (
        week !== this.currentWeek ||
        !this.isSpaceCleanupTask ||
        this.isProgramFinished
      ) {
        return;
      }

      this.zoneProgress[zoneKey] = nextValue;
    },

    async completeCurrentTask() {
      if (this.isProgramFinished || this.isCompleted()) return;

      if (!this.canComplete) {
        throw new Error(
          this.isSpaceCleanupTask
            ? "Завершить задание можно начиная с третьего дня недели."
            : "Завершить задание можно на шестой или седьмой день недели.",
        );
      }

      if (this.isSpaceCleanupTask && !this.allZonesCompleted) {
        throw new Error(
          "Перед завершением задания необходимо отметить все пять зон.",
        );
      }

      const task = this.currentTask;
      const week = this.currentWeek;

      if (!task.id) {
        throw new Error("Не удалось определить текущее еженедельное задание.");
      }

      if (this.isGeometryTask) {
        throw new Error(
          "Для завершения задания по осанке используйте отдельную проверку этапов.",
        );
      }

      try {
        await saveWeeklyCompletion(task.id, week);
        this.completed[week] = true;

        const dailyStore = useTaskStore();
        return await dailyStore.addEnergy(90);
      } catch (error) {
        console.error("[WeeklyTasks] Ошибка выполнения задания:", error);
        throw error;
      }
    },

    async completeGeometryTask(completedStages: number) {
      if (this.isProgramFinished || this.isCompleted()) return;

      if (!this.isGeometryTask) {
        throw new Error("Текущее задание не является заданием по осанке.");
      }

      if (completedStages < GEOMETRY_WEEK_MIN_COMPLETED) {
        throw new Error("Необходимо выполнить минимум 5 этапов из 7.");
      }

      const task = this.currentTask;
      const week = this.currentWeek;

      if (!task.id) {
        throw new Error("Не удалось определить текущее недельное задание.");
      }

      try {
        await saveWeeklyCompletion(task.id, week);
        this.completed[week] = true;

        const dailyStore = useTaskStore();
        return await dailyStore.addEnergy(90);
      } catch (error) {
        console.error(
          "[WeeklyTasks] Ошибка завершения задания по осанке:",
          error,
        );
        throw error;
      }
    },

    isCompleted(): boolean {
      return this.completed[this.currentWeek] === true;
    },

    rewardEnergy() {
      const dailyStore = useTaskStore();
      dailyStore.energy += 90;
    },
  },

  persist: {
    pick: ["completed"],
  },
});
