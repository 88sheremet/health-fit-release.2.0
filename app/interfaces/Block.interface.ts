import { Question } from "./Question.interface";

export interface Block {
  id: number;
  title: string;
  questions: Question[];
}
