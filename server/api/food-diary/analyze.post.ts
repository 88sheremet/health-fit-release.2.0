import { createClient } from "@supabase/supabase-js";
import {
  createError,
  defineEventHandler,
  getHeader,
  readBody,
} from "h3";

interface FoodDiaryEntry {
  entry_date: string;
  meal_type: string;
  meal_time: string | null;
  description: string;
  feeling: string | null;
}

interface FoodDiaryAnalysis {
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

const FOOD_DIARY_TASK_ID = "5382c1d1-f307-4076-a7e7-97e1c03fc5a7";

function parseAnalysis(content: string): FoodDiaryAnalysis {
  const parsed = JSON.parse(content) as FoodDiaryAnalysis;

  if (
    !parsed ||
    typeof parsed.summary !== "string" ||
    !Array.isArray(parsed.patterns) ||
    !Array.isArray(parsed.recommendations) ||
    !Array.isArray(parsed.actions) ||
    typeof parsed.limitations !== "string"
  ) {
    throw new Error("AI вернул результат в неожиданном формате.");
  }

  if (parsed.actions.length !== 3) {
    throw new Error("AI должен предложить ровно три действия.");
  }

  return parsed;
}

export default defineEventHandler(async (event) => {
  const authorization = getHeader(event, "authorization");
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: "Необходимо войти в аккаунт.",
    });
  }

  const config = useRuntimeConfig(event);
  const supabaseUrl = String(config.public.supabase?.url || "");
  const supabaseKey = String(config.public.supabase?.key || "");

  if (!supabaseUrl || !supabaseKey) {
    console.error("[FoodDiary] Supabase URL или public key не настроены.");

    throw createError({
      statusCode: 500,
      statusMessage: "Не настроено подключение к Supabase.",
    });
  }

  // Используем переданный access token для всех запросов к Supabase.
  // Сессия не сохраняется на сервере и не обновляется автоматически.
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(accessToken);

  if (authError || !user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Сессия недействительна или завершилась. Войди заново.",
    });
  }

  const body = await readBody<{
    taskId?: string;
    programWeek?: number;
  }>(event);

  if (
    body?.taskId !== FOOD_DIARY_TASK_ID ||
    !Number.isInteger(body.programWeek) ||
    !body.programWeek ||
    body.programWeek < 1
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Некорректные параметры дневника.",
    });
  }

  const { data: session, error: sessionError } = await supabase
    .from("weekly_food_diary_sessions")
    .select("*")
    .eq("user_id", user.id)
    .eq("weekly_task_id", FOOD_DIARY_TASK_ID)
    .eq("program_week", body.programWeek)
    .maybeSingle();

  if (sessionError) {
    console.error("[FoodDiary] Session lookup failed:", sessionError);

    throw createError({
      statusCode: 500,
      statusMessage: "Не удалось загрузить дневник.",
    });
  }

  if (!session || !session.first_date || !session.second_date) {
    throw createError({
      statusCode: 400,
      statusMessage: "Сначала выбери два дня для дневника.",
    });
  }

  if (session.stage === "collecting") {
    throw createError({
      statusCode: 400,
      statusMessage: "Сначала проверь записи дневника.",
    });
  }

  if (session.stage === "ready" && session.analysis) {
    return {
      success: true,
      analysis: session.analysis as FoodDiaryAnalysis,
      cached: true,
    };
  }

  const { data: entries, error: entriesError } = await supabase
    .from("weekly_food_diary_entries")
    .select("entry_date, meal_type, meal_time, description, feeling")
    .eq("user_id", user.id)
    .eq("weekly_task_id", FOOD_DIARY_TASK_ID)
    .eq("program_week", body.programWeek)
    .in("entry_date", [session.first_date, session.second_date])
    .order("entry_date", { ascending: true })
    .order("meal_time", { ascending: true });

  if (entriesError) {
    console.error("[FoodDiary] Entries lookup failed:", entriesError);

    throw createError({
      statusCode: 500,
      statusMessage: "Не удалось загрузить записи питания.",
    });
  }

  const diaryEntries = (entries ?? []) as FoodDiaryEntry[];

  const firstDayHasEntries = diaryEntries.some(
    (entry) => entry.entry_date === session.first_date,
  );

  const secondDayHasEntries = diaryEntries.some(
    (entry) => entry.entry_date === session.second_date,
  );

  if (!firstDayHasEntries || !secondDayHasEntries) {
    throw createError({
      statusCode: 400,
      statusMessage:
        "Добавь хотя бы одну запись за каждый из двух выбранных дней.",
    });
  }

  const ollamaBaseUrl = String(
    config.ollamaBaseUrl || "http://127.0.0.1:11434",
  ).replace(/\/+$/, "");

  const ollamaModel = String(config.ollamaModel || "qwen2.5:3b");

  const prompt = `
Ты — бережный помощник по пищевым привычкам в приложении Health Fit.

Проанализируй дневник питания пользователя за два выбранных дня.

ЦЕЛИ:
- Найти осторожно сформулированные повторяющиеся закономерности.
- Учесть время приёмов пищи, тип еды и напитков, а также самочувствие, если оно указано.
- Предложить практичные и реалистичные улучшения привычек.
- Сформировать ровно три небольших действия.

ОГРАНИЧЕНИЯ:
- Не подсчитывай калории.
- Не проси и не оценивай граммы, вес или размеры порций.
- Не ставь диагнозы и не делай медицинских заключений.
- Не называй закономерность доказанной, если наблюдений недостаточно.
- Не выдумывай продукты, симптомы, эмоции или причины.
- Не стыди пользователя и не оценивай его силу воли.
- Не назначай диеты, добавки или лечение.
- Если самочувствие не записано, не делай выводов о связи питания с самочувствием.
- Учитывай, что два дня — небольшая выборка.
- Отвечай на русском или украинском языке, на том языке, на котором заполнен дневник, дружелюбно и без сложных терминов.
- В evidence используй только конкретные факты из дневника.
- Если закономерностей недостаточно, честно сообщи об этом в limitations.

Верни только валидный JSON, без Markdown и текста вокруг.

Формат:
{
  "summary": "Краткое резюме наблюдений",
  "patterns": [
    {
      "title": "Короткое название",
      "explanation": "Осторожное объяснение закономерности",
      "evidence": "Какие записи это подтверждают"
    }
  ],
  "recommendations": [
    {
      "title": "Короткая рекомендация",
      "explanation": "Что можно попробовать и почему"
    }
  ],
  "actions": [
    {
      "title": "Небольшое действие",
      "description": "Конкретный шаг, который можно выполнить"
    },
    {
      "title": "Небольшое действие",
      "description": "Конкретный шаг, который можно выполнить"
    },
    {
      "title": "Небольшое действие",
      "description": "Конкретный шаг, который можно выполнить"
    }
  ],
  "limitations": "Что нельзя достоверно заключить по этим записям"
}

Даты дневника:
${session.first_date} и ${session.second_date}

Записи пользователя:
${JSON.stringify(diaryEntries)}
`.trim();

  let analysis: FoodDiaryAnalysis;

  try {
    const response = await $fetch<{
      message?: { content?: string };
    }>(`${ollamaBaseUrl}/api/chat`, {
      method: "POST",
      timeout: 180_000,
      body: {
        model: ollamaModel,
        stream: false,
        format: "json",
        messages: [
          {
            role: "system",
            content:
              "Ты анализируешь пищевые привычки бережно и осторожно. Возвращай только JSON указанной структуры.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        options: {
          temperature: 0.2,
        },
      },
    });

    if (!response.message?.content) {
      throw new Error("Ollama вернул пустой ответ.");
    }

    analysis = parseAnalysis(response.message.content);
  } catch (error) {
    console.error("[FoodDiary] Ollama analysis failed:", error);

    throw createError({
      statusCode: 502,
      statusMessage:
        "Не удалось провести ИИ-анализ. Проверь, запущена ли Ollama и доступна ли модель.",
    });
  }

  const { error: updateError } = await supabase
    .from("weekly_food_diary_sessions")
    .update({
      stage: "ready",
      analysis,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("weekly_task_id", FOOD_DIARY_TASK_ID)
    .eq("program_week", body.programWeek);

  if (updateError) {
    console.error("[FoodDiary] Failed to save analysis:", updateError);

    throw createError({
      statusCode: 500,
      statusMessage:
        "Анализ выполнен, но не удалось сохранить результат. Попробуй ещё раз.",
    });
  }

  return {
    success: true,
    analysis,
    cached: false,
  };
});