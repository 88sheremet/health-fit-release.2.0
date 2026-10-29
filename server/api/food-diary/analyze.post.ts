import { createClient } from "@supabase/supabase-js";
import { createError, defineEventHandler, getHeader, readBody } from "h3";

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

interface FoodGroupDefinition {
  label: string;
  patterns: RegExp;
}

interface DayFacts {
  date: string;
  entryCount: number;
  groups: string[];
  times: string[];
  descriptions: string;
  mealIntervals: string[];
}

interface DiaryContext {
  entriesText: string;
  factsText: string;
}

const FOOD_DIARY_TASK_ID = "5382c1d1-f307-4076-a7e7-97e1c03fc5a7";

const MAX_ATTEMPTS = 3;
const GEMINI_TIMEOUT = 120_000;

/* -------------------------------------------------------------------------- */
/* Словарь продуктов                                                           */
/* -------------------------------------------------------------------------- */

const FOOD_GROUPS: Record<string, FoodGroupDefinition> = {
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
  return value
    .toLocaleLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDay(value: string): string {
  const match = String(value)
    .slice(0, 10)
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);

  return match ? `${match[3]}.${match[2]}` : value;
}

function formatTime(value: string | null): string {
  if (!value) return "время не указано";

  const match = value.match(/^(\d{1,2}):(\d{2})/);

  if (!match) return "время не указано";

  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function getMinutes(value: string | null): number | null {
  if (!value) return null;

  const match = value.match(/^(\d{1,2}):(\d{2})/);

  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function formatInterval(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours && remainingMinutes) {
    return `${hours} ч ${remainingMinutes} мин`;
  }

  if (hours) {
    return `${hours} ч`;
  }

  return `${remainingMinutes} мин`;
}

function detectLanguage(
  locale: unknown,
  acceptLanguage: string | undefined,
  entries: FoodDiaryEntry[],
): string {
  const explicitLocale = String(locale ?? "")
    .toLowerCase()
    .trim();

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

function getFoodGroups(description: string): FoodGroup[] {
  return (Object.keys(FOOD_GROUPS) as FoodGroup[]).filter((key) =>
    FOOD_GROUPS[key].patterns.test(description),
  );
}

function getMealIntervals(entries: FoodDiaryEntry[]): string[] {
  const meals = entries
    .map((entry) => ({
      time: getMinutes(entry.meal_time),
      formattedTime: formatTime(entry.meal_time),
    }))
    .filter(
      (
        item,
      ): item is {
        time: number;
        formattedTime: string;
      } => item.time !== null,
    )
    .sort((a, b) => a.time - b.time);

  const intervals: string[] = [];

  for (let index = 1; index < meals.length; index += 1) {
    const previous = meals[index - 1];
    const current = meals[index];

    const difference = current.time - previous.time;

    if (difference <= 0) continue;

    intervals.push(
      `${previous.formattedTime} → ${current.formattedTime}: ${formatInterval(
        difference,
      )}`,
    );
  }

  return intervals;
}

/* -------------------------------------------------------------------------- */
/* Формирование контекста дневника                                             */
/* -------------------------------------------------------------------------- */

function buildDiaryContext(
  entries: FoodDiaryEntry[],
  firstDate: string,
  secondDate: string,
): DiaryContext {
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

      return [
        `ДЕНЬ ${formatDay(date)}:`,
        lines.length ? lines.join("\n") : "Записей нет.",
      ].join("\n");
    })
    .join("\n\n");

  const dayFacts: DayFacts[] = dates.map((date) => {
    const dayEntries = entries.filter((entry) => entry.entry_date === date);

    const descriptions = dayEntries.map((entry) => entry.description).join(" ");

    const groups = getFoodGroups(descriptions).map(
      (key) => FOOD_GROUPS[key].label,
    );

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
      mealIntervals: getMealIntervals(dayEntries),
    };
  });

  const repeatedGroups = (Object.keys(FOOD_GROUPS) as FoodGroup[])
    .filter((key) =>
      dayFacts.every((day) => FOOD_GROUPS[key].patterns.test(day.descriptions)),
    )
    .map((key) => FOOD_GROUPS[key].label);

  const groupsByDay = dayFacts.map((day) => ({
    date: day.date,
    groups: getFoodGroups(day.descriptions),
  }));

  const feelingCount = entries.filter((entry) =>
    Boolean(entry.feeling?.trim()),
  ).length;

  const entriesWithTime = entries.filter(
    (entry) => getMinutes(entry.meal_time) !== null,
  ).length;

  const factsText = [
    `Выбранные даты: ${formatDay(firstDate)} и ${formatDay(secondDate)}.`,
    "",
    "ОБЩИЕ ФАКТЫ:",
    `Всего записей: ${entries.length}.`,
    `Записей с указанным временем: ${entriesWithTime} из ${entries.length}.`,
    `Самочувствие указано в ${feelingCount} из ${entries.length} записей.`,
    `Группы продуктов, обнаруженные в записях обоих дней: ${
      repeatedGroups.length ? repeatedGroups.join(", ") : "не обнаружены"
    }.`,
    "",
    "ФАКТЫ ПО КАЖДОМУ ДНЮ:",
    ...dayFacts.map((day) => {
      return [
        `Дата: ${day.date}.`,
        `Количество записей: ${day.entryCount}.`,
        `Группы продуктов: ${
          day.groups.length ? day.groups.join(", ") : "не определены"
        }.`,
        `Время приёмов пищи: ${
          day.times.length ? day.times.join(", ") : "не указано"
        }.`,
        `Интервалы между записанными приёмами пищи: ${
          day.mealIntervals.length
            ? day.mealIntervals.join("; ")
            : "недостаточно данных"
        }.`,
      ].join(" ");
    }),
    "",
    "ВАЖНО:",
    "Наличие группы в записях означает только то, что соответствующие продукты были упомянуты.",
    "Отсутствие группы в записях не доказывает, что человек не употребляет эти продукты.",
    "Интервалы рассчитаны только между приёмами пищи с указанным временем.",
    "Количество записей не обязательно отражает все приёмы пищи за день.",
  ].join("\n");

  return {
    entriesText,
    factsText,
  };
}

