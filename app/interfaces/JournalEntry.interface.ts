export type JournalEntryType = "checkin" | "note";

export interface JournalEntry {
  id: string;
  date: string;
  type: JournalEntryType;
  mood?: 1 | 2 | 3 | 4 | 5;
  note: string;
}