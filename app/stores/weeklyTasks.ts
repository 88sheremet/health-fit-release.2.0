/*
 * ============================================================
 * IMPORTS
 * ============================================================
 */

/* Фабрика Pinia-стора (options API: state/getters/actions). */
import { defineStore } from "pinia";

/*
 * Стор дневных задач: даёт startDate (база расчёта недели/дня)
 * и хранит энергию, начисляемую за выполнение недельного задания.
 */
import { useTaskStore } from "./dailyTasks";

/*
 * Сервис еженедельных активностей: загрузка задач с переводами
 * и чтение/запись выполнений (weekly_task_completions).
 */
import {
  getWeeklyTasks,
  getWeeklyCompletions,
  completeWeeklyTask as saveWeeklyCompletion,
} from "~/services/weeklyTask.service";

/*
 * Утилита — число полных дней с переданной даты;
 * на её основе считаются currentWeek и currentDayWithinWeek.
 */
import { getDaysSince } from "~/utils/taskEngine";

/* UI-модель задачи недели (результат getter currentTask). */
import type { WeeklyTask } from "../interfaces/WeeklyTask.interface";

/* Форма state стора: completed / tasks / tasksLoaded. */
import type { WeeklyState } from "../interfaces/WeeklyState.interface";

/*
 * ============================================================
 * STORE
 * ============================================================
 */

/*
 * Стор еженедельных активностей: еженедельные задачи (weekly, не daily),
 * их локализация из БД, выполненные недели и прогресс пользователя.
 *
 * Прогресс вычисляется через startDate дневного стора:
 *   currentWeek          → floor(daysSince(startDate) / 7) + 1 (неделя 1-based);
 *   currentDayWithinWeek → daysSince(startDate) % 7 + 1 (день 1..7);
 * completed ключуется номером НЕДЕЛИ (weekly_task_completions.week),
 * а не id задачи; окно выполнения — 6–7 дни недели (canComplete).
 *
 * Потребляется страницей pages/weekly.vue.
 */
