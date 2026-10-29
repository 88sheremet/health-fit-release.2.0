
import type { DbWeeklyTask } from "./DbWeeklyTask.interface";

export type WeeklyZoneKey =
  | "desk"
  | "wardrobe"
  | "nightstand"
  | "shelves"
  | "drawers";

export interface WeeklyState {
  completed: Record<number, boolean>;
  tasks: DbWeeklyTask[];
  tasksLoaded: boolean;
  zoneProgress: Partial<Record<WeeklyZoneKey, boolean>>;
}
