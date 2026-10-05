/*
 * ============================================================
 * OVERVIEW
 * ============================================================
 * Баррель-файл (barrel) для моделей приложения. Собирает все
 * интерфейсы данных в одну точку, чтобы импортировать их коротко:
 * `import type { Task, Answers } from "~/interfaces"`. Рекомендуется
 * всегда подключать типы через этот файл, а не по отдельности.
 */

/*
 * ============================================================
 * IMPORTS (переэкспорт моделей)
 * ============================================================
 * Каждая строка ниже — не самостоятельная декларация, а переэкспорт
 * типа из соответствующего файла. Назначение моделей:
 */

/* Task            — ежедневная задача (тип, заголовок, награда). */
export type { Task } from "./Task.interface";
/* TaskState       — состояние загрузки и выполнения дневных задач. */
export type { TaskState } from "./TaskState.interface";
/* JournalEntry    — запись дневника (чек-ин настроения или заметка). */
export type { JournalEntry } from "./JournalEntry.interface";
/* JournalState    — состояние журнала: список записей и модалки. */
export type { JournalState } from "./JournalState.interface";
/* WeeklyTask      — недельная задача программы восстановления. */
export type { WeeklyTask } from "./WeeklyTask.interface";
/* WeeklyState     — состояние загрузки и выполнения недельных задач. */
export type { WeeklyState } from "./WeeklyState.interface";
/* Question        — один вопрос скрининга. */
export type { Question } from "./Question.interface";
/* Block           — блок вопросов скрининга (заголовок + массив вопросов). */
export type { Block } from "./Block.interface";
/* Answers         — ответы пользователя: карта «вопрос -> балл». */
export type { Answers } from "./Answers.interface";
/* BlockScores     — накопленные баллы по блокам скрининга. */
export type { BlockScores } from "./BlockScores.interface";
