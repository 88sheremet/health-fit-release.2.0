import type { DbWeeklyTask } from "./DbWeeklyTask.interface";

export interface WeeklyState {
  completed: Record<number, boolean>;
  tasks: DbWeeklyTask[];
  tasksLoaded: boolean;
}