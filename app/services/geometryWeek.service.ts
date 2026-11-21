
interface GeometryWeekCompletion {
  day: number;
}

function getSupabaseClient() {
  return useSupabaseClient();
}

/**
 * Загружает выполненные этапы пользователя
 * для конкретного недельного задания.
 */
export async function getGeometryWeekProgress(
  taskId: string,
  week: number,
): Promise<number[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("weekly_task_day_completions")
    .select("day")
    .eq("weekly_task_id", taskId)
    .eq("week", week)
    .order("day", { ascending: true });

  if (error) {
    console.error(
      "[GeometryWeekService] Не удалось загрузить прогресс:",
      error,
    );

    throw error;
  }

  return ((data ?? []) as GeometryWeekCompletion[]).map(
    (item) => item.day,
  );
}

/**
 * Сохраняет выполнение этапа текущего дня.
 */
export async function completeGeometryWeekDay(
  taskId: string,
  week: number,
  day: number,
): Promise<void> {
  if (!taskId) {
    throw new Error("Не указан ID недельного задания.");
  }

  if (!Number.isInteger(week) || week < 1) {
    throw new Error("Некорректный номер недели.");
  }

  if (!Number.isInteger(day) || day < 1 || day > 7) {
    throw new Error("Некорректный номер этапа.");
  }

  const supabase = getSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Не удалось определить пользователя.");
  }

  const { error } = await supabase
    .from("weekly_task_day_completions")
    .insert({
      user_id: user.id,
      weekly_task_id: taskId,
      week,
      day,
    });

  if (error) {
    if (error.code === "23505") {
      throw new Error("Этот этап уже был выполнен.");
    }

    console.error(
      "[GeometryWeekService] Не удалось сохранить этап:",
      error,
    );

    throw error;
  }
}