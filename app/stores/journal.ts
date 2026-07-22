import { defineStore } from "pinia";

import { JournalEntry } from "../interfaces/JournalEntry.interface";
import { JournalState } from "../interfaces/JournalState.interface";

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
    init() {
      const today = new Date().toISOString().split("T")[0];

      const lastCheckinDate = localStorage.getItem("last-checkin-date");

      this.showCheckin = lastCheckinDate !== today;
    },

    saveCheckin(payload: { mood: 1 | 2 | 3 | 4 | 5; note: string }) {
      const today = new Date().toISOString().split("T")[0];

      const existingEntry = this.entries.find((entry) => entry.date === today);

      if (existingEntry) {
        existingEntry.mood = payload.mood;
        existingEntry.note = payload.note;
      } else {
        this.entries.push({
          id: crypto.randomUUID(),
          date: today,
          mood: payload.mood,
          note: payload.note,
        });
      }

      localStorage.setItem("last-checkin-date", today);

      this.showCheckin = false;
    },

    closeCheckin() {
      this.showCheckin = false;
    },

    getEntryByDate(date: string) {
      return this.entries.find((entry) => entry.date === date);
    },

    deleteEntry(id: string) {
      this.entries = this.entries.filter((entry) => entry.id !== id);
    },
    addNote(note: string) {
  const today = new Date().toISOString().split("T")[0];
  this.entries.push({
    id: crypto.randomUUID(),
    date: today,
    note,
  });
},
  },

  persist: true,
});
