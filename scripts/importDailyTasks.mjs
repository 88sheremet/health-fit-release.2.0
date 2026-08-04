import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import food from "../app/mocks/dailyTasks/dailyFoodTasks.json" with  { type: "json" };
import mental from "../app/mocks/dailyTasks/dailyMentalTasks.json" with  { type: "json" };
import physical from "../app/mocks/dailyTasks/dailyPhysicalTasks.json" with  { type: "json" };

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const tasks = [];

for (let i = 0; i < 28; i++) {
  tasks.push({
    day: i + 1,
    type: "food",
    title: food.dailyFoodTasks[i].nameProgram,
    what_doing: food.dailyFoodTasks[i].whatDoing,
    why_doing: food.dailyFoodTasks[i].whyDoing,
    reward: 10,
  });

  tasks.push({
    day: i + 1,
    type: "mental",
    title: mental.dailyMentalTasks[i].nameProgram,
    what_doing: mental.dailyMentalTasks[i].whatDoing,
    why_doing: mental.dailyMentalTasks[i].whyDoing,
    reward: 10,
  });

  tasks.push({
    day: i + 1,
    type: "physical",
    title: physical.dailyPhysicalTasks[i].nameProgram,
    what_doing: physical.dailyPhysicalTasks[i].whatDoing,
    why_doing: physical.dailyPhysicalTasks[i].whyDoing,
    reward: 15,
  });
}

const { error } = await supabase
  .from("daily_tasks")
  .insert(tasks);

if (error) {
  console.error(error);
} else {
  console.log(`Загружено ${tasks.length} задач`);
}