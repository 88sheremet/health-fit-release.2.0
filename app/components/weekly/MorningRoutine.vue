<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

import { useMorningRoutine } from "~/composables/useMorningRoutine";

import squatsVideo from "~/assets/exercises/squats.mp4";
import pushVideo from "~/assets/exercises/push.mp4";
import plankVideo from "~/assets/exercises/plank.mp4";
import lungesVideo from "~/assets/exercises/lunges.mp4";
import absVideo from "~/assets/exercises/ads.mp4";
import supermanVideo from "~/assets/exercises/superman.mp4";

const {
  completedDays,
  completedCount,
  missedDays,
  currentChallengeDay,
  status,
  canCompleteToday,
  isTodayCompleted,
  isLoading,
  isSubmitting,
  error,
  loadProgress,
  completeToday,
} = useMorningRoutine();

const { t } = useI18n();

interface Exercise {
  id: string;
  titleKey: string;
  file: string;
}

const exercises: Exercise[] = [
  {
    id: "squats",
    titleKey: "weekly.morningRoutine.exercises.squats",
    file: "squats.mp4",
  },
  {
    id: "knee-push-ups",
    titleKey: "weekly.morningRoutine.exercises.kneePushUps",
    file: "push.mp4",
  },
  {
    id: "plank",
    titleKey: "weekly.morningRoutine.exercises.plank",
    file: "plank.mp4",
  },
  {
    id: "reverse-lunges",
    titleKey: "weekly.morningRoutine.exercises.reverseLunges",
    file: "lunges.mp4",
  },
  {
    id: "crunches",
    titleKey: "weekly.morningRoutine.exercises.crunches",
    file: "ads.mp4",
  },
  {
    id: "superman",
    titleKey: "weekly.morningRoutine.exercises.superman",
    file: "superman.mp4",
  },
];

const videoSources: Record<string, string> = {
  "squats.mp4": squatsVideo,
  "push.mp4": pushVideo,
  "plank.mp4": plankVideo,
  "lunges.mp4": lungesVideo,
  "ads.mp4": absVideo,
  "superman.mp4": supermanVideo,
};

const selectedExerciseIndex = ref(0);

const selectedExercise = computed(
  () => exercises[selectedExerciseIndex.value] ?? exercises[0]!
);

const selectedVideoSrc = computed(
  () => videoSources[selectedExercise.value.file] ?? "",
);

const days = computed(() =>
  Array.from({ length: 7 }, (_, index) => {
    const dayNumber = index + 1;

    return {
      number: dayNumber,
      completed: completedDays.value.includes(dayNumber),
      current: dayNumber === currentChallengeDay.value,
      missed:
        dayNumber < currentChallengeDay.value &&
        !completedDays.value.includes(dayNumber),
    };
  }),
);

const statusTitle = computed(() =>
  t(`weekly.morningRoutine.status.${status.value}.title`),
);

const statusDescription = computed(() =>
  t(`weekly.morningRoutine.status.${status.value}.description`),
);

const progress = computed(() => completedCount.value / 7);

async function handleComplete() {
  await completeToday();
}

onMounted(() => {
  loadProgress();
});
</script>

