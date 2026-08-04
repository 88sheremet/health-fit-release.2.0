export interface Task {
  id: string;
  type: "food" | "mental" | "physical";
  title: string;
  reward: number;
  whatDoing: any;
  whyDoing: string;
}
