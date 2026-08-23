<template>
  <div class="journal-page">
    <section class="hero">
      <div class="hero-content">
        <h1 class="hero-title">{{ $t("journal.title") }}</h1>
        <p class="hero-subtitle">
          {{ $t("journal.subtitle") }}
        </p>
      </div>
      <div class="hero-book">
        <span class="material-icons book-icon">menu_book</span>
      </div>
    </section>

    <div class="actions">
      <q-card flat class="action-card" @click="navigateTo(routes.recovery.journalChart)">
        <div class="action-icon green-bg">
          <span class="material-icons icon-green">show_chart</span>
        </div>
        <div class="action-content">
          <div class="action-title">{{ $t("journal.chartAction") }}</div>
          <div class="action-subtitle">{{ $t("journal.chartActionSubtitle") }}</div>
        </div>
        <span class="material-icons icon-green">chevron_right</span>
      </q-card>

      <q-card flat class="action-card note-card" @click="showNoteDialog = true">
        <div class="action-icon orange-bg">
          <span class="material-icons icon-orange">edit</span>
        </div>
        <div class="action-content">
          <div class="action-title">{{ $t("journal.noteAction") }}</div>
          <div class="action-subtitle">{{ $t("journal.noteActionSubtitle") }}</div>
        </div>
        <div class="plus-circle">
          <span class="material-icons icon-orange">add</span>
        </div>
      </q-card>

      <q-card
        flat
        class="action-card"
        @click="navigateTo(routes.recovery.journalArchive)"
      >
        <div class="action-icon blue-bg">
          <span class="material-icons icon-blue">inventory_2</span>
        </div>
        <div class="action-content">
          <div class="action-title">{{ $t("journal.archiveAction") }}</div>
          <div class="action-subtitle">{{ $t("journal.archiveActionSubtitle") }}</div>
        </div>
        <span class="material-icons icon-blue">chevron_right</span>
      </q-card>
    </div>

    <q-dialog v-model="showNoteDialog">
      <q-card class="dialog-card">
        <div class="dialog-title">{{ $t("journal.newNote") }}</div>
        <q-input
          v-model="note"
          type="textarea"
          autogrow
          outlined
          :placeholder="$t('journal.notePlaceholder')"
        />
        <div class="dialog-actions">
          <q-btn
            flat
            no-caps
            text-color="primary"
            :label="$t('common.cancel')"
            @click="showNoteDialog = false"
          />
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="$t('common.save')"
            @click="saveNote"
          />
        </div>
      </q-card>
    </q-dialog>

    <BottomNavigation />
  </div>
</template>

<script setup lang="ts">
import { useJournalStore } from "~/stores/journal";
import { routes } from "~/router/routes";
import { ref } from "vue";
definePageMeta({
  middleware: "auth",
  layout: "authenticated",
});
const journalStore = useJournalStore();

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
  padding-bottom: 100px;
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
.book-icon {
  font-size: 72px;
  color: var(--white);
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
  cursor: pointer;
}
.action-card:active {
  transform: scale(0.98);
}
.note-card {
  border: 1px solid var(--orange-border);
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
.icon-green {
  color: var(--green);
}
.icon-orange {
  color: var(--orange);
}
.icon-blue {
  color: var(--blue);
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
.action-card > .material-icons {
  font-size: 34px;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px var(--shadow-notify));
}
.action-icon .material-icons {
  font-size: 34px;
}
.plus-circle .material-icons {
  font-size: 34px;
}
.plus-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--icon-orange-bg);
}
.dialog-card {
  padding: 28px;
  width: min(92vw, 500px);
  border-radius: 24px;
}
.dialog-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 16px;
}
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-right: 4px;
}
.dialog-actions .q-btn {
  border-radius: 14px;
}
.dialog-card :deep(.q-field--outlined .q-field__control),
.dialog-card :deep(.q-field--outlined .q-field__control:before) {
  border-radius: 14px;
}
</style>
