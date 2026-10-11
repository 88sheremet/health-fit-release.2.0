<template>
  <div class="page">
    <div class="header">
      <div>
        <div class="title">
          {{ $t("daily.greeting", { name: userName }) }} 👋
        </div>
        <div class="subtitle">
          {{ $t("daily.day", { n: store.dayIndex }) }}
        </div>
      </div>
      <div class="streak-avatar">{{ store.streak }}</div>
    </div>

    <q-card class="energy-card">
      <div class="energy-row">
        <div>
          <div class="label">{{ $t("daily.energy") }}</div>
          <div class="value">{{ store.energy }} ⚡</div>
        </div>
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

    <div v-if="store.isRestDay" class="rest-card">
      <div class="emoji">🌿</div>
      <div class="rest-title">{{ $t("daily.restTitle") }}</div>
      <div class="rest-text">{{ $t("daily.restText") }}</div>
    </div>

    <div v-else-if="store.loading" class="flex justify-center q-pa-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <div v-else class="tasks">
      <q-card
        v-for="task in tasks"
        :key="task.id"
        class="task-card"
        :class="{ done: store.isDone(task.id) }"
        @click="openTask(task)"
      >
        <div class="task-header">
          <div class="task-title">{{ task.title }}</div>
          <button
            class="icon-popup"
            type="button"
            :aria-label="task.title"
            @click.stop="openTask(task)"
          >
            <img :src="click" class="click-icon" alt="" />
          </button>
        </div>
        <div class="task-footer">
          <div class="reward">
            {{ $t("daily.reward", { n: task.reward }) }}
          </div>
          <div v-if="store.isDone(task.id)" class="task-status">
            {{ $t("daily.done") }}
          </div>
        </div>
      </q-card>
    </div>

    <TaskDetailsDialog
      v-model="showDialog"
      :task="selectedTask"
      :gender="userGender"
      :is-done="selectedTask ? store.isDone(selectedTask.id) : false"
      @complete="completeTask"
    />

    <q-dialog
      v-model="showRewardDialog"
      :persistent="rewardTaskType === 'food' && undoSeconds > 0"
    >
      <div class="reward-dialog">
        <button
          v-if="rewardTaskType !== 'food' || undoSeconds === 0"
          class="reward-close"
          type="button"
          aria-label="Close"
          @click="showRewardDialog = false"
        >
          <span class="material-icons">close</span>
        </button>

        <div class="reward-sparkles" aria-hidden="true">✨</div>
        <div class="reward-icon" aria-hidden="true">
          <span class="material-icons">emoji_events</span>
        </div>
        <div class="reward-title">{{ currentRewardPhrase }}</div>
        <div class="reward-energy">+{{ rewardAmount }} Energy</div>
        <div class="reward-message">
          {{ $t("taskDetails.rewardMessage") }}
        </div>

        <div
          v-if="rewardTaskType === 'food' && undoSeconds > 0"
          class="reward-undo"
        >
          <q-btn
            flat
            no-caps
            color="primary"
            :label="$t('taskDetails.undoAction', { n: undoSeconds })"
            :loading="undoLoading"
            :disable="undoLoading"
            @click="undoFoodTask"
          />
        </div>
      </div>
    </q-dialog>

    <CheckInDialog
      v-model="journalStore.showCheckin"
      @save="journalStore.saveCheckin"
    />

    <BottomNavigation />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useQuasar } from "quasar";

import { useTaskStore } from "~/stores/dailyTasks";
import { useJournalStore } from "~/stores/journal";
import type { Task } from "~/interfaces/Task.interface";
import click from "~/assets/click.png";

definePageMeta({
  middleware: "auth",
  layout: "authenticated",
});

type UserGender = "male" | "female";

interface CompletionPayload {
  feedback?: string;
}

const supabase = useSupabaseClient();
const store = useTaskStore();
const journalStore = useJournalStore();

const { locale, t, tm } = useI18n();
const $q = useQuasar();

const tasks = computed(() => store.todayTasks);

const userName = ref("");
const userGender = ref<UserGender | null>(null);

const selectedTask = ref<Task | null>(null);
const showDialog = ref(false);

