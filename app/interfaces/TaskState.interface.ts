export interface TaskState {
  startDate: string;
  completed: Record<string, boolean>;
  energy: number;
  streak: number;
  lastVisitDate: string;
}
