import type { DbDailyTask } from "~/interfaces/DbDailyTask.interface";

export async function getDailyTasks(): Promise<DbDailyTask[]> {
  const supabase = useSupabaseClient();

  const { data, error } = await supabase
    .from("daily_tasks")
    .select("*")
    .order("day", { ascending: true });

  if (error) {
    console.error("Ошибка загрузки daily_tasks:", error);
    throw error;
  }

  return data ?? [];
}