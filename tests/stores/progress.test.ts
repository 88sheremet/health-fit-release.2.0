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
  it("все счётчики обнулены, категории присутствуют", () => {
    const store = useProgressStore();

    expect(store.loading).toBe(false);
    expect(store.energy).toBe(0);
    expect(store.energyChange).toBe(0);
    expect(store.streak).toBe(0);
    expect(store.moodAverage).toBe(0);
    expect(store.moodChange).toBe(0);
    expect(store.tasksCompleted).toBe(0);
    expect(store.tasksTotal).toBe(0);

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
   * Дефолт "mental" отличается от того, что посчитает `loadProgress()` для
   * нулевого прогресса ("physical": sort стабильный, а TASK_TYPES начинается
   * с "physical"). Пока страница всегда вызывает init() — расхождение не видно,
   * но если загрузка упадёт, карточка "фокус" покажет Mental recovery.
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

    expect(store.tasksTotal).toBe(0);
    expect(store.tasksPercentage).toBe(0);
  });

  it("округляет вверх до целого процента", () => {
    const store = useProgressStore();

    store.tasksCompleted = 1;
    store.tasksTotal = 3;

    expect(store.tasksPercentage).toBe(33);
  });

  it("возвращает точные 100% при выполненных заданиях", () => {
    const store = useProgressStore();

    store.tasksCompleted = 21;
    store.tasksTotal = 21;

    expect(store.tasksPercentage).toBe(100);
  });

  it("округляет 14.28% до 14%", () => {
    const store = useProgressStore();

    store.tasksCompleted = 3;
    store.tasksTotal = 21;

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
