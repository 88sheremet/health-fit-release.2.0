<template>
  <q-card class="geometry-card">
    <div class="badge">
      {{ $t("weekly.badge") }}
    </div>

    <div class="task-title">
      {{ title }}
    </div>

    <div class="section">
      <div class="section-title">
        {{ $t("weekly.whatToDo") }}
      </div>

      <div class="description">
        {{ whatDoing }}
      </div>
    </div>

    <div class="section">
      <div class="section-title">
        {{ $t("weekly.whyNeeded") }}
      </div>

      <div class="description">
        {{ whyDoing }}
      </div>
    </div>

    <div class="geometry-progress">
      <div class="progress-header">
        <div class="section-title">
          {{ $t("weekly.geometry.progressTitle") }}
        </div>

        <div class="progress-count">{{ geometryStore.completedCount }}/7</div>
      </div>

      <div class="progress-track">
        <div
          class="progress-fill"
          :style="{ width: `${geometryStore.progressPercent}%` }"
        ></div>
      </div>

      <div class="progress-caption">
        {{
          $t("weekly.geometry.progress", {
            completed: geometryStore.completedCount,
            total: 7,
          })
        }}
      </div>

      <div class="stages-list">
        <div
          v-for="day in 7"
          :key="day"
          class="stage-item"
          :class="getStageClass(day)"
        >
          <div class="stage-number">
            <q-icon v-if="isStageCompleted(day)" name="check" size="18px" />
            <q-icon v-else-if="isStageMissed(day)" name="close" size="18px" />
            <span v-else>{{ day }}</span>
          </div>

          <div class="stage-content">
            <div class="stage-title">
              {{ $t(`weekly.geometry.stages.day${day}`) }}
            </div>

            <div class="stage-status">
              {{ getStageStatus(day) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Подробная инструкция текущего дня -->
    <div v-if="isCurrentDayValid" class="stage-instructions">
      <div class="instruction-heading">
        {{ $t("weekly.geometry.instructions.title") }}
      </div>

      <div class="instruction-goal">
        {{ $t(`weekly.geometry.instructions.day${currentDay}.goal`) }}
      </div>

      <div class="instruction-section">
        <div class="instruction-section-title">
          {{ $t("weekly.geometry.instructions.stepsTitle") }}
        </div>

        <ol class="instruction-list">
          <li v-for="step in 5" :key="step">
            {{
              $t(
                `weekly.geometry.instructions.day${currentDay}.steps.${
                  step - 1
                }`,
              )
            }}
          </li>
        </ol>
      </div>

      <div class="instruction-section">
        <div class="instruction-section-title">
          {{ $t("weekly.geometry.instructions.postureTitle") }}
        </div>

        <ul class="instruction-list">
          <li v-for="item in 5" :key="item">
            {{
              $t(
                `weekly.geometry.instructions.day${currentDay}.posture.${
                  item - 1
                }`,
              )
            }}
          </li>
        </ul>
      </div>

      <div class="instruction-main-task">
        <div class="instruction-section-title">
          {{ $t("weekly.geometry.instructions.mainTaskTitle") }}
        </div>

        {{ $t(`weekly.geometry.instructions.day${currentDay}.mainTask`) }}
      </div>
    </div>

    <div v-if="isTodayAvailable" class="today-action">
      <div class="today-label">
        {{ $t("weekly.geometry.todayStage", { day: currentDay }) }}
      </div>

      <q-btn
        color="primary"
        unelevated
        no-caps
        class="complete-btn"
        :label="$t('weekly.geometry.completeStage')"
        :loading="geometryStore.saving || completing"
        :disable="geometryStore.saving || completing"
        @click="completeTodayStage"
      />
    </div>

    <div v-else-if="isTodayCompleted" class="info-message">
      {{ $t("weekly.geometry.alreadyCompletedToday") }}
    </div>

    <div v-if="geometryStore.error === 'load'" class="error-message">
      {{ $t("weekly.geometry.errors.loadProgress") }}
    </div>

    <div v-if="geometryStore.error === 'save'" class="error-message">
      {{ $t("weekly.geometry.errors.saveProgress") }}
    </div>

    <div v-if="taskError" class="error-message">
      {{ taskError }}
    </div>

    <div v-if="isTaskCompleted" class="success-banner">
      {{ $t("weekly.geometry.success") }}
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useGeometryWeekStore } from "~/stores/geometryWeek";
import { useWeeklyTaskStore } from "~/stores/weeklyTasks";

interface Props {
  taskId: string;
  week: number;
  currentDay: number;
  title: string;
  whatDoing: string;
  whyDoing: string;
}

const props = defineProps<Props>();

const { t } = useI18n();

const geometryStore = useGeometryWeekStore();
const weeklyStore = useWeeklyTaskStore();

const completing = ref(false);
const finalizing = ref(false);
const taskError = ref("");

const isTaskCompleted = computed(() => weeklyStore.isCompleted());

const isCurrentDayValid = computed(
  () => props.currentDay >= 1 && props.currentDay <= 7,
);

const isTodayCompleted = computed(() =>
  geometryStore.completedDays.includes(props.currentDay),
);

const isTodayAvailable = computed(() => {
  return (
    isCurrentDayValid.value &&
    !isTodayCompleted.value &&
    !isTaskCompleted.value &&
    !geometryStore.loading &&
    geometryStore.error !== "load"
  );
});

function isStageCompleted(day: number): boolean {
  return geometryStore.completedDays.includes(day);
}

function isStageMissed(day: number): boolean {
  return day < props.currentDay && !isStageCompleted(day);
}

function getStageClass(day: number): string {
  if (isStageCompleted(day)) {
    return "stage-completed";
  }

  if (isStageMissed(day)) {
    return "stage-missed";
  }

  if (day === props.currentDay) {
    return "stage-today";
  }

  return "stage-locked";
}

function getStageStatus(day: number): string {
  if (isStageCompleted(day)) {
    return t("weekly.geometry.status.completed");
  }

  if (isStageMissed(day)) {
    return t("weekly.geometry.status.missed");
  }

  if (day === props.currentDay) {
    return t("weekly.geometry.status.today");
  }

  return t("weekly.geometry.status.locked");
}

async function finalizeTask() {
  if (
    geometryStore.completedCount < 5 ||
    weeklyStore.isCompleted() ||
    finalizing.value
  ) {
    return;
  }

  finalizing.value = true;
  taskError.value = "";

  try {
    await weeklyStore.completeGeometryTask(geometryStore.completedCount);
  } catch (error) {
    console.error(
      "[GeometryWeek] Не удалось завершить недельное задание:",
      error,
    );

    taskError.value = t("weekly.geometry.errors.completeTask");
  } finally {
    finalizing.value = false;
  }
}

async function loadProgress() {
  taskError.value = "";

  try {
    await geometryStore.loadProgress(props.taskId, props.week);
    await finalizeTask();
  } catch (error) {
    console.error("[GeometryWeek] Не удалось загрузить прогресс:", error);
  }
}

async function completeTodayStage() {
  if (!isTodayAvailable.value || geometryStore.saving || completing.value) {
    return;
  }

  completing.value = true;
  taskError.value = "";

  try {
    await geometryStore.completeStage(
      props.taskId,
      props.week,
      props.currentDay,
    );

    await finalizeTask();
  } catch (error) {
    console.error("[GeometryWeek] Не удалось выполнить этап:", error);
  } finally {
    completing.value = false;
  }
}

watch(
  () => [props.taskId, props.week],
  async () => {
    geometryStore.reset();

    if (props.taskId) {
      await loadProgress();
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.geometry-card {
  padding: 24px;
  border-radius: 24px;
}

.badge {
  display: inline-flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 8px 14px;
  border-radius: 999px;
  background: var(--green-bg);
  color: var(--green-deep);
  font-weight: 600;
}

.task-title {
  margin-bottom: 24px;
  font-size: 24px;
  font-weight: 700;
}

.section {
  margin-bottom: 24px;
}

.section-title {
  margin-bottom: 10px;
  font-size: 18px;
  font-weight: 700;
}

.description {
  color: var(--grey-dark);
  line-height: 1.7;
  white-space: pre-line;
}

.geometry-progress {
  margin-top: 28px;
}

.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.progress-count {
  color: var(--green-deep);
  font-size: 17px;
  font-weight: 700;
}

.progress-track {
  height: 9px;
  margin-top: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--grey-hover);
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: var(--green);
  transition: width 0.25s ease;
}

.progress-caption {
  margin-top: 8px;
  color: var(--grey);
  font-size: 13px;
}

.stages-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}

.stage-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 13px;
  border: 1px solid var(--grey-hover);
  border-radius: 14px;
}

.stage-number {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--grey-hover);
  font-weight: 700;
}

