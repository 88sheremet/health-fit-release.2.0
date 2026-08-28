<template>
  <div class="archive-page">
    <div class="header">
      <button class="back-btn" @click="navigateTo(routes.recovery.journal)">
        <span class="material-icons">arrow_back</span>
      </button>

      <div class="title">
        {{ $t("journal.archive.header") }}
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <q-spinner color="primary" size="40px" />
    </div>

    <!-- Empty -->
    <div v-else-if="!entries.length" class="empty-state">
      <div class="empty-icon">📔</div>

      <div class="empty-title">
        {{ $t("journal.archive.emptyTitle") }}
      </div>

      <div class="empty-text">
        {{ $t("journal.archive.emptyText") }}
      </div>
    </div>

    <!-- Entries -->
    <q-card
      v-else
      v-for="entry in entries"
      :key="entry.id"
      flat
      class="entry-card"
    >
      <div class="entry-header">
        <div class="entry-date">
          {{ formatDate(entry.date) }}
        </div>

        <div v-if="entry.mood" class="entry-mood">
          {{ getMoodEmoji(entry.mood) }}
        </div>
      </div>

      <div v-if="entry.note" class="entry-note">
        {{ entry.note }}
      </div>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useJournalStore } from "~/stores/journal";
import { routes } from "~/router/routes";
import { moodEmojis } from "~/constants/moods";

definePageMeta({
  layout: "authenticated",
  middleware: "auth",
});

const store = useJournalStore();
const { locale } = useI18n();

const loading = ref(true);

const entries = computed(() => [...store.entries].reverse());

function getMoodEmoji(mood: number) {
  return moodEmojis[mood] || "😐";
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(locale.value, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

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