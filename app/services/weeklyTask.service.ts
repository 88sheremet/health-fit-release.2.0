import type { DbWeeklyTask } from "~/interfaces/DbWeeklyTask.interface";
import type { DbWeeklyTaskTranslation } from "~/interfaces/DbWeeklyTaskTranslation.interface";

export async function getWeeklyTasks(locale = "ru"): Promise<DbWeeklyTask[]> {
  const supabase = useSupabaseClient();

  const { data: tasks, error: tasksError } = await supabase
    .from("weekly_tasks")
    .select("*")
    .order("week", { ascending: true });

  if (tasksError) {
    console.error("[WeeklyTasks] Ошибка загрузки weekly_tasks:", tasksError);

    throw tasksError;
  }

  if (!tasks?.length) {
    return [];
  }

  const taskIds = tasks.map((task) => task.id);

  const { data: translations, error: translationsError } = await supabase
    .from("weekly_task_translations")
    .select("id, weekly_task_id, locale, title, what_doing, why_doing")
    .in("weekly_task_id", taskIds)
    .eq("locale", locale);

  if (translationsError) {
    console.error(
      "[WeeklyTasks] Ошибка загрузки weekly_task_translations:",
      translationsError
    );

    throw translationsError;
  }

  const translationsByTaskId = new Map<string, DbWeeklyTaskTranslation>();

  for (const translation of translations ?? []) {
    translationsByTaskId.set(translation.weekly_task_id, translation);
  }

  return tasks.map((task) => {
    const translation = translationsByTaskId.get(task.id);

    if (!translation) {
      return task;
    }

    return {
      ...task,
      title: translation.title,
      what_doing: translation.what_doing,
      why_doing: translation.why_doing,
    };
  });
}

export async function getWeeklyCompletions(): Promise<number[]> {
  const supabase = useSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("weekly_task_completions")
    .select("week")
    .eq("user_id", user.id);

  if (error) {
    console.error(
      "[WeeklyTasks] Ошибка загрузки weekly_task_completions:",
      error
    );

    throw error;
  }

  return (data ?? []).map((item) => item.week);
}

export async function completeWeeklyTask(weeklyTaskId: string, week: number) {
  const supabase = useSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  const { data, error } = await supabase
    .from("weekly_task_completions")
    .insert({
      user_id: user.id,
      weekly_task_id: weeklyTaskId,
      week,
    })
    .select()
    .single();

  if (error) {
    console.error("[WeeklyTasks] Ошибка сохранения weekly completion:", error);

    throw error;
  }

  return data;
}
