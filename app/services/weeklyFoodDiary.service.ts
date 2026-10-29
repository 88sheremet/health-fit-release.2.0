export type FoodDiaryStage = "collecting" | "review" | "ready";

export type FoodDiaryMealType =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "drink";

export interface FoodDiaryEntry {
  id: string;
  entry_date: string;
  meal_type: FoodDiaryMealType;
  meal_time: string | null;
  description: string;
  feeling: string | null;
}

export interface FoodDiaryAnalysis {
  summary: string;
  patterns: Array<{
    title: string;
    explanation: string;
    evidence: string;
  }>;
  recommendations: Array<{
    title: string;
    explanation: string;
  }>;
  actions: Array<{
    title: string;
    description: string;
  }>;
  limitations: string;
}

export interface FoodDiarySession {
  id: string;
  first_date: string | null;
  second_date: string | null;
  stage: FoodDiaryStage;
  analysis: FoodDiaryAnalysis | null;
}

export type FoodDiaryErrorCode =
  | "invalidTask"
  | "unauthorized"
  | "invalidDates"
  | "orphanedDates"
  | "datesNotChosen"
  | "dateMismatch"
  | "descriptionRequired"
  | "missingEntryBothDays";

export class FoodDiaryError extends Error {
  readonly code: FoodDiaryErrorCode;

  constructor(code: FoodDiaryErrorCode, message: string) {
    super(message);
    this.name = "FoodDiaryError";
    this.code = code;
  }
}

const FOOD_DIARY_TASK_ID = "5382c1d1-f307-4076-a7e7-97e1c03fc5a7";

function validateTaskId(taskId: string) {
  if (taskId !== FOOD_DIARY_TASK_ID) {
    throw new FoodDiaryError(
      "invalidTask",
      "Некорректная задача дневника питания.",
    );
  }
}

const getDatabase = () => useSupabaseClient() as any;

async function getUserId(): Promise<string> {
  const supabase = getDatabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user)
    throw new FoodDiaryError("unauthorized", "Пользователь не авторизован");

  return user.id;
}

export async function loadFoodDiary(
  taskId: string,
  programWeek: number,
): Promise<{ session: FoodDiarySession | null; entries: FoodDiaryEntry[] }> {
  validateTaskId(taskId);
  const supabase = getDatabase();
  const userId = await getUserId();

  const { data: session, error: sessionError } = await supabase
    .from("weekly_food_diary_sessions")
    .select("id, first_date, second_date, stage, analysis")
    .eq("user_id", userId)
    .eq("weekly_task_id", taskId)
    .eq("program_week", programWeek)
    .maybeSingle();

  if (sessionError) throw sessionError;

  if (!session) {
    return { session: null, entries: [] };
  }

  const { data: entries, error: entriesError } = await supabase
    .from("weekly_food_diary_entries")
    .select("id, entry_date, meal_type, meal_time, description, feeling")
    .eq("user_id", userId)
    .eq("weekly_task_id", taskId)
    .eq("program_week", programWeek)
    .order("entry_date", { ascending: true })
    .order("meal_time", { ascending: true });

  if (entriesError) throw entriesError;

  return {
    session: session as FoodDiarySession,
    entries: (entries ?? []) as FoodDiaryEntry[],
  };
}

