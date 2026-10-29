
import { createClient } from "@supabase/supabase-js";
import {
  createError,
  defineEventHandler,
  getHeader,
  readBody,
} from "h3";

/* -------------------------------------------------------------------------- */
/* Типы                                                                        */
/* -------------------------------------------------------------------------- */

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

interface ParseContext {
  diaryWords: Set<string>;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  error?: {
    message?: string;
    status?: string;
  };
}

const FOOD_DIARY_TASK_ID = "5382c1d1-f307-4076-a7e7-97e1c03fc5a7";
const MAX_ATTEMPTS = 3;

/* -------------------------------------------------------------------------- */
/* Словарь продуктов                                                           */
/* -------------------------------------------------------------------------- */

const FOOD_GROUPS = {
  grains: {
    label: "крупы, хлеб и гарниры",
    patterns:
      /греч|овсян|каша|кашу|макарон|паста|спагетти|лапша|вермишел|хлеб|хліб|булгур|киноа|кускус|рис|картоф|картош|картопл|пюре|перлов|пшен|пельмен|вареник|галушк/i,
  },
  protein: {
    label: "источники белка",
    patterns:
      /яйц|яиц|яєц|омлет|куриц|курин|куряч|мяс|м'яс|говяд|ялович|свинин|индейк|індик|котлет|фарш|туш[её]нк|рыб|риб(?!ай)|лосос|тунц|творог|творож|сыр|сир|молок|кефир|йогурт|сметан|фасол|квасол|горох|чечевиц|сочевиц|нут|тофу/i,
  },
  vegetables: {
    label: "овощи и зелень",
    patterns:
      /овощ|овоч|салат|винегрет|огурц|огурч|огірк|помидор|помідор|томат|перец|перець|капуст|морков|моркв|свекл|буряк|лук|цибул|кабач|цукін|баклажан|броккол|шпинат|укроп|петрушк|редис|тыкв|гарбуз|сельдер|селер|руккол|гриб|шампиньон/i,
  },
  fruits: {
    label: "фрукты и ягоды",
    patterns:
      /фрукт|ягод|яблок|яблук|банан|апельсин|мандарин|грейпфрут|груш|виноград|клубник|полуниц|малин|черник|смородин|вишн|черешн|персик|абрикос|арбуз|кавун|дын|киви|ананас|манго|гранат|хурм|слив|лимон|изюм|кураг|финик/i,
  },
  dairy: {
    label: "молочные продукты",
    patterns:
      /молок|кефир|кефір|йогурт|творог|творож|сыр|сир|сметан|ряженк|сливк|брынз|бринз|моцарел|пармезан/i,
  },
  fish: {
    label: "рыба и морепродукты",
    patterns:
      /рыб|риб(?!ай)|лосос|семг|сельд|селед|скумбр|сардин|тунц|форел|минтай|хек|треск|креветк|кальмар|мидии|сайра|горбуш/i,
  },
  legumes: {
    label: "бобовые",
    patterns:
      /фасол|квасол|горох|горош|чечевиц|сочевиц|нут|бобов|хумус|тофу|соя/i,
  },
  sweets: {
    label: "сладости и выпечка",
    patterns:
      /печень|печиво|конфет|цукерк|шоколад|торт|пирожн|выпечк|випічк|варень|джем|мед|вафл|пряник|зефир|десерт|сладк|солодк|кекс|круассан|пончик|сгущенк|згущенк|халв|пирог|пахлав|морожен|морозив/i,
  },
  fried: {
    label: "жареные продукты",
    patterns:
      /жарен|жарит|смажен|смажит|фритюр|картоф[её]ль? фри|підсмаж|обжарен/i,
  },
  drinks: {
    label: "напитки",
    patterns:
      /вода|воды|водой|чай|кофе|кава|сок|сік|компот|какао|лимонад|газировк|напит|напій|узвар|смузи/i,
  },
};

type FoodGroup = keyof typeof FOOD_GROUPS;

/* -------------------------------------------------------------------------- */
/* Вспомогательные функции                                                     */
/* -------------------------------------------------------------------------- */

