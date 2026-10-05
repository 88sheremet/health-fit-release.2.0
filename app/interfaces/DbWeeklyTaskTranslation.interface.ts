/*
 * ============================================================
 * DB WEEKLY TASK TRANSLATION
 * ============================================================
 */

/*
 * Строка таблицы `weekly_task_translations` — локализация
 * еженедельных активностей (i18n-локали хранятся в БД).
 *
 * Читается в getWeeklyTasks (фильтр по locale) и накладывается
 * поверх DbWeeklyTask перед попаданием в state.tasks.
 */
export interface DbWeeklyTaskTranslation {
  /* PK перевода — колонка weekly_task_translations.id. */
  id: string;
  /* FK на задачу — weekly_task_translations.weekly_task_id → weekly_tasks.id. */
  weekly_task_id: string;
  /* Код локали (например "ru"/"en") — колонка locale; ключ фильтра `.eq`. */
  locale: string;
  /* Локализованное название — перекрывает DbWeeklyTask.title. */
  title: string;
  /* Локализованное «что делать» — перекрывает DbWeeklyTask.what_doing. */
  what_doing: string;
  /* Локализованное «зачем нужно» — перекрывает DbWeeklyTask.why_doing. */
  why_doing: string;
}
