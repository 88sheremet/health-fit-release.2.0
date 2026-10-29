import { createClient } from "@supabase/supabase-js";
import { createError, defineEventHandler, getHeader, readBody } from "h3";

/* -------------------------------------------------------------------------- */
/*  Типы                                                                      */
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

interface Hint {
  observation: string;
  idea: string;
}

interface ParseContext {
  diaryStems: Set<string>;
  isLastAttempt: boolean;
}

const FOOD_DIARY_TASK_ID = "5382c1d1-f307-4076-a7e7-97e1c03fc5a7";
const MAX_ATTEMPTS = 2;

/* -------------------------------------------------------------------------- */
/*  Словарь групп продуктов                                                   */
/*  Программа заранее определяет, что реально есть в дневнике, а модель       */
/*  только формулирует выводы. Словарь работает по русским и украинским       */
/*  словам и не претендует на полноту: непонятные слова модель видит в        */
/*  исходных записях.                                                         */
/* -------------------------------------------------------------------------- */

const L = "a-zа-яіїєґ";
const END = `(?![${L}])`;

const GROUP_PATTERNS = {
  grains: [
    "греч(?!еск)",
    "овсян",
    `каш(?:а|у|и|ей|ой|е|ка|ку|ки)${END}`,
    "макарон",
    `паст(?:а|у|ы|ой)${END}`,
    "спагетт",
    "лапш",
    "вермишел",
    "хлеб",
    "хліб",
    "хлопь",
    "булк",
    "булоч",
    "батон",
    "лаваш",
    `тост(?:ы|а|ов)?${END}`,
    "лепешк",
    "пшен",
    "перлов",
    "булгур",
    "киноа",
    "кускус",
    `рис(?:а|у|ом|е|овая|овую|овой|овое|овые|овых)?${END}`,
    `круп(?:а|у|ы|ой|е)${END}`,
    "картоф",
    "картош",
    "картопл",
    "пюре",
    "драник",
    "пельмен",
    "вареник",
    "галушк",
    "ржан",
    "цельнозерн",
  ],
  wholeGrains: [
    "греч(?!еск)",
    "овсян",
    "овес",
    "пшен",
    "перлов",
    "булгур",
    "киноа",
    "цельнозерн",
    "ржан",
    "отруб",
  ],
  eggs: ["яйц", "яиц", "яєц", "яєчн", "яичн", "яешн", "омлет", "глазунь"],
  meat: [
    "куриц",
    "курин",
    "курк(?!ум)",
    "куряч",
    "м'?яс",
    "мясн",
    "говяд",
    "яловичин",
    "свинин",
    "свиной",
    "свиная",
    "свиные",
    "баранин",
    "телятин",
    "индейк",
    "індик",
    "кролик",
    "котлет",
    "тефтел",
    "фарш",
    "отбивн",
    "шашлык",
    "шашлик",
    "стейк",
    "печенк",
    "печінк",
    `печень${END}`,
    "колбас",
    "сосис",
    "сарделк",
    "ветчин",
    "бекон",
    "окорок",
    "шницел",
    "гуляш",
    "бифштекс",
    `утк(?:а|у|и|ой)${END}`,
    "гусятин",
  ],
  fish: [
    "рыб",
    "риб(?!ай)",
    "лосос",
    "семг",
    "сельд",
    "селед",
    "оселед",
    "скумбр",
    "сардин",
    "тунц",
    "тунец",
    "форел",
    "минтай",
    `хек${END}`,
    "треск",
    "килек",
    "килька",
    "шпрот",
    "кальмар",
    "креветк",
    "морепродукт",
    "мидии",
    "мидий",
    "судак",
    "камбал",
    "сайра",
    "горбуш",
    "анчоус",
    "устриц",
  ],
  dairy: [
    "молок",
    "молоч",
    "кефир",
    "кефір",
    "йогурт",
    "творог",
    "творож",
    "сырник",
    "сирник",
    "сметан",
    "ряженк",
    "ряжанк",
    "простокваш",
    "сливк",
    "морожен",
    "морозив",
    "кисломолоч",
    "пармезан",
    "моцарел",
    "брынз",
    "бринз",
    "рикот",
    "маскарпоне",
    "айран",
    "сыр(?!ой|ая|ое|ые|ого|ую|ым)",
    `сир(?:а|у|ом|и|ів)?${END}`,
  ],
  legumes: [
    "фасол",
    "квасол",
    "горох",
    "горош",
    "чечевиц",
    "сочевиц",
    `нут(?:а|у|ом)?${END}`,
    "бобов",
    `боб(?:ы|ов|ами)?${END}`,
    "хумус",
    "тофу",
    `соя${END}`,
    "эдамаме",
  ],
  vegetables: [
    "овощ",
    "овоч",
    "салат",
    "винегрет",
    "огурц",
    "огурч",
    "огірк",
    "помидор",
    "помідор",
    "томат",
    "перец",
    "перц",
    "перчик",
    "паприк",
    "капуст",
    "морков",
    "морква",
    "моркв",
    "свекл",
    "буряк",
    "буряч",
    `лук(?:а|у|ом|е)?${END}`,
    "цибул",
    "кабачк",
    "цукін",
    "баклажан",
    "броккол",
    "броколі",
    "шпинат",
    `зелен(?:ь|ью|и)${END}`,
    "укроп",
    "петрушк",
    "редис",
    "редьк",
    "тыкв",
    "гарбуз",
    "сельдерей",
    "селер",
    "руккол",
    "борщ",
    "гриб",
    "шампиньон",
    "кукуруз",
  ],
  fruits: [
    "фрукт",
    "ягод",
    "яблок",
    "яблук",
    "банан",
    "апельсин",
    "мандарин",
    "грейпфрут",
    "груш",
    "виноград",
    "клубник",
    "полуниц",
    "суниц",
    "малин",
    "черник",
    "смородин",
    "вишн",
    "черешн",
    "персик",
    "абрикос",
    "нектарин",
    "арбуз",
    "кавун",
    `дын(?:я|ю|и|е)${END}`,
    "киви",
    "ананас",
    "манго",
    "гранат",
    "хурм",
    "инжир",
    `слив(?:а|ы|у|ой|и)${END}`,
    "лимон",
    "клюкв",
    "ежевик",
    "крыжовн",
    "айв",
    "изюм",
    "кураг",
    "чернослив",
    "финик",
    "сухофрукт",
  ],
  nuts: [
    "орех",
    "орешк",
    "горіх",
    "горішк",
    "миндал",
    "мигдал",
    "фундук",
    "арахис",
    "арахіс",
    "кешью",
    "фисташк",
    "фісташк",
    "семечк",
    "насіння",
    "семена",
    "чиа",
  ],
  fried: [
    "жарен",
    "жарк(?:ое|ого|ой)",
    "жарит",
    "смажен",
    "смажит",
    "пржен",
    "фритюр",
    `фри${END}`,
    "шкварк",
    "поджарен",
    "підсмаж",
    "обжарен",
  ],
  fats: [
    `сал(?:о|а|у|ом|е)${END}`,
    `масл(?:о|а|у|ом|е)${END}`,
    "майонез",
    "шпик",
    "бекон",
    "шкварк",
  ],
  sweets: [
    `печень(?:е|я|ю|ем|ев)${END}`,
    "печеньк",
    "печенек",
    "печиво",
    "конфет",
    "цукерк",
    "шоколад",
    "торт",
    "пирожн",
    "выпечк",
    "випічк",
    "булочк",
    "варень",
    "джем",
    "мармелад",
    "сахар",
    "цукор",
    `мед(?:ом|у)?${END}`,
    "вафл",
    "пряник",
    "зефир",
    "десерт",
    "сладк",
    "солодк",
    "солодощ",
    "кекс",
    "круассан",
    "пончик",
    "пампушк",
    "сгущенк",
    "згущенк",
    "халв",
  ],
  salty: [
    "квашен",
    "солен",
    "засолен",
    "маринов",
    "консерв",
    "копчен",
    "вялен",
    "колбас",
    "сосис",
    "сарделк",
    "ветчин",
    "бекон",
    "чипс",
    "сухарик",
    `сал(?:о|а|у|ом|е)${END}`,
    "селед",
    "оселед",
    "сельд",
    "шпрот",
    "килек",
    "килька",
    "кимчи",
    "рассол",
  ],
  ferment: [
    "квашен",
    "кефир",
    "кефір",
    "йогурт",
    "ряженк",
    "ряжанк",
    "простокваш",
    "кимчи",
    "комбуч",
    "мисо",
    "айран",
    "кисломолоч",
    "заквас",
  ],
  drinks: [
    `вод(?:а|у|ы|ой)${END}`,
    `ча(?:й|я|ю|ем)${END}`,
    "кофе",
    "кава",
    "каву",
    "кави",
    `сок${END}`,
    "сока",
    "соку",
    "соком",
    "сік",
    "компот",
    "какао",
    "лимонад",
    "газировк",
    "газован",
    "напит",
    "кисель",
    "морс",
    "узвар",
    "смузи",
  ],
} satisfies Record<string, string[]>;