function normalize(value: string): string {
  return value.toLocaleLowerCase().replace(/ё/g, "е").trim();
}

function formatDay(value: string): string {
  const match = String(value).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);

  return match ? `${match[3]}.${match[2]}` : value;
}

function formatTime(value: string | null): string {
  if (!value) return "время не указано";

  const match = value.match(/^(\d{1,2}):(\d{2})/);
  const hours = match?.[1];
  const minutes = match?.[2];

  return hours && minutes
    ? `${hours.padStart(2, "0")}:${minutes}`
    : "время не указано";
}

function detectLanguage(
  locale: unknown,
  acceptLanguage: string | undefined,
  entries: FoodDiaryEntry[],
): string {
  const explicitLocale = String(locale ?? "").toLowerCase();

  if (explicitLocale === "uk" || explicitLocale.startsWith("uk-")) {
    return "украинском";
  }

  if (explicitLocale === "ru" || explicitLocale.startsWith("ru-")) {
    return "русском";
  }

  const headerLocale = (acceptLanguage ?? "")
    .split(",")[0]
    ?.split(";")[0]
    ?.trim()
    .toLowerCase();

  if (headerLocale === "uk" || headerLocale?.startsWith("uk-")) {
    return "украинском";
  }

  if (headerLocale === "ru" || headerLocale?.startsWith("ru-")) {
    return "русском";
  }

  const diaryText = entries.map((entry) => entry.description).join(" ");
  const ukrainianLetters = diaryText.match(/[іїєґІЇЄҐ]/g)?.length ?? 0;

  return ukrainianLetters >= 2 ? "украинском" : "русском";
}

function buildDiaryContext(
  entries: FoodDiaryEntry[],
  firstDate: string,
  secondDate: string,
) {
  const dates = [firstDate, secondDate];

  const entriesText = dates
    .map((date) => {
      const dayEntries = entries.filter((entry) => entry.entry_date === date);

      const lines = dayEntries.map((entry) => {
        return [
          `Время: ${formatTime(entry.meal_time)}`,
          `Тип приёма пищи: ${entry.meal_type || "не указан"}`,
          `Запись: ${entry.description.trim()}`,
          `Самочувствие: ${entry.feeling?.trim() || "не указано"}`,
        ].join(" | ");
      });

      return `ДЕНЬ ${formatDay(date)}:\n${lines.join("\n")}`;
    })
    .join("\n\n");

  const dayFacts = dates.map((date) => {
    const dayEntries = entries.filter((entry) => entry.entry_date === date);
    const descriptions = dayEntries.map((entry) => entry.description).join(" ");

    const groups = (Object.keys(FOOD_GROUPS) as FoodGroup[])
      .filter((key) => FOOD_GROUPS[key].patterns.test(descriptions))
      .map((key) => FOOD_GROUPS[key].label);

    const times = dayEntries
      .map((entry) => entry.meal_time)
      .filter((time): time is string => Boolean(time))
      .map(formatTime);

    return {
      date: formatDay(date),
      entryCount: dayEntries.length,
      groups,
      times,
      descriptions,
    };
  });

  const repeatedGroups = (Object.keys(FOOD_GROUPS) as FoodGroup[])
    .filter((key) =>
      dayFacts.every((day) => FOOD_GROUPS[key].patterns.test(day.descriptions)),
    )
    .map((key) => FOOD_GROUPS[key].label);

  const missingGroups = (Object.keys(FOOD_GROUPS) as FoodGroup[])
    .filter((key) =>
      dayFacts.every(
        (day) => !FOOD_GROUPS[key].patterns.test(day.descriptions),
      ),
    )
    .map((key) => FOOD_GROUPS[key].label);

  const feelingCount = entries.filter((entry) => entry.feeling?.trim()).length;

  const factsText = [
    `Выбранные даты: ${formatDay(firstDate)} и ${formatDay(secondDate)}.`,
    `Количество записей по дням: ${dayFacts
      .map((day) => `${day.date}: ${day.entryCount}`)
      .join("; ")}.`,
    `Повторяющиеся группы продуктов по обоим дням: ${
      repeatedGroups.length ? repeatedGroups.join(", ") : "не определены"
    }.`,
    `Группы, не найденные в записях обоих дней: ${
      missingGroups.length ? missingGroups.join(", ") : "не определены"
    }.`,
    `Самочувствие указано в ${feelingCount} из ${entries.length} записей.`,
    "",
    "Факты о каждом дне:",
    ...dayFacts.map(
      (day) =>
        `- ${day.date}: ${day.entryCount} записей; группы: ${
          day.groups.join(", ") || "не определены"
        }; время: ${day.times.join(", ") || "не указано"}.`,
    ),
  ].join("\n");

  const diaryWords = new Set<string>();

  for (const entry of entries) {
    for (const word of normalize(entry.description).match(/[a-zа-яіїєґ]{3,}/gu) ?? []) {
      diaryWords.add(word.slice(0, 4));
    }
  }

  return {
    entriesText,
    factsText,
    diaryWords,
  };
}

