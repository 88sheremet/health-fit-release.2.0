import { defineStore } from "pinia";

import {
  getGeometryWeekProgress,
  completeGeometryWeekDay,
} from "~/services/geometryWeek.service";

import type { GeometryWeekState } from "~/interfaces/GeometryWeek.interface";

export const useGeometryWeekStore = defineStore("geometryWeek", {
  state: (): GeometryWeekState => ({
    completedDays: [],
    loading: false,
    saving: false,
    error: null,
  }),

  getters: {
    completedCount(state): number {
      return state.completedDays.length;
    },

    progressPercent(): number {
      return Math.round((this.completedCount / 7) * 100);
    },
  },

  actions: {
    async loadProgress(taskId: string, week: number) {
      this.loading = true;
      this.error = null;

      try {
        this.completedDays = await getGeometryWeekProgress(taskId, week);
      } catch (error) {
        console.error(
          "[GeometryWeekStore] Ошибка загрузки прогресса:",
          error,
        );

        this.error = "load";
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async completeStage(taskId: string, week: number, day: number) {
      if (this.saving) {
        return;
      }

      if (this.completedDays.includes(day)) {
        throw new Error("Этот этап уже выполнен.");
      }

      this.saving = true;
      this.error = null;

      try {
        await completeGeometryWeekDay(taskId, week, day);

        this.completedDays = [...this.completedDays, day].sort(
          (a, b) => a - b,
        );
      } catch (error) {
        console.error(
          "[GeometryWeekStore] Ошибка сохранения этапа:",
          error,
        );

        this.error = "save";
        throw error;
      } finally {
        this.saving = false;
      }
    },

    reset() {
      this.completedDays = [];
      this.error = null;
    },
  },
});