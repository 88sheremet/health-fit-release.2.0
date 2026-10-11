import { defineStore } from "pinia";

type TaskType = "food" | "mental" | "physical";

interface CategoryProgress {
  completed: number;
  total: number;
  percentage: number;
}

interface ProgressState {
  loading: boolean;

  energy: number;
  energyChange: number;

  streak: number;

  moodAverage: number;
  moodChange: number;

  tasksCompleted: number;
  tasksTotal: number;

  categories: Record<TaskType, CategoryProgress>;

  focusCategory: TaskType;
  focusCompleted: number;
}

const TASK_TYPES: TaskType[] = ["physical", "food", "mental"];

const DAYS_IN_PERIOD = 7;

const DAILY_TASKS_TOTAL = DAYS_IN_PERIOD * TASK_TYPES.length;
const WEEKLY_TASKS_TOTAL = 1;
const TOTAL_TASKS = DAILY_TASKS_TOTAL + WEEKLY_TASKS_TOTAL;

function isTaskType(value: unknown): value is TaskType {
  return value === "physical" || value === "food" || value === "mental";
}

export const useProgressStore = defineStore("progress", {
  state: (): ProgressState => ({
    loading: false,

    energy: 0,
    energyChange: 0,

    streak: 0,

    moodAverage: 0,
    moodChange: 0,

    tasksCompleted: 0,
    tasksTotal: TOTAL_TASKS,

    categories: {
      physical: {
        completed: 0,
        total: 0,
        percentage: 0,
      },
      food: {
        completed: 0,
        total: 0,
        percentage: 0,
      },
      mental: {
        completed: 0,
        total: 0,
        percentage: 0,
      },
    },

    focusCategory: "mental",
    focusCompleted: 0,
  }),

  getters: {
    tasksPercentage(state): number {
      if (!state.tasksTotal) {
        return 0;
      }

      return Math.round((state.tasksCompleted / state.tasksTotal) * 100);
    },

    focusTitle(state): string {
      const titles: Record<TaskType, string> = {
        physical: "Physical recovery",
        food: "Nutrition",
        mental: "Mental recovery",
      };

      return titles[state.focusCategory];
    },
  },

  actions: {
    async init() {
      this.loading = true;

      try {
        await this.loadProgress();
      } catch (error) {
        console.error("[Progress] Ошибка загрузки:", error);
        throw error;
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

      const { data: screening, error: screeningError } = await supabase
        .from("screening_results")
        .select("dominant_problem")
        .eq("user_id", user.id)
        .maybeSingle();

      if (screeningError) {
        throw screeningError;
      }

      if (!screening) {
        throw new Error("Результат скрининга не найден");
      }

      const dominantProblem = screening.dominant_problem;

      if (!isTaskType(dominantProblem)) {
        throw new Error(
          `Некорректный dominant_problem: ${String(dominantProblem)}`,
        );
      }

      this.focusCategory = dominantProblem;

      const { data: progress, error: progressError } = await supabase
        .from("user_progress")
        .select("energy, streak, start_date")
        .eq("user_id", user.id)
        .single();

      if (progressError) {
        throw progressError;
      }

      this.energy = Number(progress.energy ?? 0);
      this.streak = Number(progress.streak ?? 0);

      const now = new Date();

      const currentPeriodStart = new Date(now);

      currentPeriodStart.setDate(now.getDate() - (DAYS_IN_PERIOD - 1));
      currentPeriodStart.setHours(0, 0, 0, 0);

      const previousPeriodStart = new Date(now);

      previousPeriodStart.setDate(now.getDate() - DAYS_IN_PERIOD * 2 + 1);
      previousPeriodStart.setHours(0, 0, 0, 0);

      await this.loadEnergyHistory(
        user.id,
        currentPeriodStart,
        previousPeriodStart,
      );

      const { data: completions, error: completionsError } = await supabase
        .from("daily_task_completions")
        .select("task_id, day_index, completed_at")
        .eq("user_id", user.id)
        .gte("completed_at", previousPeriodStart.toISOString());

      if (completionsError) {
        throw completionsError;
      }

      const { data: tasks, error: tasksError } = await supabase
        .from("daily_tasks")
        .select("id, day, type");

      if (tasksError) {
        throw tasksError;
      }

      const taskMap = new Map((tasks ?? []).map((task) => [task.id, task]));

      const currentWeekCompletions = (completions ?? []).filter(
        (completion) => new Date(completion.completed_at) >= currentPeriodStart,
      );

      const { data: weeklyCompletions, error: weeklyError } = await supabase
        .from("weekly_task_completions")
        .select("weekly_task_id, week, completed_at")
        .eq("user_id", user.id)
        .gte("completed_at", currentPeriodStart.toISOString());

      if (weeklyError) {
        throw weeklyError;
      }

      const weeklyTasksCompleted = weeklyCompletions?.length ?? 0;

      const dailyTasksCompleted = currentWeekCompletions.length;

      this.tasksCompleted = dailyTasksCompleted + weeklyTasksCompleted;
      this.tasksTotal = TOTAL_TASKS;

      const categoryCompleted: Record<TaskType, number> = {
        physical: 0,
        food: 0,
        mental: 0,
      };

      for (const completion of currentWeekCompletions) {
        const task = taskMap.get(completion.task_id);

        if (!task || !isTaskType(task.type)) {
          continue;
        }

        categoryCompleted[task.type]++;
      }

      for (const category of TASK_TYPES) {
        const completed = categoryCompleted[category];
        const total = DAYS_IN_PERIOD;

        this.categories[category] = {
          completed,
          total,
          percentage: Math.round((completed / total) * 100),
        };
      }

      this.focusCompleted = categoryCompleted[this.focusCategory];

      await this.loadMood(user.id, currentPeriodStart, previousPeriodStart);
    },

    async loadEnergyHistory(
      userId: string,
      currentPeriodStart: Date,
      previousPeriodStart: Date,
    ) {
      const supabase = useSupabaseClient();

      const { data, error } = await supabase
        .from("energy_history")
        .select("energy, amount, source, created_at")
        .eq("user_id", userId)
        .gte("created_at", previousPeriodStart.toISOString())
        .order("created_at", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      if (!data?.length) {
        this.energyChange = 0;
        return;
      }

      const previousPeriodEntries = data.filter(
        (entry) => new Date(entry.created_at) < currentPeriodStart,
      );

      const currentPeriodEntries = data.filter(
        (entry) => new Date(entry.created_at) >= currentPeriodStart,
      );

      const firstCurrentEntry = currentPeriodEntries[0];

      if (!firstCurrentEntry) {
        this.energyChange = 0;
        return;
      }

      let startEnergy = Number(firstCurrentEntry.energy);

      const lastPreviousEntry =
        previousPeriodEntries[previousPeriodEntries.length - 1];

      if (lastPreviousEntry) {
        startEnergy = Number(lastPreviousEntry.energy);
      }

      this.energyChange = this.energy - startEnergy;
    },

    async loadMood(
      userId: string,
      currentPeriodStart: Date,
      previousPeriodStart: Date,
    ) {
      const supabase = useSupabaseClient();

      const currentPeriodDate = this.formatDate(currentPeriodStart);
      const previousPeriodDate = this.formatDate(previousPeriodStart);

      const { data, error } = await supabase
        .from("journal_entries")
        .select("date, mood, entry_type")
        .eq("user_id", userId)
        .not("mood", "is", null)
        .gte("date", previousPeriodDate)
        .order("date", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      const current = (data ?? []).filter(
        (entry) => entry.date >= currentPeriodDate,
      );

      const previous = (data ?? []).filter(
        (entry) => entry.date < currentPeriodDate,
      );

      const currentAverage = this.calculateMoodAverage(current);
      const previousAverage = this.calculateMoodAverage(previous);

      this.moodAverage = currentAverage;

      if (!previous.length) {
        this.moodChange = 0;
        return;
      }

      this.moodChange = Number((currentAverage - previousAverage).toFixed(1));
    },

    calculateMoodAverage(
      entries: Array<{
        mood: number | null;
      }>,
    ): number {
      if (!entries.length) {
        return 0;
      }

      const values = entries
        .map((entry) => Number(entry.mood))
        .filter((value) => Number.isFinite(value) && value >= 1 && value <= 5);

      if (!values.length) {
        return 0;
      }

      const average =
        values.reduce((sum, value) => sum + value, 0) / values.length;

      return Number(average.toFixed(1));
    },

    formatDate(date: Date): string {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    },
  },
});
