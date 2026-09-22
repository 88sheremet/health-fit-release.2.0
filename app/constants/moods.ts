export const moodEmojis: Record<number, string> = {
  1: "😡",
  2: "😞",
  3: "😐",
  4: "🙂",
  5: "😄",
};

export const moodOptions = [
  { value: 5, emoji: moodEmojis[5], labelKey: "moods.great" },
  { value: 4, emoji: moodEmojis[4], labelKey: "moods.good" },
  { value: 3, emoji: moodEmojis[3], labelKey: "moods.normal" },
  { value: 2, emoji: moodEmojis[2], labelKey: "moods.bad" },
  { value: 1, emoji: moodEmojis[1], labelKey: "moods.hard" },
];
