import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { setActivePinia, createPinia } from "pinia";

import { useProgressStore } from "~/stores/progress";
import { useSupabaseClient } from "../setup";

/**
 * Integration-тесты страницы прогресса.
 *
 * `loadProgress()` читает пять таблиц за один проход, поэтому здесь мокается
 * весь Supabase-клиент: `from(table)` возвращает «липкую» цепочку, которая
 * по завершении отдаёт настроенный `{ data, error }` для этой таблицы.
 * Дата заморожена на 2026-08-03, чтобы границы 7-дневных окон были детерминированы:
 *
 *   текущее окно:    2026-07-28 .. 2026-08-03
 *   предыдущее окно: 2026-07-21 .. 2026-07-27
 */

const NOW = new Date(2026, 7, 3, 12, 0, 0);

const CURRENT_PERIOD_START = "2026-07-28";
const PREVIOUS_PERIOD_START = "2026-07-21";

type TableResult = { data?: any; error?: any };

let tableResults: Record<string, TableResult> = {};

/**
 * Строит цепочку запроса: каждый метод возвращает сам же объект, а сам объект
 * является thenable — `await chain` отдаёт `{ data, error }` для таблицы.
 * Так одновременно работает и настоящий код стора, и проверка вызовов в тестах.
 */
function buildChain(table: string) {
  const result = () => tableResults[table] ?? { data: null, error: null };

  const chain: any = {};

  ["select", "eq", "not", "gte", "lte", "order", "limit"].forEach((method) => {
    chain[method] = vi.fn(() => chain);
  });

  chain.single = vi.fn(() => Promise.resolve(result()));

  chain.then = (onFulfilled: any, onRejected: any) =>
    Promise.resolve(result()).then(onFulfilled, onRejected);

  return chain;
}

function setupSupabaseClient(user: any, tables: Record<string, TableResult>) {
  tableResults = tables;

  const client = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: vi.fn((table: string) => buildChain(table)),
  };

  vi.mocked(useSupabaseClient).mockReturnValue(client as any);

  return client;
}

/**
 * Базовый набор данных.
 *
 * energy: 420 (текущее), отсчётная точка 300 (последняя запись предыдущего окна)
 *   → ожидаемый прирост +120.
 * Задания: 2 × food + 1 × mental в текущем окне (+1 × physical в прошлом, не считается)
 *   → completed 3 из 21, physical 0%, mental 14%, food 29%, фокус — physical.
 * Настроение: прошлое (3, 4) → 3.5; текущее (5, 4) → 4.5 → прирост +1.0.
 */
