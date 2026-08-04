<template>
  <div class="page">
    <div class="header">
      <div>
        <div class="title">Привет 👋</div>
        <div class="subtitle">День {{ store.dayIndex }}</div>
      </div>
      <div class="streak-avatar">{{ store.streak }}</div>
    </div>

    <q-card class="energy-card">
      <div class="energy-row">
        <div>
          <div class="label">Энергия</div>
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
      <div class="rest-title">Сегодня полный отдых</div>
      <div class="rest-text">Восстановление — это тоже прогресс</div>
    </div>

    <div
  v-if="store.loading"
  class="flex justify-center q-pa-xl"
>
  <q-spinner
    color="primary"
    size="40px"
  />
</div>


    <div v-else class="tasks">
      <q-card
        v-for="task in tasks"
        :key="task.id"
        class="task-card"
        @click="openTask(task)"
      >
        <div class="task-header">
          <div class="task-title">{{ task.title }}</div>
          <button class="icon-popup" @click.stop="openTask(task)">
            <img :src="click" class="click-icon" />
          </button>
        </div>
        <div class="task-footer">
          <div class="reward">+{{ task.reward }} ресурса</div>
          <q-btn
            class="select-btn"
            dense
            no-caps
            unelevated
            color="primary"
            text-color="white"
            :label="store.isDone(task.id) ? 'Готово' : 'Выполнить'"
            :disable="store.isDone(task.id)"
            @click.stop="store.completeTask(task)"
          />
        </div>
      </q-card>
    </div>

    <TaskDetailsDialog v-model="showDialog" :task="selectedTask" />
    <CheckInDialog
      v-model="journalStore.showCheckin"
      @save="journalStore.saveCheckin"
    />

    <BottomNavigation />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useTaskStore } from "~/stores/dailyTasks";
import { useJournalStore } from "~/stores/journal";
import click from "~/assets/click.png";

const store = useTaskStore();
const journalStore = useJournalStore();

const tasks = computed(() => store.todayTasks);

const selectedTask = ref<any>(null);
const showDialog = ref(false);

function openTask(task: any) {
  selectedTask.value = task;
  showDialog.value = true;
}

onMounted(async () => {
  await store.init();
  journalStore.init();
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
.select-btn{
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
