import { defineStore } from "pinia";

import { getDayIndex, isRestDayByDate } from "~/utils/taskEngine";

import { getDailyTasks } from "~/services/dailyTask.service";

import type { Task } from "~/interfaces/Task.interface";
import type { DbDailyTask } from "~/interfaces/DbDailyTask.interface";
import type { TaskState } from "~/interfaces/TaskState.interface";

const DAY_COUNT = 30;

const TASK_TYPES = ["food", "mental", "physical"] as const;

const STANDARD_TASK_REWARD = 10;
const PHYSICAL_TASK_REWARD = 15;

function rewardForType(type: string): number {
  return type === "physical" ? PHYSICAL_TASK_REWARD : STANDARD_TASK_REWARD;
}

function normalizeWhatDoing(value: unknown): unknown {
  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed.startsWith("{")) {
      try {
        return JSON.parse(trimmed);
      } catch {
        // Если строка не является JSON,
        // оставляем её как обычный текст.
      }
    }
  }

  return value;
}

function dbTasksForDay(rows: DbDailyTask[], dayIndex: number): Task[] {
  const targetDay = ((dayIndex - 1) % DAY_COUNT) + 1;

  const byType = new Map<(typeof TASK_TYPES)[number], DbDailyTask[]>();

  for (const row of rows) {
    const list = byType.get(row.type) ?? [];

    list.push(row);

    byType.set(row.type, list);
  }

  return TASK_TYPES.reduce<Task[]>((result, type) => {
    const list = (byType.get(type) ?? []).slice().sort((a, b) => a.day - b.day);

    if (!list.length) {
      return result;
    }

    const row =
      list.find((item) => item.day === targetDay) ??
      list[(targetDay - 1) % list.length];

    if (!row) {
      return result;
    }

    result.push({
      id: row.id,
      type,
      title: row.title,
      reward: row.reward ?? rewardForType(type),
      whatDoing: normalizeWhatDoing(row.what_doing),
      whyDoing: row.why_doing,
    });

    return result;
  }, []);
}

