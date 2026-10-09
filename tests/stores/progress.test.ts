import { describe, it, expect, beforeEach } from "vitest";

import { setActivePinia, createPinia } from "pinia";

import { useProgressStore } from "~/stores/progress";

/**
 * Unit-тесты страницы прогресса.
 *
 * Здесь проверяется только чистая логика: начальный state, геттеры и вспомогательные
 * действия (`calculateMoodAverage`, `formatDate`). Всё, что ходит в Supabase,
 * покрыто в `tests/integration/progressFlow.test.ts`, а рендер — в `e2e/progress.spec.ts`.
 */

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("progress store — начальное состояние", () => {
  it("энергия и настроение обнулены, задания — 0 из 22, категории присутствуют", () => {
    const store = useProgressStore();

    expect(store.loading).toBe(false);
    expect(store.energy).toBe(0);
    expect(store.energyChange).toBe(0);
    expect(store.streak).toBe(0);
    expect(store.moodAverage).toBe(0);
    expect(store.moodChange).toBe(0);
    expect(store.tasksCompleted).toBe(0);

    /*
     * `tasksTotal` — константа TOTAL_TASKS = 7 дней × 3 категории + 1 недельное
     * задание = 22. Она известна до первой загрузки, поэтому карточка «Задания»
     * показывает знаменатель сразу, а не после `loadProgress()`.
     */
    expect(store.tasksTotal).toBe(22);
    expect(store.tasksPercentage).toBe(0);

    expect(Object.keys(store.categories).sort()).toEqual([
      "food",
      "mental",
      "physical",
    ]);

    for (const key of ["physical", "food", "mental"] as const) {
      expect(store.categories[key]).toEqual({
        completed: 0,
        total: 0,
        percentage: 0,
      });
    }
  });

  /**
   * До загрузки категория фокуса равна дефолту state "mental". После
   * `loadProgress()` она перезаписывается значением `dominant_problem`
   * из скрининга — дефолт виден только пока данных нет или загрузка упала.
   */
  it("focusCategory по умолчанию равен mental", () => {
    const store = useProgressStore();

    expect(store.focusCategory).toBe("mental");
    expect(store.focusCompleted).toBe(0);
  });
});

describe("progress store — геттер tasksPercentage", () => {
  it("возвращает 0 при нулевом знаменателе (деление на ноль не происходит)", () => {
    const store = useProgressStore();

    /*
     * В проде знаменатель — константа TOTAL_TASKS (22), поэтому ноль здесь
     * задаётся явно: геттер обязан пережить и такое значение.
     */
    store.tasksTotal = 0;

    expect(store.tasksPercentage).toBe(0);
  });

  it("округляет 1/3 до 33%", () => {
    const store = useProgressStore();

    store.tasksCompleted = 1;
    store.tasksTotal = 3;

    expect(store.tasksPercentage).toBe(33);
  });

  it("возвращает точные 100% при выполненных заданиях", () => {
    const store = useProgressStore();

    store.tasksCompleted = 22;
    store.tasksTotal = 22;

    expect(store.tasksPercentage).toBe(100);
  });

  it("округляет 13.64% до 14% (3 из 22)", () => {
    const store = useProgressStore();

    expect(store.tasksTotal).toBe(22);

    store.tasksCompleted = 3;

    expect(store.tasksPercentage).toBe(14);
  });
});

describe("progress store — геттер focusTitle", () => {
  /**
   * Заголовок в геттере захардкожен на английском, хотя страница использует
   * i18n-ключи `progress.focuses.*`. Геттер нигде не вызывается — тест
   * фиксирует текущее поведение, чтобы его удаление было заметным.
   */
  it("возвращает английские названия для каждой категории", () => {
    const store = useProgressStore();

    store.focusCategory = "physical";
    expect(store.focusTitle).toBe("Physical recovery");

    store.focusCategory = "food";
    expect(store.focusTitle).toBe("Nutrition");

    store.focusCategory = "mental";
    expect(store.focusTitle).toBe("Mental recovery");
  });
});

describe("progress store — calculateMoodAverage", () => {
  it("возвращает 0 для пустого массива", () => {
    const store = useProgressStore();

    expect(store.calculateMoodAverage([])).toBe(0);
  });

  it("считает среднее и округляет до одного знака", () => {
    const store = useProgressStore();

    expect(store.calculateMoodAverage([{ mood: 5 }, { mood: 4 }])).toBe(4.5);

    expect(store.calculateMoodAverage([{ mood: 3 }, { mood: 4 }])).toBe(3.5);
  });

  it("дробное среднее округляется вверх: 14 / 3 = 4.666 → 4.7", () => {
    const store = useProgressStore();

    expect(
      store.calculateMoodAverage([{ mood: 5 }, { mood: 4 }, { mood: 5 }]),
    ).toBe(4.7);
  });

  it("целое среднее не получает лишний знак: 9 / 3 = 3", () => {
    const store = useProgressStore();

    expect(
      store.calculateMoodAverage([{ mood: 2 }, { mood: 3 }, { mood: 4 }]),
    ).toBe(3);
  });

  it("отбрасывает null: Number(null) === 0 попадает ниже нижней границы 1", () => {
    const store = useProgressStore();

    expect(store.calculateMoodAverage([{ mood: 5 }, { mood: null }])).toBe(5);
  });

  it("отбрасывает значения вне шкалы 1..5", () => {
    const store = useProgressStore();

    expect(store.calculateMoodAverage([{ mood: 0 }])).toBe(0);

    expect(store.calculateMoodAverage([{ mood: 6 }])).toBe(0);

    expect(store.calculateMoodAverage([{ mood: -3 }])).toBe(0);
  });

  it("возвращает 0, если ни одно значение не прошло фильтр", () => {
    const store = useProgressStore();

    expect(
      store.calculateMoodAverage([{ mood: null }, { mood: undefined as any }]),
    ).toBe(0);
  });

  it("NaN не попадает в среднее", () => {
    const store = useProgressStore();

    expect(
      store.calculateMoodAverage([{ mood: 4 }, { mood: NaN }, { mood: 4 }]),
    ).toBe(4);
  });
});

describe("progress store — formatDate", () => {
  it("дополняет месяц и день нулём", () => {
    const store = useProgressStore();

    expect(store.formatDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("форматирует последний день года", () => {
    const store = useProgressStore();

    expect(store.formatDate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });

  it("форматирует середину месяца без изменений", () => {
    const store = useProgressStore();

    expect(store.formatDate(new Date(2026, 7, 15))).toBe("2026-08-15");
  });
});
