import { useSupabase } from "~/composables/useSupabase";

export async function getDailyTasks() {
  const supabase = useSupabase();

  const { data, error } = await supabase
    .from("daily_tasks")
    .select("*")
    .order("day");

  if (error) {
    throw error;
  }

  return data ?? [];
}