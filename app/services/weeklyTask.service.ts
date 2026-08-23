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
    console.error("Ошибка загрузки weekly_task_completions:", error);

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
    console.error("Ошибка сохранения weekly completion:", error);

    throw error;
  }

  return data;
}