type GroupKey = keyof typeof GROUP_PATTERNS;

const GROUP_KEYS = Object.keys(GROUP_PATTERNS) as GroupKey[];

const GROUP_REGEX = Object.fromEntries(
  GROUP_KEYS.map((key) => [
    key,
    new RegExp(`(?<![${L}])(?:${GROUP_PATTERNS[key].join("|")})[${L}]*`, "giu"),
  ]),
) as Record<GroupKey, RegExp>;

const GROUP_LABELS: Record<GroupKey, string> = {
  grains: "Крупы, хлеб, картофель",
  wholeGrains: "Цельные крупы",
  eggs: "Яйца",
  meat: "Мясо и птица",
  fish: "Рыба и морепродукты",
  dairy: "Молочные и кисломолочные продукты",
  legumes: "Бобовые",
  vegetables: "Овощи и зелень",
  fruits: "Фрукты и ягоды",
  nuts: "Орехи и семена",
  fried: "Жареное",
  fats: "Сало и масло",
  sweets: "Сладкое и выпечка",
  salty: "Солёное, квашеное, копчёное",
  ferment: "Квашеные и кисломолочные продукты",
  drinks: "Напитки",
};

const PROTEIN_GROUPS: GroupKey[] = ["eggs", "meat", "fish", "dairy", "legumes"];

