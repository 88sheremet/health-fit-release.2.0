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
        /* keep raw string */
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
        console.log("[DailyTasks] Нет startDate → day 1");

        return 1;
      }

      const day = getDayIndex(state.startDate);

      return day;
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
    async init() {
      this.loading = true;

      try {
        await this.loadProgress();

        await this.loadTasks();

        await this.loadCompletedTasks();

        await this.updateStreak();
      } catch (error) {
        console.error("[DailyTasks] Ошибка инициализации:", error);
      } finally {
        this.loading = false;
      }
    },

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

      if (!data) {
        const startDate = new Date().toISOString();

        const { data: newProgress, error: insertError } = await supabase
          .from("user_progress")
          .insert({
            user_id: user.id,

            start_date: startDate,

            energy: 40,

            streak: 1,

            last_visit_date: new Date().toISOString().split("T")[0],
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        this.startDate = newProgress.start_date;

        this.energy = newProgress.energy;

        this.streak = newProgress.streak;

        this.lastVisitDate = newProgress.last_visit_date;

        return;
      }

      this.startDate = data.start_date;

      this.energy = Number(data.energy);

      this.streak = Number(data.streak);

      this.lastVisitDate = data.last_visit_date || "";
    },

    async loadTasks() {
      try {
        this.tasks = await getDailyTasks();
      } catch (error) {
        console.error("[DailyTasks] Не удалось загрузить задачи:", error);

        throw error;
      } finally {
        this.tasksLoaded = true;
      }
    },

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

    async updateStreak() {
      const supabase = useSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const today = new Date().toISOString().split("T")[0];

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

      const newEnergy = this.energy + task.reward;

      const { error: completionError } = await supabase
        .from("daily_task_completions")
        .insert({
          user_id: user.id,

          task_id: task.id,

          day_index: this.dayIndex,

          completed_at: new Date().toISOString(),
        });

      if (completionError) {
        if (completionError.code === "23505") {
          this.completed[task.id] = true;

          return;
        }

        throw completionError;
      }

      this.completed[task.id] = true;

      this.energy = newEnergy;

      const { error: progressError } = await supabase
        .from("user_progress")
        .update({
          energy: this.energy,

          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (progressError) {
        throw progressError;
      }
    },

    async addEnergy(amount: number) {
      const supabase = useSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Пользователь не авторизован");
      }

      const newEnergy = this.energy + amount;

      const { error } = await supabase
        .from("user_progress")
        .update({
          energy: newEnergy,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) {
        console.error("[DailyTasks] Ошибка обновления энергии:", error);

        throw error;
      }

      this.energy = newEnergy;
    },

    isDone(id: string) {
      return !!this.completed[id];
    },
  },

  persist: {
    pick: ["startDate", "completed", "energy", "streak", "lastVisitDate"],
  },
});
