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

const WEEKLY_ZONE_KEYS: WeeklyZoneKey[] = [
  "desk",
  "wardrobe",
  "nightstand",
  "shelves",
  "drawers",
];

// Специальный функционал очистки пространства.
const SPACE_CLEANUP_TASK_ID = "ac671c82-1240-4548-a661-2f67cebad9ae";

export const useWeeklyTaskStore = defineStore("weeklyTasks", {
  state: (): WeeklyState => ({
    completed: {},
    tasks: [],
    tasksLoaded: false,
    zoneProgress: {},
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

      if (state.tasksLoaded && state.tasks.length > 0) {
        const currentWeekTask = state.tasks.find(
          (task) => task.week === this.currentWeek,
        );

        const fallbackTask = state.tasks[weekIndex % state.tasks.length];

        const task = currentWeekTask ?? fallbackTask;

        if (task) {
          return {
            id: task.id,
            nameProgram: task.title,
            whatDoing: task.what_doing,
            whyDoing: task.why_doing,
          };
        }
      }

      return {
        id: "",
        nameProgram: "",
        whatDoing: "",
        whyDoing: "",
      };
    },

    // Проверяем одновременно ID задания и неделю программы.
    isSpaceCleanupTask(): boolean {
      return this.currentTask.id === SPACE_CLEANUP_TASK_ID;
    },

    // Для уборки доступно с третьего дня.
    // Для остальных заданий сохраняется старое правило: дни 6–7.
    canComplete(): boolean {
      if (this.isSpaceCleanupTask) {
        return this.currentDayWithinWeek >= 3;
      }

      return this.currentDayWithinWeek >= 6 && this.currentDayWithinWeek <= 7;
    },

    zoneCount(): number {
      return WEEKLY_ZONE_KEYS.length;
    },

    completedZoneCount(): number {
      if (!this.isSpaceCleanupTask) {
        return 0;
      }

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

      // Загружаем чек-лист только для специального задания.
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
      // Сначала загружаем задания и историю завершений.
      await Promise.all([this.loadTasks(locale), this.loadCompletions()]);

      // После загрузки заданий можно достоверно определить
      // специальное задание текущей недели.
      if (this.isSpaceCleanupTask) {
        await this.loadZoneProgress();
      } else {
        this.zoneProgress = {};
      }
    },

    async toggleZone(zoneKey: WeeklyZoneKey) {
      if (!WEEKLY_ZONE_KEYS.includes(zoneKey)) {
        throw new Error(`Неизвестная зона: ${zoneKey}`);
      }

      // Чек-лист доступен только для задания по уборке.
      if (!this.isSpaceCleanupTask || this.isCompleted()) {
        return;
      }

      const nextValue = this.zoneProgress[zoneKey] !== true;
      const week = this.currentWeek;

      // Сначала сохраняем изменение в Supabase.
      await saveWeeklyZoneProgress(week, zoneKey, nextValue);

      // Не изменяем текущий интерфейс, если пользователь
      // перешёл на другую неделю во время сохранения.
      if (week !== this.currentWeek || !this.isSpaceCleanupTask) {
        return;
      }

      this.zoneProgress[zoneKey] = nextValue;
    },

    async completeCurrentTask() {
      if (this.isCompleted()) {
        return;
      }

      if (!this.canComplete) {
        throw new Error(
          this.isSpaceCleanupTask
            ? "Завершить задание можно начиная с третьего дня недели."
            : "Завершить задание можно на шестой или седьмой день недели.",
        );
      }

      // Все пять зон обязательны только для задания по уборке.
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

      try {
        await saveWeeklyCompletion(task.id, week);

        this.completed[week] = true;

        const dailyStore = useTaskStore();
        await dailyStore.addEnergy(90);
      } catch (error) {
        console.error("[WeeklyTasks] Ошибка выполнения задания:", error);

        throw error;
      }
    },

    isCompleted(): boolean {
      return this.completed[this.currentWeek] === true;
    },

    // Оставлено для совместимости с существующим кодом.
    // Для завершения задания используй completeCurrentTask().
    rewardEnergy() {
      const dailyStore = useTaskStore();
      dailyStore.energy += 90;
    },
  },

  persist: {
    pick: ["completed"],
  },
});
