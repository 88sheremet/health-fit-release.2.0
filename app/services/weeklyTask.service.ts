import { useSupabase } from "~/composables/useSupabase";

export interface DbWeeklyTask {
  id: string;
  week: number;
  title: string;
  what_doing: string;
  why_doing: string;
  reward: number;
}

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