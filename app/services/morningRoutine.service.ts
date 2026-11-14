const MORNING_ROUTINE_TASK_ID = "81658713-0b40-463c-914f-899952d824b0";

export const MORNING_ROUTINE_WEEK = 4;

export const MORNING_ROUTINE_DAY_COUNT = 7;

export interface MorningRoutineCompletion {
  id: string;
  day_number: number;
  completed_at: string;
}

export async function getMorningRoutineCompletions(): Promise<number[]> {
  const supabase = useSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  const { data, error } = await supabase
    .from("weekly_task_daily_completions")
    .select("day_number")
    .eq("user_id", user.id)
    .eq("weekly_task_id", MORNING_ROUTINE_TASK_ID)
    .eq("week", MORNING_ROUTINE_WEEK)
    .order("day_number", { ascending: true });

  if (error) {
    console.error("[MorningRoutine] Ошибка загрузки прогресса:", error);

    throw error;
  }

  return (data ?? []).map((item) => item.day_number);
}

export async function completeMorningRoutineDay(
  dayNumber: number,
): Promise<boolean> {
  if (
    !Number.isInteger(dayNumber) ||
    dayNumber < 1 ||
    dayNumber > MORNING_ROUTINE_DAY_COUNT
  ) {
    throw new Error("Некорректный номер дня челленджа");
  }

  const supabase = useSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw authError;
  }

  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  const { error } = await supabase
    .from("weekly_task_daily_completions")
    .insert({
      user_id: user.id,
      weekly_task_id: MORNING_ROUTINE_TASK_ID,
      week: MORNING_ROUTINE_WEEK,
      day_number: dayNumber,
    });

  if (error) {
    if (error.code === "23505") {
      return false;
    }

    console.error("[MorningRoutine] Ошибка сохранения выполнения:", error);

    throw error;
  }

  return true;
}
