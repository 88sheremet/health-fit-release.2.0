<template>
  <div class="chart-page">
    <div class="chart-card">
      <div class="header">
        <button class="back-btn" @click="navigateTo(routes.recovery.journal)">
          <span class="material-icons">arrow_back</span>
        </button>

        <div class="title">
          {{ $t("journal.chart.header") }}
        </div>
      </div>

      <div class="chart-wrapper">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Line } from "vue-chartjs";
import { useJournalStore } from "~/stores/journal";
import { routes } from "~/router/routes";
import { moodEmojis } from "~/constants/moods";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  type ChartOptions,
  type TooltipItem,
  type ChartData,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip
);

const store = useJournalStore();

const { locale, t } = useI18n();

const CHART_GREEN = "#4caf50";

const checkinEntries = computed(() =>
  store.entries
    .filter((entry) => entry.mood != null)
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
);

const chartData = computed<ChartData<"line", (number | null)[], string>>(
  () => ({
    labels: checkinEntries.value.map((entry) =>
      new Date(entry.date).toLocaleDateString(locale.value, {
        day: "2-digit",
        month: "2-digit",
      })
    ),

    datasets: [
      {
        data: checkinEntries.value.map((entry) => entry.mood ?? null),

        borderColor: CHART_GREEN,
        backgroundColor: CHART_GREEN,

        tension: 0.4,

        pointRadius: 10,
        pointHoverRadius: 12,

        pointBackgroundColor: "transparent",
        pointBorderColor: "transparent",
        pointHoverBackgroundColor: "transparent",
        pointHoverBorderColor: "transparent",
      },
    ],
  })
);

const chartOptions = computed<ChartOptions<"line">>(() => ({
  responsive: true,

  maintainAspectRatio: true,

  interaction: {
    intersect: false,
    mode: "index",
  },

  plugins: {
    legend: {
      display: false,
    },

    tooltip: {
      displayColors: false,

      callbacks: {
        title(items: TooltipItem<"line">[]) {
          const firstItem = items[0];

          if (!firstItem) {
            return "";
          }

          const index = firstItem.dataIndex;
          const entry = checkinEntries.value[index];

          if (!entry) {
            return "";
          }

          return new Date(entry.date).toLocaleDateString(locale.value, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        },

        label(context: TooltipItem<"line">) {
          const index = context.dataIndex;
          const entry = checkinEntries.value[index];

          if (!entry) {
            return "";
          }

          const emoji = entry.mood != null ? moodEmojis[entry.mood] : "";

          return `${emoji} ${t("journal.chart.mood", {
            value: entry.mood,
          })}`;
        },

        afterLabel(context: TooltipItem<"line">) {
          const index = context.dataIndex;
          const entry = checkinEntries.value[index];

          if (!entry?.note) {
            return "";
          }

          return `\n${entry.note}`;
        },
      },
    },
  },

  scales: {
    x: {
      title: {
        display: true,
        text: t("journal.chart.days"),
      },
    },

    y: {
      min: 1,
      max: 5,

      ticks: {
        stepSize: 1,

        font: {
          size: 20,
        },

        callback(value: string | number) {
          return moodEmojis[value as number] || "";
        },
      },
    },
  },
}));

const emojiPlugin = {
  id: "moodEmoji",

  afterDatasetsDraw(chart: any) {
    const { ctx, data } = chart;

    const dataset = data.datasets[0];

    if (!dataset) {
      return;
    }

    const meta = chart.getDatasetMeta(0);

    meta.data.forEach((point: any, index: number) => {
      const value = dataset.data[index];

      const emoji = moodEmojis[value];

      if (!emoji) {
        return;
      }

      ctx.save();

      ctx.font = "22px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillText(emoji, point.x, point.y);

      ctx.restore();
    });
  },
};

ChartJS.register(emojiPlugin);
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
  background: var(--shadow-md);
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

.chart-wrapper {
  width: 100%;
  margin-top: 20px;
}
</style>