const showRewardDialog = ref(false);
const rewardAmount = ref(0);
const rewardTaskType = ref<Task["type"] | null>(null);
const currentRewardPhrase = ref("");

const undoSeconds = ref(0);
const undoLoading = ref(false);

let undoInterval: ReturnType<typeof setInterval> | undefined;
let rewardTimeout: ReturnType<typeof setTimeout> | undefined;
let dialogTransitionTimeout: ReturnType<typeof setTimeout> | undefined;
let undoDeadline = 0;

function getRandomRewardPhrase(): string {
  const translatedPhrases = tm("taskDetails.rewardPhrases");

  const phrases: string[] = Array.isArray(translatedPhrases)
    ? translatedPhrases.filter(
        (phrase): phrase is string => typeof phrase === "string",
      )
    : [];

  if (phrases.length === 0) {
    return t("taskDetails.rewardTitle");
  }

  if (typeof window === "undefined") {
    return phrases[Math.floor(Math.random() * phrases.length)]!;
  }

  const previousPhrase = window.localStorage.getItem(
    "health-fit:last-reward-phrase",
  );
  const previousLocale = window.localStorage.getItem(
    "health-fit:last-reward-locale",
  );

  const availablePhrases =
    previousLocale === locale.value && phrases.length > 1
      ? phrases.filter((phrase) => phrase !== previousPhrase)
      : phrases;

  const randomIndex = Math.floor(Math.random() * availablePhrases.length);
  const phrase = availablePhrases[randomIndex] ?? phrases[0]!;

  window.localStorage.setItem("health-fit:last-reward-phrase", phrase);
  window.localStorage.setItem("health-fit:last-reward-locale", locale.value);

  return phrase;
}

function clearRewardTimers() {
  if (undoInterval) {
    clearInterval(undoInterval);
    undoInterval = undefined;
  }

  if (rewardTimeout) {
    clearTimeout(rewardTimeout);
    rewardTimeout = undefined;
  }

  if (dialogTransitionTimeout) {
    clearTimeout(dialogTransitionTimeout);
    dialogTransitionTimeout = undefined;
  }
}

function openTask(task: Task) {
  selectedTask.value = task;
  showDialog.value = true;
}

function showReward(task: Task, amount: number) {
  clearRewardTimers();

  currentRewardPhrase.value = getRandomRewardPhrase();
  rewardAmount.value = amount;
  rewardTaskType.value = task.type;
  undoSeconds.value = 0;

  // Закрываем окно задания перед открытием окна награды.
  showRewardDialog.value = false;

  dialogTransitionTimeout = setTimeout(() => {
    dialogTransitionTimeout = undefined;
    showRewardDialog.value = true;

    if (task.type === "food") {
      undoSeconds.value = 5;
      undoDeadline = Date.now() + 5000;

      undoInterval = setInterval(() => {
        const remaining = Math.max(
          0,
          Math.ceil((undoDeadline - Date.now()) / 1000),
        );

        undoSeconds.value = remaining;

        if (remaining === 0) {
          clearRewardTimers();
          showRewardDialog.value = false;
        }
      }, 200);

      return;
    }

    rewardTimeout = setTimeout(() => {
      showRewardDialog.value = false;
      rewardTimeout = undefined;
    }, 2500);
  }, 350);
}

async function completeTask(payload?: CompletionPayload) {
  const task = selectedTask.value;

  if (!task || store.isDone(task.id)) {
    return;
  }

  try {
    const awardedEnergy = await store.completeTask(task, payload?.feedback);

    showDialog.value = false;

    // Не показываем награду повторно, если Energy не начислена.
    if (awardedEnergy > 0) {
      showReward(task, awardedEnergy);
    }
  } catch (error) {
    console.error("[Daily] Не удалось завершить задание:", error);

    showDialog.value = false;

    $q.notify({
      type: "negative",
      message: t("taskDetails.completeError"),
    });
  }
}

