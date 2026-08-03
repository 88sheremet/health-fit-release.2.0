export const moodEmojis: Record<number, string> = {
  1: "😡",
  2: "😞",
  3: "😐",
  4: "🙂",
  5: "😄",
};

export const moodOptions = [
  { value: 5, emoji: moodEmojis[5], label: "Отлично" },
  { value: 4, emoji: moodEmojis[4], label: "Хорошо" },
  { value: 3, emoji: moodEmojis[3], label: "Нормально" },
  { value: 2, emoji: moodEmojis[2], label: "Плохо" },
  { value: 1, emoji: moodEmojis[1], label: "Тяжело" },
];