export const useWeeklyTaskStore = defineStore("weeklyTasks", {
  /*
   * ============================================================
   * REACTIVE STATE
   * ============================================================
   */
  state: (): WeeklyState => ({
    /*
     * Карта выполненных недель: номер недели → true.
     * Попадает в persist (pick: ["completed"]); проверяется isCompleted().
     */
    completed: {},
    /* Задачи недели с наложенными переводами текущей локали. */
    tasks: [],
    /* Флаг, что задачи загружены — управляет выбором currentTask. */
    tasksLoaded: false,
  }),

  /*
   * ============================================================
   * COMPUTED / GETTERS
   * ============================================================
   */
  getters: {
    /*
     * Текущий номер недели (1-based):
     * полных 7-дневных блоков с dailyStore.startDate + 1.
     * Без startDate — программа не стартовала → неделя 1.
     * Используется в currentTask, completeCurrentTask, isCompleted,
     * а также в шаблоне страницы ($t("weekly.week", { n }) и пр.).
     */
    currentWeek(): number {
      const dailyStore = useTaskStore();

      /* Стартовая дата не задана — отображаем первую неделю. */
      if (!dailyStore.startDate) {
        return 1;
      }

      /* Целая часть от деления кол-ва дней на 7 + сдвиг на 1. */
      return Math.floor(getDaysSince(dailyStore.startDate) / 7) + 1;
    },

    /*
     * День внутри текущей недели (1..7): остаток дней % 7 + 1.
     * Используется для определения окна выполнения (см. canComplete)
     * и для подписи дня в шаблоне страницы.
     */
    currentDayWithinWeek(): number {
      const dailyStore = useTaskStore();

      if (!dailyStore.startDate) {
        return 1;
      }

      /* Остаток от деления на 7 + сдвиг на 1 (диапазон 1–7). */
      return (getDaysSince(dailyStore.startDate) % 7) + 1;
    },

    /*
     * Задача текущей недели, приведённая к UI-модели WeeklyTask.
     *
     * Логика выбора:
     *   - ищется задача с week === currentWeek (прямое соответствие);
     *   - если такой нет — циклический фолбэк tasks[weekIndex % length],
     *     где weekIndex = currentWeek - 1;
     *   - до загрузки задач (tasksLoaded == false) — пустая заглушка.
     * DB-поля title/what_doing/why_doing маппятся в nameProgram/что/зачем.
     */
    currentTask(state): WeeklyTask {
      const weekIndex = this.currentWeek - 1;

      if (state.tasksLoaded && state.tasks.length) {
        /* Основной вариант: задача точно на эту неделю. */
        const currentWeekTask = state.tasks.find(
          (task) => task.week === this.currentWeek
        );

        /* Фолбэк: зацикливание, если недель в БД меньше текущей. */
        const fallbackTask = state.tasks[weekIndex % state.tasks.length];

        const task = currentWeekTask ?? fallbackTask;

        return {
          id: task!.id,
          nameProgram: task!.title,
          whatDoing: task!.what_doing,
          whyDoing: task!.why_doing,
        };
      }

      /* Задачи ещё не загружены — пустая модель, чтобы не ломать шаблон. */
      return {
        id: "",
        nameProgram: "",
        whatDoing: "",
        whyDoing: "",
      };
    },

    /*
     * Доступность выполнения задания: только 6–7 день недели
     * (выходные). Используется для дизейбла кнопки и подсказки.
     */
    canComplete(): boolean {
      return this.currentDayWithinWeek >= 6 && this.currentDayWithinWeek <= 7;
    },
  },

  /*
   * ============================================================
   * ACTIONS
   * ============================================================
   */
  actions: {
    /*
     * Загрузка еженедельных задач под текущую локаль.
     *
     * Поток:
     *   1. Сброс флага tasksLoaded (чтобы шаблон показал заглушку).
     *   2. Вызов сервиса getWeeklyTasks(locale) → tasks с переводами.
     *   3. Ошибка логируется и пробрасывается, флаг ставится в finally.
     * Вызывается при init и при смене locale (i18n-зависимость).
     */
    async loadTasks(locale = "ru") {
      try {
        this.tasksLoaded = false;

        this.tasks = await getWeeklyTasks(locale);
      } catch (error) {
        console.error(
          "[WeeklyTasks] Не удалось загрузить weekly_tasks:",
          error
        );

        throw error;
      } finally {
        this.tasksLoaded = true;
      }
    },

    /*
     * Загрузка выполненных ранее недель текущего пользователя.
     *
     * Поток:
     *   1. Сервис возвращает массив номеров недель.
     *   2. Карта completed сбрасывается.
     *   3. Каждая неделя помечается true (ключ — week, не id задачи).
     * Ошибка логируется и пробрасывается.
     */
    async loadCompletions() {
      try {
        const weeks = await getWeeklyCompletions();

        this.completed = {};

        weeks.forEach((week) => {
          this.completed[week] = true;
        });
      } catch (error) {
        console.error(
          "[WeeklyTasks] Не удалось загрузить weekly completions:",
          error
        );

        throw error;
      }
    },

    /*
     * Инициализация страницы: параллельно грузятся задачи
     * (с переводами под locale) и выполненные недели.
     */
    async init(locale = "ru") {
      await Promise.all([this.loadTasks(locale), this.loadCompletions()]);
    },

    /*
     * Выполнение текущей недельной задачи.
     *
     * Поток:
     *   1. Защита от повторного выполнения (isCompleted).
     *   2. Проверка, что выбрана реальная задача (есть id).
     *   3. Сохранение выполнения в БД (задача + номер недели).
     *   4. Отметка currentWeek в локальной карте completed.
     *   5. Начисление энергии (+100) в стор дневных задач.
     */
    async completeCurrentTask() {
      /* 1. Уже выполнено — выходим без повторных записей. */
      if (this.isCompleted()) {
        return;
      }

      const task = this.currentTask;

      /* 2. Задача не выбрана (пустой id) — нечего сохранять. */
      if (!task.id) {
        return;
      }

      try {
        /* 3. Персист в weekly_task_completions. */
        await saveWeeklyCompletion(task.id, this.currentWeek);

        /* 4. Ключ — текущий номер недели (не id задачи). */
        this.completed[this.currentWeek] = true;

        const dailyStore = useTaskStore();

        /* 5. Награда энергией в общем прогрессе программы. */
        await dailyStore.addEnergy(100);
      } catch (error) {
        console.error("[WeeklyTasks] Ошибка выполнения задания:", error);

        throw error;
      }
    },

    /*
     * Проверка выполнения текущей недели по карте completed.
     * Используется в шаблоне (кнопка/баннер) и completeCurrentTask.
     */
    isCompleted(): boolean {
      return !!this.completed[this.currentWeek];
    },

    /*
     * Резервное начисление энергии (+100) напрямую в дневной стор,
     * без записи выполнения в БД.
     */
    rewardEnergy() {
      const dailyStore = useTaskStore();

      dailyStore.energy += 100;
    },
  },

  /*
   * Персист: в localStorage хранится только карта completed
   * (задачи и переводы читаются из Supabase при каждой инициализации).
   */
  persist: {
    pick: ["completed"],
  },
});