/* -------------------------------------------------------------------------- */
/* Промпт и запрос к Gemini                                                    */
/* -------------------------------------------------------------------------- */

const SYSTEM_PROMPT = `
Ты — бережный консультант по пищевым привычкам в приложении Health Fit.
Анализируй только предоставленные записи. Не ставь диагнозы, не назначай
лечение и не оценивай пользователя. Два дня — небольшая выборка, поэтому
не выдавай предварительные наблюдения за устойчивые привычки.

Верни только JSON, соответствующий заданной структуре. Не добавляй Markdown.
Все текстовые поля ответа должны быть на языке, явно указанном в запросе.
Язык записей пользователя не является указанием менять язык ответа.
`.trim();

async function requestGemini(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  prompt: string;
}): Promise<string> {
  if (!params.apiKey) {
    throw new Error("Не задан geminiApiKey в runtimeConfig.");
  }

  const model = params.model.replace(/^models\//, "").trim();

  if (!model) {
    throw new Error("Не задана модель Gemini.");
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(params.apiKey)}`;

  const response = await $fetch<GeminiResponse>(url, {
    method: "POST",
    timeout: 120_000,
    retry: 0,
    headers: {
      "Content-Type": "application/json",
    },
    body: {
      systemInstruction: {
        parts: [{ text: params.systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: params.prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        maxOutputTokens: 4096,
      },
    },
  });

  const content = response.candidates
    ?.flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!content) {
    const finishReason = response.candidates?.[0]?.finishReason;

    throw new Error(
      `Gemini вернул пустой ответ. Причина завершения: ${finishReason ?? "не указана"}.`,
    );
  }

  return content;
}

function buildPrompt(params: {
  entriesText: string;
  factsText: string;
  languageName: string;
  retryNote?: string;
}): string {
  return `
ЯЗЫК ОТВЕТА: ${params.languageName}.

Весь ответ, включая summary, patterns, recommendations, actions и limitations,
должен быть написан на ${params.languageName}. Не переключайся на другой язык
из-за языка исходных записей. Названия продуктов можно цитировать из дневника.

ЗАДАЧА
Проанализируй питание за два выбранных дня. Подготовь краткое резюме,
обоснованные наблюдения, практичные рекомендации и ровно три небольших действия.

ЗАПИСИ ДНЕВНИКА
${params.entriesText}

ФАКТЫ, ПОДГОТОВЛЕННЫЕ ПРОГРАММОЙ
${params.factsText}

ПРАВИЛА АНАЛИЗА
1. Используй только факты из записей. Не выдумывай продукты, количество,
   симптомы, эмоции, причины поведения или время приёмов пищи.
2. Не делай медицинских выводов, не назначай лечение или добавки.
3. Не подсчитывай калории, БЖУ и не оценивай вес, граммы или размеры порций.
4. Не называй еду вредной, запрещённой или плохой.
5. Не используй слова «часто», «всегда», «обычно», «постоянно»:
   двух дней недостаточно для таких утверждений.
6. Не считай отсутствие продукта в записях доказательством, что человек
   никогда его не ест.
7. Повторяющаяся закономерность должна подтверждаться обоими днями.
   Если надёжных закономерностей нет, верни пустой массив patterns.
8. В evidence указывай даты и конкретные продукты, действительно упомянутые
   в записях. Не придумывай подтверждения.
9. Учитывай сильные стороны рациона, если они действительно видны.
10. Рекомендации должны быть мягкими, реалистичными и не дублировать друг друга.
11. Actions должны быть конкретными и небольшими, выполнимыми в течение недели.
12. В limitations кратко укажи, что по двум дням нельзя достоверно установить
    устойчивые привычки, а неполные записи ограничивают выводы.

ТРЕБОВАНИЯ К СТРУКТУРЕ
- summary: краткое резюме в 2–3 предложениях.
- patterns: массив от 0 до 3 объектов.
- recommendations: массив из 2–4 объектов.
- actions: ровно 3 объекта.
- limitations: короткое объяснение ограничений анализа.
- У каждого объекта patterns должны быть title, explanation, evidence.
- У каждого объекта recommendations должны быть title, explanation.
- У каждого объекта actions должны быть title, description.
- Все значения этих полей должны быть непустыми строками.

${
  params.retryNote
    ? `\nПРЕДЫДУЩИЙ ОТВЕТ НЕ ПРОШЁЛ ПРОВЕРКУ: ${params.retryNote}\nИсправь указанную проблему и верни новый полный JSON.\n`
    : ""
}

Верни только JSON без Markdown и текста до или после него.

Формат:
{
  "summary": "Краткое резюме",
  "patterns": [
    {
      "title": "Название наблюдения",
      "explanation": "Осторожное объяснение",
      "evidence": "Конкретные записи и даты"
    }
  ],
  "recommendations": [
    {
      "title": "Рекомендация",
      "explanation": "Что можно попробовать"
    }
  ],
  "actions": [
    {
      "title": "Действие 1",
      "description": "Конкретный небольшой шаг"
    },
    {
      "title": "Действие 2",
      "description": "Конкретный небольшой шаг"
    },
    {
      "title": "Действие 3",
      "description": "Конкретный небольшой шаг"
    }
  ],
  "limitations": "Ограничения анализа"
}
`.trim();
}

/* -------------------------------------------------------------------------- */
/* Разбор и проверка ответа                                                    */
/* -------------------------------------------------------------------------- */

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function extractJson(content: string): string {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  if (cleaned.startsWith("{") && cleaned.endsWith("}")) {
    return cleaned;
  }

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start >= 0 && end > start) {
    return cleaned.slice(start, end + 1);
  }

  throw new Error("ответ не содержит JSON-объект");
}

function parseAnalysis(
  content: string,
  context: ParseContext,
): FoodDiaryAnalysis {
  let parsed: unknown;

  try {
    parsed = JSON.parse(extractJson(content));
  } catch (error) {
    throw new Error(
      `не удалось прочитать JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const data = asRecord(parsed);

  if (!data) {
    throw new Error("ответ должен быть JSON-объектом");
  }

  const summary = cleanString(data.summary);
  const limitations = cleanString(data.limitations);

  if (!summary) {
    throw new Error("отсутствует summary");
  }

  if (!limitations) {
    throw new Error("отсутствует limitations");
  }

  if (!Array.isArray(data.patterns)) {
    throw new Error("patterns должен быть массивом");
  }

  if (!Array.isArray(data.recommendations)) {
    throw new Error("recommendations должен быть массивом");
  }

  if (!Array.isArray(data.actions)) {
    throw new Error("actions должен быть массивом");
  }

  const patterns = data.patterns
    .map((item) => {
      const record = asRecord(item);

      return {
        title: cleanString(record?.title),
        explanation: cleanString(record?.explanation),
        evidence: cleanString(record?.evidence),
      };
    })
    .filter(
      (item) => item.title && item.explanation && item.evidence,
    )
    .slice(0, 3);

  const recommendations = data.recommendations
    .map((item) => {
      const record = asRecord(item);

      return {
        title: cleanString(record?.title),
        explanation: cleanString(record?.explanation),
      };
    })
    .filter((item) => item.title && item.explanation)
    .slice(0, 4);

  if (recommendations.length < 2) {
    throw new Error(
      `нужно не менее двух рекомендаций; получено: ${recommendations.length}`,
    );
  }

  const actions = data.actions
    .map((item) => {
      const record = asRecord(item);

      return {
        title: cleanString(record?.title),
        description: cleanString(record?.description),
      };
    })
    .filter((item) => item.title && item.description);

  if (actions.length !== 3) {
    throw new Error(
      `нужно ровно три корректных действия; получено: ${actions.length}`,
    );
  }

  const normalizeTitle = (value: string) =>
    normalize(value).replace(/[^\p{L}\p{N}]+/gu, " ");

  const actionTitles = actions.map((item) => normalizeTitle(item.title));

  if (new Set(actionTitles).size !== 3) {
    throw new Error("названия трёх действий повторяются");
  }

  const recommendationTitles = recommendations.map((item) =>
    normalizeTitle(item.title),
  );

  if (new Set(recommendationTitles).size !== recommendationTitles.length) {
    throw new Error("названия рекомендаций повторяются");
  }

  const allText = [
    summary,
    limitations,
    ...patterns.flatMap((item) => [
      item.title,
      item.explanation,
      item.evidence,
    ]),
    ...recommendations.flatMap((item) => [item.title, item.explanation]),
    ...actions.flatMap((item) => [item.title, item.description]),
  ].join(" ");

  if (
    /вредн|шкідлив|запрещ|заборон|калори|калорі|холестерин|диагноз|діагноз|лечени|лікуванн|похуден|схуднен/i.test(
      allText,
    )
  ) {
    throw new Error(
      "ответ содержит запрещённые медицинские или оценочные формулировки",
    );
  }

  // Сохраняем контекст для дальнейшего расширения проверки обоснованности.
  // Не отклоняем весь ответ только потому, что модель использовала
  // словоформу, которой нет в исходной записи.
  void context.diaryWords;

  return {
    summary,
    patterns,
    recommendations,
    actions,
    limitations,
  };
}

/* -------------------------------------------------------------------------- */
/* API                                                                         */
/* -------------------------------------------------------------------------- */

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
    locale?: string;
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

  const languageName = detectLanguage(
    body.locale,
    getHeader(event, "accept-language"),
    diaryEntries,
  );

  const diaryContext = buildDiaryContext(
    diaryEntries,
    String(session.first_date),
    String(session.second_date),
  );

  let analysis: FoodDiaryAnalysis | undefined;
  let retryNote = "";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const prompt = buildPrompt({
      entriesText: diaryContext.entriesText,
      factsText: diaryContext.factsText,
      languageName,
      retryNote,
    });

    let content: string;

    try {
      content = await requestGemini({
        apiKey: String(config.geminiApiKey || ""),
        model: String(config.geminiModel || "gemini-3.1-flash-lite"),
        systemPrompt: SYSTEM_PROMPT,
        prompt,
      });
    } catch (error) {
      console.error(
        `[FoodDiary] Gemini request failed (attempt ${attempt}/${MAX_ATTEMPTS}):`,
        error,
      );

      throw createError({
        statusCode: 502,
        statusMessage:
          "Не удалось получить ответ от ИИ. Проверь настройки Gemini API и попробуй ещё раз.",
      });
    }

    try {
      analysis = parseAnalysis(content, {
        diaryWords: diaryContext.diaryWords,
      });

      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      console.error(
        `[FoodDiary] Analysis rejected (attempt ${attempt}/${MAX_ATTEMPTS}):`,
        message,
      );

      retryNote = message;
    }
  }

  if (!analysis) {
    console.error(
      "[FoodDiary] All Gemini responses were rejected by validation.",
    );

    throw createError({
      statusCode: 502,
      statusMessage:
        "ИИ не смог подготовить корректный анализ после нескольких попыток. Попробуй ещё раз.",
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
