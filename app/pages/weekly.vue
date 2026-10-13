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
      <div class="badge">
        {{ $t("weekly.badge") }}
      </div>

      <div class="task-title">
        {{ store.currentTask.nameProgram }}
      </div>

      <div class="section">
        <div class="section-title">
          {{ $t("weekly.whatToDo") }}
        </div>

        <div class="text">
          {{ store.currentTask.whatDoing }}
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          {{ $t("weekly.whyNeeded") }}
        </div>

        <div class="text">
          {{ store.currentTask.whyDoing }}
        </div>
      </div>

      <!-- Чек-лист только для задания по очистке пространства -->
      <div v-if="store.isSpaceCleanupTask" class="checklist">
        <div class="checklist-header">
          <div class="section-title">
            {{ $t("weekly.zones.title") }}
          </div>

          <div class="progress-count">
            {{ store.completedZoneCount }}/{{ store.zoneCount }}
          </div>
        </div>

        <div
          class="progress-track"
          role="progressbar"
          :aria-valuenow="store.completedZoneCount"
          :aria-valuemin="0"
          :aria-valuemax="store.zoneCount"
        >
          <div
            class="progress-fill"
            :style="{ width: `${store.zoneProgressPercent}%` }"
          />
        </div>

        <div class="progress-caption">
          {{
            $t("weekly.zones.progress", {
              completed: store.completedZoneCount,
              total: store.zoneCount,
            })
          }}
        </div>

        <div class="zone-list">
          <q-checkbox
            v-for="zone in zones"
            :key="zone.key"
            :model-value="store.zoneProgress[zone.key] === true"
            :label="$t(zone.label)"
            color="positive"
            keep-color
            :disable="store.isCompleted() || savingZones[zone.key]"
            class="zone-checkbox"
            @update:model-value="toggleZone(zone.key, $event)"
          />
        </div>

        <div v-if="zoneError" class="error-message">
          {{ zoneError }}
        </div>
      </div>

      <q-btn
        v-if="!store.isCompleted()"
        color="primary"
        unelevated
        no-caps
        class="complete-btn"
        :label="$t('weekly.completedBtn')"
        :loading="completing"
        :disable="
          !store.canComplete ||
          (store.isSpaceCleanupTask && !store.allZonesCompleted) ||
          completing
        "
        @click="completeWeeklyTask"
      />

      <div v-if="!store.canComplete && !store.isCompleted()" class="week-info">
        {{ $t("weekly.info") }}
      </div>

      <div
        v-else-if="
          store.isSpaceCleanupTask &&
          !store.allZonesCompleted &&
          !store.isCompleted()
        "
        class="week-info"
      >
        {{ $t("weekly.zones.completeAll") }}
      </div>

      <div v-if="taskError" class="error-message">
        {{ taskError }}
      </div>

      <div v-if="store.isCompleted()" class="success-banner">
        {{ $t("weekly.successBanner") }}
      </div>
    </q-card>

    <BottomNavigation />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

import { useWeeklyTaskStore } from "~/stores/weeklyTasks";
import type { WeeklyZoneKey } from "~/interfaces/WeeklyState.interface";

definePageMeta({
  middleware: "auth",
  layout: "authenticated",
});

const { locale } = useI18n();
const store = useWeeklyTaskStore();

const completing = ref(false);
const zoneError = ref("");
const taskError = ref("");

const savingZones = reactive<Record<WeeklyZoneKey, boolean>>({
  desk: false,
  wardrobe: false,
  nightstand: false,
  shelves: false,
  drawers: false,
});

const zones: { key: WeeklyZoneKey; label: string }[] = [
  { key: "desk", label: "weekly.zones.desk" },
  { key: "wardrobe", label: "weekly.zones.wardrobe" },
  { key: "nightstand", label: "weekly.zones.nightstand" },
  { key: "shelves", label: "weekly.zones.shelves" },
  { key: "drawers", label: "weekly.zones.drawers" },
];

await store.init(locale.value);

watch(locale, async (newLocale) => {
  await store.loadTasks(newLocale);
});

async function toggleZone(
  zoneKey: WeeklyZoneKey,
  checked: boolean | string | number | null,
) {
  zoneError.value = "";

  if (
    !store.isSpaceCleanupTask ||
    store.isCompleted() ||
    savingZones[zoneKey]
  ) {
    return;
  }

  const nextValue = checked === true;
  const currentValue = store.zoneProgress[zoneKey] === true;

  if (currentValue === nextValue) {
    return;
  }

  savingZones[zoneKey] = true;

  try {
    // Store toggleZone инвертирует текущее значение.
    await store.toggleZone(zoneKey);
  } catch (error) {
    console.error("[WeeklyPage] Не удалось сохранить зону:", error);

    zoneError.value = "Не удалось сохранить прогресс. Попробуйте ещё раз.";
  } finally {
    savingZones[zoneKey] = false;
  }
}

async function completeWeeklyTask() {
  taskError.value = "";

  if (!store.canComplete) {
    return;
  }

  if (store.isSpaceCleanupTask && !store.allZonesCompleted) {
    return;
  }

  completing.value = true;

  try {
    await store.completeCurrentTask();
  } catch (error) {
    console.error("[WeeklyPage] Не удалось завершить задание:", error);

    taskError.value = "Не удалось завершить задание. Попробуйте ещё раз.";
  } finally {
    completing.value = false;
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding: 20px;
  padding-bottom: 100px;
  background: var(--bg-gradient-main);
}

.header {
  margin-bottom: 20px;
}

.title {
  font-size: 30px;
  font-weight: 700;
}

.subtitle {
  margin-top: 4px;
  color: var(--grey);
}

.week-day {
  margin-top: 6px;
  font-size: 14px;
  color: var(--green);
}

.task-card {
  padding: 24px;
  border-radius: 24px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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

.text {
  color: var(--grey-dark);
  line-height: 1.7;
  white-space: pre-line;
}

.checklist {
  margin: 28px 0 24px;
  padding: 18px;
  border: 1px solid var(--grey-hover);
  border-radius: 18px;
}

.checklist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.checklist-header .section-title {
  margin-bottom: 0;
}

.progress-count {
  flex-shrink: 0;
  color: var(--green-deep);
  font-size: 16px;
  font-weight: 700;
}

.progress-track {
  height: 8px;
  margin-top: 16px;
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

.zone-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 14px;
}

.zone-checkbox {
  min-height: 44px;
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

.week-info {
  margin-top: 12px;
  color: var(--grey);
  font-size: 14px;
  text-align: center;
  line-height: 1.5;
}

.error-message {
  margin-top: 12px;
  color: var(--negative);
  font-size: 14px;
  line-height: 1.5;
}
</style>
