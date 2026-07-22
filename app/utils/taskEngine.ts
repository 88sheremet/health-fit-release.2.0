export const DAY_COUNT = 30;

export function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

export function getDayIndex(startDate: string) {
  const start = new Date(startDate);
  const today = new Date();

  const diff = Math.floor(
    (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  return diff + 1;
}

export function isRestDayByDate(date: Date = new Date()) {
  return date.getDay() === 0;
}

export function isRestDay(dayIndex: number) {
  return dayIndex % 7 === 0;
}