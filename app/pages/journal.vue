<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <div class="journal-page">
        <section class="hero">
          <div class="hero-content">
            <h1 class="hero-title">Дневник</h1>

            <p class="hero-subtitle">
              Фиксируй свои мысли и состояние, чтобы видеть изменения со
              временем
            </p>
          </div>

          <div class="hero-book">
            <q-icon name="menu_book" size="72px" color="white" />
          </div>
        </section>

        <div class="actions">
          <q-card
            flat
            clickable
            class="action-card"
            @click="$router.push('/journal-chart')"
          >
            <div class="action-icon green-bg">
              <q-icon name="show_chart" size="30px" color="green" />
            </div>

            <div class="action-content">
              <div class="action-title">Смотреть график</div>

              <div class="action-subtitle">
                Посмотри динамику своего состояния
              </div>
            </div>

            <q-icon name="chevron_right" size="30px" color="green" />
          </q-card>

          <q-card
            flat
            clickable
            class="action-card note-card"
            @click="showNoteDialog = true"
          >
            <div class="action-icon orange-bg">
              <q-icon name="edit" size="28px" color="orange" />
            </div>

            <div class="action-content">
              <div class="action-title">Сделать заметку</div>

              <div class="action-subtitle">
                Запиши свои мысли или наблюдения
              </div>
            </div>

            <div class="plus-circle">
              <q-icon name="add" size="26px" color="orange" />
            </div>
          </q-card>

          <q-card
            flat
            clickable
            class="action-card"
            @click="router.push(routes.recovery.journalArchive)"
          >
            <div class="action-icon blue-bg">
              <q-icon name="inventory_2" size="28px" color="primary" />
            </div>

            <div class="action-content">
              <div class="action-title">Архив</div>

              <div class="action-subtitle">Просмотри сохраненные записи</div>
            </div>

            <q-icon name="chevron_right" size="30px" color="primary" />
          </q-card>
        </div>

        <q-dialog v-model="showNoteDialog">
          <q-card class="dialog-card">
            <q-card-section>
              <div class="dialog-title">Новая заметка</div>

              <q-input
                v-model="note"
                outlined
                autogrow
                placeholder="Напишите свои мысли или наблюдения..."
              />
            </q-card-section>

            <q-card-actions align="right" class="q-card-wrapper">
              <q-btn flat label="Отмена" v-close-popup />

              <q-btn color="green" label="Сохранить" @click="saveNote" />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </div>
      <BottomNavigation />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useJournalStore } from "../stores/journal.ts";
import { useRouter } from "vue-router";
import BottomNavigation from "../components/BottomNavigation.vue";
import { routes } from "../router/index";
const router = useRouter();
const journalStore = useJournalStore();
import { ref } from "vue";

const showNoteDialog = ref(false);
const note = ref("");

function saveNote() {
  if (!note.value.trim()) return;

  journalStore.addNote(note.value);

  showNoteDialog.value = false;
  note.value = "";
}
</script>

<style scoped>
.journal-page {
  min-height: 100vh;
  padding: 24px;
  background: var(--bg-gradient-main);
}

.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}

.hero-content {
  flex: 1;
  max-width: 65%;
}

.hero-title {
  margin: 0;
  font-size: 42px;
  font-weight: 700;
  color: var(--black1);
}

.hero-subtitle {
  margin-top: 14px;
  line-height: 1.6;
  color: var(--grey2);
  font-size: 16px;
}

.hero-book {
  width: 120px;
  height: 120px;
  border-radius: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gradient-purple);
  box-shadow: 0 12px 32px var(--shadow-xl);
  transform: rotate(-8deg);
}

.overview-card {
  display: flex;
  align-items: center;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 24px;
  background: var(--glass-heavy);
  box-shadow: 0 8px 24px var(--shadow-md);
}

.overview-icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--icon-green-bg);
}

.overview-content {
  flex: 1;
  margin-left: 16px;
}

.overview-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--black1);
}

.overview-subtitle {
  margin-top: 4px;
  color: var(--grey);
}

.mini-chart {
  width: 90px;
  height: 40px;
  position: relative;
}

.chart-line {
  width: 100%;
  height: 100%;
  border-bottom: 3px solid var(--green);
  border-radius: 50%;
  transform: skewX(-20deg);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.action-card {
  display: flex;
  align-items: center;
  padding: 18px;
  border-radius: 24px;
  background: var(--glass-heavy);
  box-shadow: 0 8px 24px var(--shadow-md);
  transition: 0.2s;
}

.action-card:active {
  transform: scale(0.98);
}

.note-card {
  border: 1px solid rgba(251, 140, 0, 0.2);
}

.action-icon {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.green-bg {
  background: var(--icon-green-bg);
}

.orange-bg {
  background: var(--icon-orange-bg);
}

.blue-bg {
  background: var(--icon-blue-bg);
}

.action-content {
  flex: 1;
  margin-left: 16px;
}

.action-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--black1);
}

.action-subtitle {
  margin-top: 4px;
  color: var(--grey);
  font-size: 14px;
}

.plus-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--icon-orange-bg2);
}

.dialog-card {
  width: 92%;
  max-width: 500px;
  border-radius: 24px;
}

.q-card-wrapper {
  padding-right: 15px;
  padding-bottom: 15px;
}

.dialog-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 16px;
}
</style>