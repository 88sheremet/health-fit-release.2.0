export interface DbWeeklyTaskTranslation {
  id: string;
  weekly_task_id: string;
  locale: "ru" | "uk";
  title: string;
  what_doing: string;
  why_doing: string;
}
