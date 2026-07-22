<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="page">
        <div class="header">
          <div class="title">Еженедельное задание</div>
          <div class="subtitle">Неделя {{ store.currentWeek }}</div>
          <div class="week-day">День {{ store.currentDayWithinWeek }} из 7</div>
        </div>

        <q-card class="task-card">
          <div class="badge">🎯 Задание недели</div>

          <div class="task-title">
            {{ store.currentTask.nameProgram }}
          </div>

          <div class="section">
            <div class="section-title">Что делать</div>
            <div class="text">
              {{ store.currentTask.whatDoing }}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Зачем это нужно</div>
            <div class="text">
              {{ store.currentTask.whyDoing }}
            </div>
          </div>

          <q-btn
            v-if="!store.isCompleted()"
            unelevated
            color="green"
            class="complete-btn"
            label="Задание недели выполнено"
            :disable="!store.canComplete"
            @click="completeWeeklyTask"
          />
          <div
            v-if="!store.canComplete && !store.isCompleted()"
            class="week-info"
          >
            Выполнить задание можно на 6–7 день недели
          </div>
          <q-banner v-else rounded class="success-banner">
            ✅ Задание недели выполнено
          </q-banner>
        </q-card>
      </q-page>
    </q-page-container>

    <BottomNavigation />
  </q-layout>
</template>

<script setup lang="ts">
import BottomNavigation from "../components/BottomNavigation.vue";
import { useWeeklyTaskStore } from "../stores/weeklyTasks.ts";

const store = useWeeklyTaskStore();

function completeWeeklyTask() {
  if (!store.canComplete) return;

  store.completeCurrentTask();
  store.rewardEnergy();
}
</script>

<style scoped>
.page {
  padding: 20px;
  padding-bottom: 60px;
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
  background: var(--green-bg);
  color: var(--green-deep);
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