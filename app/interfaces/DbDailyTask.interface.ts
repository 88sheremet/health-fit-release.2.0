/*
 * ============================================================
 * INTERFACES
 * ============================================================
 */

/*
 * Строка таблицы daily_tasks — базовый (русскоязычный) справочник
 * задач программы. Используется в dailyTask.service.ts и
 * маппится в доменную Task в stores/dailyTasks.ts.
 */
export interface DbDailyTask {
  /* Первичный ключ. Колонка id. Становится Task.id и ключом в completed. */
  id: string;

  /* Номер дня в цикле программы (1–30). Колонка day. Отбирается по targetDay в dbTasksForDay. */
  day: number;

  /* Категория задачи. Колонка type. Определяет группу (food/mental/physical) при сборке задач дня. */
  type: "food" | "mental" | "physical";

  /* Базовое название. Колонка title. Заменяется на перевод из daily_task_translations, если он есть. */
  title: string;

  /* Базовая инструкция «что делать». Колонка what_doing. Может быть строкой или JSON-объектом упражнений. */
  what_doing: unknown;

  /* Базовое обоснование «зачем». Колонка why_doing. Заменяется переводом при наличии. */
  why_doing: string;

  /* Награда из БД. Колонка reward. null — используется дефолт по типу (physical 15 / иначе 10). */
  reward: number | null;
}
