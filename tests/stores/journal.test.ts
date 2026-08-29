import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { setActivePinia, createPinia } from "pinia";

import { useJournalStore } from "~/stores/journal";

import { useSupabaseClient } from "../setup";

import type { JournalEntry } from "~/interfaces/JournalEntry.interface";

let mockGetUser: ReturnType<typeof vi.fn>;
let mockInsert: ReturnType<typeof vi.fn>;
let mockUpdate: ReturnType<typeof vi.fn>;
let mockDelete: ReturnType<typeof vi.fn>;

type QueryResult = {
  data: any;
  error: any;
};

function createSelectChain(result: QueryResult) {
  const single = vi.fn().mockResolvedValue(result);

  const select = vi.fn().mockReturnValue({
    single,
  });

  return {
    select,
    single,
  };
}

function setupSupabaseClient(options: {
  user: any;
  entries?: any[];
  selectResult?: QueryResult;
  writeResult?: QueryResult;
  deleteError?: any;
}) {
  const {
    user,
    entries = [],
    selectResult = {
      data: entries,
      error: null,
    },
    writeResult = {
      data: null,
      error: null,
    },
    deleteError = null,
  } = options;

  mockGetUser = vi.fn().mockResolvedValue({
    data: {
      user,
    },
    error: null,
  });

  mockInsert = vi.fn().mockReturnValue(createSelectChain(writeResult));

  mockUpdate = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue(createSelectChain(writeResult)),
    }),
  });

  mockDelete = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        error: deleteError,
      }),
    }),
  });

  const mockSelect = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue(selectResult),
      }),
    }),
  });

  const client = {
    auth: {
      getUser: mockGetUser,
    },

    from: vi.fn((table: string) => {
      if (table === "journal_entries") {
        return {
          select: mockSelect,
          insert: mockInsert,
          update: mockUpdate,
          delete: mockDelete,
        };
      }

      return {};
    }),
  };

  vi.mocked(useSupabaseClient).mockReturnValue(client as any);
}

