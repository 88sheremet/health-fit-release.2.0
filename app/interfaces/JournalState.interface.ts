import { JournalEntry } from "./JournalEntry.interface";

export interface JournalState {
  entries: JournalEntry[];
  showCheckin: boolean;
}
