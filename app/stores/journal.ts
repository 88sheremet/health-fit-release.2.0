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
          entry.type === "checkin" && normalizeDate(entry.date) === today,
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
        entry_type,
        mood,
        note
      `,
        )
        .eq("user_id", user.id)
        .order("date", {
          ascending: true,
        })
        .order("created_at", {
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
          type: entry.entry_type as "checkin" | "note",
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
      const trimmedNote = payload.note.trim();

      const existing = this.entries.find(
        (entry) =>
          entry.type === "checkin" && normalizeDate(entry.date) === today,
      );

      let data;
      let error;

      if (existing) {
        const result = await supabase
          .from("journal_entries")
          .update({
            mood: payload.mood,
            note: trimmedNote,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .eq("user_id", user.id)
          .select(
            `
          id,
          date,
          entry_type,
          mood,
          note
        `,
          )
          .single();

        data = result.data;
        error = result.error;
      } else {
        const result = await supabase
          .from("journal_entries")
          .insert({
            user_id: user.id,
            date: today,
            entry_type: "checkin",
            mood: payload.mood,
            note: trimmedNote,
          })
          .select(
            `
          id,
          date,
          entry_type,
          mood,
          note
        `,
          )
          .single();

        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error("[Journal] Ошибка сохранения Check-in:", error);
        throw error;
      }

      const entry: JournalEntry = {
        id: data.id,
        date: data.date,
        type: "checkin",
        mood: toMood(data.mood),
        note: data.note ?? "",
      };

      this.entries = this.entries.filter((entry) => entry.id !== data.id);

      this.entries.push(entry);

      this.entries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      this.showCheckin = false;
    },

    closeCheckin() {
      this.showCheckin = false;
    },

    getCheckinByDate(date: string): JournalEntry | undefined {
      const normalizedDate = normalizeDate(date);

      return this.entries.find(
        (entry) =>
          entry.type === "checkin" &&
          normalizeDate(entry.date) === normalizedDate,
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

      const { data, error } = await supabase
        .from("journal_entries")
        .insert({
          user_id: user.id,
          date: today,
          entry_type: "note",
          mood: null,
          note: trimmedNote,
        })
        .select(
          `
        id,
        date,
        entry_type,
        mood,
        note
      `,
        )
        .single();

      if (error) {
        console.error("[Journal] Ошибка добавления заметки:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        throw error;
      }

      const entry: JournalEntry = {
        id: data.id,
        date: data.date,
        type: "note",
        mood: undefined,
        note: data.note ?? "",
      };

      this.entries.push(entry);

      this.entries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    },
  },
});
