/*
 * ============================================================
 * WEEKLY STATE
 * ============================================================
 */

/* Тип строки weekly_tasks — базовая задача недели без перевода. */
import type { DbWeeklyTask } from "./DbWeeklyTask.interface";

/*
 * Форма state Pinia-стора `weeklyTasks` (stores/weeklyTasks.ts).
 *
 * Описывает карту выполненных недель, список задач и флаг загрузки;
 * используется в шаблоне pages/weekly.vue через getters стора.
 */
export interface WeeklyState {
  /*
   * Карта выполненных недель: номер недели → true.
   * Ключ — колонка weekly_task_completions.week (не id задачи);
   * попадает в persist (pick: ["completed"]) и в isCompleted().
   */
  completed: Record<number, boolean>;
  /* Массив задач недели — строки weekly_tasks с наложенными переводами. */
  tasks: DbWeeklyTask[];
  /*
   * Флаг завершения загрузки задач.
   * Включает отрисовку currentTask вместо пустой заглушки.
   */
  tasksLoaded: boolean;
}