const REPEAT_GROUPS: GroupKey[] = [
  "grains",
  "eggs",
  "meat",
  "fish",
  "dairy",
  "legumes",
  "vegetables",
  "fruits",
  "nuts",
  "sweets",
  "fried",
  "salty",
  "drinks",
];

const MISSING_GROUPS: GroupKey[] = [
  "fish",
  "dairy",
  "legumes",
  "fruits",
  "nuts",
];

/* -------------------------------------------------------------------------- */
/*  Вспомогательные функции для анализа дневника                              */
/* -------------------------------------------------------------------------- */

interface DayFacts {
  date: string;
  entries: FoodDiaryEntry[];
  mealCount: number;
  times: number[];
  words: Record<GroupKey, string[]>;
  entryHits: Record<GroupKey, number>;
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/ё/g, "е");
}

function uniqueWords(list: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const word of list) {
    const key = word.slice(0, 5);

    if (!word || seen.has(key)) continue;

    seen.add(key);
    result.push(word);
  }

  return result;
}

function findWords(text: string, regex: RegExp): string[] {
  const found: string[] = [];

  for (const match of normalize(text).matchAll(regex)) {
    found.push(match[0].trim());
  }

  return uniqueWords(found);
}

function formatList(words: string[], limit = 5): string {
  return words.slice(0, limit).join(", ");
}

function formatDay(date: string): string {
  const [, month, day] = String(date).slice(0, 10).split("-");

  return day && month ? `${day}.${month}` : String(date);
}

function parseTime(value: string | null): number | null {
  const match = value?.match(/^(\d{1,2}):(\d{2})/);

  if (!match) return null;

  return Number(match[1]) * 60 + Number(match[2]);
}

function formatTime(value: string | null): string {
  const match = value?.match(/^(\d{1,2}):(\d{2})/);

  return match
    ? `${match[1].padStart(2, "0")}:${match[2]}`
    : "время не указано";
}

function buildDayFacts(date: string, entries: FoodDiaryEntry[]): DayFacts {
  const words = {} as Record<GroupKey, string[]>;
  const entryHits = {} as Record<GroupKey, number>;

  for (const key of GROUP_KEYS) {
    const union: string[] = [];
    let hits = 0;

    for (const entry of entries) {
      const found = findWords(entry.description, GROUP_REGEX[key]);

      if (found.length > 0) hits += 1;

      union.push(...found);
    }

    words[key] = uniqueWords(union);
    entryHits[key] = hits;
  }

  const times = entries
    .map((entry) => parseTime(entry.meal_time))
    .filter((minutes): minutes is number => minutes !== null)
    .sort((a, b) => a - b);

  return {
    date,
    entries,
    mealCount: entries.length,
    times,
    words,
    entryHits,
  };
}