async function undoFoodTask() {
  const task = selectedTask.value;

  if (
    !task ||
    task.type !== "food" ||
    undoSeconds.value <= 0 ||
    Date.now() > undoDeadline ||
    undoLoading.value
  ) {
    return;
  }

  undoLoading.value = true;

  try {
    await store.undoTask(task, rewardAmount.value);

    clearRewardTimers();
    undoSeconds.value = 0;
    showRewardDialog.value = false;

    $q.notify({
      type: "positive",
      message: t("taskDetails.undoSuccess"),
    });
  } catch (error) {
    console.error("[Daily] Не удалось отменить задание:", error);

    $q.notify({
      type: "negative",
      message: t("taskDetails.undoError"),
    });
  } finally {
    undoLoading.value = false;
  }
}

async function loadUserName() {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("[Daily] Не удалось получить пользователя:", userError);
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("name, gender")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[Daily] Ошибка загрузки профиля:", error);
      return;
    }

    userName.value =
      profile?.name?.trim() ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      "";

    userGender.value =
      profile?.gender === "male" || profile?.gender === "female"
        ? profile.gender
        : null;
  } catch (error) {
    console.error("[Daily] Ошибка загрузки профиля:", error);
  }
}

onMounted(async () => {
  await Promise.all([
    store.init(locale.value),
    journalStore.init(),
    loadUserName(),
  ]);
});

watch(
  locale,
  async (newLocale, oldLocale) => {
    if (newLocale === oldLocale) {
      return;
    }

    try {
      await store.loadTasks(newLocale);
    } catch (error) {
      console.error("[Daily] Ошибка загрузки задач после смены языка:", error);
    }
  },
  { immediate: false },
);

onBeforeUnmount(() => {
  clearRewardTimers();
});
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
  gap: 12px;
}

.reward {
  font-size: 13px;
  color: var(--green);
}

.task-status {
  font-size: 13px;
  font-weight: 600;
  color: var(--green);
}

.task-hint {
  font-size: 13px;
  color: var(--grey);
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

.icon-popup {
  margin-bottom: 10px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}

/* Reward animation */
.reward-dialog {
  position: relative;
  width: min(88vw, 380px);
  padding: 42px 28px 30px;
  border-radius: 28px;
  background: var(--white);
  text-align: center;
  overflow: hidden;
  animation: reward-appear 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.reward-close {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  background: var(--bg-gradient-main);
  color: var(--grey-dark);
  cursor: pointer;
}

.reward-sparkles {
  position: absolute;
  top: 8px;
  left: 0;
  width: 100%;
  font-size: 30px;
  pointer-events: none;
  animation: sparkle-float 1.5s ease-in-out infinite alternate;
}

.reward-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 86px;
  height: 86px;
  margin: 12px auto 20px;
  border-radius: 50%;
  background: var(--bg-gradient-main);
  color: var(--green);
  animation: reward-pulse 1.2s ease-in-out infinite;
}

.reward-icon .material-icons {
  font-size: 46px;
}

.reward-title {
  font-size: 25px;
  line-height: 1.3;
  font-weight: 800;
  color: var(--grey-dark);
}

.reward-energy {
  margin-top: 14px;
  color: var(--green);
  font-size: 34px;
  font-weight: 800;
  animation: energy-pop 0.55s 0.15s both;
}

.reward-message {
  margin-top: 8px;
  color: var(--grey);
  font-size: 14px;
}

.reward-undo {
  margin-top: 14px;
  border-top: 1px solid var(--border-default);
  padding-top: 10px;
}

@keyframes reward-appear {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.88);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes reward-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.07);
  }
}

@keyframes energy-pop {
  from {
    opacity: 0;
    transform: scale(0.65);
  }
  70% {
    transform: scale(1.12);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes sparkle-float {
  from {
    opacity: 0.6;
    transform: translateY(4px) rotate(-5deg);
  }
  to {
    opacity: 1;
    transform: translateY(-4px) rotate(5deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .reward-dialog,
  .reward-icon,
  .reward-energy,
  .reward-sparkles {
    animation: none;
  }
}

@media (max-width: 480px) {
  .header {
    align-items: flex-start;
  }

  .title {
    font-size: 24px;
  }

  .reward-dialog {
    padding: 38px 22px 24px;
  }

  .reward-energy {
    font-size: 30px;
  }
}
</style>
