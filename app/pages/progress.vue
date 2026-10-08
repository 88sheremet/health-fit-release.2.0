<template>
  <div class="page">
    <div class="title">
      {{ $t("progress.title") }}
    </div>

    <div v-if="store.loading" class="loading">
      <q-spinner color="primary" size="40px" />
    </div>

    <template v-else>
      <q-card class="progress-card">
        <div class="card-title">⚡ {{ $t("progress.energy") }}</div>

        <div class="energy-value">{{ store.energy }} / 1000</div>

        <q-linear-progress
          :value="store.energy / 1000"
          rounded
          size="10px"
          color="primary"
          track-color="grey-3"
        />

        <div class="change">
          {{
            store.energyChange >= 0
              ? `+${store.energyChange}`
              : store.energyChange
          }}
          {{ $t("progress.last7Days") }}
        </div>
      </q-card>

      <q-card class="progress-card small-card">
        <div class="card-title">🔥 {{ $t("progress.streak") }}</div>

        <div class="big-value">
          {{ store.streak }}
          {{ $t("progress.days") }}
        </div>
      </q-card>

      <q-card class="progress-card small-card">
        <div class="card-title">😊 {{ $t("progress.mood") }}</div>

        <div class="big-value">{{ store.moodAverage }} / 5</div>

        <div v-if="store.moodChange !== 0" class="change">
          {{ store.moodChange > 0 ? "↑" : "↓" }}
          {{ Math.abs(store.moodChange).toFixed(1) }}
        </div>
      </q-card>

      <q-card class="progress-card small-card">
        <div class="card-title">✅ {{ $t("progress.tasks") }}</div>

        <div class="big-value">
          {{ store.tasksCompleted }} /
          {{ store.tasksTotal }}
        </div>

        <div class="change">{{ store.tasksPercentage }}%</div>
      </q-card>

      <div class="section">
        <div class="section-title">
          {{ $t("progress.thisWeek") }}
        </div>

        <div
          v-for="category in ['physical', 'food', 'mental']"
          :key="category"
          class="category"
        >
          <div class="category-header">
            <span>
              {{ $t(`progress.categories.${category}`) }}
            </span>

            <span> {{ store.categories[category].percentage }}% </span>
          </div>

          <q-linear-progress
            :value="store.categories[category].percentage / 100"
            rounded
            size="10px"
            color="primary"
            track-color="grey-dark"
          />
        </div>
      </div>

      <div class="focus">
        <div class="focus-title">🎯 {{ $t("progress.focus") }}</div>

        <div class="focus-category">
          {{ $t(`progress.focuses.${store.focusCategory}`) }}
        </div>

        <div class="focus-text">
          {{
            $t("progress.focusText", {
              count: store.focusCompleted,
            })
          }}
        </div>
      </div>
    </template>

    <BottomNavigation />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useProgressStore } from "~/stores/progress";

definePageMeta({
  middleware: "auth",
  layout: "authenticated",
});

const store = useProgressStore();

onMounted(() => {
  store.init();
});
</script>

<style scoped>
.page {
  width: 100%;
  min-height: 100vh;
  padding: 24px;
  padding-bottom: 100px;
  background: var(--bg-gradient-main);
}

.title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 20px;
}

.progress-card {
  margin-bottom: 12px;
  padding: 18px;
  border-radius: 20px;
  background: var(--white);
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
}

.energy-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 12px;
}

.big-value {
  font-size: 22px;
  font-weight: 700;
}

.change {
  margin-top: 6px;
  font-size: 13px;
  color: var(--green);
}

.section {
  margin-top: 28px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 16px;
}

.category {
  margin-bottom: 16px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 14px;
}

.focus {
  margin-top: 28px;
  padding: 20px;
  border-radius: 20px;
  background: var(--white);
}

.focus-title {
  font-weight: 600;
}

.focus-category {
  font-size: 20px;
  font-weight: 700;
  margin-top: 12px;
}

.focus-text {
  margin-top: 6px;
  color: var(--grey);
}

.loading {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}
</style>