function longestGapMinutes(day: DayFacts): number {
  let longest = 0;

  for (let index = 1; index < day.times.length; index += 1) {
    longest = Math.max(longest, day.times[index] - day.times[index - 1]);
  }

  return longest;
}

function detectLanguage(entries: FoodDiaryEntry[]): string {
  const text = entries.map((entry) => entry.description).join(" ");
  const ukrainianLetters = text.match(/[іїєґІЇЄҐ]/g)?.length ?? 0;

  return ukrainianLetters >= 2 ? "украинский" : "русский";
}

/* -------------------------------------------------------------------------- */
/*  Подсказки для рекомендаций (взгляд нутрициолога)                          */
/* -------------------------------------------------------------------------- */

function buildHints(days: DayFacts[], feelingRecorded: boolean): Hint[] {
  const allWords = (key: GroupKey) =>
    uniqueWords(days.flatMap((day) => day.words[key]));
  const isPresent = (key: GroupKey) => allWords(key).length > 0;

  const hints: Hint[] = [];

  // 1. Разнообразие белка: один источник, нет рыбы, нет молочных, нет бобовых.
  const presentProtein = PROTEIN_GROUPS.filter(isPresent);
  const singleProtein = presentProtein.length === 1;
  const noFish = !isPresent("fish");
  const noDairy = !isPresent("dairy");
  const noLegumes = !isPresent("legumes");
  const proteinHint = singleProtein || noFish || noDairy;

  if (proteinHint) {
    const observations: string[] = [];
    const ideas: string[] = [];

    if (singleProtein) {
      const key = presentProtein[0];

      observations.push(
        `источник белка в записях один: ${GROUP_LABELS[
          key
        ].toLowerCase()} (${formatList(allWords(key))})`,
      );
      ideas.push("чередовать источники белка, а не опираться на один");
    }

    if (noFish) {
      observations.push("рыбы и морепродуктов в записях нет");
      ideas.push(
        "добавить рыбу (запечённую, варёную или консервированную сардину или скумбрию) один-два раза в неделю",
      );
    }

    if (noDairy) {
      observations.push("молочных и кисломолочных продуктов в записях нет");
      ideas.push("добавить стакан кефира, йогурт без сахара или творог");
    }

    if (noLegumes) {
      observations.push("бобовых в записях нет");
      ideas.push("положить фасоль или чечевицу в суп или гарнир");
    }

    const text = observations.join("; ");

    hints.push({
      observation: text.charAt(0).toUpperCase() + text.slice(1) + ".",
      idea: ideas.join("; "),
    });
  }

  // 2. Жареное, сало, масло.
  const fried = allWords("fried");
  const fats = allWords("fats");

  if (fried.length > 0 || fats.length >= 2) {
    const parts: string[] = [];

    if (fried.length > 0) parts.push(`жареное (${formatList(fried)})`);
    if (fats.length > 0) parts.push(`сало или масло (${formatList(fats)})`);

    hints.push({
      observation: `В записях встречаются: ${parts.join(", ")}.`,
      idea: "иногда варить, запекать или готовить на пару (например, варёные яйца вместо жареных); для разнообразия жиров добавить рыбу, орехи или растительное масло без жарки",
    });
  }

  // 3. Фрукты и ягоды.
  if (!isPresent("fruits")) {
    hints.push({
      observation: "Фруктов и ягод в записях нет.",
      idea: "добавить к завтраку одно яблоко, банан или горсть ягод",
    });
  }

  // 4. Соль.
  const salty = allWords("salty");

  if (salty.length >= 2) {
    hints.push({
      observation: `В записях несколько солёных, квашеных или копчёных продуктов: ${formatList(
        salty,
      )}. Соли в таком рационе может быть много.`,
      idea: "не досаливать блюда и хотя бы в одном приёме пищи брать свежие овощи вместо солёных",
    });
  }

  // 5. Режим приёмов пищи.
  const fewMeals = days.every((day) => day.mealCount <= 2);
  const maxGap = Math.max(...days.map(longestGapMinutes));
  const longGap = maxGap >= 360;

  if (fewMeals || longGap) {
    const parts: string[] = [];

    if (fewMeals) {
      parts.push(
        "в каждый из дней записано не больше двух приёмов пищи (возможно, записаны не все)",
      );
    }

    if (longGap) {
      parts.push(
        `между приёмами пищи бывает перерыв около ${Math.round(maxGap / 60)} ч`,
      );
    }

    const text = parts.join("; ");

    hints.push({
      observation: text.charAt(0).toUpperCase() + text.slice(1) + ".",
      idea: "если к вечеру появляется сильный голод, можно добавить небольшой перекус: фрукт, кефир или горсть орехов; это необязательно",
    });
  }

  // 6. Бобовые отдельно, если блок про белок не сработал.
  if (!proteinHint && noLegumes) {
    hints.push({
      observation: "Бобовых (фасоль, чечевица, нут, горох) в записях нет.",
      idea: "добавить фасоль или чечевицу в суп или гарнир",
    });
  }

  const result = hints.slice(0, 5);

  // Запасные подсказки, чтобы всегда было минимум три.
  const fallbacks: Hint[] = [];

  if (!feelingRecorded) {
    fallbacks.push({
      observation: "Самочувствие после еды в записях не указано.",
      idea: "рядом с каждым приёмом пищи записывать самочувствие в двух-трёх словах (бодрость, сытость, лёгкость)",
    });
  }

  if (!isPresent("drinks")) {
    fallbacks.push({
      observation: "Напитки в записях не отмечены.",
      idea: "отмечать в дневнике напитки (вода, чай, кофе, соки), чтобы анализ мог их учитывать",
    });
  }

  fallbacks.push({
    observation: "Двух дней мало, чтобы увидеть устойчивые привычки.",
    idea: "вести дневник ещё несколько дней и записывать время приёмов пищи",
  });

  for (const fallback of fallbacks) {
    if (result.length >= 3) break;

    result.push(fallback);
  }

  return result;
}

