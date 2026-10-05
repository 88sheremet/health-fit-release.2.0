/*
 * ============================================================
 * CONSTANTS
 * ============================================================
 */

/*
 * Эмодзи шкалы настроения 1..5.
 * Ключ — значение JournalEntry.mood, значение — эмодзи.
 * Применяется в архиве (journal-archive.vue), на оси Y
 * и в тултипе графика (JournalChart.vue), а также
 * в кнопках чек-ина (CheckInDialog через moodOptions).
 */
export const moodEmojis: Record<number, string> = {
  1: "😡",
  2: "😞",
  3: "😐",
  4: "🙂",
  5: "😄",
};

/*
 * Варианты сетки выбора настроения для CheckInDialog.
 * Порядок — от лучшего (5) к худшему (1), как в вёрстке.
 * Свойства каждого элемента:
 *   value    — числовой балл, уходит в payload события save;
 *   emoji    — копия из таблицы moodEmojis;
 *   labelKey — ключ i18n (moods.*), текст зависит от локали.
 */
export const moodOptions = [
  { value: 5, emoji: moodEmojis[5], labelKey: "moods.great" },
  { value: 4, emoji: moodEmojis[4], labelKey: "moods.good" },
  { value: 3, emoji: moodEmojis[3], labelKey: "moods.normal" },
  { value: 2, emoji: moodEmojis[2], labelKey: "moods.bad" },
  { value: 1, emoji: moodEmojis[1], labelKey: "moods.hard" },
];
