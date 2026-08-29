import { defineStore } from "pinia";

import type { JournalEntry } from "../interfaces/JournalEntry.interface";
import type { JournalState } from "../interfaces/JournalState.interface";

type Mood = 1 | 2 | 3 | 4 | 5;
type JournalEntryType = "checkin" | "note";

type JournalRow = {
  id: string;
  date: string;
  entry_type: JournalEntryType;
  mood: number | null;
  note: string | null;
};

const toMood = (value: unknown): Mood | undefined => {
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
  ) {
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

/**
 * Supabase generated types can incorrectly infer `entry_type`
 * as `never` when the local Database type is outdated.
 *
 * The table structure is known in the application, so we isolate
 * the cast in one place instead of using `as any` throughout the store.
 */
const getJournalTable = () => {
  const supabase = useSupabaseClient();

  return supabase.from("journal_entries") as any;
};

const mapRowToEntry = (row: JournalRow): JournalEntry => {
  return {
    id: row.id,
    date: row.date,
    type: row.entry_type,
    mood: toMood(row.mood),
    note: row.note ?? "",
  };
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

      const journalTable = getJournalTable();

      const { data, error } = await journalTable
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

      this.entries = ((data ?? []) as JournalRow[]).map(mapRowToEntry);
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

      const existingCheckin = this.entries.find(
        (entry) =>
          entry.type === "checkin" && normalizeDate(entry.date) === today,
      );

      const journalTable = getJournalTable();

      let data: JournalRow | null;
      let error: any;

      if (existingCheckin) {
        const result = await journalTable
          .update({
            mood: payload.mood,
            note: trimmedNote || existingCheckin.note,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingCheckin.id)
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
        const result = await journalTable
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

      if (!data) {
        throw new Error("Supabase не вернул сохранённую запись");
      }

      const entry = mapRowToEntry(data);

      /*
       * Replace the existing local entry instead of pushing
       * another one. This prevents duplicates in Pinia state.
       */
      this.entries = this.entries.filter((item) => item.id !== data.id);

      /*
       * If an old local checkin existed but Supabase returned
       * another id, remove it as well.
       */
      if (existingCheckin) {
        this.entries = this.entries.filter(
          (item) => item.id !== existingCheckin.id,
        );
      }

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

      const journalTable = getJournalTable();

      const { error } = await journalTable
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

      /*
       * A note is a separate journal row.
       * It must NOT replace today's check-in.
       */
      const journalTable = getJournalTable();

      const { data, error } = await journalTable
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
        console.error("[Journal] Ошибка добавления заметки:", error);
        throw error;
      }

      if (!data) {
        throw new Error("Supabase не вернул сохранённую заметку");
      }

      const entry = mapRowToEntry(data);

      this.entries.push(entry);

      this.entries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    },
  },
});
