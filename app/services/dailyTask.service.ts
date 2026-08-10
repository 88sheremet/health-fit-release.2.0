import { useSupabase } from "~/composables/useSupabase";
import type { DbDailyTask } from "~/interfaces/DbDailyTask.interface";

export async function getDailyTasks(): Promise<DbDailyTask[]> {
  const supabase = useSupabase();

  const { data, error } = await supabase
    .from("daily_tasks")
    .select("*")
    .order("day");

  if (error) {
    throw error;
  }

  return (data ?? []) as DbDailyTask[];
}