export async function saveFoodDiaryDates(
  taskId: string,
  programWeek: number,
  firstDate: string,
  secondDate: string,
): Promise<FoodDiarySession> {
  validateTaskId(taskId);

  if (!firstDate || !secondDate || firstDate === secondDate) {
    throw new FoodDiaryError("invalidDates", "Выбери две разные даты.");
  }

  const supabase = getDatabase();
  const userId = await getUserId();

  const { data: existingSession, error: readSessionError } = await supabase
    .from("weekly_food_diary_sessions")
    .select("first_date, second_date")
    .eq("user_id", userId)
    .eq("weekly_task_id", taskId)
    .eq("program_week", programWeek)
    .maybeSingle();

  if (readSessionError) throw readSessionError;

  if (existingSession) {
    const { data: existingEntries, error: entriesError } = await supabase
      .from("weekly_food_diary_entries")
      .select("id, entry_date")
      .eq("user_id", userId)
      .eq("weekly_task_id", taskId)
      .eq("program_week", programWeek);

    if (entriesError) throw entriesError;

    const allowedDates = new Set([firstDate, secondDate]);
    const orphaned = (existingEntries ?? []).some(
      (entry: { entry_date: string }) => !allowedDates.has(entry.entry_date),
    );

    if (orphaned) {
      throw new FoodDiaryError(
        "orphanedDates",
        "Новые даты не совпадают с датами существующих записей. Сначала удали или перенеси такие записи.",
      );
    }
  }

  const { data, error } = await supabase
    .from("weekly_food_diary_sessions")
    .upsert(
      {
        user_id: userId,
        weekly_task_id: taskId,
        program_week: programWeek,
        first_date: firstDate,
        second_date: secondDate,
        stage: "collecting",
        analysis: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,weekly_task_id,program_week" },
    )
    .select("id, first_date, second_date, stage, analysis")
    .single();

  if (error) throw error;

  return data as FoodDiarySession;
}

export async function saveFoodDiaryEntry(
  taskId: string,
  programWeek: number,
  entry: {
    id?: string;
    entry_date: string;
    meal_type: FoodDiaryMealType;
    meal_time: string;
    description: string;
    feeling: string;
  },
): Promise<FoodDiaryEntry> {
  validateTaskId(taskId);
  const supabase = getDatabase();
  const userId = await getUserId();

  const { data: session, error: sessionError } = await supabase
    .from("weekly_food_diary_sessions")
    .select("first_date, second_date")
    .eq("user_id", userId)
    .eq("weekly_task_id", taskId)
    .eq("program_week", programWeek)
    .maybeSingle();

  if (sessionError) throw sessionError;
  if (!session?.first_date || !session?.second_date) {
    throw new FoodDiaryError(
      "datesNotChosen",
      "Сначала выбери две даты дневника.",
    );
  }

  if (
    entry.entry_date !== session.first_date &&
    entry.entry_date !== session.second_date
  ) {
    throw new FoodDiaryError(
      "dateMismatch",
      "Дата записи должна совпадать с одним из выбранных дней.",
    );
  }

  const payload = {
    user_id: userId,
    weekly_task_id: taskId,
    program_week: programWeek,
    entry_date: entry.entry_date,
    meal_type: entry.meal_type,
    meal_time: entry.meal_time || null,
    description: entry.description.trim(),
    feeling: entry.feeling.trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (!payload.description) {
    throw new FoodDiaryError(
      "descriptionRequired",
      "Добавь описание еды или напитка.",
    );
  }

  const query = entry.id
    ? supabase
        .from("weekly_food_diary_entries")
        .update(payload)
        .eq("id", entry.id)
        .eq("user_id", userId)
        .eq("weekly_task_id", taskId)
        .eq("program_week", programWeek)
    : supabase.from("weekly_food_diary_entries").insert(payload);

  const { data, error } = await query
    .select("id, entry_date, meal_type, meal_time, description, feeling")
    .single();

  if (error) throw error;

  await invalidateAnalysis(supabase, userId, taskId, programWeek);

  return data as FoodDiaryEntry;
}

async function invalidateAnalysis(
  supabase: any,
  userId: string,
  taskId: string,
  programWeek: number,
) {
  const { error } = await supabase
    .from("weekly_food_diary_sessions")
    .update({
      stage: "collecting",
      analysis: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("weekly_task_id", taskId)
    .eq("program_week", programWeek);

  if (error) throw error;
}

export async function deleteFoodDiaryEntry(
  taskId: string,
  programWeek: number,
  entryId: string,
): Promise<void> {
  validateTaskId(taskId);
  const supabase = getDatabase();
  const userId = await getUserId();

  const { error } = await supabase
    .from("weekly_food_diary_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", userId)
    .eq("weekly_task_id", taskId)
    .eq("program_week", programWeek);

  if (error) throw error;

  await invalidateAnalysis(supabase, userId, taskId, programWeek);
}

export async function setFoodDiaryStage(
  taskId: string,
  programWeek: number,
  stage: FoodDiaryStage,
): Promise<void> {
  validateTaskId(taskId);
  const supabase = getDatabase();
  const userId = await getUserId();

  const { data: session, error: readError } = await supabase
    .from("weekly_food_diary_sessions")
    .select("first_date, second_date")
    .eq("user_id", userId)
    .eq("weekly_task_id", taskId)
    .eq("program_week", programWeek)
    .maybeSingle();

  if (readError) throw readError;
  if (!session?.first_date || !session?.second_date) {
    throw new FoodDiaryError(
      "datesNotChosen",
      "Сначала выбери две даты дневника.",
    );
  }

  if (stage === "review" || stage === "ready") {
    const { data: entries, error: entriesError } = await supabase
      .from("weekly_food_diary_entries")
      .select("entry_date")
      .eq("user_id", userId)
      .eq("weekly_task_id", taskId)
      .eq("program_week", programWeek)
      .in("entry_date", [session.first_date, session.second_date]);

    if (entriesError) throw entriesError;

    const datesWithEntries = new Set(
      (entries ?? []).map((entry: { entry_date: string }) => entry.entry_date),
    );

    if (
      !datesWithEntries.has(session.first_date) ||
      !datesWithEntries.has(session.second_date)
    ) {
      throw new FoodDiaryError(
        "missingEntryBothDays",
        "Добавь хотя бы одну запись за каждый из двух выбранных дней.",
      );
    }
  }

  const updatePayload: Record<string, unknown> = {
    stage,
    updated_at: new Date().toISOString(),
  };

  if (stage === "collecting") {
    updatePayload.analysis = null;
  }

  const { error } = await supabase
    .from("weekly_food_diary_sessions")
    .update(updatePayload)
    .eq("user_id", userId)
    .eq("weekly_task_id", taskId)
    .eq("program_week", programWeek);

  if (error) throw error;
}
