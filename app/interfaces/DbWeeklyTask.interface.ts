/*
 * ============================================================
 * DB WEEKLY TASK
 * ============================================================
 */

/*
 * Строка таблицы Supabase `weekly_tasks`.
 *
 * Используется сервисом weeklyTask.service (getWeeklyTasks)
 * и state.tasks стора weeklyTasks.
 */
export interface DbWeeklyTask {
  /* PK задачи — колонка weekly_tasks.id; участвует в INSERT выполнения. */
  id: string;
  /* Номер недели программы — weekly_tasks.week; база для currentWeek/фолбэка. */
  week: number;
  /* Название — weekly_tasks.title; перекрывается полем перевода title. */
  title: string;
  /* Инструкция «что делать» — weekly_tasks.what_doing (перевод перекрывает). */
  what_doing: string;
  /* Обоснование «зачем» — weekly_tasks.why_doing (перевод перекрывает). */
  why_doing: string;
}
