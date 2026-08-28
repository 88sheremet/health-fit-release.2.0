import { defineStore } from "pinia";

import type { JournalEntry } from "../interfaces/JournalEntry.interface";
import type { JournalState } from "../interfaces/JournalState.interface";

type Mood = 1 | 2 | 3 | 4 | 5;

const toMood = (value: unknown): Mood | undefined => {
  if (typeof value === "number" && value >= 1 && value <= 5) {
    return value as Mood;
  }

  return undefined;
};

const getToday = (): string => {
  return new Date().toISOString().slice(0, 10);
};

const normalizeDate = (date: string): string => {
  return date.slice(0, 10);
};

export const useJournalStore = defineStore("journal", {
  state: (): JournalState => ({
    entries: [],
    showCheckin: false,
  }),

  getters: {
    chartData(state) {
      return state.entries
        .slice()
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((entry, index) => ({
          day: index + 1,
          mood: entry.mood,
          date: entry.date,
          note: entry.note,
        }));
    },

    lastEntry(state): JournalEntry | null {
      if (!state.entries.length) {
        return null;
      }

      return state.entries[state.entries.length - 1] ?? null;
    },
  },

  actions: {
    async init() {
      await this.loadEntries();

      const today = getToday();

      const todayCheckin = this.entries.find(
        (entry) =>
          normalizeDate(entry.date) === today && entry.mood !== undefined,
      );

      this.showCheckin = !todayCheckin;
    },

    async loadEntries() {
      const supabase = useSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        this.entries = [];
        return;
      }

      const { data, error } = await supabase
        .from("journal_entries")
        .select(
          `
            id,
            date,
            mood,
            note
          `,
        )
        .eq("user_id", user.id)
        .order("date", {
          ascending: true,
        });

      if (error) {
        console.error("[Journal] Ошибка загрузки:", error);
        throw error;
      }

      this.entries = (data ?? []).map(
        (entry): JournalEntry => ({
          id: entry.id,
          date: entry.date,
          mood: toMood(entry.mood),
          note: entry.note ?? "",
        }),
      );
    },

    async saveCheckin(payload: { mood: Mood; note: string }) {
      const supabase = useSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Пользователь не авторизован");
      }

      const today = getToday();
      const existing = this.getEntryByDate(today);

      const trimmedNote = payload.note.trim();

      const { data, error } = await supabase
        .from("journal_entries")
        .upsert(
          {
            user_id: user.id,
            date: today,
            mood: payload.mood,
            note: trimmedNote !== "" ? trimmedNote : existing?.note ?? "",
          },
          {
            onConflict: "user_id,date",
          },
        )
        .select(
          `
            id,
            date,
            mood,
            note
          `,
        )
        .single();

      if (error) {
        console.error("[Journal] Ошибка сохранения Check-in:", error);

        throw error;
      }

      const entry: JournalEntry = {
        id: data.id,
        date: data.date,
        mood: toMood(data.mood),
        note: data.note ?? "",
      };

      this.entries = this.entries.filter(
        (entry) => normalizeDate(entry.date) !== today,
      );

      this.entries.push(entry);

      this.showCheckin = false;
    },

    closeCheckin() {
      this.showCheckin = false;
    },

    getEntryByDate(date: string): JournalEntry | undefined {
      const normalizedDate = normalizeDate(date);

      return this.entries.find(
        (entry) => normalizeDate(entry.date) === normalizedDate,
      );
    },

    async deleteEntry(id: string) {
      const supabase = useSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Пользователь не авторизован");
      }

      const { error } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        console.error("[Journal] Ошибка удаления:", error);
        throw error;
      }

      this.entries = this.entries.filter((entry) => entry.id !== id);
    },

    async addNote(note: string) {
      const supabase = useSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Пользователь не авторизован");
      }

      const trimmedNote = note.trim();

      if (!trimmedNote) {
        return;
      }

      const today = getToday();
      const existing = this.getEntryByDate(today);

      const { data, error } = await supabase
        .from("journal_entries")
        .upsert(
          {
            user_id: user.id,
            date: today,
            mood: existing?.mood ?? null,
            note: trimmedNote,
          },
          {
            onConflict: "user_id,date",
          },
        )
        .select(
          `
            id,
            date,
            mood,
            note
          `,
        )
        .single();

      if (error) {
        console.error("[Journal] Ошибка добавления заметки:", error);

        throw error;
      }

      const entry: JournalEntry = {
        id: data.id,
        date: data.date,
        mood: toMood(data.mood),
        note: data.note ?? "",
      };

      this.entries = this.entries.filter(
        (entry) => normalizeDate(entry.date) !== today,
      );

      this.entries.push(entry);
    },
  },
});
