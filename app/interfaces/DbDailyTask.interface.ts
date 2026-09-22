export interface DbDailyTask {
  id: string;
  day: number;
  type: "food" | "mental" | "physical";
  title: string;
  what_doing: unknown;
  why_doing: string;
  reward: number | null;
}
