export interface JournalEntry {
  id: string;
  date: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  note: string;
}
