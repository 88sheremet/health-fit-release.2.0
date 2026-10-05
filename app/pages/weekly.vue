<template>  <!--
    Страница еженедельного задания: номер недели, день недели
    и карточка текущей задачи с кнопкой выполнения (weekly, не daily).
  -->
  <div class="page">
    <!--
      Шапка: заголовок, номер текущей недели и день внутри недели.
      Значения берутся из стора weeklyTasks (currentWeek / текущий день).
    -->
    <div class="header">
      <div class="title">{{ $t("weekly.title") }}</div>

      <div class="subtitle">
        {{ $t("weekly.week", { n: store.currentWeek }) }}
      </div>

      <div class="week-day">
        {{ $t("weekly.dayOfWeek", { n: store.currentDayWithinWeek }) }}
      </div>
    </div>

    <!--
      Карточка текущей задачи: бейдж, название, «что делать» и «зачем».
      Данные — из getter currentTask (локальная модель WeeklyTask).
    -->
    <q-card class="task-card">
      <div class="badge">
        {{ $t("weekly.badge") }}
      </div>

      <div class="task-title">
        {{ store.currentTask.nameProgram }}
      </div>

      <div class="section">
        <div class="section-title">
          {{ $t("weekly.whatToDo") }}
        </div>

        <div class="text">
          {{ store.currentTask.whatDoing }}
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          {{ $t("weekly.whyNeeded") }}
        </div>

        <div class="text">
          {{ store.currentTask.whyDoing }}
        </div>
      </div>

      <!--
        Кнопка «Выполнено»: видна, пока задание не выполнено;
        дизейблится вне окна 6–7 дней недели (store.canComplete).
      -->
      <q-btn
        v-if="!store.isCompleted()"
        color="primary"
        unelevated
        no-caps
        class="complete-btn"
        :label="$t('weekly.completedBtn')"
        :disable="!store.canComplete"
        @click="completeWeeklyTask"
      />

      <!--
        Подсказка: окно выполнения ещё не открыто (не 6–7 день).
      -->
      <div v-if="!store.canComplete && !store.isCompleted()" class="week-info">
        {{ $t("weekly.info") }}
      </div>

      <!--
        Успешный баннер: задание текущей недели уже выполнено.
      -->
      <div v-else-if="store.isCompleted()" class="success-banner">
        {{ $t("weekly.successBanner") }}
      </div>
    </q-card>

    <!--
      Нижняя навигация приложения (централизованные маршруты routes.*).
    -->
    <BottomNavigation />
  </div>
</template>

<script setup lang="ts">
/*
 * ============================================================
 * IMPORTS
 * ============================================================
 */

/*
 * Vue-i18n composition API: реактивная локаль интерфейса и
 * функция перевода $t (строки секции weekly.* в словаре).
 */
import { useI18n } from "vue-i18n";

/*
 * Стор еженедельных задач: задачи с переводами, выполненные недели,
 * computed-пары currentWeek / currentDayWithinWeek / currentTask.
 */
import { useWeeklyTaskStore } from "~/stores/weeklyTasks";

/*
 * ============================================================
 * PAGE META
 * ============================================================
 */

/*
 * Метатаданные маршрута: страница закрыта auth-middleware
 * и использует layout authenticated.
 */
definePageMeta({
  middleware: "auth",
  layout: "authenticated",
});

/*
 * ============================================================
 * DEPENDENCIES
 * ============================================================
 */

/* Текущая локаль i18n — язык еженедельных задач (locale-зависимость). */
const { locale } = useI18n();

/* Инстанс стора еженедельных активностей для шаблона и действий. */
const store = useWeeklyTaskStore();

/*
 * ============================================================
 * LOAD WEEKLY TASKS FLOW
 * ============================================================
 */

/*
 * Первичная инициализация: параллельно грузятся задачи (с переводами
 * под локаль) и выполненные недели пользователя.
 */
await store.init(locale.value);

/*
 * Смена локали → перезагрузка задач с новым переводом.
 * Выполнения (completed) не зависят от языка − перечитывать их не нужно.
 */
watch(locale, async (newLocale) => {
  await store.loadTasks(newLocale);
});

/*
 * ============================================================
 * COMPLETE WEEKLY TASK FLOW
 * ============================================================
 */

/*
 * Обработчик кнопки «Выполнено».
 *
 * Поток:
 *   1. Проверка разрешения (store.canComplete — 6–7 день недели).
 *   2. Сохранение выполнения в БД + начисление энергии (стор).
 */
async function completeWeeklyTask() {
  /* Вне окна выполнения — выходим (доп. защита к дизейблу кнопки). */
  if (!store.canComplete) {
    return;
  }

  /* Отметка текущей недели выполненной и награда энергией. */
  await store.completeCurrentTask();
}
</script>

<style scoped>
.page {
  padding: 20px;
  padding-bottom: 100px;
  background: var(--bg-gradient-main);
  min-height: 100vh;
}
.header {
  margin-bottom: 20px;
}
.title {
  font-size: 30px;
  font-weight: 700;
}
.subtitle {
  color: var(--grey);
  margin-top: 4px;
}
.task-card {
  border-radius: 24px;
  padding: 24px;
}
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--green-bg);
  color: var(--green-deep);
  padding: 8px 14px;
  border-radius: 999px;
  font-weight: 600;
  margin-bottom: 20px;
}
.task-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 24px;
}
.section {
  margin-bottom: 24px;
}
.section-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 10px;
}
.text {
  line-height: 1.7;
  color: var(--grey-dark);
  white-space: pre-line;
}
.complete-btn {
  width: 100%;
  height: 54px;
  border-radius: 16px;
}
.success-banner {
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--green-bg);
  color: var(--green-deep);
  text-align: center;
  font-weight: 600;
}
.week-day {
  margin-top: 6px;
  font-size: 14px;
  color: var(--green);
}
.week-info {
  margin-top: 12px;
  text-align: center;
  font-size: 14px;
  color: var(--grey);
}
</style>
