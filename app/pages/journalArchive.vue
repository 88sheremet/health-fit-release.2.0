<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="archive-page">
        <div class="header">
          <q-btn
            flat
            round
            icon="arrow_back"
            @click="router.push(routes.recovery.journal)"
          />

          <div class="title">Архив состояния</div>
        </div>

        <div v-if="!entries.length" class="empty-state">
          <div class="empty-icon">📔</div>

          <div class="empty-title">Пока нет записей</div>

          <div class="empty-text">
            Пройди ежедневный чек-ин, чтобы появилась история состояния
          </div>
        </div>

        <q-card
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

          <div class="entry-note">
            {{ entry.note }}
          </div>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useJournalStore } from "../stores/journal";
import { useRouter } from "vue-router";
import { routes } from "../router/index";
import { moodEmojis } from "../constants/moods";
const router = useRouter();
const store = useJournalStore();

const entries = computed(() => {
  return [...store.entries].reverse();
});

function getMoodEmoji(mood: number) {
  return moodEmojis[mood] || "😐";
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
</script>

<style scoped>
.archive-page {
  min-height: 100vh;
  padding: 20px;
  background: var(--bg-gradient-main);
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: var(--black1);
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
</style>