.stage-content {
  min-width: 0;
}

.stage-title {
  font-weight: 600;
  line-height: 1.4;
}

.stage-status {
  margin-top: 4px;
  color: var(--grey);
  font-size: 12px;
}

.stage-completed {
  border-color: var(--green);
  background: var(--green-bg);
}

.stage-completed .stage-number {
  background: var(--green);
  color: white;
}

.stage-missed {
  opacity: 0.55;
}

.stage-missed .stage-number {
  background: var(--grey-hover);
}

.stage-today {
  border-color: var(--green);
  border-width: 2px;
}

.stage-today .stage-number {
  background: var(--green-bg);
  color: var(--green-deep);
}

.stage-locked {
  opacity: 0.55;
}

/* Инструкция текущего дня */
.stage-instructions {
  margin-top: 28px;
  padding: 20px;
  border-radius: 18px;
  background: var(--green-bg);
}

.instruction-heading {
  margin-bottom: 12px;
  color: var(--green-deep);
  font-size: 20px;
  font-weight: 700;
}

.instruction-goal {
  margin-bottom: 20px;
  line-height: 1.6;
}

.instruction-section {
  margin-top: 18px;
}

.instruction-section-title {
  margin-bottom: 10px;
  font-weight: 700;
}

.instruction-list {
  margin: 0;
  padding-left: 22px;
  line-height: 1.7;
}

.instruction-list li + li {
  margin-top: 8px;
}

.instruction-main-task {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  line-height: 1.6;
}

.today-action {
  margin-top: 24px;
}

.today-label {
  margin-bottom: 12px;
  color: var(--green-deep);
  font-weight: 700;
}

.complete-btn {
  width: 100%;
  height: 54px;
  border-radius: 16px;
}

.info-message {
  margin-top: 18px;
  padding: 14px;
  border-radius: 12px;
  background: var(--green-bg);
  color: var(--green-deep);
  text-align: center;
  line-height: 1.5;
}

.success-banner {
  margin-top: 20px;
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--green-bg);
  color: var(--green-deep);
  text-align: center;
  font-weight: 600;
}

.error-message {
  margin-top: 12px;
  color: var(--negative);
  font-size: 14px;
  line-height: 1.5;
}
</style>
