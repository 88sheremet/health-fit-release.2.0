<template>
  <div class="page">
    <div class="header">
      <div class="title">{{ $t("weekly.title") }}</div>
      <div class="subtitle">
        {{ $t("weekly.week", { n: store.currentWeek }) }}
      </div>
      <div class="week-day">
        {{ $t("weekly.dayOfWeek", { n: store.currentDayWithinWeek }) }}
      </div>
    </div>

    <q-card class="task-card">
      <div class="badge">{{ $t("weekly.badge") }}</div>
      <div class="task-title">{{ store.currentTask.nameProgram }}</div>

      <div class="section">
        <div class="section-title">{{ $t("weekly.whatToDo") }}</div>
        <div class="text">{{ store.currentTask.whatDoing }}</div>
      </div>

      <div class="section">
        <div class="section-title">{{ $t("weekly.whyNeeded") }}</div>
        <div class="text">{{ store.currentTask.whyDoing }}</div>
      </div>

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
      <div v-if="!store.canComplete && !store.isCompleted()" class="week-info">
        {{ $t("weekly.info") }}
      </div>
      <div v-else class="success-banner">{{ $t("weekly.successBanner") }}</div>
    </q-card>

    <BottomNavigation />
  </div>
</template>

<script setup lang="ts">
import { useWeeklyTaskStore } from "~/stores/weeklyTasks";

definePageMeta({
  middleware: "auth",
  layout: "authenticated",
});

const store = useWeeklyTaskStore();

await store.init();

async function completeWeeklyTask() {
  if (!store.canComplete) {
    return;
  }

  await store.completeCurrentTask();
  store.rewardEnergy();
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
