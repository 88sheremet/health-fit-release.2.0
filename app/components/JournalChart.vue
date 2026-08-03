<template>
  <div class="chart-page">
    <div class="chart-card">
      <div class="header">
        <button class="back-btn" @click="navigateTo(routes.recovery.journal)">
          <span class="material-icons">arrow_back</span>
        </button>
        <div class="title">График состояния</div>
      </div>
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { routes } from "~/router/routes";
import { computed } from "vue";
import { Line } from "vue-chartjs";
import { useJournalStore } from "~/stores/journal";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js";
import { moodEmojis } from "~/constants/moods";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip
);

const store = useJournalStore();

const checkinEntries = computed(() =>
  store.entries.filter((entry) => entry.mood != null)
);

const chartData = computed(() => ({
  labels: checkinEntries.value.map((entry) =>
    new Date(entry.date).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
    })
  ),
  datasets: [
    {
      data: checkinEntries.value.map((entry) => entry.mood),
      borderColor: "#4caf50",
      backgroundColor: "#4caf50",
      tension: 0.4,
      pointRadius: 9,
      pointHoverRadius: 11,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: { title: { display: true, text: "Дни" } },
    y: {
      min: 1,
      max: 5,
      ticks: {
        stepSize: 1,
        font: { size: 20 },
        callback(value: number) {
          return moodEmojis[value] || "";
        },
      },
    },
  },
};
</script>

<style scoped>
.chart-page {
  padding: 20px;
  background: var(--bg-gradient-main);
  min-height: 100vh;
}
.header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}
.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--black1);
}
.back-btn:hover {
  background: rgba(0, 0, 0, 0.05);
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
.back-btn > .material-icons {
  font-size: 34px;
}
</style>
