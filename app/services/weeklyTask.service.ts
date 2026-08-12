import type { DbWeeklyTask } from "~/interfaces/DbWeeklyTask.interface";

export async function getWeeklyTasks(): Promise<DbWeeklyTask[]> {
  const supabase = useSupabaseClient();

  const { data, error } = await supabase
    .from("weekly_tasks")
    .select("*")
    .order("week", { ascending: true });

  if (error) {
    console.error("Ошибка загрузки weekly_tasks:", error);
    throw error;
  }

  return data ?? [];
}