function buildStrengths(days: DayFacts[]): string[] {
  const allWords = (key: GroupKey) =>
    uniqueWords(days.flatMap((day) => day.words[key]));
  const strengths: string[] = [];

  const vegetables = allWords("vegetables");

  if (vegetables.length > 0) {
    const inBothDays = days.every((day) => day.words.vegetables.length > 0);

    strengths.push(
      `овощи есть ${inBothDays ? "в оба дня" : "в записях"} (${formatList(
        vegetables,
      )})`,
    );
  }

  const ferment = allWords("ferment");

  if (ferment.length > 0) {
    strengths.push(
      `есть квашеные или кисломолочные продукты (${formatList(ferment)})`,
    );
  }

  const wholeGrains = allWords("wholeGrains");

  if (wholeGrains.length > 0) {
    strengths.push(`есть цельные крупы (${formatList(wholeGrains)})`);
  }

  const proteinEachDay = days.every((day) =>
    PROTEIN_GROUPS.some((key) => day.words[key].length > 0),
  );

  if (proteinEachDay) {
    strengths.push("белок есть в записях каждого дня");
  }

  const totalEntries = days.reduce((sum, day) => sum + day.mealCount, 0);
  const sweetsEntries = days.reduce(
    (sum, day) => sum + day.entryHits.sweets,
    0,
  );

  if (sweetsEntries > 0 && sweetsEntries / totalEntries <= 0.25) {
    strengths.push("сладкое составляет небольшую часть записей");
  }

  if (strengths.length === 0) {
    strengths.push("пользователь ведёт дневник питания, это хорошая привычка");
  }

  return strengths;
}

