import type { DbDailyTask } from "./DbDailyTask.interface";

export interface TaskState {
  startDate: string;
  completed: Record<string, boolean>;
  energy: number;
  streak: number;
  lastVisitDate: string;
  tasks: DbDailyTask[];
  tasksLoaded: boolean;
  loading: boolean;
}