export const useTaskStore = defineStore("tasks", {
  state: (): TaskState => ({
    startDate: "",
    completed: {},
    energy: 40,
    streak: 1,
    lastVisitDate: "",
    tasks: [],
    tasksLoaded: false,
    loading: false,
  }),

  getters: {
    dayIndex(state) {
      if (!state.startDate) {
        return 1;
      }

      return getDayIndex(state.startDate);
    },

    isRestDay(): boolean {
      return isRestDayByDate(new Date());
    },

    todayTasks(): Task[] {
      if (this.isRestDay) {
        return [];
      }

      return dbTasksForDay(this.tasks, this.dayIndex);
    },

    completedCount(state): number {
      return Object.values(state.completed).filter(Boolean).length;
    },
  },

  actions: {
    /*
     * ==========================================
     * INITIALIZATION
     * ==========================================
     */

    async init(locale = "ru") {
      this.loading = true;

      try {
        await this.loadProgress();
        await this.loadTasks(locale);
        await this.loadCompletedTasks();
        await this.updateStreak();
      } catch (error) {
        console.error("[DailyTasks] Ошибка инициализации:", error);

        throw error;
      } finally {
        this.loading = false;
      }
    },

    /*
     * ==========================================
     * TASKS
     * ==========================================
     */

    async loadTasks(locale = "ru") {
      try {
        this.tasksLoaded = false;

        this.tasks = await getDailyTasks(locale);
      } catch (error) {
        console.error("[DailyTasks] Не удалось загрузить задачи:", error);

        throw error;
      } finally {
        this.tasksLoaded = true;
      }
    },

    /*
     * ==========================================
     * USER PROGRESS
     * ==========================================
     */

    async loadProgress() {
      const supabase = useSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Пользователь не авторизован");
      }

      const { data, error } = await supabase
        .from("user_progress")
        .select(
          `
                id,
                user_id,
                start_date,
                energy,
                streak,
                last_visit_date
              `,
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      /*
       * Create progress for a new user.
       */

      if (!data) {
        const startDate = new Date().toISOString();

        const today = new Date().toISOString().slice(0, 10);

        const { data: newProgress, error: insertError } = await supabase
          .from("user_progress")
          .insert({
            user_id: user.id,
            start_date: startDate,
            energy: 40,
            streak: 1,
            last_visit_date: today,
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        this.startDate = newProgress.start_date;

        this.energy = Number(newProgress.energy);

        this.streak = Number(newProgress.streak);

        this.lastVisitDate = newProgress.last_visit_date;

        /*
         * Create initial energy history.
         *
         * This is not earned Energy.
         * It is the starting point.
         */

        const { error: historyError } = await supabase
          .from("energy_history")
          .insert({
            user_id: user.id,
            energy: Number(newProgress.energy),
            amount: 0,
            source: "initial",
          });

        if (historyError) {
          console.error(
            "[DailyTasks] Ошибка создания initial energy history:",
            historyError,
          );

          throw historyError;
        }

        return;
      }

      this.startDate = data.start_date;

      this.energy = Number(data.energy);

      this.streak = Number(data.streak);

      this.lastVisitDate = data.last_visit_date || "";
    },

    /*
     * ==========================================
     * COMPLETED TASKS
     * ==========================================
     */

    async loadCompletedTasks() {
      const supabase = useSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Пользователь не авторизован");
      }

      const { data, error } = await supabase
        .from("daily_task_completions")
        .select(
          `
              task_id,
              day_index
            `,
        )
        .eq("user_id", user.id)
        .eq("day_index", this.dayIndex);

      if (error) {
        throw error;
      }

      this.completed = {};

      for (const row of data ?? []) {
        this.completed[row.task_id] = true;
      }
    },

    /*
     * ==========================================
     * STREAK
     * ==========================================
     */

    async updateStreak() {
      const supabase = useSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const today = new Date().toISOString().slice(0, 10);

      if (!this.lastVisitDate) {
        this.streak = 1;
      } else {
        const lastVisit = new Date(this.lastVisitDate);

        const currentDate = new Date(today);

        const diffDays = Math.floor(
          (currentDate.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (diffDays === 1) {
          this.streak++;
        } else if (diffDays > 1) {
          this.streak = 1;
        }
      }

      this.lastVisitDate = today;

      const { error } = await supabase
        .from("user_progress")
        .update({
          streak: this.streak,
          last_visit_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }
    },

    /*
     * ==========================================
     * COMPLETE TASK
     * ==========================================
     */

    async completeTask(task: Task) {
      if (this.completed[task.id]) {
        return;
      }

      const supabase = useSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Пользователь не авторизован");
      }

      /*
       * 1. Save task completion
       */

      const { error: completionError } = await supabase
        .from("daily_task_completions")
        .insert({
          user_id: user.id,
          task_id: task.id,
          day_index: this.dayIndex,
          completed_at: new Date().toISOString(),
        });

      if (completionError) {
        /*
         * Task was already completed.
         */

        if (completionError.code === "23505") {
          this.completed[task.id] = true;

          return;
        }

        throw completionError;
      }

      /*
       * 2. Add Energy.
       *
       * addEnergy() is the single
       * source of truth for Energy updates.
       */

      try {
        await this.addEnergy(task.reward, "daily_task");
      } catch (error) {
        /*
         * The completion was already
         * saved. We throw the error so
         * the UI knows that Energy update
         * failed.
         */

        console.error("[DailyTasks] Ошибка начисления Energy:", error);

        throw error;
      }

      /*
       * 3. Update local completion state.
       */

      this.completed[task.id] = true;
    },

    /*
     * ==========================================
     * ENERGY
     * ==========================================
     */

    async addEnergy(amount: number, source = "manual") {
      if (!Number.isFinite(amount)) {
        throw new Error("Некорректное значение Energy");
      }

      if (amount === 0) {
        return;
      }

      const supabase = useSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Пользователь не авторизован");
      }

      /*
       * Energy cannot exceed 1000.
       */

      const newEnergy = Math.min(1000, this.energy + amount);

      /*
       * Actual amount received.
       *
       * Example:
       *
       * energy = 995
       * amount = 15
       *
       * actualAmount = 5
       */

      const actualAmount = newEnergy - this.energy;

      if (actualAmount <= 0) {
        return;
      }

      /*
       * 1. Update current Energy.
       */

      const { error: progressError } = await supabase
        .from("user_progress")
        .update({
          energy: newEnergy,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (progressError) {
        throw progressError;
      }

      /*
       * 2. Save Energy history.
       */

      const { error: historyError } = await supabase
        .from("energy_history")
        .insert({
          user_id: user.id,
          energy: newEnergy,
          amount: actualAmount,
          source,
        });

      if (historyError) {
        console.error(
          "[DailyTasks] Ошибка сохранения energy history:",
          historyError,
        );

        throw historyError;
      }

      /*
       * 3. Update local state.
       */

      this.energy = newEnergy;
    },

    /*
     * ==========================================
     * HELPERS
     * ==========================================
     */

    isDone(id: string) {
      return !!this.completed[id];
    },
  },

  persist: {
    pick: ["startDate", "completed", "energy", "streak", "lastVisitDate"],
  },
});
