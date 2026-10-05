import type { DbDailyTask } from "./DbDailyTask.interface";

/*
 * ============================================================
 * INTERFACES
 * ============================================================
 */

/*
 * Состояние Pinia-стора "tasks" (stores/dailyTasks.ts).
 * Частично персистится через persist.pick; tasks и флаги — нет.
 */
export interface TaskState {
  /*
   * Дата старта программы. Колонка start_date таблицы user_progress.
   * Пустая строка — прогресс ещё не создан; используется в вычислении dayIndex.
   */
  startDate: string;

  /*
   * Карта выполненных задач: task_id → true для текущего dayIndex.
   * Строится из таблицы daily_task_completions; влияет на disabled-состояние кнопки «Выполнено».
   */
  completed: Record<string, boolean>;

  /* Текущий запас энергии. Колонка energy. Начальное значение 40; растёт от наград за задачи. Отображается на карточке энергии. */
  energy: number;

  /* Дней подряд без пропусков. Колонка streak. Отображается в круглом бейдже рядом с приветствием. */
  streak: number;

  /*
   * Дата последнего визита (YYYY-MM-DD). Колонка last_visit_date.
   * Используется в updateStreak для вычисления разницы в днях.
   */
  lastVisitDate: string;

  /* Сырые строки задач из daily_tasks (с переводами). Заполняется loadTasks, отфильтровывается геттером todayTasks. */
  tasks: DbDailyTask[];

  /*
   * true — попытка загрузки задач завершена (успешно или с ошибкой).
   * Управляет тем, можно ли уже рендерить список вместо спиннера.
   */
  tasksLoaded: boolean;

  /* true — выполняется инициализация (init). Показывает спиннер загрузки на странице daily. */
  loading: boolean;
}
