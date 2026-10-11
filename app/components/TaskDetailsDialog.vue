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
          aria-label="Close"
          @click="$emit('update:modelValue', false)"
        >
          <span class="material-icons">close</span>
        </button>

        <div class="title">{{ task.title }}</div>

        <div class="header-meta">
          <span class="reward-chip">
            {{ $t("taskDetails.reward", { n: task.reward }) }}
          </span>

          <span class="category-chip" :class="`category-${task.type}`">
            {{ categoryLabel }}
          </span>
        </div>
      </div>

      <hr class="separator" />

      <div class="content">
        <div class="section-title">
          {{ $t("taskDetails.whatToDo") }}
        </div>

        <template v-if="task.type !== 'physical'">
          <div class="text">{{ getText(task.whatDoing) }}</div>
        </template>

        <template v-else>
          <div v-if="getExercisePart('back')" class="exercise-block">
            <div class="exercise-title">{{ $t("taskDetails.back") }}</div>
            <div class="text">{{ getExercisePart("back") }}</div>
          </div>

          <div v-if="getExercisePart('legs')" class="exercise-block">
            <div class="exercise-title">{{ $t("taskDetails.legs") }}</div>
            <div class="text">{{ getExercisePart("legs") }}</div>
          </div>

          <div v-if="getExercisePart('abs')" class="exercise-block">
            <div class="exercise-title">{{ $t("taskDetails.abs") }}</div>
            <div class="text">{{ getExercisePart("abs") }}</div>
          </div>

          <div v-if="!hasExerciseData" class="text">
            {{ getText(task.whatDoing) }}
          </div>
        </template>

        <hr class="separator content-separator" />

        <div class="section-title">
          {{ $t("taskDetails.whyToDo") }}
        </div>

        <div class="text">{{ task.whyDoing }}</div>

        <div
          v-if="task.type === 'mental' && step === 'feedback' && !isDone"
          class="feedback-section"
        >
          <div class="section-title">
            {{ $t("taskDetails.feedbackTitle") }}
          </div>

          <div class="text feedback-hint">
            {{ $t("taskDetails.feedbackDescription") }}
          </div>

          <q-option-group
            v-model="selectedImprovement"
            :options="improvementOptions"
            type="radio"
            color="primary"
            class="feedback-options"
          />
        </div>
      </div>

      <div class="actions">
        <div v-if="isDone" class="done-status">
          <span class="material-icons">check_circle</span>
          {{ $t("daily.done") }}
        </div>

        <template v-else>
          <q-btn
            class="complete-btn"
            unelevated
            no-caps
            color="primary"
            text-color="white"
            :label="actionLabel"
            :disable="isFeedbackStep && !selectedImprovement"
            @click="handleAction"
          />
        </template>
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import type { Task } from "~/interfaces/Task.interface";

type UserGender = "male" | "female" | null;
type Step = "ready" | "practice" | "feedback";

interface Props {
  modelValue: boolean;
  task: Task | null;
  isDone?: boolean;
  gender?: UserGender;
}

interface CompletionPayload {
  feedback?: string;
}

interface ExerciseData {
  abs?: string;
  back?: string;
  legs?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isDone: false,
  gender: null,
});

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "complete", payload?: CompletionPayload): void;
}>();

const { t } = useI18n();

const step = ref<Step>("ready");
const selectedImprovement = ref("");

const isFeedbackStep = computed(
  () => props.task?.type === "mental" && step.value === "feedback",
);

const categoryLabel = computed(() => {
  if (!props.task) return "";

  return t(`taskDetails.categories.${props.task.type}`);
});

const actionLabel = computed(() => {
  if (!props.task) return "";

  if (props.task.type === "food") {
    return t(`taskDetails.actions.food.${props.gender ?? "neutral"}`);
  }

  if (step.value === "ready") {
    return t("taskDetails.actions.start");
  }

  if (props.task.type === "mental" && step.value === "feedback") {
    return t("taskDetails.actions.confirm");
  }

  return t(
    `taskDetails.actions.${props.task.type}.${props.gender ?? "neutral"}`,
  );
});

const improvementOptions = computed(() => [
  { label: t("taskDetails.improvements.mood"), value: "mood" },
  { label: t("taskDetails.improvements.calm"), value: "calm" },
  { label: t("taskDetails.improvements.focus"), value: "focus" },
  { label: t("taskDetails.improvements.energy"), value: "energy" },
  { label: t("taskDetails.improvements.none"), value: "none" },
]);

watch(
  () => [props.modelValue, props.task?.id] as const,
  ([isOpen]) => {
    if (isOpen) {
      step.value = "ready";
      selectedImprovement.value = "";
    }
  },
);

function handleAction() {
  if (!props.task || props.isDone) return;

  if (props.task.type === "food") {
    emit("complete");
    return;
  }

  if (step.value === "ready") {
    step.value = "practice";
    return;
  }

  if (props.task.type === "mental" && step.value === "practice") {
    step.value = "feedback";
    return;
  }

  if (props.task.type === "mental" && step.value === "feedback") {
    if (!selectedImprovement.value) return;

    emit("complete", { feedback: selectedImprovement.value });
    return;
  }

  if (props.task.type === "physical" && step.value === "practice") {
    emit("complete");
  }
}

function handleBack() {
  if (step.value === "feedback") {
    step.value = "practice";
  } else {
    step.value = "ready";
  }
}

function isExerciseData(value: unknown): value is ExerciseData {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getText(value: unknown): string {
  if (typeof value === "string") return value;

  if (isExerciseData(value)) {
    return Object.values(value)
      .filter((item): item is string => typeof item === "string")
      .join("\n");
  }

  return "";
}

function getExercisePart(part: keyof ExerciseData): string {
  if (!props.task || !isExerciseData(props.task.whatDoing)) return "";

  const partValue = props.task.whatDoing[part];

  return typeof partValue === "string" ? partValue : "";
}

const hasExerciseData = computed(() => {
  if (!props.task || !isExerciseData(props.task.whatDoing)) return false;

  const value = props.task.whatDoing;

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
  padding: 20px 24px 16px;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 10px;
  background: var(--white);
  border: none;
  cursor: pointer;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 20px;
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

.header-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.reward-chip,
.category-chip {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

.reward-chip {
  background: var(--green);
  color: var(--white);
}

.category-chip {
  background: var(--bg-gradient-main);
  color: var(--grey-dark);
}

.separator {
  border: none;
  height: 1px;
  background: var(--border-default);
  margin: 0;
  flex-shrink: 0;
}

.content {
  flex: 1;
  min-height: 0;
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

.feedback-section {
  margin-top: 24px;
  padding: 18px;
  border-radius: 18px;
  background: var(--bg-gradient-main);
}

.feedback-hint {
  margin-bottom: 12px;
}

.feedback-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 24px 24px;
  border-top: 1px solid var(--border-default);
  background: var(--white);
}

.complete-btn,
.back-btn {
  width: 100%;
  min-height: 46px;
  border-radius: 14px;
  font-weight: 600;
}

.done-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--green);
  font-weight: 700;
  padding: 12px;
}

@media (max-width: 480px) {
  .header {
    padding: 18px 20px 14px;
  }

  .content {
    padding: 20px;
  }

  .actions {
    padding: 14px 20px 20px;
  }

  .title {
    font-size: 21px;
  }
}
</style>
