import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useJournalStore } from "~/stores/journal";
import { useSupabaseClient } from "../setup";
import type { JournalEntry } from "~/interfaces/JournalEntry.interface";

let mockGetUser: ReturnType<typeof vi.fn>;
let mockUpsert: ReturnType<typeof vi.fn>;
let mockDelete: ReturnType<typeof vi.fn>;

type QueryResult = { data: any; error: any };

function setupSupabaseClient(options: {
  user: any;
  entries?: any[];
  selectResult?: QueryResult;
  selectData?: any;
  deleteError?: any;
}) {
  const { user, selectData, deleteError } = options;

  mockGetUser = vi.fn().mockResolvedValue({ data: { user }, error: null });

  mockUpsert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: selectData, error: null }),
    }),
  });

  mockDelete = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: deleteError ?? null }),
    }),
  });

  const client = {
    auth: { getUser: mockGetUser },
    from: vi.fn((table: string) => {
      if (table === "journal_entries") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve(options.selectResult)),
            })),
          })),
          upsert: mockUpsert,
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
        { id: "3", date: "2026-06-15", mood: 3, note: "" },
        { id: "1", date: "2026-06-13", mood: 5, note: "" },
        { id: "2", date: "2026-06-14", mood: 1, note: "" },
      ];
      const dates = store.chartData.map((e) => e.date);
      expect(dates).toEqual(["2026-06-13", "2026-06-14", "2026-06-15"]);
    });

    it("assigns sequential day numbers", () => {
      const store = useJournalStore();
      store.entries = [
        { id: "1", date: "2026-06-13", mood: 5, note: "" },
        { id: "2", date: "2026-06-14", mood: 1, note: "" },
      ];
      const days = store.chartData.map((e) => e.day);
      expect(days).toEqual([1, 2]);
    });

    it("preserves mood, date, and note fields", () => {
      const store = useJournalStore();
      store.entries = [
        { id: "1", date: "2026-06-13", mood: 4, note: "great day" },
      ];
      const chart = store.chartData[0];
      expect(chart.mood).toBe(4);
      expect(chart.date).toBe("2026-06-13");
      expect(chart.note).toBe("great day");
    });

    it("does not mutate original entries array", () => {
      const store = useJournalStore();
      const entries: JournalEntry[] = [
        { id: "2", date: "2026-06-14", mood: 2, note: "" },
        { id: "1", date: "2026-06-13", mood: 5, note: "" },
      ];
      store.entries = entries;
      store.chartData;
      expect(entries[0].date).toBe("2026-06-14");
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
        { id: "1", date: "2026-06-13", mood: 5, note: "" },
        { id: "2", date: "2026-06-14", mood: 3, note: "ok" },
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
        { id: "1", date: "2026-06-13", mood: 5, note: "" },
        { id: "2", date: "2026-06-14", mood: 3, note: "" },
      ];
      expect(store.getEntryByDate("2026-06-14")?.id).toBe("2");
    });

    it("returns undefined when no match", () => {
      const store = useJournalStore();
      store.entries = [
        { id: "1", date: "2026-06-13", mood: 5, note: "" },
      ];
      expect(store.getEntryByDate("2026-06-99")).toBeUndefined();
    });
  });

  describe("loadEntries", () => {
    it("loads entries and maps mood/note into JournalEntry shape", async () => {
      setupSupabaseClient({
        user: { id: "u1" },
        selectResult: {
          data: [
            { id: "e1", date: "2026-06-15", mood: 5, note: "great" },
            { id: "e2", date: "2026-06-16", mood: null, note: null },
          ],
          error: null,
        },
      });

      const store = useJournalStore();
      await store.loadEntries();

      expect(store.getEntryByDate("2026-06-15")?.mood).toBe(5);
      expect(store.getEntryByDate("2026-06-16")?.note).toBe("");
      expect(store.getEntryByDate("2026-06-16")?.mood).toBeUndefined();
    });

    it("clears entries and returns early when no user", async () => {
      setupSupabaseClient({ user: null });
      const store = useJournalStore();
      store.entries = [{ id: "old", date: "2026-06-10", note: "" }];
      await store.loadEntries();
      expect(store.entries).toEqual([]);
    });

    it("throws and does not set entries when Supabase returns an error", async () => {
      setupSupabaseClient({
        user: { id: "u1" },
        selectResult: { data: null, error: { message: "boom" } },
      });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const store = useJournalStore();
      store.entries = [{ id: "old", date: "2026-06-10", note: "" }];
      await expect(store.loadEntries()).rejects.toEqual({
        message: "boom",
      });
      expect(store.entries).toEqual([{ id: "old", date: "2026-06-10", note: "" }]);
      errorSpy.mockRestore();
    });
  });

  describe("saveCheckin", () => {
    it("creates a single row via upsert and sets showCheckin false", async () => {
      setupSupabaseClient({
        user: { id: "u1" },
        selectData: { id: "e1", date: "2026-06-15", mood: 4, note: "" },
      });
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00"));

      const store = useJournalStore();
      await store.saveCheckin({ mood: 4, note: "" });

      expect(mockUpsert).toHaveBeenCalledWith(
        { user_id: "u1", date: "2026-06-15", mood: 4, note: "" },
        { onConflict: "user_id,date" },
      );
      expect(store.getEntryByDate("2026-06-15")?.mood).toBe(4);
      expect(store.showCheckin).toBe(false);
      vi.useRealTimers();
    });

    it("preserves an existing note when checkin has no note", async () => {
      setupSupabaseClient({
        user: { id: "u1" },
        selectData: { id: "e1", date: "2026-06-15", mood: 3, note: "existing note" },
      });
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00"));

      const store = useJournalStore();
      store.entries = [{ id: "e0", date: "2026-06-15", note: "existing note" }];
      await store.saveCheckin({ mood: 3, note: "" });

      expect(mockUpsert).toHaveBeenCalledWith(
        { user_id: "u1", date: "2026-06-15", mood: 3, note: "existing note" },
        { onConflict: "user_id,date" },
      );
      expect(store.entries).toHaveLength(1);
      expect(store.getEntryByDate("2026-06-15")?.mood).toBe(3);
      vi.useRealTimers();
    });

    it("replaces the existing today entry instead of duplicating", async () => {
      setupSupabaseClient({
        user: { id: "u1" },
        selectData: { id: "e1", date: "2026-06-15", mood: 4, note: "note" },
      });
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00"));

      const store = useJournalStore();
      store.entries = [{ id: "e0", date: "2026-06-15", note: "old" }];
      await store.saveCheckin({ mood: 4, note: "note" });

      expect(store.entries).toHaveLength(1);
      expect(store.entries[0].id).toBe("e1");
      vi.useRealTimers();
    });

    it("throws when no user", async () => {
      setupSupabaseClient({ user: null });
      const store = useJournalStore();
      await expect(store.saveCheckin({ mood: 4, note: "" })).rejects.toThrow(
        "Пользователь не авторизован",
      );
      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it("throws and does not mutate entries on Supabase error", async () => {
      setupSupabaseClient({ user: { id: "u1" } });
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00"));

      const err = { message: "write failed" };
      mockUpsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: err }),
        }),
      });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const store = useJournalStore();
      store.entries = [];
      store.showCheckin = true;
      await expect(store.saveCheckin({ mood: 4, note: "" })).rejects.toBe(err);
      expect(store.entries).toEqual([]);
      expect(store.showCheckin).toBe(true);
      errorSpy.mockRestore();
      vi.useRealTimers();
    });
  });

  describe("addNote", () => {
    it("adds a note row via upsert with mood null", async () => {
      setupSupabaseClient({
        user: { id: "u1" },
        selectData: { id: "e2", date: "2026-06-15", mood: null, note: "hello" },
      });
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00"));

      const store = useJournalStore();
      await store.addNote("  hello  ");

      expect(mockUpsert).toHaveBeenCalledWith(
        { user_id: "u1", date: "2026-06-15", mood: null, note: "hello" },
        { onConflict: "user_id,date" },
      );
      expect(store.getEntryByDate("2026-06-15")?.note).toBe("hello");
      expect(store.getEntryByDate("2026-06-15")?.mood).toBeUndefined();
      vi.useRealTimers();
    });

    it("does nothing for a blank note", async () => {
      setupSupabaseClient({ user: { id: "u1" } });
      const store = useJournalStore();
      await store.addNote("   ");
      expect(mockUpsert).not.toHaveBeenCalled();
      expect(store.entries).toEqual([]);
    });

    it("preserves existing mood when adding a note to a checkin day", async () => {
      setupSupabaseClient({
        user: { id: "u1" },
        selectData: { id: "e2", date: "2026-06-15", mood: 5, note: "note" },
      });
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00"));

      const store = useJournalStore();
      store.entries = [{ id: "e1", date: "2026-06-15", mood: 5, note: "" }];
      await store.addNote("note");

      expect(mockUpsert).toHaveBeenCalledWith(
        { user_id: "u1", date: "2026-06-15", mood: 5, note: "note" },
        { onConflict: "user_id,date" },
      );
      expect(store.entries).toHaveLength(1);
      expect(store.entries[0].mood).toBe(5);
      expect(store.entries[0].note).toBe("note");
      vi.useRealTimers();
    });

    it("throws when no user", async () => {
      setupSupabaseClient({ user: null });
      const store = useJournalStore();
      await expect(store.addNote("hi")).rejects.toThrow("Пользователь не авторизован");
      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it("throws and does not mutate entries on Supabase error", async () => {
      setupSupabaseClient({ user: { id: "u1" } });
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00"));

      const err = { message: "write failed" };
      mockUpsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: err }),
        }),
      });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const store = useJournalStore();
      store.entries = [];
      await expect(store.addNote("hi")).rejects.toBe(err);
      expect(store.entries).toEqual([]);
      errorSpy.mockRestore();
      vi.useRealTimers();
    });
  });

  describe("deleteEntry", () => {
    it("deletes the entry from DB and state", async () => {
      setupSupabaseClient({ user: { id: "u1" } });
      const store = useJournalStore();
      store.entries = [
        { id: "e1", date: "2026-06-15", note: "" },
        { id: "e2", date: "2026-06-16", note: "" },
      ];
      await store.deleteEntry("e1");

      expect(mockDelete).toHaveBeenCalled();
      expect(store.entries.map((e) => e.id)).toEqual(["e2"]);
    });

    it("throws when no user", async () => {
      setupSupabaseClient({ user: null });
      const store = useJournalStore();
      await expect(store.deleteEntry("e1")).rejects.toThrow(
        "Пользователь не авторизован",
      );
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it("throws and keeps entry on Supabase error", async () => {
      const err = { message: "delete failed" };
      setupSupabaseClient({ user: { id: "u1" }, deleteError: err });
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const store = useJournalStore();
      store.entries = [{ id: "e1", date: "2026-06-15", note: "" }];
      await expect(store.deleteEntry("e1")).rejects.toBe(err);
      expect(store.entries.map((e) => e.id)).toEqual(["e1"]);
      errorSpy.mockRestore();
    });
  });

  describe("init", () => {
    it("sets showCheckin false when a checkin already exists today", async () => {
      setupSupabaseClient({
        user: { id: "u1" },
        selectResult: {
          data: [{ id: "e1", date: "2026-06-15", mood: 4, note: "" }],
          error: null,
        },
      });
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00"));

      const store = useJournalStore();
      await store.init();
      expect(store.showCheckin).toBe(false);
      vi.useRealTimers();
    });

    it("sets showCheckin true when no checkin today", async () => {
      setupSupabaseClient({
        user: { id: "u1" },
        selectResult: {
          data: [{ id: "e1", date: "2026-06-14", mood: 4, note: "" }],
          error: null,
        },
      });
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00"));

      const store = useJournalStore();
      await store.init();
      expect(store.showCheckin).toBe(true);
      vi.useRealTimers();
    });

    it("shows checkin for a same-day note-only entry", async () => {
      setupSupabaseClient({
        user: { id: "u1" },
        selectResult: {
          data: [{ id: "e1", date: "2026-06-15", mood: null, note: "note" }],
          error: null,
        },
      });
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-06-15T12:00:00"));

      const store = useJournalStore();
      await store.init();
      expect(store.showCheckin).toBe(true);
      vi.useRealTimers();
    });
  });
});