<template>
  <q-card class="morning-routine" flat>
    <q-card-section>
      <div class="row items-center justify-between q-mb-md">
        <div>
          <div class="text-h5 text-weight-bold">
            {{ $t("weekly.morningRoutine.title") }}
          </div>

          <div class="text-subtitle2 text-grey-7">
            {{ $t("weekly.morningRoutine.subtitle") }}
          </div>
        </div>

        <q-icon name="wb_sunny" size="36px" color="orange" />
      </div>

      <div class="text-body2 q-mb-md">
        {{ statusDescription }}
      </div>

      <q-banner
        v-if="status === 'success'"
        class="bg-green-1 text-green-9 q-mb-md"
        rounded
      >
        <template #avatar>
          <q-icon name="check_circle" />
        </template>

        {{ statusTitle }}
      </q-banner>

      <q-banner
        v-else-if="status === 'failed'"
        class="bg-orange-1 text-orange-9 q-mb-md"
        rounded
      >
        <template #avatar>
          <q-icon name="info" />
        </template>

        {{ statusTitle }}
      </q-banner>

      <q-banner
        v-else-if="status === 'upcoming'"
        class="bg-blue-1 text-blue-9 q-mb-md"
        rounded
      >
        {{ statusTitle }}
      </q-banner>

      <div class="row items-center justify-between q-mb-sm">
        <span class="text-weight-medium">
          {{ $t("weekly.morningRoutine.progress") }}
        </span>

        <span class="text-weight-bold"> {{ completedCount }} / 7 </span>
      </div>

      <q-linear-progress
        :value="progress"
        color="positive"
        track-color="grey-3"
        rounded
        size="10px"
      />

      <div class="row justify-between text-caption text-grey-7 q-mt-sm">
        <span>
          {{ $t("weekly.morningRoutine.completed") }} {{ completedCount }}
        </span>
        <span>
          {{ $t("weekly.morningRoutine.missed") }} {{ missedDays }}
        </span>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="text-subtitle1 text-weight-bold q-mb-md">
        {{ $t("weekly.morningRoutine.weekTitle") }}
      </div>

      <div class="row q-col-gutter-sm">
        <div v-for="day in days" :key="day.number" class="col">
          <div
            class="day-item"
            :class="{
              'day-item--completed': day.completed,
              'day-item--current': day.current,
              'day-item--missed': day.missed,
            }"
          >
            <div class="text-caption">
              {{ $t("weekly.morningRoutine.day") }}
            </div>

            <div class="text-h6 text-weight-bold">
              {{ day.number }}
            </div>

            <q-icon
              v-if="day.completed"
              name="check_circle"
              color="positive"
              size="20px"
            />

            <q-icon
              v-else-if="day.missed"
              name="close"
              color="negative"
              size="20px"
            />

            <q-icon
              v-else-if="day.current"
              name="today"
              color="primary"
              size="20px"
            />

            <q-icon
              v-else
              name="radio_button_unchecked"
              color="grey-5"
              size="20px"
            />
          </div>
        </div>
      </div>

      <div v-if="status === 'active'" class="text-caption text-grey-7 q-mt-md">
        {{ $t("weekly.morningRoutine.skipHint") }}
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="text-subtitle1 text-weight-bold q-mb-md">
        {{ $t("weekly.morningRoutine.exercisesTitle") }}
      </div>

      <div class="exercise-list q-mb-md">
        <q-btn
          v-for="(exercise, index) in exercises"
          :key="exercise.id"
          :label="$t(exercise.titleKey)"
          :class="[
            'exercise-btn',
            selectedExerciseIndex === index
              ? 'exercise-btn--active'
              : 'exercise-btn--inactive',
          ]"
          no-caps
          unelevated
          @click="selectedExerciseIndex = index"
        />
      </div>

      <div class="text-weight-medium q-mb-sm">
        {{ $t(selectedExercise.titleKey) }}
      </div>

      <video
        :key="selectedVideoSrc"
        class="exercise-video"
        :src="selectedVideoSrc"
        controls
        playsinline
        preload="metadata"
      />
    </q-card-section>

    <q-separator />

    <q-card-section>
      <q-btn
        v-if="canCompleteToday"
        :label="$t('weekly.morningRoutine.completeToday')"
        color="positive"
        icon="check_circle"
        class="complete-btn full-width"
        no-caps
        unelevated
        :loading="isSubmitting"
        :disable="isLoading"
        @click="handleComplete"
      />

      <q-banner
        v-else-if="isTodayCompleted"
        class="bg-green-1 text-green-9"
        rounded
      >
        <template #avatar>
          <q-icon name="check_circle" />
        </template>

        {{ $t("weekly.morningRoutine.todayCompleted") }}
      </q-banner>

      <q-banner v-else-if="status === 'active'" class="bg-grey-2" rounded>
        {{ $t("weekly.morningRoutine.dayUnavailable") }}
      </q-banner>

      <div v-if="error" class="text-negative text-caption q-mt-md">
        {{ error ? $t(error) : "" }}
      </div>

      <div v-if="isLoading" class="row justify-center q-mt-md">
        <q-spinner color="primary" size="30px" />
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped>
.morning-routine {
  width: 100%;
  border-radius: 16px;
}

.day-item {
  min-width: 0;
  padding: 10px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--q-separator-color);
  border-radius: 12px;
  background: var(--day-bg);
}

.day-item--completed {
  border-color: var(--q-positive);
  background: var(--day-completed-bg);
}

.day-item--current {
  border: 2px solid var(--q-primary);
}

.day-item--missed {
  border-color: var(--q-negative);
  background: var(--day-missed-bg);
}

.exercise-video {
  display: block;
  width: 100%;
  max-height: 420px;
  border-radius: 12px;
  background: var(--black);
  object-fit: contain;
}

.exercise-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.exercise-btn {
  min-height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.exercise-btn:active {
  transform: scale(0.97);
}

.exercise-btn--active {
  background: var(--q-primary);
  color: var(--white);
}

.exercise-btn--inactive {
  background: var(--exercise-btn-bg);
  color: var(--q-primary);
}

.complete-btn {
  min-height: 54px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0;
  box-shadow: var(--complete-btn-shadow);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.complete-btn:active {
  transform: scale(0.98);
  box-shadow: none;
}
</style>
