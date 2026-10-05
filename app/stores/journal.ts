/*
 * ============================================================
 * IMPORTS
 * ============================================================
 */

/* Фабрика Pinia-стора — определяет стор "journal" внизу файла. */
import { defineStore } from "pinia";

/* Клиентская модель записи журнала — тип элементов entries. */
import type { JournalEntry } from "../interfaces/JournalEntry.interface";

/* Форма состояния стора (entries + showCheckin) для state(). */
import type { JournalState } from "../interfaces/JournalState.interface";

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

/*
 * Шкала настроения чек-ина: 1 (худшее) .. 5 (лучшее).
 * Используется в payload saveCheckin и в поле mood записи.
 */
type Mood = 1 | 2 | 3 | 4 | 5;

/*
 * Вид записи в журнале: "checkin" — отметка дня,
 * "note" — свободная заметка (колонка entry_type в БД).
 */
type JournalEntryType = "checkin" | "note";

/*
 * Сырая строка таблицы Supabase journal_entries (только
 * выбираемые колонки). Маппится в JournalEntry функцией
 * mapRowToEntry ниже.
 */
type JournalRow = {
  /* UUID строки. Колонка БД: journal_entries.id. */
  id: string;

  /* Дата записи (ISO). Колонка БД: journal_entries.date. */
  date: string;

  /* Тип записи. Колонка БД: journal_entries.entry_type. */
  entry_type: JournalEntryType;

  /* Настроение 1..5 или NULL. Колонка БД: journal_entries.mood. */
  mood: number | null;

  /* Текст заметки или NULL. Колонка БД: journal_entries.note. */
  note: string | null;
};

/*
 * ============================================================
 * FUNCTIONS
 * ============================================================
 */

/*
 * Приводит значение из БД к шкале настроения.
 * 1. Проверяет, что value — целое число в диапазоне 1..5.
 * 2. Возвращает Mood либо undefined для прочих значений
 *    (защита от некорректных данных при маппинге строк).
 */
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

/*
 * Сегодняшняя дата в формате YYYY-MM-DD (по UTC).
 * Используется как date новых записей и при поиске
 * чек-ина текущего дня.
 */
const getToday = (): string => {
  return new Date().toISOString().slice(0, 10);
};

/*
 * Обрезает строку даты до YYYY-MM-DD — позволяет сравнивать
 * даты с временем (например, ISO с временем суток) по
 * календарному дню.
 */
const normalizeDate = (date: string): string => {
  return date.slice(0, 10);
};

/*
 * Возвращает таблицу journal_entries из Supabase-клиента.
 * Типы Supabase могут выводить entry_type как never, если
 * локальный тип Database устарел. Структура таблицы известна
 * приложению, поэтому приведение изолировано здесь, а не
 * размазано через `as any` по всему стору.
 */
const getJournalTable = () => {
  const supabase = useSupabaseClient();

  return supabase.from("journal_entries") as any;
};

/*
 * Маппит строку БД в модель JournalEntry:
 * entry_type → type, mood → валидный Mood | undefined,
 * NULL в note → пустая строка.
 */
const mapRowToEntry = (row: JournalRow): JournalEntry => {
  return {
    id: row.id,
    date: row.date,
    type: row.entry_type,
    mood: toMood(row.mood),
    note: row.note ?? "",
  };
};

/*
 * Фабрика стора "journal": хранит записи пользователя,
 * синхронизирует их с Supabase и управляет модалкой чек-ина.
 */
