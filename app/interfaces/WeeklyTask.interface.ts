/*
 * ============================================================
 * WEEKLY TASK (UI MODEL)
 * ============================================================
 */

/*
 * UI-модель еженедельной задачи для шаблона weekly.vue.
 *
 * Маппится из DbWeeklyTask (+ перевод) в getter `currentTask` стора
 * weeklyTasks: DB-поля title/what_doing/why_doing → camelCase-поля.
 */
export interface WeeklyTask {
  /* Идентификатор задачи — колонка weekly_tasks.id; ключ для INSERT выполнения. */
  id: string;
  /* Название программы — weekly_tasks.title (перекрывается переводом). */
  nameProgram: string;
  /* «Что делать» — колонка what_doing из weekly_tasks / перевода. */
  whatDoing: string;
  /* «Зачем нужно» — колонка why_doing из weekly_tasks / перевода. */
  whyDoing: string;
}
