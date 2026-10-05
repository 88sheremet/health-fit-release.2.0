/*
 * ============================================================
 * CONSTANTS
 * ============================================================
 */

/* Длина цикла программы в днях. Используется для суток wrap (day-30) в dbTasksForDay и проверки isRestDay по индексу. */
export const DAY_COUNT = 30;

/* Миллисекунды в одном календарном дне. Базовая единица для всей датовой арифметики движка задач. */
export const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;

/*
 * ============================================================
 * FUNCTIONS
 * ============================================================
 */

/*
 * Сколько полных календарных дней прошло с даты date до текущего момента.
 * Используется для вычисления «дня с начала» и возрастания streak.
 *
 * 1. Нормализуем вход в timestamp (строка или Date).
 * 2. Вычитаем из текущего времени и округляем вниз до целых дней.
 */
export function getDaysSince(date: Date | string): number {
  return Math.floor(
    (Date.now() - new Date(date).getTime()) / MILLISECONDS_IN_DAY
  );
}

/*
 * Ключ сегодняшней даты в формате YYYY-MM-DD (UTC).
 * Используется как value lastVisitDate / для сравнения дат визитов.
 *
 * 1. Берём ISO-строку текущего момента.
 * 2. Отсекаем время, оставляя только дату.
 */
export function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

/*
 * Номер дня программы: 1 = startDate, 2 = следующий календарный день и т.д.
 * Используется геттером dayIndex стора tasks для выбора задач и записи completions.
 *
 * 1. Приводим startDate и «сегодня» к датам без времени (чтобы DST не влиял).
 * 2. Считаем разницу в полных днях.
 * 3. day 1 соответствует самой дате старта, поэтому возвращаем diff + 1.
 */
export function getDayIndex(startDate: string) {
  const start = new Date(startDate);
  const today = new Date();

  /* Обрезаем время старта до даты (год/месяц/день). */
  const startDay = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  );

  /* Обрезаем время «сегодня» до даты. */
  const todayDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  /* Разница в полных днях между датами без времени. */
  const diff = Math.floor(
    (todayDay.getTime() - startDay.getTime()) / MILLISECONDS_IN_DAY
  );

  /* +1: день старта считается первым днём программы. */
  return diff + 1;
}

/*
 * Выходной ли день по календарной дате: воскресенье (getDay() === 0).
 * true — день отдыха, на странице daily показывается rest-card вместо задач.
 */
export function isRestDayByDate(date: Date = new Date()) {
  return date.getDay() === 0;
}

/*
 * Выходной ли день по номеру дня программы: каждое 7-е деление на 30 без остатка.
 * Альтернативный расчёт, когда календарная дата недоступна.
 */
export function isRestDay(dayIndex: number) {
  return dayIndex % 7 === 0;
}
