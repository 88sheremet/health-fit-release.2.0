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

    async completeTask(task: Task, feedback?: string): Promise<number> {
      if (this.completed[task.id]) {
        return 0;
      }

      const supabase = useSupabaseClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error("Пользователь не авторизован");
      }

      const { error: completionError } = await supabase
        .from("daily_task_completions")
        .insert({
          user_id: user.id,
          task_id: task.id,
          day_index: this.dayIndex,
          completed_at: new Date().toISOString(),
          feedback: task.type === "mental" ? feedback ?? null : null,
        });

      if (completionError) {
        if (completionError.code === "23505") {
          this.completed[task.id] = true;
          return 0;
        }

        throw completionError;
      }

      let awardedEnergy = 0;

      try {
        awardedEnergy = await this.addEnergy(task.reward, "daily_task");
      } catch (error) {
        // Если начисление не удалось, пробуем убрать запись выполнения.
        const { error: rollbackError } = await supabase
          .from("daily_task_completions")
          .delete()
          .eq("user_id", user.id)
          .eq("task_id", task.id)
          .eq("day_index", this.dayIndex);

        if (rollbackError) {
          console.error(
            "[DailyTasks] Не удалось отменить запись выполнения:",
            rollbackError,
          );
        }

        throw error;
      }

      this.completed[task.id] = true;

      return awardedEnergy;
    },

    /*
     * ==========================================
     * ENERGY
     * ==========================================
     */

    async addEnergy(amount: number, source = "manual"): Promise<number> {
      if (!Number.isFinite(amount)) {
        throw new Error("Некорректное значение Energy");
      }

      if (amount === 0) {
        return 0;
      }

      const supabase = useSupabaseClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error("Пользователь не авторизован");
      }

      const previousEnergy = this.energy;
      const newEnergy = Math.max(0, Math.min(1000, previousEnergy + amount));
      const actualAmount = newEnergy - previousEnergy;

      if (actualAmount === 0) {
        return 0;
      }

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

      const { error: historyError } = await supabase
        .from("energy_history")
        .insert({
          user_id: user.id,
          energy: newEnergy,
          amount: actualAmount,
          source,
        });

      if (historyError) {
        // Пытаемся восстановить баланс, если история не сохранилась.
        const { error: rollbackError } = await supabase
          .from("user_progress")
          .update({
            energy: previousEnergy,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        if (rollbackError) {
          console.error(
            "[DailyTasks] Не удалось восстановить баланс:",
            rollbackError,
          );
        }

        throw historyError;
      }

      this.energy = newEnergy;

      return actualAmount;
    },

    async undoTask(task: Task, awardedEnergy: number): Promise<void> {
      if (task.type !== "food" || !this.completed[task.id]) {
        return;
      }

      const supabase = useSupabaseClient();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error("Пользователь не авторизован");
      }

      const { error: deleteError } = await supabase
        .from("daily_task_completions")
        .delete()
        .eq("user_id", user.id)
        .eq("task_id", task.id)
        .eq("day_index", this.dayIndex);

      if (deleteError) {
        throw deleteError;
      }

      try {
        if (awardedEnergy > 0) {
          await this.addEnergy(-awardedEnergy, "daily_task_undo");
        }
      } catch (error) {
        // Если обратное начисление не удалось, восстанавливаем выполнение.
        const { error: restoreError } = await supabase
          .from("daily_task_completions")
          .insert({
            user_id: user.id,
            task_id: task.id,
            day_index: this.dayIndex,
            completed_at: new Date().toISOString(),
          });

        if (restoreError) {
          console.error(
            "[DailyTasks] Не удалось восстановить выполнение:",
            restoreError,
          );
        }

        throw error;
      }

      delete this.completed[task.id];
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
