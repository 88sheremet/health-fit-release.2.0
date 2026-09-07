import type { DbDailyTask } from "~/interfaces/DbDailyTask.interface";
import type { DbDailyTaskTranslation } from "~/interfaces/DbDailyTaskTranslation.interface";

export async function getDailyTasks(locale = "ru"): Promise<DbDailyTask[]> {
  const supabase = useSupabaseClient();

  const { data: tasks, error: tasksError } = await supabase
    .from("daily_tasks")
    .select("*")
    .order("day", { ascending: true });

  if (tasksError) {
    console.error("[DailyTasks] Ошибка загрузки daily_tasks:", tasksError);

    throw tasksError;
  }

  if (!tasks?.length) {
    return [];
  }

  const taskIds = tasks.map((task) => task.id);

  const { data: translations, error: translationsError } = await supabase
    .from("daily_task_translations")
    .select(
      `
      task_id,
      locale,
      title,
      what_doing,
      why_doing
    `,
    )
    .in("task_id", taskIds)
    .eq("locale", locale);

  if (translationsError) {
    console.error("[DailyTasks] Ошибка загрузки переводов:", translationsError);

    throw translationsError;
  }

  const translationMap = new Map<string, DbDailyTaskTranslation>();

  for (const translation of translations ?? []) {
    translationMap.set(translation.task_id, translation);
  }

  return tasks.map((task) => {
    const translation = translationMap.get(task.id);

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
