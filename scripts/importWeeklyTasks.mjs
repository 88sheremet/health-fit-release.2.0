import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const weekly = JSON.parse(
  fs.readFileSync("./app/mocks/weeklyTasks/weeklyTasks.json", "utf8")
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const rows = weekly.weeklyTasks.map((task, index) => ({
  week: index + 1,
  title: task.nameProgram,
  what_doing: task.whatDoing,
  why_doing: task.whyDoing,
  reward: 100,
}));

const { error } = await supabase
  .from("weekly_tasks")
  .insert(rows);

if (error) {
  console.error(error);
} else {
  console.log(`Загружено ${rows.length} недельных задач`);
}