function buildDiaryContext(
  entries: FoodDiaryEntry[],
  firstDate: string,
  secondDate: string,
) {
  const days = [firstDate, secondDate].map((date) =>
    buildDayFacts(
      date,
      entries.filter((entry) => entry.entry_date === date),
    ),
  );

  const feelingCount = entries.filter((entry) => entry.feeling?.trim()).length;
  const feelingRecorded = feelingCount > 0;

  const entriesText = entries
    .map(
      (entry) =>
        `${formatDay(entry.entry_date)} · ${formatTime(entry.meal_time)} · ${
          entry.meal_type
        }: ${entry.description.trim()} · самочувствие: ${
          entry.feeling?.trim() || "не указано"
        }`,
    )
    .join("\n");

  const mealsText = days
    .map(
      (day) =>
        `${formatDay(day.date)} — ${day.mealCount} (${day.entries
          .map((entry) => formatTime(entry.meal_time))
          .join(", ")})`,
    )
    .join("; ");

  const repeated = REPEAT_GROUPS.filter((key) =>
    days.every((day) => day.words[key].length > 0),
  ).map(
    (key) =>
      `- ${GROUP_LABELS[key]} — ${days
        .map(
          (day) => `${formatDay(day.date)}: ${formatList(day.words[key], 4)}`,
        )
        .join("; ")}`,
  );

  const missing = MISSING_GROUPS.filter((key) =>
    days.every((day) => day.words[key].length === 0),
  ).map((key) => GROUP_LABELS[key].toLowerCase());

  const strengths = buildStrengths(days);
  const hints = buildHints(days, feelingRecorded);

  const factsText = [
    `Даты: ${formatDay(firstDate)} и ${formatDay(secondDate)}.`,
    `Приёмов пищи по дням: ${mealsText}.`,
    feelingRecorded
      ? `Самочувствие указано в ${feelingCount} из ${entries.length} записей.`
      : "Самочувствие не указано ни в одной записи.",
    "",
    "ПОВТОРЯЕТСЯ В ОБА ДНЯ:",
    repeated.length > 0 ? repeated.join("\n") : "- ничего не повторяется",
    "",
    "НЕ ВСТРЕЧАЕТСЯ НИ В ОДИН ИЗ ДВУХ ДНЕЙ:",
    missing.length > 0 ? missing.join("; ") : "- таких групп нет",
    "",
    "СИЛЬНЫЕ СТОРОНЫ:",
    strengths.map((item) => `- ${item}`).join("\n"),
  ].join("\n");

  const hintsText = hints
    .map(
      (hint, index) =>
        `${index + 1}. Наблюдение: ${hint.observation}\n   Идея: ${hint.idea}`,
    )
    .join("\n");

  // Основы слов из дневника, чтобы проверять, что evidence не выдуман.
  const diaryStems = new Set<string>();

  for (const entry of entries) {
    for (const word of wordsOf(entry.description)) {
      diaryStems.add(word.slice(0, 4));
    }
  }

  return {
    entriesText,
    factsText,
    hintsText,
    hintsCount: hints.length,
    languageName: detectLanguage(entries),
    diaryStems,
  };
}

/* -------------------------------------------------------------------------- */
/*  Промпт                                                                    */
/* -------------------------------------------------------------------------- */

const SYSTEM_PROMPT =
  "Ты — внимательный нутрициолог-консультант. Опирайся только на записи пользователя и на блок фактов, ничего не выдумывай, отмечай и сильные стороны рациона, и реальные пробелы. Возвращай только JSON указанной структуры.";