/* -------------------------------------------------------------------------- */
/* Промпт                                                                      */
/* -------------------------------------------------------------------------- */

const SYSTEM_PROMPT = `
Ты — персональный помощник по пищевым привычкам в приложении Health Fit.

Твоя задача — помогать человеку лучше понимать собственное питание,
замечать возможные закономерности и постепенно формировать комфортные
и реалистичные привычки.

Ты работаешь бережно, без осуждения, давления и категоричных оценок.

ВАЖНЫЕ ПРИНЦИПЫ:

1. Анализируй только предоставленные записи и факты.
2. Не выдумывай продукты, порции, количество, симптомы или обстоятельства.
3. Не ставь диагнозы и не назначай лечение.
4. Не оценивай человека и его силу воли.
5. Не дели продукты на хорошие и плохие.
6. Не используй запугивание и чувство вины.
7. Помни, что два дня — небольшая выборка.
8. Не превращай отсутствие информации в негативный вывод.
9. Не делай выводов о причинах поведения без подтверждения.
10. Предлагай небольшие изменения, которые можно попробовать без давления.

Язык ответа всегда определяется отдельным параметром запроса.
Не переключай язык из-за языка дневника.

Верни только JSON. Не добавляй Markdown.
`.trim();

function buildPrompt(params: {
  entriesText: string;
  factsText: string;
  languageName: string;
  retryNote?: string;
}): string {
  return `
ЯЗЫК ОТВЕТА

Пиши исключительно на ${params.languageName}.

Все поля JSON должны быть на этом языке:
summary, patterns, recommendations, actions, limitations.

Не смешивай русский и украинский.
Названия продуктов можно цитировать из дневника, если это необходимо.

РОЛЬ

Ты — персональный помощник по пищевым привычкам.

Твоя цель — не просто перечислить продукты, а помочь пользователю понять:
- какие особенности питания видны в записях;
- какие сильные стороны уже присутствуют;
- на что можно обратить внимание;
- какие небольшие изменения можно попробовать;
- какие дополнительные данные помогут сделать следующий анализ точнее.

ЗАПИСИ ДНЕВНИКА

${params.entriesText}

ФАКТЫ, ПОДГОТОВЛЕННЫЕ ПРОГРАММОЙ

${params.factsText}

ЗАДАЧА

Подготовь персональный анализ питания за два выбранных дня.

Анализ должен быть полезным, конкретным и связанным с реальными записями.

Не ограничивайся рекомендацией «продолжай вести дневник».
Помогай пользователю постепенно лучше понимать свои пищевые привычки.

КАК АНАЛИЗИРОВАТЬ

1. Разнообразие питания

Обрати внимание на группы продуктов:
- крупы, хлеб и гарниры;
- источники белка;
- овощи и зелень;
- фрукты и ягоды;
- молочные продукты;
- рыба и морепродукты;
- бобовые;
- сладости и выпечка;
- напитки.

Учитывай конкретные продукты, а не только названия групп.

Например, если в записях есть яйца, творог и горох, можно отметить
разнообразие упомянутых источников белка.

Не утверждай, что рацион сбалансирован только на основании наличия
нескольких групп продуктов.

2. Повторяющиеся наблюдения

Повторяющимся можно называть только то, что подтверждается записями
обоих дней.

Если продукт или группа встречается только один раз, не называй это
устойчивой привычкой.

3. Время питания

Используй рассчитанные программой интервалы между записями.

Можно отметить заметный интервал между записанными приёмами пищи,
но нельзя утверждать, что человек пропускал еду или голодал.

Если записей мало, прямо укажи, что картина может быть неполной.

4. Самочувствие

Если пользователь указывал самочувствие, осторожно сопоставляй его
с конкретными приёмами пищи.

Не устанавливай причинно-следственные связи.

Например, нельзя утверждать, что конкретный продукт вызвал усталость
или улучшил самочувствие.

Если самочувствие не указано, не придумывай эмоциональные или физические
реакции.

5. Сильные стороны

Обязательно ищи реальные положительные моменты:
- разнообразие продуктов;
- наличие разных источников белка;
- овощи и фрукты в записях;
- регулярность записей, если она действительно видна;
- внимание пользователя к своему питанию.

Не придумывай сильные стороны ради заполнения отчёта.

6. Рекомендации

Рекомендации должны быть связаны с конкретными наблюдениями.

Предлагай мягкие и практичные изменения:
- добавить разнообразия в определённую группу продуктов;
- обратить внимание на состав отдельных приёмов пищи;
- попробовать включить конкретный продукт;
- наблюдать за самочувствием после еды;
- дополнить дневник информацией, которой не хватает для анализа.

Не давай универсальные советы, если они не связаны с записями.

Не назначай диеты, ограничения, добавки или лечение.

7. Действия

Предложи ровно три небольших действия на ближайшую неделю.

Каждое действие должно:
- быть конкретным;
- быть выполнимым;
- иметь понятную формулировку;
- помогать постепенно улучшать пищевые привычки или понимание своего питания.

Действия не должны просто повторять названия рекомендаций.

Не делай все три действия заданиями по заполнению дневника.
Если данных достаточно, предложи действия, связанные непосредственно с питанием.

8. Ограничения анализа

Учитывай, что анализ основан только на двух выбранных днях.
Не делай выводов об устойчивых привычках.
Если записи неполные, укажи это.

ТРЕБОВАНИЯ К СТРУКТУРЕ

summary:
- 2–3 предложения.
- Кратко опиши общую картину.
- Упомяни конкретные особенности питания.
- Не используй общие фразы, которые подходят любому человеку.

patterns:
- От 0 до 3 наблюдений.
- Не нужно обязательно заполнять все три.
- Каждое наблюдение должно иметь конкретное подтверждение.
- В evidence укажи даты и реальные продукты из дневника.
- Если данных для наблюдения недостаточно, не добавляй его.

recommendations:
- От 2 до 4 рекомендаций.
- Они должны быть персональными и не дублировать друг друга.
- Каждая рекомендация должна объяснять, что можно попробовать и зачем.

actions:
- Ровно 3 действия.
- Они должны быть конкретными и небольшими.
- Не повторяй рекомендации дословно.

limitations:
- Кратко опиши ограничения анализа.
- Не используй пугающие или обвиняющие формулировки.

ПРОВЕРЬ ПЕРЕД ОТВЕТОМ

- Все ли выводы подтверждаются записями?
- Не перепутаны ли даты?
- Не придуманы ли продукты?
- Не сделаны ли выводы о пропущенных приёмах пищи?
- Не выданы ли предположения за факты?
- Есть ли практическая польза для пользователя?
- Не повторяют ли actions рекомендации?
- Весь ли ответ написан на ${params.languageName}?

${
  params.retryNote
    ? `
ПРЕДЫДУЩИЙ ОТВЕТ НЕ ПРОШЁЛ ПРОВЕРКУ:

${params.retryNote}

Исправь проблему и верни полный JSON.
`
    : ""
}

ВЕРНИ ТОЛЬКО JSON БЕЗ MARKDOWN.

Формат:

{
  "summary": "Краткое персональное резюме",
  "patterns": [
    {
      "title": "Название наблюдения",
      "explanation": "Что это может означать",
      "evidence": "Конкретные продукты и даты из дневника"
    }
  ],
  "recommendations": [
    {
      "title": "Рекомендация",
      "explanation": "Что можно попробовать и почему"
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
/* Запрос к Gemini                                                             */
/* -------------------------------------------------------------------------- */

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
    `${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(
      params.apiKey,
    )}`;

  const response = await $fetch<GeminiResponse>(url, {
    method: "POST",
    timeout: GEMINI_TIMEOUT,
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
        temperature: 0.3,
        responseMimeType: "application/json",
        maxOutputTokens: 4096,
      },
    },
  });

  const candidate = response.candidates?.[0];

  const content = candidate?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!content) {
    throw new Error(
      `Gemini вернул пустой ответ. Причина завершения: ${
        candidate?.finishReason ?? "не указана"
      }.`,
    );
  }

  return content;
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

  throw new Error("Ответ не содержит JSON-объект.");
}

function normalizeTitle(value: string): string {
  return normalize(value).replace(/[^\p{L}\p{N}]+/gu, " ");
}

function parseAnalysis(content: string): FoodDiaryAnalysis {
  let parsed: unknown;

  try {
    parsed = JSON.parse(extractJson(content));
  } catch (error) {
    throw new Error(
      `Не удалось прочитать JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const data = asRecord(parsed);

  if (!data) {
    throw new Error("Ответ должен быть JSON-объектом.");
  }

  const summary = cleanString(data.summary);
  const limitations = cleanString(data.limitations);

  if (!summary) {
    throw new Error("Отсутствует summary.");
  }

  if (!limitations) {
    throw new Error("Отсутствует limitations.");
  }

  if (!Array.isArray(data.patterns)) {
    throw new Error("patterns должен быть массивом.");
  }

  if (!Array.isArray(data.recommendations)) {
    throw new Error("recommendations должен быть массивом.");
  }

  if (!Array.isArray(data.actions)) {
    throw new Error("actions должен быть массивом.");
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
    .filter((item) => item.title && item.explanation && item.evidence)
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
      `Нужно не менее двух рекомендаций. Получено: ${recommendations.length}.`,
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
      `Нужно ровно три корректных действия. Получено: ${actions.length}.`,
    );
  }

  const actionTitles = actions.map((item) => normalizeTitle(item.title));

  if (new Set(actionTitles).size !== 3) {
    throw new Error("Названия трёх действий повторяются.");
  }

  const recommendationTitles = recommendations.map((item) =>
    normalizeTitle(item.title),
  );

  if (new Set(recommendationTitles).size !== recommendationTitles.length) {
    throw new Error("Названия рекомендаций повторяются.");
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
      "Ответ содержит запрещённые медицинские или оценочные формулировки.",
    );
  }

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
  /* ------------------------------ Авторизация ----------------------------- */

  const authorization = getHeader(event, "authorization");
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!accessToken) {
    throw createError({
      statusCode: 401,
      statusMessage: "Необходимо войти в аккаунт.",
    });
  }

  /* ------------------------------ Конфигурация ----------------------------- */

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

  /* ------------------------------ Параметры -------------------------------- */

  const body = await readBody<{
    taskId?: string;
    programWeek?: number;
    locale?: string;
    forceRegenerate?: boolean;
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

  /* ------------------------------ Сессия ----------------------------------- */

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

  /*
   * Если анализ уже готов, возвращаем сохранённую версию.
   *
   * forceRegenerate позволяет пересоздать анализ после изменения промпта
   * или при необходимости обновить результат.
   */

  if (
    session.stage === "ready" &&
    session.analysis &&
    body.forceRegenerate !== true
  ) {
    return {
      success: true,
      analysis: session.analysis as FoodDiaryAnalysis,
      cached: true,
    };
  }

  /* ------------------------------ Записи ----------------------------------- */

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

  /* ------------------------------ Контекст --------------------------------- */

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

  /* ------------------------------ Gemini ----------------------------------- */

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
      analysis = parseAnalysis(content);
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

  /* ------------------------------ Сохранение ------------------------------- */

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