function baseTables(): Record<string, TableResult> {
  return {
    user_progress: {
      data: { energy: 420, streak: 5, start_date: "2026-07-01" },
      error: null,
    },

    energy_history: {
      data: [
        { energy: 250, created_at: "2026-07-24T10:00:00" },
        { energy: 300, created_at: "2026-07-27T10:00:00" },
        { energy: 350, created_at: "2026-07-29T10:00:00" },
        { energy: 420, created_at: "2026-08-02T10:00:00" },
      ],
      error: null,
    },

    daily_task_completions: {
      data: [
        // прошлое окно — в счётчики недели не попадает
        { task_id: "task-3", day_index: 0, completed_at: "2026-07-25T10:00:00" },
        { task_id: "task-1", day_index: 0, completed_at: "2026-07-29T10:00:00" },
        { task_id: "task-1", day_index: 1, completed_at: "2026-07-30T10:00:00" },
        { task_id: "task-2", day_index: 2, completed_at: "2026-07-31T10:00:00" },
      ],
      error: null,
    },

    daily_tasks: {
      data: [
        { id: "task-1", day: 0, type: "food" },
        { id: "task-2", day: 0, type: "mental" },
        { id: "task-3", day: 0, type: "physical" },
      ],
      error: null,
    },

    journal_entries: {
      data: [
        { date: "2026-07-25", mood: 3, entry_type: "checkin" },
        { date: "2026-07-26", mood: 4, entry_type: "checkin" },
        { date: "2026-07-30", mood: 5, entry_type: "checkin" },
        { date: "2026-08-01", mood: 4, entry_type: "checkin" },
        { date: "2026-08-02", mood: null, entry_type: "note" },
      ],
      error: null,
    },
  };
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("loadProgress — happy path", () => {
  it("заполняет энергию, серию и счётчики заданий", async () => {
    setupSupabaseClient({ id: "u1" }, baseTables());

    const store = useProgressStore();

    await store.loadProgress();

    expect(store.energy).toBe(420);
    expect(store.streak).toBe(5);

    expect(store.tasksCompleted).toBe(3);
    expect(store.tasksTotal).toBe(21);
    expect(store.tasksPercentage).toBe(14);
  });

  it("считает проценты по трём категориям относительно 7 дней", async () => {
    setupSupabaseClient({ id: "u1" }, baseTables());

    const store = useProgressStore();

    await store.loadProgress();

    expect(store.categories.food).toEqual({
      completed: 2,
      total: 7,
      percentage: 29,
    });

    expect(store.categories.mental).toEqual({
      completed: 1,
      total: 7,
      percentage: 14,
    });

    expect(store.categories.physical).toEqual({
      completed: 0,
      total: 7,
      percentage: 0,
    });
  });

  it("выбирает фокусом категорию с наименьшим процентом", async () => {
    setupSupabaseClient({ id: "u1" }, baseTables());

    const store = useProgressStore();

    await store.loadProgress();

    expect(store.focusCategory).toBe("physical");
    expect(store.focusCompleted).toBe(0);
  });

  it("считает прирост энергии от последней записи предыдущего окна", async () => {
    setupSupabaseClient({ id: "u1" }, baseTables());

    const store = useProgressStore();

    await store.loadProgress();

    expect(store.energyChange).toBe(120);
  });

  it("считает среднее настроение и его прирост", async () => {
    setupSupabaseClient({ id: "u1" }, baseTables());

    const store = useProgressStore();

    await store.loadProgress();

    expect(store.moodAverage).toBe(4.5);
    expect(store.moodChange).toBe(1);
  });

  it("обходит все пять таблиц нужными методами", async () => {
    const client = setupSupabaseClient({ id: "u1" }, baseTables());

    const store = useProgressStore();

    await store.loadProgress();

    const tables = (client.from as any).mock.calls.map((call: any) => call[0]);

    expect(tables).toEqual([
      "user_progress",
      "energy_history",
      "daily_task_completions",
      "daily_tasks",
      "journal_entries",
    ]);
  });
});

describe("loadProgress — границы 7-дневных окон", () => {
  it("не считает задания, выполненные до 2026-07-28", async () => {
    const tables = baseTables();

    tables.daily_task_completions.data = [
      { task_id: "task-3", day_index: 0, completed_at: "2026-07-27T23:59:59" },
    ];

    setupSupabaseClient({ id: "u1" }, tables);

    const store = useProgressStore();

    await store.loadProgress();

    expect(store.tasksCompleted).toBe(0);

    expect(store.categories.physical.completed).toBe(0);
    expect(store.categories.physical.percentage).toBe(0);
  });

  it("считает задание, выполненное ровно на границе окна", async () => {
    const tables = baseTables();

    tables.daily_task_completions.data = [
      { task_id: "task-3", day_index: 0, completed_at: "2026-07-28T00:00:00" },
    ];

    setupSupabaseClient({ id: "u1" }, tables);

    const store = useProgressStore();

    await store.loadProgress();

    expect(store.tasksCompleted).toBe(1);
    expect(store.categories.physical.completed).toBe(1);
  });

  it("границы окон вычисляются от сегодняшней даты, а не фиксированы", async () => {
    const tables = baseTables();
    const client = setupSupabaseClient({ id: "u1" }, tables);

    const store = useProgressStore();

    await store.loadProgress();

    const gteCalls = (client.from as any).mock.calls.length;

    expect(gteCalls).toBe(5);

    const completions = tables.daily_task_completions.data;

    expect(
      completions.filter(
        (entry: any) => new Date(entry.completed_at) >= new Date(2026, 6, 28),
      ),
    ).toHaveLength(3);
  });
});

describe("loadProgress — фокус и неизвестные задания", () => {
  it("завершения с неизвестным task_id не попадают в категории, но идут в tasksCompleted", async () => {
    const tables = baseTables();

    tables.daily_task_completions.data = [
      { task_id: "ghost", day_index: 0, completed_at: "2026-07-29T10:00:00" },
      { task_id: "task-1", day_index: 1, completed_at: "2026-07-30T10:00:00" },
    ];

    setupSupabaseClient({ id: "u1" }, tables);

    const store = useProgressStore();

    await store.loadProgress();

    expect(store.tasksCompleted).toBe(2);

    expect(store.categories.food.completed).toBe(1);
    expect(store.categories.physical.completed).toBe(0);
    expect(store.categories.mental.completed).toBe(0);
  });

  it("задание с типом вне TASK_TYPES игнорируется", async () => {
    const tables = baseTables();

    tables.daily_tasks.data = [
      { id: "task-1", day: 0, type: "weird" },
      { id: "task-2", day: 0, type: "mental" },
    ];

    tables.daily_task_completions.data = [
      { task_id: "task-1", day_index: 0, completed_at: "2026-07-29T10:00:00" },
      { task_id: "task-2", day_index: 1, completed_at: "2026-07-30T10:00:00" },
    ];

    setupSupabaseClient({ id: "u1" }, tables);

    const store = useProgressStore();

    await store.loadProgress();

    expect(store.tasksCompleted).toBe(2);

    expect(store.categories.food.completed).toBe(0);
    expect(store.categories.physical.completed).toBe(0);
    expect(store.categories.mental.completed).toBe(1);
  });

  /**
   * При нулевом прогрессе все три процента равны, и `Array#sort` стабилен,
   * поэтому фокусом становится первая категория из TASK_TYPES — "physical",
   * а не дефолтное значение state "mental".
   */
  it("при нулевом прогрессе фокусом становится physical", async () => {
    const tables = baseTables();

    tables.daily_task_completions.data = [];
    tables.energy_history.data = [];
    tables.journal_entries.data = [];

    setupSupabaseClient({ id: "u1" }, tables);

    const store = useProgressStore();

    await store.loadProgress();

    expect(store.focusCategory).toBe("physical");
    expect(store.focusCompleted).toBe(0);
  });

  it("фокусом становится категория с минимальным, но ненулевым числом", async () => {
    const tables = baseTables();

    tables.daily_task_completions.data = [
      { task_id: "task-1", day_index: 0, completed_at: "2026-07-29T10:00:00" },
      { task_id: "task-2", day_index: 1, completed_at: "2026-07-30T10:00:00" },
      { task_id: "task-3", day_index: 2, completed_at: "2026-07-31T10:00:00" },
    ];

    setupSupabaseClient({ id: "u1" }, tables);

    const store = useProgressStore();

    await store.loadProgress();

    expect(store.categories.food.percentage).toBe(14);
    expect(store.categories.mental.percentage).toBe(14);
    expect(store.categories.physical.percentage).toBe(14);

    expect(store.focusCategory).toBe("physical");
    expect(store.focusCompleted).toBe(1);
  });
});

describe("loadProgress — пустые данные", () => {
  it("нет истории энергии → energyChange = 0", async () => {
    const tables = baseTables();
    tables.energy_history.data = [];

    setupSupabaseClient({ id: "u1" }, tables);

    const store = useProgressStore();

    await store.loadProgress();

    expect(store.energyChange).toBe(0);
    expect(store.energy).toBe(420);
  });

  it("история только из текущего окна → отсчёт от первой текущей записи", async () => {
    const tables = baseTables();

    tables.energy_history.data = [
      { energy: 400, created_at: "2026-07-29T10:00:00" },
      { energy: 420, created_at: "2026-08-02T10:00:00" },
    ];

    setupSupabaseClient({ id: "u1" }, tables);

    const store = useProgressStore();

    await store.loadProgress();

    expect(store.energyChange).toBe(20);
  });

  it("история только из прошлого окна → energyChange = 0", async () => {
    const tables = baseTables();

    tables.energy_history.data = [
      { energy: 300, created_at: "2026-07-27T10:00:00" },
    ];

    setupSupabaseClient({ id: "u1" }, tables);

    const store = useProgressStore();

    await store.loadProgress();

    expect(store.energyChange).toBe(0);
  });

  it("нет журнала за оба окна → moodAverage и moodChange равны 0", async () => {
    const tables = baseTables();
    tables.journal_entries.data = [];

    setupSupabaseClient({ id: "u1" }, tables);

    const store = useProgressStore();

    await store.loadProgress();

    expect(store.moodAverage).toBe(0);
    expect(store.moodChange).toBe(0);
  });

  it("нет записей за прошлое окно → moodChange = 0, но среднее считается", async () => {
    const tables = baseTables();

    tables.journal_entries.data = [
      { date: "2026-07-30", mood: 5, entry_type: "checkin" },
      { date: "2026-08-01", mood: 4, entry_type: "checkin" },
    ];

    setupSupabaseClient({ id: "u1" }, tables);

    const store = useProgressStore();

    await store.loadProgress();

    expect(store.moodAverage).toBe(4.5);
    expect(store.moodChange).toBe(0);
  });

  it("нет заданий и завершений → 0 из 21", async () => {
    const tables = baseTables();

    tables.daily_tasks.data = [];
    tables.daily_task_completions.data = [];

    setupSupabaseClient({ id: "u1" }, tables);

    const store = useProgressStore();

    await store.loadProgress();

    expect(store.tasksCompleted).toBe(0);
    expect(store.tasksTotal).toBe(21);
    expect(store.tasksPercentage).toBe(0);
  });
});

describe("loadProgress — ошибки и отсутствие данных", () => {
  it("бросает ошибку, если пользователь не авторизован", async () => {
    setupSupabaseClient(null, baseTables());

    const store = useProgressStore();

    await expect(store.loadProgress()).rejects.toThrow(
      "Пользователь не авторизован",
    );
  });

  it("бросает ошибку из user_progress", async () => {
    const tables = baseTables();
    tables.user_progress = { data: null, error: { message: "boom" } };

    setupSupabaseClient({ id: "u1" }, tables);

    const store = useProgressStore();

    await expect(store.loadProgress()).rejects.toMatchObject({ message: "boom" });
  });

  /**
   * `.single()` возвращает PGRST116, когда строк нет. Стор не делает запасного
   * пути для нового пользователя, поэтому первая загрузка страницы падает —
   * в консоль попадает ошибка, а карточки остаются пустыми.
   */
  it("строка user_progress отсутствует → PGRST116 пробрасывается наружу", async () => {
    const tables = baseTables();

    tables.user_progress = {
      data: null,
      error: { code: "PGRST116", message: "no rows" },
    };

    setupSupabaseClient({ id: "u1" }, tables);

    const store = useProgressStore();

    await expect(store.loadProgress()).rejects.toMatchObject({ code: "PGRST116" });
  });

  /**
   * Если `.single()` вернул `null` без ошибки (так отвечает старый e2e-мок),
   * стор падает с TypeError при чтении `progress.energy`.
   */
  it("null вместо строки user_progress → TypeError при чтении .energy", async () => {
    const tables = baseTables();
    tables.user_progress = { data: null, error: null };

    setupSupabaseClient({ id: "u1" }, tables);

    const store = useProgressStore();

    await expect(store.loadProgress()).rejects.toThrow(TypeError);
  });

  it("бросает ошибку из daily_task_completions", async () => {
    const tables = baseTables();
    tables.daily_task_completions = { data: null, error: { message: "boom" } };

    setupSupabaseClient({ id: "u1" }, tables);

    const store = useProgressStore();

    await expect(store.loadProgress()).rejects.toMatchObject({ message: "boom" });
  });

  it("бросает ошибку из daily_tasks", async () => {
    const tables = baseTables();
    tables.daily_tasks = { data: null, error: { message: "boom" } };

    setupSupabaseClient({ id: "u1" }, tables);

    const store = useProgressStore();

    await expect(store.loadProgress()).rejects.toMatchObject({ message: "boom" });
  });

  it("бросает ошибку из energy_history", async () => {
    const tables = baseTables();
    tables.energy_history = { data: null, error: { message: "boom" } };

    setupSupabaseClient({ id: "u1" }, tables);

    const store = useProgressStore();

    await expect(store.loadProgress()).rejects.toMatchObject({ message: "boom" });
  });

  it("бросает ошибку из journal_entries", async () => {
    const tables = baseTables();
    tables.journal_entries = { data: null, error: { message: "boom" } };

    setupSupabaseClient({ id: "u1" }, tables);

    const store = useProgressStore();

    await expect(store.loadProgress()).rejects.toMatchObject({ message: "boom" });
  });
});

describe("init — индикатор загрузки", () => {
  it("переводит loading в true, а после успеха — в false", async () => {
    setupSupabaseClient({ id: "u1" }, baseTables());

    const store = useProgressStore();

    expect(store.loading).toBe(false);

    const pending = store.init();

    expect(store.loading).toBe(true);

    await pending;

    expect(store.loading).toBe(false);
    expect(store.energy).toBe(420);
  });

  it("сбрасывает loading и пробрасывает ошибку", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const tables = baseTables();
    tables.user_progress = { data: null, error: { message: "boom" } };

    setupSupabaseClient({ id: "u1" }, tables);

    const store = useProgressStore();

    await expect(store.init()).rejects.toMatchObject({ message: "boom" });

    expect(store.loading).toBe(false);

    expect(spy).toHaveBeenCalledWith(
      "[Progress] Ошибка загрузки:",
      expect.objectContaining({ message: "boom" }),
    );
  });
});
