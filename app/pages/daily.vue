<template>  <!--
    Основной контейнер страницы ежедневных задач.
    Включает шапку, карточку энергии, список задач/отдыха и диалоги.
  -->
  <div class="page">
    <!--
      Шапка страницы: приветствие, номер дня и бейдж серии (streak).
    -->
    <div class="header">
      <div>
        <!-- Название дня по локали i18n (daily.greeting). -->
        <div class="title">
          {{ $t("daily.greeting") }}
        </div>

        <!-- Номер текущего дня программы из геттера dayIndex стора tasks. -->
        <div class="subtitle">
          {{ $t("daily.day", { n: store.dayIndex }) }}
        </div>
      </div>

      <!--
        Круглый бейдж с количеством дней подряд (streak).
        Значение приходит из стора и обновляется при инициализации.
      -->
      <div class="streak-avatar">
        {{ store.streak }}
      </div>
    </div>

    <!--
      Карточка текущего запаса энергии.
      Числовое значение + круговой прогресс до максимума 1000.
    -->
    <q-card class="energy-card">
      <div class="energy-row">
        <div>
          <div class="label">
            {{ $t("daily.energy") }}
          </div>

          <!-- Текущая энергия и эмодзи-индикатор. -->
          <div class="value">{{ store.energy }} ⚡</div>
        </div>

        <!-- Кольцевой индикатор энергии: value от 0 до max=1000. -->
        <q-circular-progress
          :value="store.energy"
          :max="1000"
          size="60px"
          color="primary"
          track-color="grey-4"
          :thickness="0.1"
        />
      </div>
    </q-card>

    <!--
      Карточка дня отдыха. Показывается только в воскресенье
      (геттер isRestDay); список задач в этот день скрыт.
    -->
    <div v-if="store.isRestDay" class="rest-card">
      <div class="emoji">🌿</div>

      <div class="rest-title">
        {{ $t("daily.restTitle") }}
      </div>

      <div class="rest-text">
        {{ $t("daily.restText") }}
      </div>
    </div>

    <!-- Спиннер: обычный день, но стор ещё загружает данные (loading = true). -->
    <div v-else-if="store.loading" class="flex justify-center q-pa-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <!--
      Список задач дня: обычный день и загрузка завершена.
      Одна карточка на каждую задачу из геттера todayTasks.
    -->
    <div v-else class="tasks">
      <!-- Карточка задачи: клик по карточке или иконке открывает детали. -->
      <q-card
        v-for="task in tasks"
        :key="task.id"
        class="task-card"
        @click="openTask(task)"
      >
        <div class="task-header">
          <!-- Название задачи (уже локализовано сервисом). -->
          <div class="task-title">
            {{ task.title }}
          </div>

          <!--
            Иконка-подсказка: открывает диалог деталей.
            stop — чтобы не дублировать клик по всей карточке.
          -->
          <button class="icon-popup" @click.stop="openTask(task)">
            <img :src="click" class="click-icon" />
          </button>
        </div>

        <div class="task-footer">
          <!-- Награда за выполнение (task.reward) в тексте из i18n. -->
          <div class="reward">
            {{
              $t("daily.reward", {
                n: task.reward,
              })
            }}
          </div>

          <!--
            Кнопка выполнения: «Выполнено» и disabled, если задача уже
            сделана (isDone), иначе «Выполнить» с начислением награды.
          -->
          <q-btn
            class="select-btn"
            dense
            no-caps
            unelevated
            color="primary"
            text-color="white"
            :label="
              store.isDone(task.id) ? $t('daily.done') : $t('daily.complete')
            "
            :disable="store.isDone(task.id)"
            @click.stop="store.completeTask(task)"
          />
        </div>
      </q-card>
    </div>

    <!-- Диалог деталей задачи: управляет showDialog, получает selectedTask. -->
    <TaskDetailsDialog v-model="showDialog" :task="selectedTask" />

    <!-- Диалог чек-ина дневника: управляется стором journal. -->
    <CheckInDialog
      v-model="journalStore.showCheckin"
      @save="journalStore.saveCheckin"
    />

    <!-- Нижняя навигация аутентифицированного layout. -->
    <BottomNavigation />
  </div>
</template>

<script setup lang="ts">
/*
 * ============================================================
 * IMPORTS
 * ============================================================
 */

/* Реактивные примитивы Vue: вычисляемое, хуки жизненного цикла, ссылки. */
import { computed, onMounted, ref, watch } from "vue";

/* Текущая локаль интерфейса — для перезагрузки задач при смене языка. */
import { useI18n } from "vue-i18n";

/* Стор ежедневных задач (id "tasks"): задачи, энергия, streak, прогресс. */
import { useTaskStore } from "~/stores/dailyTasks";

