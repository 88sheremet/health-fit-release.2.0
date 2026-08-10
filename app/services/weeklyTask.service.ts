import { useSupabase } from "~/composables/useSupabase";
import type { DbWeeklyTask } from "~/interfaces/DbWeeklyTask.interface";

export async function getWeeklyTasks(): Promise<DbWeeklyTask[]> {
  const supabase = useSupabase();

  const { data, error } = await supabase
    .from("weekly_tasks")
    .select("*")
    .order("week");

  if (error) {
    throw error;
  }

  return data as DbWeeklyTask[];
}