/*
 * ============================================================
 * IMPORTS
 * ============================================================
 */

/* Фабрика Pinia-сторов. */
import { defineStore } from "pinia";

/* Вычисление дня программы и проверка воскресенья как дня отдыха. */
import { getDayIndex, isRestDayByDate } from "~/utils/taskEngine";

/* Загрузка задач с переводами из Supabase. */
import { getDailyTasks } from "~/services/dailyTask.service";

/* Доменная модель задачи (выход мержа базы и перевода). */
import type { Task } from "~/interfaces/Task.interface";

/* Строка таблицы daily_tasks до мержа. */
import type { DbDailyTask } from "~/interfaces/DbDailyTask.interface";

/* Форма state стора. */
import type { TaskState } from "~/interfaces/TaskState.interface";

/*
 * ============================================================
 * CONSTANTS
 * ============================================================
 */

/* Длина цикла программы: day-30 переходит обратно на 1 при выборе задач. */
const DAY_COUNT = 30;

/* Возможные типы задач; фиксируют порядок категорий в списке дня. */
const TASK_TYPES = ["food", "mental", "physical"] as const;

/* Дефолтная награда за обычную задачу (food/mental), если reward в БД = null. */
const STANDARD_TASK_REWARD = 10;

/* Повышенная награда за физическую задачу, если reward в БД = null. */
const PHYSICAL_TASK_REWARD = 15;

/*
 * ============================================================
 * FUNCTIONS
 * ============================================================
 */

/*
 * Возвращает награду по умолчанию для типа задачи.
 * Используется при маппинге DbDailyTask → Task, когда колонка reward = null.
 *
 * 1. physical → 15, все остальные → 10.
 */
function rewardForType(type: string): number {
  return type === "physical" ? PHYSICAL_TASK_REWARD : STANDARD_TASK_REWARD;
}

/*
 * Нормализует поле what_doing: JSON-строку превращает в объект, обычный текст оставляет как есть.
 * Нужно, потому что в БД упражнения могут храниться строкой-JSON, а UI (TaskDetailsDialog) ждёт объект.
 *
 * 1. Не строка — возвращаем значение без изменений.
 * 2. Строка начинается с "{" — пробуем распарсить как JSON.
 * 3. Парсинг не удался — возвращаем исходную строку (ветка catch).
 * 4. Иначе возвращаем исходное значение.
 */
function normalizeWhatDoing(value: unknown): unknown {
  if (typeof value === "string") {
    const trimmed = value.trim();

    if (trimmed.startsWith("{")) {
      try {
        return JSON.parse(trimmed);
      } catch {
        // Если строка не является JSON,
        // оставляем её как обычный текст.
      }
    }
  }

  return value;
}

/*
 * Собирает список задач для конкретного дня программы из сырых строк daily_tasks.
 * Используется геттером todayTasks.
 *
 * 1. Приводим dayIndex к номеру внутри цикла 1–30 (суррогат day-30).
 * 2. Группируем строки по типу задачи.
 * 3. Для каждого типа (в порядке TASK_TYPES): сортируем по day,
 *    берём строку с targetDay либо по модулю длины списка (fallback),
 *    маппим в доменную Task и добавляем в результат.
 */
