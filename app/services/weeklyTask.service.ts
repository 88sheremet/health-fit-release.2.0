/*
 * ============================================================
 * IMPORTS
 * ============================================================
 */

/*
 * Тип строки таблицы weekly_tasks — базовая задача недели.
 * Используется в возвращаемом типе getWeeklyTasks.
 */
import type { DbWeeklyTask } from "~/interfaces/DbWeeklyTask.interface";

/*
 * Тип строки таблицы weekly_task_translations — переводы задач
 * под конкретную локаль (weekly activities localization).
 */
import type { DbWeeklyTaskTranslation } from "~/interfaces/DbWeeklyTaskTranslation.interface";

/*
 * ============================================================
 * GET WEEKLY TASKS FLOW
 * ============================================================
 */

/*
 * Загружает еженедельные задачи и их локализацию из Supabase.
 *
 * Поток:
 *   1. Читает все строки weekly_tasks, упорядоченные по week.
 *   2. Собирает id задач и запрашивает переводы из
 *      weekly_task_translations, отфильтрованные по locale.
 *   3. Склеивает перевод с базовой задачей (перевод перекрывает поля);
 *      при отсутствии перевода возвращает оригинальную строку.
 *
 * Используется в сторе weeklyTasks.loadTasks; locale берётся из i18n
 * страницы pages/weekly.vue (перезагрузка при смене языка).
 */
export async function getWeeklyTasks(locale = "ru"): Promise<DbWeeklyTask[]> {
  /* Клиент Supabase (автоимпорт Nuxt). */
  const supabase = useSupabaseClient();

  /* 1. Все задачи недели в порядке возрастания week. */
  const { data: tasks, error: tasksError } = await supabase
    .from("weekly_tasks")
    .select("*")
    .order("week", { ascending: true });

  if (tasksError) {
    console.error("[WeeklyTasks] Ошибка загрузки weekly_tasks:", tasksError);

    throw tasksError;
  }

  /* Таблица пуста — задач для отображения нет. */
  if (!tasks?.length) {
    return [];
  }

  /* 2a. Id задач — фильтр для запроса переводов. */
  const taskIds = tasks.map((task) => task.id);

  /* 2б. Локализованные поля для текущей локали выбранных задач. */
  const { data: translations, error: translationsError } = await supabase
    .from("weekly_task_translations")
    .select("id, weekly_task_id, locale, title, what_doing, why_doing")
    .in("weekly_task_id", taskIds)
    .eq("locale", locale);

  if (translationsError) {
    console.error(
      "[WeeklyTasks] Ошибка загрузки weekly_task_translations:",
      translationsError
    );

    throw translationsError;
  }

  /* Индекс переводов по weekly_task_id — быстрый доступ при склейке. */
  const translationsByTaskId = new Map<string, DbWeeklyTaskTranslation>();

  for (const translation of translations ?? []) {
    translationsByTaskId.set(translation.weekly_task_id, translation);
  }

  /* 3. На каждую задачу: наложить перевод или вернуть оригинал (fallback). */
  return tasks.map((task) => {
    const translation = translationsByTaskId.get(task.id);

    if (!translation) {
      return task;
    }

    return {
      ...task,
      title: translation.title,
      what_doing: translation.what_doing,
      why_doing: translation.why_doing,
    };
  });
}

/*
 * ============================================================
 * LOAD COMPLETIONS FLOW
 * ============================================================
 */

/*
 * Загружает номера недель, уже выполненных пользователем.
 *
 * Поток:
 *   1. Берёт текущего пользователя из сессии Supabase.
 *   2. Читает строки weekly_task_completions по user_id.
 *   3. Отдаёт массив значений колонки week.
 *
 * Используется в сторе weeklyTasks.loadCompletions
 * для построения карты completed (ключ — номер недели).
 */
export async function getWeeklyCompletions(): Promise<number[]> {
  const supabase = useSupabaseClient();

  /* 1. Авторизованный пользователь (без него выполнения не читаем). */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /* Гость не может иметь выполнений. */
  if (!user) {
    return [];
  }

  /* 2. Выполненные недели текущего пользователя. */
  const { data, error } = await supabase
    .from("weekly_task_completions")
    .select("week")
    .eq("user_id", user.id);

  if (error) {
    console.error(
      "[WeeklyTasks] Ошибка загрузки weekly_task_completions:",
      error
    );

    throw error;
  }

  /* 3. Массив номеров недель → ключи карты completed в сторе. */
  return (data ?? []).map((item) => item.week);
}

/*
 * ============================================================
 * COMPLETE WEEKLY TASK FLOW
 * ============================================================
 */

/*
 * Сохраняет выполнение еженедельного задания в БД.
 *
 * Поток:
 *   1. Берёт текущего пользователя (без него — исключение).
 *   2. INSERT в weekly_task_completions: user_id, weekly_task_id, week.
 *   3. Возвращает сохранённую строку.
 *
 * Вызывается из стора weeklyTasks.completeCurrentTask;
 * для persist в БД используется выбранная задача currentTask и
 * вычисленный номер недели currentWeek.
 */
export async function completeWeeklyTask(weeklyTaskId: string, week: number) {
  const supabase = useSupabaseClient();

  /* 1. Авторизованный пользователь — обязателен для записи. */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Пользователь не авторизован");
  }

  /* 2. Запись выполнения: задача + номер недели за пользователем. */
  const { data, error } = await supabase
    .from("weekly_task_completions")
    .insert({
      user_id: user.id,
      weekly_task_id: weeklyTaskId,
      week,
    })
    .select()
    .single();

  if (error) {
    console.error("[WeeklyTasks] Ошибка сохранения weekly completion:", error);

    throw error;
  }

  /* 3. Сохранённая строка выполнения. */
  return data;
}