/* Стор дневника: показ/сохранение чек-ина на этой же странице. */
import { useJournalStore } from "~/stores/journal";

/* Тип доменной задачи для selectedTask и openTask. */
import type { Task } from "~/interfaces/Task.interface";

/* Иконка-подсказка (PNG) на карточке задачи. */
import click from "~/assets/click.png";

/*
 * ============================================================
 * PAGE META
 * ============================================================
 */

/*
 * Метаданные страницы: доступ только для авторизованных
 * (middleware auth) и layout с нижней навигацией.
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

/* Стор задач — источник данных страницы (dayIndex, energy, streak и т.д.). */
const store = useTaskStore();

/* Стор дневника — владеет видимостью и сохранением чек-ина. */
const journalStore = useJournalStore();

/* Реактивная локаль vue-i18n; отслеживается в watch ниже. */
const { locale } = useI18n();

/*
 * ============================================================
 * REACTIVE STATE
 * ============================================================
 */

/* Список задач сегодня из геттера todayTasks (пусто в выходной). */
const tasks = computed(() => store.todayTasks);

/* Задача, выбранная для показа в диалоге деталей; null — диалог закрыт. */
const selectedTask = ref<Task | null>(null);

/* Видимость TaskDetailsDialog: true — диалог открыт. */
const showDialog = ref(false);

/*
 * ============================================================
 * METHODS
 * ============================================================
 */

/*
 * Открывает диалог деталей для выбранной задачи.
 *
 * 1. Кладём задачу в selectedTask.
 * 2. Переключаем флаг видимости диалога.
 */
function openTask(task: Task) {
  /* Запоминаем, какую задачу показывать. */
  selectedTask.value = task;

  /* Открываем диалог. */
  showDialog.value = true;
}

/*
 * ============================================================
 * LIFECYCLE
 * ============================================================
 */

/*
 * При монтировании страницы инициализируем оба стора.
 *
 * 1. store.init — прогресс, задачи, выполненные, streak (с учётом локали).
 * 2. journalStore.init — состояние дневника для чек-ина.
 */
onMounted(async () => {
  await store.init(locale.value);
  await journalStore.init();
});

/*
 * ============================================================
 * WATCH LOCALE FLOW
 * ============================================================
 */

/*
 * При смене языка интерфейса перезагружаем задачи на новой локали.
 *
 * 1. Если локаль не изменилась — выходим.
 * 2. Повторно вызываем loadTasks с новым кодом языка.
 * 3. Ошибки загрузки логируем, не роняя страницу.
 */
watch(
  locale,
  async (newLocale, oldLocale) => {
    /* Язык остался прежним — перезагрузка не нужна. */
    if (newLocale === oldLocale) {
      return;
    }

    try {
      /* Запрашиваем задачи на новой локали (мерж перевотов в сервисе). */
      await store.loadTasks(newLocale);
    } catch (error) {
      console.error("[Daily] Ошибка загрузки задач после смены языка:", error);
    }
  },
  {
    immediate: false,
  }
);
</script>

<style scoped>
.page {
  padding: 24px;
  padding-bottom: 100px;
  background: var(--bg-gradient-main);
  width: 100%;
  min-height: 100vh;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-size: 28px;
  font-weight: 700;
}
.subtitle {
  color: var(--grey);
}
.streak-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--green);
  color: var(--white);
  font-weight: 700;
  font-size: 14px;
}
.energy-card {
  margin-top: 20px;
  padding: 20px;
  border-radius: 20px;
  background: var(--white);
}
.energy-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.value {
  font-size: 22px;
  font-weight: 700;
}
.tasks {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.task-card {
  padding: 16px;
  border-radius: 18px;
  background: var(--white);
  transition: 0.2s;
  cursor: pointer;
}
.task-card.done {
  opacity: 0.6;
  transform: scale(0.98);
}
.task-title {
  font-weight: 600;
  margin-bottom: 10px;
  margin-right: 10px;
}
.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.task-footer .q-btn {
  border-radius: 14px;
}
.reward {
  font-size: 13px;
  color: var(--green);
}
.rest-card {
  margin-top: 30px;
  text-align: center;
  padding: 30px;
  border-radius: 24px;
  background: var(--white);
}
.emoji {
  font-size: 40px;
}
.rest-title {
  font-size: 20px;
  font-weight: 700;
  margin-top: 10px;
}
.rest-text {
  color: var(--grey);
}
.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.click-icon {
  width: 28px;
  height: 30px;
  object-fit: contain;
}
.select-btn {
  padding-left: 10px;
  padding-right: 10px;
}
.icon-popup {
  margin-bottom: 10px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}
</style>