export const useJournalStore = defineStore("journal", {
  /*
   * ============================================================
   * REACTIVE STATE
   * ============================================================
   */
  state: (): JournalState => ({
    /* Записи (checkin + note), сортировка по date ↑ в loadEntries. */
    entries: [],
    /* Видимость модалки чек-ина: true, пока за сегодня нет
       отметки, затем сбрасывается. */
    showCheckin: false,
  }),

  /*
   * ============================================================
   * GETTERS
   * ============================================================
   */
  getters: {
    /*
     * Данные для графика настроения: копия entries,
     * отсортированная по дате, с порядковым номером дня.
     * mood может отсутствовать (undefined) у заметок.
     * Читается страницами графика.
     */
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

    /*
     * Последняя (самая новая) запись журнала
     * либо null, если записей ещё нет.
     */
    lastEntry(state): JournalEntry | null {
      if (!state.entries.length) {
        return null;
      }

      return state.entries[state.entries.length - 1] ?? null;
    },
  },

  /*
   * ============================================================
   * ACTIONS
   * ============================================================
   */
  actions: {
    /*
     * INIT FLOW
     * Инициализация стора при старте приложения:
     * 1. Загружает записи из Supabase.
     * 2. Ищет чек-ин за сегодня (нормализуя даты).
     * 3. Если отметки нет — включает модалку чек-ина.
     */
    async init() {
      await this.loadEntries();

      const today = getToday();

      /* Только записи типа "checkin" с сегодняшней датой. */
      const todayCheckin = this.entries.find(
        (entry) =>
          entry.type === "checkin" && normalizeDate(entry.date) === today
      );

      /* Чек-ин уже сделан — диалог показывать не нужно. */
      this.showCheckin = !todayCheckin;
    },

    /*
     * LOAD ENTRIES FLOW
     * Загрузка всех записей текущего пользователя:
     * 1. Определяет пользователя; без него очищает entries
     *    (вышедший из аккаунта или гость).
     * 2. Выбирает нужные колонки с фильтром по user_id.
     * 3. Сортирует по date, затем по created_at — стабильный
     *    порядок записей внутри одного дня.
     * 4. Маппит строки и сохраняет их в state.
     */
    async loadEntries() {
      const supabase = useSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      /* Нет пользователя — журнал пуст, выходим без запроса. */
      if (!user) {
        this.entries = [];
        return;
      }

      const journalTable = getJournalTable();

      /* Запрос строк: нужные колонки, только мой user_id. */
      const { data, error } = await journalTable
        .select(
          `
          id,
          date,
          entry_type,
          mood,
          note
        `
        )
        .eq("user_id", user.id)
        .order("date", {
          ascending: true,
        })
        .order("created_at", {
          ascending: true,
        });

      /* Ошибку логируем и пробрасываем — UI покажет состояние. */
      if (error) {
        console.error("[Journal] Ошибка загрузки:", error);
        throw error;
      }

      /* Строки БД → клиентские модели JournalEntry. */
      this.entries = ((data ?? []) as JournalRow[]).map(mapRowToEntry);
    },

    /*
     * CHECK-IN FLOW
     * Сохранение ежедневной отметки настроения:
     * 1. Проверяет авторизацию (иначе бросает ошибку).
     * 2. Готовит дату сегодня и обрезанный текст заметки.
     * 3. Ищет чек-ин за сегодня в локальном состоянии.
     * 4. Есть — UPDATE (пустая заметка сохранит старую);
     *    нет — INSERT новой строки типа "checkin".
     * 5. При ошибке логирует и пробрасывает её в UI.
     * 6. Обновляет entries без дублей и сортирует по дате.
     * 7. Скрывает модалку чек-ина.
     */
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

      /* Существующая отметка за сегодня — кандидат на UPDATE. */
      const existingCheckin = this.entries.find(
        (entry) =>
          entry.type === "checkin" && normalizeDate(entry.date) === today
      );

      const journalTable = getJournalTable();

      let data: JournalRow | null;
      let error: any;

      if (existingCheckin) {
        /* UPDATE: новая заметка либо сохранение старой при пустой. */
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
          `
          )
          .single();

        data = result.data;
        error = result.error;
      } else {
        /* INSERT: первая отметка за сегодня. */
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
          `
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
       * Убираем старую копию записи: не push дубля,
       * а замена строки, чтобы не плодить элементы в Pinia.
       */
      this.entries = this.entries.filter((item) => item.id !== data.id);

      /*
       * Если локальный чек-ин был, а Supabase вернул другой id,
       * удаляем и его — защищаем состояние от дублей.
       */
      if (existingCheckin) {
        this.entries = this.entries.filter(
          (item) => item.id !== existingCheckin.id
        );
      }

      /* Добавляем свежую запись и выстраиваем порядок по дате. */
      this.entries.push(entry);

      this.entries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      /* Отметка сохранена — модалку можно закрыть. */
      this.showCheckin = false;
    },

    /* Закрывает модалку чек-ина (действие «отмена» в UI). */
    closeCheckin() {
      this.showCheckin = false;
    },

    /*
     * Возвращает чек-ин за указанную дату: нормализует дату
     * к YYYY-MM-DD и ищет запись типа "checkin" на этот день,
     * иначе undefined.
     */
    getCheckinByDate(date: string): JournalEntry | undefined {
      const normalizedDate = normalizeDate(date);

      return this.entries.find(
        (entry) =>
          entry.type === "checkin" &&
          normalizeDate(entry.date) === normalizedDate
      );
    },

    /*
     * Возвращает любую запись (чек-ин или заметку) за указанную
     * дату либо undefined, если записи на этот день нет.
     */
    getEntryByDate(date: string): JournalEntry | undefined {
      const normalizedDate = normalizeDate(date);

      return this.entries.find(
        (entry) => normalizeDate(entry.date) === normalizedDate
      );
    },

    /*
     * DELETE FLOW
     * Удаление записи:
     * 1. Проверяет авторизацию.
     * 2. Удаляет строку из БД с фильтром по user_id —
     *    чужую запись удалить нельзя.
     * 3. Убирает запись из локального состояния.
     */
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

      /* Синхронизируем Pinia-state после успешного удаления. */
      this.entries = this.entries.filter((entry) => entry.id !== id);
    },

    /*
     * SAVE NOTE FLOW
     * Добавление свободной заметки:
     * 1. Проверяет авторизацию (иначе ошибка).
     * 2. Обрезает текст и выходит, если он пуст.
     * 3. Вставляет отдельную строку типа "note" с mood = NULL
     *    за сегодня — заметка не заменяет чек-ин дня.
     * 4. Маппит результат, дополняет entries и сортирует по дате.
     */
    async addNote(note: string) {
      const supabase = useSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Пользователь не авторизован");
      }

      const trimmedNote = note.trim();

      /* Пустая заметка не сохраняется. */
      if (!trimmedNote) {
        return;
      }

      const today = getToday();

      /*
       * Заметка — отдельная строка журнала, она НЕ должна
       * перезаписывать чек-ин текущего дня.
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
        `
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

      /* Помещаем запись в state и выстраиваем порядок по дате. */
      this.entries.push(entry);

      this.entries.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    },
  },
});