beforeEach(() => {
  setActivePinia(createPinia());
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("journal store", () => {
  describe("chartData", () => {
    it("returns empty array when no entries", () => {
      const store = useJournalStore();

      expect(store.chartData).toEqual([]);
    });

    it("sorts entries by date ascending", () => {
      const store = useJournalStore();

      store.entries = [
        {
          id: "3",
          date: "2026-06-15",
          type: "checkin",
          mood: 3,
          note: "",
        },
        {
          id: "1",
          date: "2026-06-13",
          type: "checkin",
          mood: 5,
          note: "",
        },
        {
          id: "2",
          date: "2026-06-14",
          type: "checkin",
          mood: 1,
          note: "",
        },
      ];

      const dates = store.chartData.map((entry) => entry.date);

      expect(dates).toEqual(["2026-06-13", "2026-06-14", "2026-06-15"]);
    });

    it("assigns sequential day numbers", () => {
      const store = useJournalStore();

      store.entries = [
        {
          id: "1",
          date: "2026-06-13",
          type: "checkin",
          mood: 5,
          note: "",
        },
        {
          id: "2",
          date: "2026-06-14",
          type: "checkin",
          mood: 1,
          note: "",
        },
      ];

      const days = store.chartData.map((entry) => entry.day);

      expect(days).toEqual([1, 2]);
    });

    it("preserves mood, date, and note fields", () => {
      const store = useJournalStore();

      store.entries = [
        {
          id: "1",
          date: "2026-06-13",
          type: "checkin",
          mood: 4,
          note: "great day",
        },
      ];

      const chart = store.chartData[0];

      expect(chart.mood).toBe(4);
      expect(chart.date).toBe("2026-06-13");
      expect(chart.note).toBe("great day");
    });

    it("does not mutate original entries array", () => {
      const store = useJournalStore();

      const entries: JournalEntry[] = [
        {
          id: "2",
          date: "2026-06-14",
          type: "checkin",
          mood: 2,
          note: "",
        },
        {
          id: "1",
          date: "2026-06-13",
          type: "checkin",
          mood: 5,
          note: "",
        },
      ];

      store.entries = entries;

      store.chartData;

      expect(entries[0].date).toBe("2026-06-14");
    });

    it("assigns distinct day numbers for same-date entries", () => {
      const store = useJournalStore();

      store.entries = [
        {
          id: "1",
          date: "2026-06-15",
          type: "checkin",
          mood: 5,
          note: "a",
        },
        {
          id: "2",
          date: "2026-06-15",
          type: "note",
          mood: undefined,
          note: "b",
        },
      ];

      const chart = store.chartData;

      expect(chart).toHaveLength(2);
      expect(chart[0].day).toBe(1);
      expect(chart[1].day).toBe(2);
    });

    it("leaves mood undefined for note-only entries", () => {
      const store = useJournalStore();

      store.entries = [
        {
          id: "1",
          date: "2026-06-15",
          type: "checkin",
          mood: 4,
          note: "Walked in the park",
        },
        {
          id: "2",
          date: "2026-06-16",
          type: "note",
          mood: undefined,
          note: "",
        },
      ];

      const chart = store.chartData;

      expect(chart[0].note).toBe("Walked in the park");

      expect(chart[1].note).toBe("");

      expect(chart[1].mood).toBeUndefined();
    });
  });

  describe("lastEntry", () => {
    it("returns null when entries is empty", () => {
      const store = useJournalStore();

      expect(store.lastEntry).toBeNull();
    });

    it("returns the last entry in the array", () => {
      const store = useJournalStore();

      store.entries = [
        {
          id: "1",
          date: "2026-06-13",
          type: "checkin",
          mood: 5,
          note: "",
        },
        {
          id: "2",
          date: "2026-06-14",
          type: "note",
          mood: undefined,
          note: "ok",
        },
      ];

      expect(store.lastEntry?.id).toBe("2");
    });
  });

  describe("closeCheckin", () => {
    it("sets showCheckin to false", () => {
      const store = useJournalStore();

      store.showCheckin = true;

      store.closeCheckin();

      expect(store.showCheckin).toBe(false);
    });
  });

  describe("getEntryByDate", () => {
    it("returns matching entry", () => {
      const store = useJournalStore();

      store.entries = [
        {
          id: "1",
          date: "2026-06-13",
          type: "checkin",
          mood: 5,
          note: "",
        },
        {
          id: "2",
          date: "2026-06-14",
          type: "checkin",
          mood: 3,
          note: "",
        },
      ];

      expect(store.getEntryByDate("2026-06-14")?.id).toBe("2");
    });

    it("returns undefined when no match", () => {
      const store = useJournalStore();

      store.entries = [
        {
          id: "1",
          date: "2026-06-13",
          type: "checkin",
          mood: 5,
          note: "",
        },
      ];

      expect(store.getEntryByDate("2026-06-99")).toBeUndefined();
    });
  });

  describe("getCheckinByDate", () => {
    it("returns checkin for date", () => {
      const store = useJournalStore();

      store.entries = [
        {
          id: "1",
          date: "2026-06-15",
          type: "checkin",
          mood: 4,
          note: "good",
        },
      ];

      expect(store.getCheckinByDate("2026-06-15")?.mood).toBe(4);
    });

    it("does not return note-only entry", () => {
      const store = useJournalStore();

      store.entries = [
        {
          id: "1",
          date: "2026-06-15",
          type: "note",
          mood: undefined,
          note: "just note",
        },
      ];

      expect(store.getCheckinByDate("2026-06-15")).toBeUndefined();
    });
  });

  describe("loadEntries", () => {
    it("loads entries and maps mood/note into JournalEntry shape", async () => {
      setupSupabaseClient({
        user: {
          id: "u1",
        },

        selectResult: {
          data: [
            {
              id: "e1",
              date: "2026-06-15",
              entry_type: "checkin",
              mood: 5,
              note: "great",
            },
            {
              id: "e2",
              date: "2026-06-16",
              entry_type: "note",
              mood: null,
              note: null,
            },
          ],

          error: null,
        },
      });

      const store = useJournalStore();

      await store.loadEntries();

      expect(store.getEntryByDate("2026-06-15")?.mood).toBe(5);

      expect(store.getEntryByDate("2026-06-16")?.note).toBe("");

      expect(store.getEntryByDate("2026-06-16")?.mood).toBeUndefined();

      expect(store.getEntryByDate("2026-06-16")?.type).toBe("note");
    });

    it("clears entries and returns early when no user", async () => {
      setupSupabaseClient({
        user: null,
      });

      const store = useJournalStore();

      store.entries = [
        {
          id: "old",
          date: "2026-06-10",
          type: "note",
          mood: undefined,
          note: "",
        },
      ];

      await store.loadEntries();

      expect(store.entries).toEqual([]);
    });

    it("throws and does not set entries when Supabase returns an error", async () => {
      setupSupabaseClient({
        user: {
          id: "u1",
        },

        selectResult: {
          data: null,
          error: {
            message: "boom",
          },
        },
      });

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const store = useJournalStore();

      const oldEntry: JournalEntry = {
        id: "old",
        date: "2026-06-10",
        type: "note",
        mood: undefined,
        note: "",
      };

      store.entries = [oldEntry];

      await expect(store.loadEntries()).rejects.toEqual({
        message: "boom",
      });

      expect(store.entries).toEqual([oldEntry]);

      errorSpy.mockRestore();
    });
  });

  describe("saveCheckin", () => {
    it("inserts a new checkin when today's checkin does not exist", async () => {
      setupSupabaseClient({
        user: {
          id: "u1",
        },

        writeResult: {
          data: {
            id: "e1",
            date: "2026-06-15",
            entry_type: "checkin",
            mood: 4,
            note: "",
          },

          error: null,
        },
      });

      vi.useFakeTimers();

      vi.setSystemTime(new Date("2026-06-15T12:00:00"));

      const store = useJournalStore();

      await store.saveCheckin({
        mood: 4,
        note: "",
      });

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "u1",
        date: "2026-06-15",
        entry_type: "checkin",
        mood: 4,
        note: "",
      });

      expect(mockUpdate).not.toHaveBeenCalled();

      expect(store.getCheckinByDate("2026-06-15")?.mood).toBe(4);

      expect(store.showCheckin).toBe(false);
    });

    it("updates existing today checkin instead of duplicating", async () => {
      setupSupabaseClient({
        user: {
          id: "u1",
        },

        writeResult: {
          data: {
            id: "e1",
            date: "2026-06-15",
            entry_type: "checkin",
            mood: 4,
            note: "new note",
          },

          error: null,
        },
      });

      vi.useFakeTimers();

      vi.setSystemTime(new Date("2026-06-15T12:00:00"));

      const store = useJournalStore();

      store.entries = [
        {
          id: "e0",
          date: "2026-06-15",
          type: "checkin",
          mood: 2,
          note: "old note",
        },
      ];

      await store.saveCheckin({
        mood: 4,
        note: "new note",
      });

      expect(mockUpdate).toHaveBeenCalled();

      expect(mockInsert).not.toHaveBeenCalled();

      expect(store.entries).toHaveLength(1);

      expect(store.getCheckinByDate("2026-06-15")?.id).toBe("e1");

      expect(store.getCheckinByDate("2026-06-15")?.mood).toBe(4);

      expect(store.getCheckinByDate("2026-06-15")?.note).toBe("new note");
    });

    it("preserves an existing note when checkin has no note", async () => {
      setupSupabaseClient({
        user: {
          id: "u1",
        },

        writeResult: {
          data: {
            id: "e1",
            date: "2026-06-15",
            entry_type: "checkin",
            mood: 3,
            note: "existing note",
          },

          error: null,
        },
      });

      vi.useFakeTimers();

      vi.setSystemTime(new Date("2026-06-15T12:00:00"));

      const store = useJournalStore();

      store.entries = [
        {
          id: "e0",
          date: "2026-06-15",
          type: "checkin",
          mood: 2,
          note: "existing note",
        },
      ];

      await store.saveCheckin({
        mood: 3,
        note: "",
      });

      expect(mockUpdate).toHaveBeenCalled();

      expect(mockInsert).not.toHaveBeenCalled();

      expect(store.entries).toHaveLength(1);

      expect(store.getCheckinByDate("2026-06-15")?.mood).toBe(3);

      expect(store.getCheckinByDate("2026-06-15")?.note).toBe("existing note");
    });

    it("does not treat today's note as an existing checkin", async () => {
      setupSupabaseClient({
        user: {
          id: "u1",
        },

        writeResult: {
          data: {
            id: "e1",
            date: "2026-06-15",
            entry_type: "checkin",
            mood: 4,
            note: "",
          },

          error: null,
        },
      });

      vi.useFakeTimers();

      vi.setSystemTime(new Date("2026-06-15T12:00:00"));

      const store = useJournalStore();

      store.entries = [
        {
          id: "note1",
          date: "2026-06-15",
          type: "note",
          mood: undefined,
          note: "ordinary note",
        },
      ];

      await store.saveCheckin({
        mood: 4,
        note: "",
      });

      expect(mockInsert).toHaveBeenCalled();

      expect(mockUpdate).not.toHaveBeenCalled();

      expect(store.entries).toHaveLength(2);

      expect(store.getCheckinByDate("2026-06-15")?.mood).toBe(4);
    });

    it("throws when no user", async () => {
      setupSupabaseClient({
        user: null,
      });

      const store = useJournalStore();

      await expect(
        store.saveCheckin({
          mood: 4,
          note: "",
        }),
      ).rejects.toThrow("Пользователь не авторизован");

      expect(mockInsert).not.toHaveBeenCalled();

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("throws and does not mutate entries on Supabase error", async () => {
      setupSupabaseClient({
        user: {
          id: "u1",
        },

        writeResult: {
          data: null,
          error: {
            message: "write failed",
          },
        },
      });

      vi.useFakeTimers();

      vi.setSystemTime(new Date("2026-06-15T12:00:00"));

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const store = useJournalStore();

      store.entries = [];

      store.showCheckin = true;

      await expect(
        store.saveCheckin({
          mood: 4,
          note: "",
        }),
      ).rejects.toEqual({
        message: "write failed",
      });

      expect(store.entries).toEqual([]);

      expect(store.showCheckin).toBe(true);

      errorSpy.mockRestore();
    });
  });

  describe("addNote", () => {
    it("inserts a note-only row", async () => {
      setupSupabaseClient({
        user: {
          id: "u1",
        },

        writeResult: {
          data: {
            id: "e2",
            date: "2026-06-15",
            entry_type: "note",
            mood: null,
            note: "hello",
          },

          error: null,
        },
      });

      vi.useFakeTimers();

      vi.setSystemTime(new Date("2026-06-15T12:00:00"));

      const store = useJournalStore();

      await store.addNote("  hello  ");

      expect(mockInsert).toHaveBeenCalledWith({
        user_id: "u1",
        date: "2026-06-15",
        entry_type: "note",
        mood: null,
        note: "hello",
      });

      expect(store.getEntryByDate("2026-06-15")?.note).toBe("hello");

      expect(store.getEntryByDate("2026-06-15")?.mood).toBeUndefined();

      expect(store.getEntryByDate("2026-06-15")?.type).toBe("note");
    });

    it("does nothing for a blank note", async () => {
      setupSupabaseClient({
        user: {
          id: "u1",
        },
      });

      const store = useJournalStore();

      await store.addNote("   ");

      expect(mockInsert).not.toHaveBeenCalled();

      expect(store.entries).toEqual([]);
    });

    it("adds note without removing existing checkin", async () => {
      setupSupabaseClient({
        user: {
          id: "u1",
        },

        writeResult: {
          data: {
            id: "e2",
            date: "2026-06-15",
            entry_type: "note",
            mood: null,
            note: "note",
          },

          error: null,
        },
      });

      vi.useFakeTimers();

      vi.setSystemTime(new Date("2026-06-15T12:00:00"));

      const store = useJournalStore();

      store.entries = [
        {
          id: "e1",
          date: "2026-06-15",
          type: "checkin",
          mood: 5,
          note: "",
        },
      ];

      await store.addNote("note");

      expect(mockInsert).toHaveBeenCalled();

      expect(store.entries).toHaveLength(2);

      expect(store.getCheckinByDate("2026-06-15")?.mood).toBe(5);

      expect(store.entries.find((entry) => entry.id === "e2")?.note).toBe(
        "note",
      );
    });

    it("throws when no user", async () => {
      setupSupabaseClient({
        user: null,
      });

      const store = useJournalStore();

      await expect(store.addNote("hi")).rejects.toThrow(
        "Пользователь не авторизован",
      );

      expect(mockInsert).not.toHaveBeenCalled();
    });

    it("throws and does not mutate entries on Supabase error", async () => {
      setupSupabaseClient({
        user: {
          id: "u1",
        },

        writeResult: {
          data: null,
          error: {
            message: "write failed",
          },
        },
      });

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const store = useJournalStore();

      store.entries = [];

      await expect(store.addNote("hi")).rejects.toEqual({
        message: "write failed",
      });

      expect(store.entries).toEqual([]);

      errorSpy.mockRestore();
    });
  });

  describe("deleteEntry", () => {
    it("deletes the entry from DB and state", async () => {
      setupSupabaseClient({
        user: {
          id: "u1",
        },
      });

      const store = useJournalStore();

      store.entries = [
        {
          id: "e1",
          date: "2026-06-15",
          type: "note",
          mood: undefined,
          note: "",
        },
        {
          id: "e2",
          date: "2026-06-16",
          type: "note",
          mood: undefined,
          note: "",
        },
      ];

      await store.deleteEntry("e1");

      expect(mockDelete).toHaveBeenCalled();

      expect(store.entries.map((entry) => entry.id)).toEqual(["e2"]);
    });

    it("throws when no user", async () => {
      setupSupabaseClient({
        user: null,
      });

      const store = useJournalStore();

      await expect(store.deleteEntry("e1")).rejects.toThrow(
        "Пользователь не авторизован",
      );

      expect(mockDelete).not.toHaveBeenCalled();
    });

    it("throws and keeps entry on Supabase error", async () => {
      const err = {
        message: "delete failed",
      };

      setupSupabaseClient({
        user: {
          id: "u1",
        },

        deleteError: err,
      });

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const store = useJournalStore();

      store.entries = [
        {
          id: "e1",
          date: "2026-06-15",
          type: "note",
          mood: undefined,
          note: "",
        },
      ];

      await expect(store.deleteEntry("e1")).rejects.toBe(err);

      expect(store.entries.map((entry) => entry.id)).toEqual(["e1"]);

      errorSpy.mockRestore();
    });
  });

  describe("init", () => {
    it("sets showCheckin false when a checkin already exists today", async () => {
      setupSupabaseClient({
        user: {
          id: "u1",
        },

        selectResult: {
          data: [
            {
              id: "e1",
              date: "2026-06-15",
              entry_type: "checkin",
              mood: 4,
              note: "",
            },
          ],

          error: null,
        },
      });

      vi.useFakeTimers();

      vi.setSystemTime(new Date("2026-06-15T12:00:00"));

      const store = useJournalStore();

      await store.init();

      expect(store.showCheckin).toBe(false);
    });

    it("sets showCheckin true when no checkin today", async () => {
      setupSupabaseClient({
        user: {
          id: "u1",
        },

        selectResult: {
          data: [
            {
              id: "e1",
              date: "2026-06-14",
              entry_type: "checkin",
              mood: 4,
              note: "",
            },
          ],

          error: null,
        },
      });

      vi.useFakeTimers();

      vi.setSystemTime(new Date("2026-06-15T12:00:00"));

      const store = useJournalStore();

      await store.init();

      expect(store.showCheckin).toBe(true);
    });

    it("shows checkin for a same-day note-only entry", async () => {
      setupSupabaseClient({
        user: {
          id: "u1",
        },

        selectResult: {
          data: [
            {
              id: "e1",
              date: "2026-06-15",
              entry_type: "note",
              mood: null,
              note: "note",
            },
          ],

          error: null,
        },
      });

      vi.useFakeTimers();

      vi.setSystemTime(new Date("2026-06-15T12:00:00"));

      const store = useJournalStore();

      await store.init();

      expect(store.showCheckin).toBe(true);
    });
  });
});
