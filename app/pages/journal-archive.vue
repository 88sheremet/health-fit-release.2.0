<template>  <!--
    Архив записей журнала: все чек-ины и заметки пользователя,
    отсортированные от новых к старым, с состояниями загрузки
    и пустого списка.
  -->
  <div class="archive-page">
    <!--
      Шапка: кнопка возврата в журнал (routes.recovery.journal)
      и заголовок раздела из i18n (journal.archive.header).
    -->
    <div class="header">
      <button class="back-btn" @click="navigateTo(routes.recovery.journal)">
        <span class="material-icons">arrow_back</span>
      </button>

      <!-- Заголовок страницы архива (текст зависит от локали). -->
      <div class="title">
        {{ $t("journal.archive.header") }}
      </div>
    </div>

    <!--
      Состояние загрузки: спиннер, пока onMounted
      выполняет loadEntries().
    -->
    <div v-if="loading" class="loading-state">
      <q-spinner color="primary" size="40px" />
    </div>

    <!--
      Пустой архив: записей нет — заголовок и подсказка
      из i18n (journal.archive.empty*).
    -->
    <div v-else-if="!entries.length" class="empty-state">
      <div class="empty-icon">📔</div>

      <div class="empty-title">
        {{ $t("journal.archive.emptyTitle") }}
      </div>

      <div class="empty-text">
        {{ $t("journal.archive.emptyText") }}
      </div>
    </div>

    <!--
      Список записей: карточка на каждую entry (после
      разворота computed entries). Сверху — свежие записи.
    -->
    <q-card
      v-else
      v-for="entry in entries"
      :key="entry.id"
      flat
      class="entry-card"
    >
      <!-- Верх карточки: локализованная дата и эмодзи
           настроения, если у записи есть mood. -->
      <div class="entry-header">
        <div class="entry-date">
          {{ formatDate(entry.date) }}
        </div>

        <!-- Эмодзи по шкале настроения; видно только
             у чек-инов, у заметок mood отсутствует. -->
        <div v-if="entry.mood" class="entry-mood">
          {{ getMoodEmoji(entry.mood) }}
        </div>
      </div>

      <!-- Текст записи: заметка или комментарий к чек-ину. -->
      <div v-if="entry.note" class="entry-note">
        {{ entry.note }}
      </div>
    </q-card>
  </div>
</template>

<script setup lang="ts">
/*
 * ============================================================
 * IMPORTS
 * ============================================================
 */

/* computed, onMounted, ref — список, загрузка и флаг
   спиннера архива. */
import { computed, onMounted, ref } from "vue";

/* Стор журнала — источник записей и загрузка из Supabase. */
import { useJournalStore } from "~/stores/journal";

/* Централизованные маршруты: кнопка «назад» в журнал. */
import { routes } from "~/router/routes";

/* Эмодзи настроения 1..5 для карточек записей. */
import { moodEmojis } from "~/constants/moods";

/*
 * ============================================================
 * PAGE META
 * ============================================================
 */

/* Layout с навигацией и защита маршрута middleware'ом auth. */
definePageMeta({
  layout: "authenticated",
  middleware: "auth",
});

/*
 * ============================================================
 * DEPENDENCIES
 * ============================================================
 */

/* Стор — общее состояние записей журнала. */
const store = useJournalStore();

/* Текущая локаль i18n: форматирование даты под язык
   интерфейса пользователя. */
const { locale } = useI18n();

/*
 * ============================================================
 * REACTIVE STATE
 * ============================================================
 */

/* Пока true — вместо списка показывается спиннер. */
const loading = ref(true);

/*
 * ============================================================
 * COMPUTED
 * ============================================================
 */

/* Копия entries из стора, разёрнутая в обратном порядке:
   в сторе порядок по date ↑, здесь — новые записи сверху.
   Не мутирует исходный массив стора. */
const entries = computed(() => [...store.entries].reverse());

/*
 * ============================================================
 * METHODS
 * ============================================================
 */

/*
 * Возвращает эмодзи для числового настроения;
 * при неизвестном значении — нейтральное «спокойное».
 */
function getMoodEmoji(mood: number) {
  return moodEmojis[mood] || "😐";
}

/*
 * Форматирует дату long-форматом текущей локали
 * (день, месяц словом, год). Вид строки зависит
 * от языка интерфейса (locale из useI18n).
 */
function formatDate(date: string) {
  return new Date(date).toLocaleDateString(locale.value, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/*
 * ============================================================
 * LOAD ENTRIES FLOW
 * ============================================================
 */

/*
 * При монтировании страницы:
 * 1. Запрашивает записи из Supabase через стор.
 * 2. Ошибку пишет в консоль (список останется пустым).
 * 3. В finally снимает loading — UI переключается
 *    на список или пустое состояние.
 */
onMounted(async () => {
  try {
    await store.loadEntries();
  } catch (error) {
    console.error("[Journal Archive] Ошибка загрузки:", error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.archive-page {
  min-height: 100vh;
  padding: 24px;
  background: var(--bg-gradient-main);
}
.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}
.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--white);
  border: 1px solid var(--border-default);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--black1);
  transition: background 0.2s, border-color 0.2s;
  flex-shrink: 0;
}
.back-btn:hover {
  background: var(--grey-hover);
  border-color: var(--green);
}
.title {
  font-size: 28px;
  font-weight: 700;
  color: var(--black1);
}
.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
.entry-card {
  padding: 20px;
  margin-bottom: 16px;
  border-radius: 24px;
  background: var(--white);
  box-shadow: 0 10px 25px var(--shadow-md);
}
.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.entry-date {
  font-size: 15px;
  font-weight: 600;
  color: var(--grey);
}
.entry-mood {
  font-size: 34px;
}
.entry-note {
  font-size: 16px;
  line-height: 1.7;
  color: var(--black1);
}
.empty-state {
  margin-top: 80px;
  text-align: center;
}
.empty-icon {
  font-size: 72px;
}
.empty-title {
  margin-top: 20px;
  font-size: 24px;
  font-weight: 700;
}
.empty-text {
  margin-top: 10px;
  color: var(--grey);
  line-height: 1.6;
}
.back-btn > .material-icons {
  font-size: 27px;
}
</style>