function dbTasksForDay(rows: DbDailyTask[], dayIndex: number): Task[] {
  /* Шаг 1: wrap по 30 дням — day 31 снова смотрит на задачу дня 1. */
  const targetDay = ((dayIndex - 1) % DAY_COUNT) + 1;

  /* Шаг 2: контейнер «тип → строки этого типа». */
  const byType = new Map<(typeof TASK_TYPES)[number], DbDailyTask[]>();

  /* Раскладываем каждую строку по её type. */
  for (const row of rows) {
    const list = byType.get(row.type) ?? [];

    list.push(row);

    byType.set(row.type, list);
  }

  /* Шаг 3: для каждой категории формируем по одной задаче дня. */
  return TASK_TYPES.reduce<Task[]>((result, type) => {
    /* Копия строк типа, отсортированная по номеру дня. */
    const list = (byType.get(type) ?? []).slice().sort((a, b) => a.day - b.day);

    /* У типа нет строк — категория пропускается. */
    if (!list.length) {
      return result;
    }

    /* Точное совпадение дня, иначе — circular fallback по модулю длины. */
    const row =
      list.find((item) => item.day === targetDay) ??
      list[(targetDay - 1) % list.length];

    if (!row) {
      return result;
    }

    /* Маппинг DbDailyTask → Task с нормализацией what_doing и дефолтной наградой. */
    result.push({
      id: row.id,

      type,

      title: row.title,

      reward: row.reward ?? rewardForType(type),

      whatDoing: normalizeWhatDoing(row.what_doing),

      whyDoing: row.why_doing,
    });

    return result;
  }, []);
}

/*
 * ============================================================
 * STORE
 * ============================================================
 */

/*
 * Pinia-стор ежедневных задач (id: "tasks").
 * Хранит прогресс пользователя, задачи, энергию и streak;
 * персистит выбранные поля state через плагин persist.
 */
