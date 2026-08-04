export interface WeeklyState {
  completed: Record<number, boolean>;
  tasks: DbWeeklyTask[];
  tasksLoaded: boolean;
}