function buildPrompt(params: {
  entriesText: string;
  factsText: string;
  hintsText: string;
  hintsCount: number;
  languageName: string;
  retryNote?: string;
}): string {
  const {
    entriesText,
    factsText,
    hintsText,
    hintsCount,
    languageName,
    retryNote,
  } = params;

  return `
Ты — бережный нутрициолог-консультант в приложении Health Fit. Ты опираешься только на записи пользователя и на блок «ФАКТЫ», который программа подготовила заранее.

ЗАДАЧА
Дай короткий дружелюбный разбор питания за два выбранных дня и предложи ровно три небольших действия.

ЯЗЫК ОТВЕТА: ${languageName}. Пиши простыми словами, без сложных терминов.

=== ЗАПИСИ ПОЛЬЗОВАТЕЛЯ ===
${entriesText}

=== ФАКТЫ (подготовлены программой) ===
${factsText}

=== ПОДСКАЗКИ ДЛЯ РЕКОМЕНДАЦИЙ (по важности) ===
${hintsText}

ВАЖНО О ФАКТАХ
Блок «ФАКТЫ» составлен автоматически по ключевым словам и может не узнать редкие или написанные с ошибкой слова. Если в записях ты явно видишь продукт из группы, которая в фактах отмечена как отсутствующая, не предлагай добавлять эту группу. Непонятные слова не угадывай: цитируй как есть или не упоминай.

КАК СОСТАВИТЬ ОТВЕТ

summary (2–3 предложения):
- начни с сильных сторон из блока «СИЛЬНЫЕ СТОРОНЫ»;
- затем назови одно-два самых заметных наблюдения из подсказок;
- не пересказывай весь дневник.

patterns (от 0 до 3):
- бери только из списка «ПОВТОРЯЕТСЯ В ОБА ДНЯ»;
- закономерность — это то, что есть в обоих днях; одно наблюдение за один день закономерностью не является;
- разные продукты не называй одним и тем же (рис и гречка — разные продукты; говори «крупы» или называй оба);
- формулируй осторожно: «в записях видно», «в оба дня встречается»;
- evidence: даты и точные слова из записей;
- если список пуст, верни patterns: [] и коротко объясни это в limitations.

recommendations:
- ровно ${hintsCount} — по одной на каждую подсказку, в том же порядке;
- explanation: 1–2 предложения: что видно в записях и что можно попробовать; мягко, например «можно попробовать», «для разнообразия»;
- не добавляй рекомендации, которых нет в подсказках; не давай общих советов вроде «ешьте больше овощей».

actions (ровно три):
- по одному маленькому действию на каждую из первых трёх рекомендаций, на основе «Идеи» из подсказок;
- действие выполнимо за неделю, без граммов и подсчётов;
- не повторяй одно и то же разными словами.

limitations:
- напиши, что два дня — небольшая выборка, порции и самочувствие могут быть не указаны, поэтому выводы предварительные.

ОГРАНИЧЕНИЯ
- Не подсчитывай калории, БЖУ и холестерин.
- Не проси и не оценивай граммы, вес или размеры порций. Количество упоминай только если оно записано пользователем (например, «5 яиц»), без оценок «много» или «мало».
- Не ставь диагнозы и не делай медицинских заключений.
- Не называй продукты «вредными» или «запрещёнными».
- Не назначай диеты, добавки или лечение.
- Не выдумывай продукты, симптомы, эмоции или причины.
- Не объясняй, почему пользователь так ест (удобство, вкус, привычка), если он сам этого не писал.
- Не стыди пользователя и не оценивай его силу воли.
- Если самочувствие не записано, не делай выводов о связи питания с самочувствием.
- Два дня — очень маленькая выборка: не используй слова «часто», «всегда», «обычно», «постоянно».
${
  retryNote
    ? `\nПРЕДЫДУЩИЙ ОТВЕТ БЫЛ ОТКЛОНЁН: ${retryNote}\nИсправь это и верни новый JSON.\n`
    : ""
}
Верни только валидный JSON, без Markdown и текста вокруг.

Формат:
{
  "summary": "Краткое резюме наблюдений",
  "patterns": [
    {
      "title": "Короткое название",
      "explanation": "Осторожное объяснение закономерности",
      "evidence": "Даты и точные слова из записей"
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
`.trim();
}

/* -------------------------------------------------------------------------- */
/*  Валидация ответа модели                                                   */
/* -------------------------------------------------------------------------- */

const WORD_RE = new RegExp(`[${L}]{3,}`, "gu");

const STOP_KEYS = new Set([
  "для",
  "дня",
  "дни",
  "день",
  "дней",
  "днях",
  "оба",
  "при",
  "что",
  "как",
  "это",
  "без",
  "или",
  "два",
  "запи",
  "прие",
  "пищи",
  "блюд",
]);

// Слова, которые нельзя использовать в любом случае.
const HARD_BANNED =
  /вредн|шкідлив|запрещ|заборон|калори|калорі|холестерин|диагноз|діагноз|лечени|лікуванн|похуден|схуднен|диет(?!ическ|олог)|дієт(?!ичн|олог)/i;

// Слова, которые нарушают осторожный тон: сначала просим исправить.
const SOFT_BANNED = new RegExp(
  `(?<![${L}])(?:всегда|обычно|постоянно|часто|завжди|зазвичай|постійно)(?![${L}])`,
  "i",
);

