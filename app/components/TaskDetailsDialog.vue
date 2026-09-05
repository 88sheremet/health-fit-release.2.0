<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div v-if="task" class="dialog">
      <div class="header">
        <button
          class="close-btn"
          type="button"
          @click="$emit('update:modelValue', false)"
        >
          <span class="material-icons"> close </span>
        </button>

        <div class="title">
          {{ task.title }}
        </div>

        <span class="reward-chip">
          {{
            $t("taskDetails.reward", {
              n: task.reward,
            })
          }}
        </span>
      </div>

      <hr class="separator" />

      <div class="content">
        <div class="section-title">
          {{ $t("taskDetails.whatToDo") }}
        </div>

        <template v-if="task.type !== 'physical'">
          <div class="text">
            {{ getText(task.whatDoing) }}
          </div>
        </template>

        <template v-else>
          <div v-if="getExercisePart('back')" class="exercise-block">
            <div class="exercise-title">
              {{ $t("taskDetails.back") }}
            </div>

            <div class="text">
              {{ getExercisePart("back") }}
            </div>
          </div>

          <div v-if="getExercisePart('legs')" class="exercise-block">
            <div class="exercise-title">
              {{ $t("taskDetails.legs") }}
            </div>

            <div class="text">
              {{ getExercisePart("legs") }}
            </div>
          </div>

          <div v-if="getExercisePart('abs')" class="exercise-block">
            <div class="exercise-title">
              {{ $t("taskDetails.abs") }}
            </div>

            <div class="text">
              {{ getExercisePart("abs") }}
            </div>
          </div>

          <div v-if="!hasExerciseData" class="text">
            {{ getText(task.whatDoing) }}
          </div>
        </template>

        <hr class="separator content-separator" />

        <div class="section-title">
          {{ $t("taskDetails.whyToDo") }}
        </div>

        <div class="text">
          {{ task.whyDoing }}
        </div>
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";

import type { Task } from "~/interfaces/Task.interface";

interface Props {
  modelValue: boolean;
  task: Task | null;
}

interface ExerciseData {
  abs?: string;
  back?: string;
  legs?: string;
}

const props = defineProps<Props>();

defineEmits<{
  (event: "update:modelValue", value: boolean): void;
}>();

function isExerciseData(value: unknown): value is ExerciseData {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (isExerciseData(value)) {
    return Object.values(value)
      .filter((item): item is string => typeof item === "string")
      .join("\n");
  }

  return "";
}

function getExercisePart(part: keyof ExerciseData): string {
  if (!props.task) {
    return "";
  }

  const value = props.task.whatDoing;

  if (!isExerciseData(value)) {
    return "";
  }

  const partValue = value[part];

  return typeof partValue === "string" ? partValue : "";
}

const hasExerciseData = computed(() => {
  if (!props.task) {
    return false;
  }

  const value = props.task.whatDoing;

  if (!isExerciseData(value)) {
    return false;
  }

  return Boolean(value.abs || value.back || value.legs);
});
</script>

<style scoped>
.dialog {
  width: min(92vw, 700px);
  max-width: 700px;
  max-height: 90vh;
  border-radius: 28px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--white);
}

.header {
  position: relative;
  padding: 20px 24px 16px 24px;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--white);
  border: none;
  cursor: pointer;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.title {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.3;
  padding-right: 40px;
  margin-bottom: 12px;
}

.reward-chip {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--green);
  color: var(--white);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}

.separator {
  border: none;
  height: 1px;
  background: var(--border-default);
  margin: 0;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 14px;
}

.exercise-block {
  margin-bottom: 20px;
}

.exercise-title {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--green);
}

.text {
  font-size: 15px;
  line-height: 1.7;
  color: var(--grey-dark);
  white-space: pre-line;
}

.content-separator {
  margin: 24px 0;
}
</style>