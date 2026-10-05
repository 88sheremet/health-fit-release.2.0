/*
 * ============================================================
 * IMPORTS
 * ============================================================
 */

/* Базовая строка задачи из таблицы daily_tasks (до подстановки перевода). */
import type { DbDailyTask } from "~/interfaces/DbDailyTask.interface";

/* Строка локализации из daily_task_translations для мержа поверх базовой. */
import type { DbDailyTaskTranslation } from "~/interfaces/DbDailyTaskTranslation.interface";

/*
 * ============================================================
 * FUNCTIONS
 * ============================================================
 */

/*
 * Загружает все задачи программы для указанной локали.
 * Используется в stores/dailyTasks.ts (action loadTasks).
 *
 * 1. Получаем Supabase-клиент.
 * 2. Читаем все строки daily_tasks, упорядоченные по day.
 * 3. Если таблица пуста — возвращаем [].
 * 4. Загружаем переводы из daily_task_translations для этих id и локали.
 * 5. Строим Map task_id → перевод.
 * 6. Мержим: при наличии перевода подставляем title/what_doing/why_doing,
 *    иначе оставляем базовую строку без изменений.
 */
export async function getDailyTasks(locale = "ru"): Promise<DbDailyTask[]> {
  /* Supabase-клиент для чтения таблиц задач и переводов. */
  const supabase = useSupabaseClient();

  /* Шаг 2: чтение базового справочника daily_tasks по возрастанию дня. */
  const { data: tasks, error: tasksError } = await supabase
    .from("daily_tasks")
    .select("*")
    .order("day", { ascending: true });

  /* Ошибка чтения — логируем и пробрасываем наверх (init уронит загрузку). */
  if (tasksError) {
    console.error("[DailyTasks] Ошибка загрузки daily_tasks:", tasksError);

    throw tasksError;
  }

  /* Шаг 3: пустая таблица — возвращаем пустой список, дальнейшие запросы не нужны. */
  if (!tasks?.length) {
    return [];
  }

  /* Идентификаторы задач для фильтрации переводов через .in(...). */
  const taskIds = tasks.map((task) => task.id);

  /* Шаг 4: чтение переводов только для нужной локали и только для загруженных id. */
  const { data: translations, error: translationsError } = await supabase
    .from("daily_task_translations")
    .select(
      `
      task_id,
      locale,
      title,
      what_doing,
      why_doing
    `
    )
    .in("task_id", taskIds)
    .eq("locale", locale);

  /* Ошибка переводов — логируем и пробрасываем; без них работать корректно нельзя. */
  if (translationsError) {
    console.error("[DailyTasks] Ошибка загрузки переводов:", translationsError);

    throw translationsError;
  }

  /* Шаг 5: Map для O(1) поиска перевода по task_id при мерже. */
  const translationMap = new Map<string, DbDailyTaskTranslation>();

  /* Индексируем каждую полученную строку перевода. */
  for (const translation of translations ?? []) {
    translationMap.set(translation.task_id, translation);
  }

  /* Шаг 6: мерж базовых строк с переводами. */
  return tasks.map((task) => {
    /* Перевода для этой задачи нет — фолбэк на базовую строку. */
    const translation = translationMap.get(task.id);

    if (!translation) {
      return task;
    }

    /* Перевод есть — перекрываем текстовые поля, id/type/day/reward остаются базовыми. */
    return {
      ...task,
      title: translation.title,
      what_doing: translation.what_doing,
      why_doing: translation.why_doing,
    };
  });
}