function wordsOf(text: string): string[] {
  return normalize(text).match(WORD_RE) ?? [];
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function isGrounded(text: string, stems: Set<string>): boolean {
  return wordsOf(text).some((word) => {
    const key = word.slice(0, 4);

    return !STOP_KEYS.has(key) && stems.has(key);
  });
}

function parseAnalysis(
  content: string,
  { diaryStems, isLastAttempt }: ParseContext,
): FoodDiaryAnalysis {
  let raw: unknown;

  try {
    raw = JSON.parse(content);
  } catch {
    throw new Error("ответ не является валидным JSON");
  }

  const data = asRecord(raw);

  if (!data) {
    throw new Error("ответ имеет неожиданный формат");
  }

  const summary = cleanString(data.summary);
  const limitations = cleanString(data.limitations);

  if (!summary || !limitations) {
    throw new Error("не заполнены summary или limitations");
  }

  const patterns = (Array.isArray(data.patterns) ? data.patterns : [])
    .map((item) => {
      const record = asRecord(item);

      return {
        title: cleanString(record?.title),
        explanation: cleanString(record?.explanation),
        evidence: cleanString(record?.evidence),
      };
    })
    // Закономерность без опоры на реальные слова из дневника отбрасываем.
    .filter(
      (item) =>
        item.title &&
        item.explanation &&
        item.evidence &&
        isGrounded(item.evidence, diaryStems),
    )
    .slice(0, 3);

  const recommendations = (
    Array.isArray(data.recommendations) ? data.recommendations : []
  )
    .map((item) => {
      const record = asRecord(item);

      return {
        title: cleanString(record?.title),
        explanation: cleanString(record?.explanation),
      };
    })
    .filter((item) => item.title && item.explanation)
    .slice(0, 5);

  if (recommendations.length === 0) {
    throw new Error("нет ни одной рекомендации");
  }

  const actions = (Array.isArray(data.actions) ? data.actions : [])
    .map((item) => {
      const record = asRecord(item);

      return {
        title: cleanString(record?.title),
        description: cleanString(record?.description),
      };
    })
    .filter((item) => item.title && item.description);

  if (actions.length < 3) {
    throw new Error("нужно ровно три действия");
  }

  const finalActions = actions.slice(0, 3);

  if (
    new Set(finalActions.map((action) => action.title.toLowerCase())).size < 3
  ) {
    throw new Error("действия повторяются");
  }

  const analysis: FoodDiaryAnalysis = {
    summary,
    patterns,
    recommendations,
    actions: finalActions,
    limitations,
  };

  const texts = [
    analysis.summary,
    analysis.limitations,
    ...analysis.patterns.flatMap((item) => [
      item.title,
      item.explanation,
      item.evidence,
    ]),
    ...analysis.recommendations.flatMap((item) => [
      item.title,
      item.explanation,
    ]),
    ...analysis.actions.flatMap((item) => [item.title, item.description]),
  ];

  if (texts.some((text) => HARD_BANNED.test(text))) {
    throw new Error(
      "в тексте есть запрещённые слова (калории, диагнозы, «вредно», диеты, лечение)",
    );
  }

  if (!isLastAttempt && texts.some((text) => SOFT_BANNED.test(text))) {
    throw new Error(
      "в тексте есть слова «часто», «всегда», «обычно» или «постоянно», а по двум дням так говорить нельзя",
    );
  }

  return analysis;
}

/* -------------------------------------------------------------------------- */
/*  Запрос к Ollama                                                           */
/* -------------------------------------------------------------------------- */

async function requestOllama(params: {
  baseUrl: string;
  model: string;
  prompt: string;
}): Promise<string> {
  const response = await $fetch<{
    message?: { content?: string };
  }>(`${params.baseUrl}/api/chat`, {
    method: "POST",
    timeout: 240_000,
    body: {
      model: params.model,
      stream: false,
      format: "json",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: params.prompt },
      ],
      options: {
        temperature: 0.2,
        num_ctx: 8192,
        num_predict: 1200,
      },
    },
  });

  if (!response.message?.content) {
    throw new Error("Ollama вернул пустой ответ.");
  }

  return response.message.content;
}

/* -------------------------------------------------------------------------- */
/*  Обработчик                                                                */
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

  // Предобработка: программа определяет группы продуктов, повторы, пробелы и
  // подсказки, а модель только формулирует из них аккуратный текст.
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
      hintsText: diaryContext.hintsText,
      hintsCount: diaryContext.hintsCount,
      languageName: diaryContext.languageName,
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
      console.error("[FoodDiary] Gemini request failed:", error);

      throw createError({
        statusCode: 502,
        statusMessage: "Не удалось провести ИИ-анализ. Попробуй ещё раз позже.",
      });
    }

    try {
      analysis = parseAnalysis(content, {
        diaryStems: diaryContext.diaryStems,
        isLastAttempt: attempt === MAX_ATTEMPTS,
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
    throw createError({
      statusCode: 502,
      statusMessage:
        "ИИ вернул ответ в неподходящем виде. Попробуй ещё раз чуть позже.",
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
