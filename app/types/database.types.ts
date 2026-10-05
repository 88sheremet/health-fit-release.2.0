/*
 * ============================================================
 * OVERVIEW
 * ============================================================
 * Сгенерированные Supabase-типы для схемы `public` базы данных
 * (получены через `supabase gen types typescript`). Файл описывает
 * форму всех таблиц, представлений и функций БД и автоматически
 * обновляется при изменениях схемы — править его вручную не нужно.
 *
 * Для каждой таблицы используется стандартный набор форм Supabase:
 *   Row     — точная форма строки, возвращаемой SELECT-запросом;
 *   Insert  — допустимые поля при добавлении (опциональные помечены «?»);
 *   Update  — допустимые поля при обновлении (все опциональные);
 *   Relationships — связи с другими таблицами (здесь пусто).
 */

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

/*
 * `Json` — рекурсивный тип для значений JSON-формата. Используется
 * для колонок с свободной структурой вроде answers / what_doing,
 * хранящих негомогенные данные.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/*
 * `Database` — корневой интерфейс, описывающий схему `public`.
 * Хранит карту таблиц (Tables), представлений (Views) и функций
 * (Functions); последние два здесь пусты, т.к. в БД их нет.
 */
export interface Database {
  public: {
    Tables: {
      /*
       * journal_entries — записи дневника пользователя: оценка
       * настроения (mood) и текстовая заметка (note) на дату.
       */
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          mood: number | null;
          note: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          mood?: number | null;
          note?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          mood?: number | null;
          note?: string | null;
        };
        Relationships: [];
      };
      /*
       * daily_tasks — шаблоны ежедневных задач программы. Тип задачи
       * ограничен перечислением "food" | "mental" | "physical"; состав
       * действий (what_doing) хранится как JSON-структура шагов.
       */
      daily_tasks: {
        Row: {
          id: string;
          day: number;
          type: "food" | "mental" | "physical";
          title: string;
          what_doing: Json;
          why_doing: string;
          reward: number | null;
        };
        Insert: {
          id?: string;
          day: number;
          type: "food" | "mental" | "physical";
          title: string;
          what_doing: Json;
          why_doing: string;
          reward?: number | null;
        };
        Update: {
          id?: string;
          day?: number;
          type?: "food" | "mental" | "physical";
          title?: string;
          what_doing?: Json;
          why_doing?: string;
          reward?: number | null;
        };
        Relationships: [];
      };
      /*
       * daily_task_translations — локализованные тексты ежедневных
       * задач (title, what_doing, why_doing) для каждого locale.
       */
      daily_task_translations: {
        Row: {
          id: string;
          task_id: string;
          locale: string;
          title: string;
          what_doing: Json;
          why_doing: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          locale: string;
          title: string;
          what_doing: Json;
          why_doing: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          locale?: string;
          title?: string;
          what_doing?: Json;
          why_doing?: string;
        };
        Relationships: [];
      };
      /*
       * daily_task_completions — факты выполнения ежедневной задачи
       * конкретным пользователем в конкретный день цикла (day_index).
       */
      daily_task_completions: {
        Row: {
          id: string;
          user_id: string;
          task_id: string;
          day_index: number;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_id: string;
          day_index: number;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_id?: string;
          day_index?: number;
          completed_at?: string;
        };
        Relationships: [];
      };
      /*
       * weekly_tasks — шаблоны недельных задач: контент фиксирован,
       * привязан к номеру недели цикла (week).
       */
      weekly_tasks: {
        Row: {
          id: string;
          week: number;
          title: string;
          what_doing: string;
          why_doing: string;
        };
        Insert: {
          id?: string;
          week: number;
          title: string;
          what_doing: string;
          why_doing: string;
        };
        Update: {
          id?: string;
          week?: number;
          title?: string;
          what_doing?: string;
          why_doing?: string;
        };
        Relationships: [];
      };
      /*
       * weekly_task_translations — локализованные тексты недельных
       * задач (аналог ежедневных переводов, но для weekly_tasks).
       */
      weekly_task_translations: {
        Row: {
          id: string;
          weekly_task_id: string;
          locale: string;
          title: string;
          what_doing: string;
          why_doing: string;
        };
        Insert: {
          id?: string;
          weekly_task_id: string;
          locale: string;
          title: string;
          what_doing: string;
          why_doing: string;
        };
        Update: {
          id?: string;
          weekly_task_id?: string;
          locale?: string;
          title?: string;
          what_doing?: string;
          why_doing?: string;
        };
        Relationships: [];
      };
      /*
       * weekly_task_completions — факты выполнения недельных задач
       * пользователем. Привязка идёт к неделе цикла (week) и к
       * конкретному шаблону через weekly_task_id.
       */
      weekly_task_completions: {
        Row: {
          id: string;
          user_id: string;
          weekly_task_id: string;
          week: number;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          weekly_task_id: string;
          week: number;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          weekly_task_id?: string;
          week?: number;
          completed_at?: string;
        };
        Relationships: [];
      };
      /*
       * user_progress — сводный прогресс пользователя: дата старта,
       * уровень энергии, серия дней (streak) и время последнего визита.
       */
      user_progress: {
        Row: {
          id: string;
          user_id: string;
          start_date: string;
          energy: number;
          streak: number;
          last_visit_date: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          start_date: string;
          energy?: number;
          streak?: number;
          last_visit_date?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          start_date?: string;
          energy?: number;
          streak?: number;
          last_visit_date?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      /*
       * screening_results — результаты скрининга пользователя: сырые
       * ответы (answers), баллы по трём доменам и доминирующая
       * проблема (dominant_problem), определяющая страницу результата.
       */
      screening_results: {
        Row: {
          user_id: string;
          answers: Json;
          physical_score: number | null;
          food_score: number | null;
          mind_score: number | null;
          dominant_problem: string | null;
          completed_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          answers: Json;
          physical_score?: number | null;
          food_score?: number | null;
          mind_score?: number | null;
          dominant_problem?: string | null;
          completed_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          answers?: Json;
          physical_score?: number | null;
          food_score?: number | null;
          mind_score?: number | null;
          dominant_problem?: string | null;
          completed_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
