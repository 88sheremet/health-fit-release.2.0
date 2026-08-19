import { defineStore } from "pinia";

import type { JournalEntry } from "../interfaces/JournalEntry.interface";
import type { JournalState } from "../interfaces/JournalState.interface";

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

      return state.entries[state.entries.length - 1];
    },
  },

  actions: {
    async init() {
      await this.loadEntries();

      const today = new Date().toISOString().split("T")[0];

      const todayEntry = this.entries.find((entry) => entry.date === today);

      this.showCheckin = !todayEntry;
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

      this.entries = (data ?? []).map((entry) => ({
        id: entry.id,

        date: entry.date,

        mood: entry.mood as 1 | 2 | 3 | 4 | 5 | undefined,

        note: entry.note ?? "",
      }));
    },

    async saveCheckin(payload: { mood: 1 | 2 | 3 | 4 | 5; note: string }) {
      const supabase = useSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Пользователь не авторизован");
      }

      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("journal_entries")
        .upsert(
          {
            user_id: user.id,

            date: today,

            mood: payload.mood,

            note: payload.note,

            updated_at: new Date().toISOString(),
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
        console.error("[Journal] Ошибка сохранения:", error);

        throw error;
      }

      const entry: JournalEntry = {
        id: data.id,

        date: data.date,

        mood: data.mood as 1 | 2 | 3 | 4 | 5,

        note: data.note ?? "",
      };

      const existingIndex = this.entries.findIndex(
        (item) => item.date === today,
      );

      if (existingIndex !== -1) {
        this.entries[existingIndex] = entry;
      } else {
        this.entries.push(entry);
      }

      this.showCheckin = false;
    },

    closeCheckin() {
      this.showCheckin = false;
    },

    getEntryByDate(date: string) {
      return this.entries.find((entry) => entry.date === date);
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

      const today = new Date().toISOString().split("T")[0];

      const existingEntry = this.entries.find((entry) => entry.date === today);

      const { data, error } = await supabase
        .from("journal_entries")
        .upsert(
          {
            user_id: user.id,

            date: today,

            mood: existingEntry?.mood ?? null,

            note,

            updated_at: new Date().toISOString(),
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

        mood: data.mood as 1 | 2 | 3 | 4 | 5 | undefined,

        note: data.note ?? "",
      };

      const existingIndex = this.entries.findIndex(
        (item) => item.date === today,
      );

      if (existingIndex !== -1) {
        this.entries[existingIndex] = entry;
      } else {
        this.entries.push(entry);
      }
    },
  },
});
