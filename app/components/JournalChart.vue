<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="chart-page">
        <q-card class="chart-card">
          <div class="header">
            <q-btn
              flat
              round
              icon="arrow_back"
              class="back-btn"
              @click="goBack"
            />

            <div class="title">График состояния</div>
          </div>

          <Line :data="chartData" :options="chartOptions" />
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { routes } from "../router/index";
import { computed } from "vue";
import { Line } from "vue-chartjs";
import { useJournalStore } from "../stores/journal";
import { useRouter } from "vue-router";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";
import { moodEmojis } from "../constants/moods";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip
);

const store = useJournalStore();
const router = useRouter();

function goBack() {
  router.push(routes.recovery.journal);
}
const chartData = computed(() => ({
  labels: store.entries.map((entry) =>
    new Date(entry.date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })
  ),
  datasets: [
    {
      data: store.entries.map((entry) => entry.mood),
      borderColor: "#4caf50",
      backgroundColor: "#4caf50",
      tension: 0.4,
      pointRadius: 6,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      title: {
        display: true,
        text: "Дни",
      },
    },
    y: {
      min: 1,
      max: 5,
      ticks: {
        stepSize: 1,
        callback(value: number) {
          return moodEmojis[value] || "";
        },
      },
    },
  },
};
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}

.back-btn {
  color: var(--black1);
}
.chart-page {
  padding: 20px;
  background: var(--bg-gradient-main);
  min-height: 100vh;
}

.chart-card {
  padding: 24px;
  border-radius: 24px;
}

.title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}
</style>