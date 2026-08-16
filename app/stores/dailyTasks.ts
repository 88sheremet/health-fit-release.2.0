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

    if (!list.length) return result;

    const row =
      list.find((item) => item.day === targetDay) ??
      list[(targetDay - 1) % list.length];

    result.push({
      id: `${type}-${(dayIndex - 1) % DAY_COUNT}`,
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
      if (!state.startDate) return 1;

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
    async init() {
      await this.loadTasks();

      const today = new Date().toDateString();

      if (!this.startDate) {
        this.startDate = new Date().toISOString();
        localStorage.setItem("recovery-start-date", this.startDate);
      }

      if (!this.lastVisitDate) {
        this.lastVisitDate = today;
        this.streak = 1;
        return;
      }

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

      this.lastVisitDate = today;
    },

    async loadTasks() {
      this.loading = true;

      try {
        this.tasks = await getDailyTasks();
      } catch (e) {
        console.error("Не удалось загрузить задачи", e);
      } finally {
        this.loading = false;
        this.tasksLoaded = true;
      }
    },

    completeTask(task: Task) {
      if (this.completed[task.id]) {
        return;
      }

      this.completed[task.id] = true;

      this.energy += task.reward;
    },

    isDone(id: string) {
      return !!this.completed[id];
    },
  },

  persist: {
    pick: ["startDate", "completed", "energy", "streak", "lastVisitDate"],
  },
});