export const useTaskStore = defineStore("tasks", {
  /*
   * ============================================================
   * REACTIVE STATE
   * ============================================================
   */
  state: (): TaskState => ({
    /* Дата старта программы (ISO); "" — прогресс ещё не создан. */
    startDate: "",

    /* Выполненные задачи текущего дня: task_id → true. */
    completed: {},

    /* Запас энергии; стартовое значение 40, растёт от наград. */
    energy: 40,

    /* Серия дней подряд; стартовое значение 1. */
    streak: 1,

    /* Дата последнего визита YYYY-MM-DD; нужна updateStreak. */
    lastVisitDate: "",

    /* Сырые строки daily_tasks (с переводами) из getDailyTasks. */
    tasks: [],

    /* true — попытка loadTasks завершена (для условия показа списка). */
    tasksLoaded: false,

    /* true — идёт init; управляет спиннером на daily.vue. */
    loading: false,
  }),

  /*
   * ============================================================
   * GETTERS
   * ============================================================
   */
  getters: {
    /* Текущий номер дня программы: 1 = startDate; без startDate деградирует до 1. */
    dayIndex(state) {
      /* Прогресса ещё нет — считаем первый день, чтобы UI не падал. */
      if (!state.startDate) {
        return 1;
      }

      /* Иначе считаем по дате старта через taskEngine. */
      return getDayIndex(state.startDate);
    },

    /* true — сегодня воскресенье: на странице показывается rest-card, задачи скрыты. */
    isRestDay(): boolean {
      return isRestDayByDate(new Date());
    },

    /* Задачи для сегодняшнего дня (по dayIndex, с wrap по 30); в выходной — пустой массив. */
    todayTasks(): Task[] {
      /* День отдыха — список задач не формируется. */
      if (this.isRestDay) {
        return [];
      }

      /* Обычный день — отбираем по одной задаче на категорию. */
      return dbTasksForDay(this.tasks, this.dayIndex);
    },

    /* Сколько задач выполнено сегодня (для статистики/UI-счётчиков). */
    completedCount(state): number {
      return Object.values(state.completed).filter(Boolean).length;
    },
  },

  /*
   * ============================================================
   * ACTIONS
   * ============================================================
   */
  actions: {
    /*
     * Полная инициализация страницы daily: прогресс, задачи, выполненные, streak.
     * Вызывается в onMounted daily.vue.
     *
     * 1. Включаем флаг loading (спиннер).
     * 2. loadProgress — читает/создаёт строку user_progress.
     * 3. loadTasks — загружает задачи для текущей локали.
     * 4. loadCompletedTasks — восстанавливает completed для сегодняшнего дня.
     * 5. updateStreak — обновляет серию по разнице дат.
     * 6. Ошибки логируются и пробрасываются; finally гасит loading.
     */
    async init(locale = "ru") {
      /* Шаг 1: показать спиннер загрузки. */
      this.loading = true;

      try {
        /* Шаг 2: загрузить/создать прогресс пользователя. */
        await this.loadProgress();

        /* Шаг 3: загрузить задачи под текущий язык. */
        await this.loadTasks(locale);

        /* Шаг 4: восстановить отметки выполнения за сегодня. */
        await this.loadCompletedTasks();

        /* Шаг 5: пересчитать и сохранить streak. */
        await this.updateStreak();
      } catch (error) {
        /* Шаг 6: ошибку видно в консоли; пробрасываем, чтобы вызывающий код знал о сбое. */
        console.error("[DailyTasks] Ошибка инициализации:", error);

        throw error;
      } finally {
        /* В любом случае убираем спиннер. */
        this.loading = false;
      }
    },

    /*
     * Загружает (или перезагружает при смене локали) список задач.
     * Вызывается из init и из watch(locale) на daily.vue.
     *
     * 1. Сбрасываем tasksLoaded (идёт новая загрузка).
     * 2. Получаем задачи из сервиса и кладём в state.
     * 3. Ошибки логируем и пробрасываем; finally помечаем попытку завершённой.
     */
    async loadTasks(locale = "ru") {
      try {
        /* Шаг 1: сигнал «загрузка началась». */
        this.tasksLoaded = false;

        /* Шаг 2: запрос в Supabase через dailyTask.service. */
        this.tasks = await getDailyTasks(locale);
      } catch (error) {
        /* Шаг 3: лог и проброс — daily.vue ловит ошибку в watch. */
        console.error("[DailyTasks] Не удалось загрузить задачи:", error);

        throw error;
      } finally {
        /* Попытка завершена (успех или ошибка) — список можно считать «решённым». */
        this.tasksLoaded = true;
      }
    },

    /*
     * Загружает прогресс пользователя из user_progress; при первом визите создаёт строку.
     *
     * 1. Получаем Supabase-клиент и текущего пользователя.
     * 2. Без пользователя — ошибка авторизации.
     * 3. Читаем строку user_progress по user_id.
     * 4. Строки нет — создаём её со стартовыми значениями (energy 40, streak 1) и заполняем state.
     * 5. Строка есть — заполняем state из неё.
     */
    async loadProgress() {
      /* Шаг 1: клиент Supabase. */
      const supabase = useSupabaseClient();

      /* Текущий авторизованный пользователь — owner прогресса. */
      const {
        data: { user },
      } = await supabase.auth.getUser();

      /* Шаг 2: неавторизованный доступ к прогрессу невозможен. */
      if (!user) {
        throw new Error("Пользователь не авторизован");
      }

      /* Шаг 3: SELECT строки прогресса; maybeSingle — 0 строк не ошибка. */
      const { data, error } = await supabase
        .from("user_progress")
        .select(
          `
            id,
            user_id,
            start_date,
            energy,
            streak,
            last_visit_date
          `
        )
        .eq("user_id", user.id)
        .maybeSingle();

      /* Ошибка чтения — пробрасываем наверх. */
      if (error) {
        throw error;
      }

      /* Шаг 4: первое посещение — INSERT новой строки прогресса. */
      if (!data) {
        /* Текущий момент как start_date программы. */
        const startDate = new Date().toISOString();

        /* Вставка со стартовыми energy/streak и сегодняшним last_visit_date. */
        const { data: newProgress, error: insertError } = await supabase
          .from("user_progress")
          .insert({
            user_id: user.id,
            start_date: startDate,
            energy: 40,
            streak: 1,
            last_visit_date: new Date().toISOString().slice(0, 10),
          })
          .select()
          .single();

        /* Ошибка вставки — пробрасываем. */
        if (insertError) {
          throw insertError;
        }

        /* Переносим созданные значения в state и выходим. */
        this.startDate = newProgress.start_date;
        this.energy = newProgress.energy;
        this.streak = newProgress.streak;
        this.lastVisitDate = newProgress.last_visit_date;

        return;
      }

      /* Шаг 5: существующий прогресс — читаем поля (числа приводим к number). */
      this.startDate = data.start_date;
      this.energy = Number(data.energy);
      this.streak = Number(data.streak);
      this.lastVisitDate = data.last_visit_date || "";
    },

    /*
     * Восстанавливает отметки выполненных задач за текущий dayIndex.
     *
     * 1. Получаем Supabase-клиент и пользователя.
     * 2. Без пользователя — ошибка авторизации.
     * 3. Читаем daily_task_completions, отфильтрованные по user_id и day_index.
     * 4. Ошибки чтения — пробрасываем.
     * 5. Сбрасываем completed и помечаем каждую полученную task_id как true.
     */
    async loadCompletedTasks() {
      /* Шаг 1: клиент Supabase. */
      const supabase = useSupabaseClient();

      /* Текущий пользователь — владелец строк completions. */
      const {
        data: { user },
      } = await supabase.auth.getUser();

      /* Шаг 2: без auth читать completions нельзя. */
      if (!user) {
        throw new Error("Пользователь не авторизован");
      }

      /* Шаг 3: SELECT только за сегодняшний день программы. */
      const { data, error } = await supabase
        .from("daily_task_completions")
        .select(
          `
            task_id,
            day_index
          `
        )
        .eq("user_id", user.id)
        .eq("day_index", this.dayIndex);

      /* Шаг 4: ошибка чтения уронит инициализацию. */
      if (error) {
        throw error;
      }

      /* Шаг 5: чистим старую карту (важно при смене дня/локали). */
      this.completed = {};

      /* Каждая строка — выполненная задача текущего дня. */
      for (const row of data ?? []) {
        this.completed[row.task_id] = true;
      }
    },

    /*
     * Обновляет серию посещений (streak) по разнице с last_visit_date.
     *
     * 1. Получаем Supabase-клиент и пользователя; без него — тихий выход.
     * 2. Формируем сегодняшнюю дату YYYY-MM-DD.
     * 3. Нет прошлого визита — streak = 1.
     * 4. Разница 1 день — streak += 1; больше 1 — сброс в 1; 0 — без изменений.
     * 5. Фиксируем lastVisitDate = сегодня и персистим streak в user_progress.
     * 6. Ошибку обновления пробрасываем.
     */
    async updateStreak() {
      /* Шаг 1: клиент Supabase. */
      const supabase = useSupabaseClient();

      /* Пользователь для адресного UPDATE по user_id. */
      const {
        data: { user },
      } = await supabase.auth.getUser();

      /* Неавторизован — streak не обновляем, но не роняем init. */
      if (!user) {
        return;
      }

      /* Шаг 2: ключ сегодняшней даты. */
      const today = new Date().toISOString().slice(0, 10);

      /* Шаг 3: первый визит — серия стартует с 1. */
      if (!this.lastVisitDate) {
        this.streak = 1;
      } else {
        /* Разница в днях между последним и текущим визитом. */
        const lastVisit = new Date(this.lastVisitDate);
        const currentDate = new Date(today);

        /* Шаг 4: целое число суток между датами (без времени). */
        const diffDays = Math.floor(
          (currentDate.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
        );

        /* Вчера — серия продолжается. */
        if (diffDays === 1) {
          this.streak++;
        } else if (diffDays > 1) {
          /* Пропустили день — серия обнуляется. */
          this.streak = 1;
        }
        /* diffDays === 0 — повторный визит сегодня, streak не трогаем. */
      }

      /* Шаг 5: сегодняшняя дата становится точкой отсчёта для следующего визита. */
      this.lastVisitDate = today;

      /* Персистим streak и дату визита в user_progress. */
      const { error } = await supabase
        .from("user_progress")
        .update({
          streak: this.streak,
          last_visit_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      /* Шаг 6: ошибка записи пробрасывается вызывающему коду. */
      if (error) {
        throw error;
      }
    },

    /*
     * Помечает задачу выполненной и начисляет энергию.
     *
     * 1. Уже выполнена — выходим без побочных эффектов (защита от двойного клика).
     * 2. Получаем Supabase-клиент и пользователя.
     * 3. Вычисляем новую энергию = текущая + награда.
     * 4. INSERT в daily_task_completions за текущий dayIndex.
     * 5. Конфликт 23505 (дубликат) — задача уже записана, ставим completed и выходим.
     * 6. Другая ошибка вставки — пробрасываем.
     * 7. Локально отмечаем задачу и фиксируем новую энергию.
     * 8. UPDATE energy в user_progress; ошибку пробрасываем.
     */
    async completeTask(task: Task) {
      /* Шаг 1: повторное выполнение невозможно. */
      if (this.completed[task.id]) {
        return;
      }

      /* Шаг 2: клиент и пользователь для insert/update. */
      const supabase = useSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      /* Без авторизации записать выполнение нельзя. */
      if (!user) {
        throw new Error("Пользователь не авторизован");
      }

      /* Шаг 3: предварительный расчёт награды (до записи, чтобы UI мгновенно реагировал). */
      const newEnergy = this.energy + task.reward;

      /* Шаг 4: запись факта выполнения (уникальность — user_id + task_id + day_index). */
      const { error: completionError } = await supabase
        .from("daily_task_completions")
        .insert({
          user_id: user.id,
          task_id: task.id,
          day_index: this.dayIndex,
          completed_at: new Date().toISOString(),
        });

      /* Шаг 5/6: ветка обработки ошибок вставки. */
      if (completionError) {
        /* 23505 = unique_violation: запись уже есть — считаем задачу выполненной. */
        if (completionError.code === "23505") {
          this.completed[task.id] = true;
          return;
        }

        /* Любая другая ошибка — пробрасываем. */
        throw completionError;
      }

      /* Шаг 7: локальное состояние — задача выполнена, энергия начислена. */
      this.completed[task.id] = true;
      this.energy = newEnergy;

      /* Шаг 8: персистим новую энергию в user_progress. */
      const { error: progressError } = await supabase
        .from("user_progress")
        .update({
          energy: this.energy,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      /* Ошибка записи энергии — пробрасываем. */
      if (progressError) {
        throw progressError;
      }
    },

    /*
     * Начисляет произвольное количество энергии (например, за чек-ин).
     *
     * 1. Получаем Supabase-клиент и пользователя.
     * 2. Считаем новую энергию.
     * 3. UPDATE в user_progress; ошибку логируем и пробрасываем.
     * 4. Успех — фиксируем энергию в state.
     */
    async addEnergy(amount: number) {
      /* Шаг 1: клиент и пользователь. */
      const supabase = useSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      /* Без авторизации начисление невозможно. */
      if (!user) {
        throw new Error("Пользователь не авторизован");
      }

      /* Шаг 2: прибавляем amount к текущему запасу. */
      const newEnergy = this.energy + amount;

      /* Шаг 3: запись в БД. */
      const { error } = await supabase
        .from("user_progress")
        .update({
          energy: newEnergy,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      /* Ошибка — логируем и пробрасываем, state не меняем. */
      if (error) {
        console.error("[DailyTasks] Ошибка обновления энергии:", error);

        throw error;
      }

      /* Шаг 4: БД подтвердила — обновляем локальный state. */
      this.energy = newEnergy;
    },

    /*
     * Проверка «задача выполнена» для текущего дня.
     * true — кнопка на карточке блокируется и показывает «Выполнено».
     */
    isDone(id: string) {
      return !!this.completed[id];
    },
  },

  /*
   * ============================================================
   * PERSIST
   * ============================================================
   */
  persist: {
    /* Переживают перезагрузку только данные прогресса; tasks и флаги — нет. */
    pick: ["startDate", "completed", "energy", "streak", "lastVisitDate"],
  },
});
