<template>  <!--
    Линейный график настроения по ежедневным чек-инам:
    шапка с возвратом к журналу, заголовок и сам график
    через компонент Line из vue-chartjs.
  -->
  <div class="chart-page">
    <div class="chart-card">
      <!--
        Шапка: кнопка «назад» (routes.recovery.journal)
        и заголовок раздела из i18n (journal.chart.header).
      -->
      <div class="header">
        <button class="back-btn" @click="navigateTo(routes.recovery.journal)">
          <span class="material-icons">arrow_back</span>
        </button>

        <div class="title">
          {{ $t("journal.chart.header") }}
        </div>
      </div>

      <!--
        Контейнер графика: реактивные данные и опции
        подготавливаются в script setup ниже.
      -->
      <div class="chart-wrapper">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/*
 * ============================================================
 * IMPORTS
 * ============================================================
 */

/* computed — реактивные данные и опции графика. */
import { computed } from "vue";

/* Компонент Line из vue-chartjs (обёртка над Chart.js). */
import { Line } from "vue-chartjs";

/* Стор журнала — записи-чек-ины для построения точек. */
import { useJournalStore } from "~/stores/journal";

/* Централизованные маршруты: кнопка «назад» к журналу. */
import { routes } from "~/router/routes";

/* Эмодзи настроения — подписи оси Y и содержимое тултипа. */
import { moodEmojis } from "~/constants/moods";

/*
 * Импорты Chart.js: регистрацией ниже подключаются только
 * нужные модули (tree-shaking), плюс типы для data/options.
 */
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

/*
 * ============================================================
 * CHART CONFIG
 * ============================================================
 */

/*
 * Регистрация модулей Chart.js, без которых ломается Line:
 * категориальная ось X, линейная ось Y, элементы точки
 * и линии, а также тултип.
 */
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip
);

/*
 * ============================================================
 * DEPENDENCIES
 * ============================================================
 */

/* Стор с записями журнала (фильтруются по type "checkin"). */
const store = useJournalStore();

/* locale — формат дат в подписях и тултипах; t — переводы
   подписей графика, зависящие от языка интерфейса. */
const { locale, t } = useI18n();

/*
 * ============================================================
 * REACTIVE STATE
 * ============================================================
 */

/* Цвет линии и точек графика: значение CSS-переменной
   --green с запасным зелёным на случай недоступности. */
const CHART_GREEN = resolveCssColor("--green", "#4caf50");

/*
 * Читает значение CSS-переменной у корня документа.
 * 1. На сервере (SSR) window отсутствует — fallback.
 * 2. Иначе берёт значение getComputedStyle; если переменная
 *    не определена или пуста — снова fallback.
 */
function resolveCssColor(varName: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(varName).trim() ||
    fallback
  );
}

/*
 * ============================================================
 * COMPUTED
 * ============================================================
 */

/*
 * Записи для графика: на график попадают ТОЛЬКО чек-ины
 * (type === "checkin"), заметки отфильтрованы. Благодаря
 * slice() сортировка не мутирует массив стора; порядок —
 * по дате по возрастанию, точки идут календарно.
 */
const checkinEntries = computed(() =>
  store.entries
    .filter((entry) => entry.type === "checkin")
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
);

/*
 * ДАННЫЕ ГРАФИКА (datasets).
 * labels — короткие даты DD.MM в текущей локали.
 * datasets[0]:
 *   data — значения mood чек-инов (null, если отсутствует);
 *   borderColor/backgroundColor — цвет из переменной --green;
 *   tension 0.4 — плавное сглаживание линии;
 *   pointRadius 10 / hover 12 — невидимые «подложки» точек,
 *   так как сами эмодзи поверх рисует emojiPlugin.
 */
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

/*
 * ОПЦИИ ГРАФИКА.
 * responsive + maintainAspectRatio — адаптивность;
 * interaction по "index" без пересечения — тултипы целой
 * колонки; легенда скрыта (узлов всего один датасет).
 * Тултип: title — полная локализованная дата чек-ина,
 * label — эмодзи + перевод journal.chart.mood (i18n),
 * afterLabel — текст заметки, если он есть.
 * Ось Y — шкала 1..5 с эмодзи-подписями (шаг 1),
 * ось X — подпись переводом journal.chart.days.
 */
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

          /* Полная дата чек-ина в формате текущей локали. */
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

          /* Эмодзи настроения + локализованный текст «настроение». */
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

          /* Заметка чек-ина — дополнительной строкой тултипа. */
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

        /* Подписи делений оси Y — эмодзи настроения. */
        callback(value: string | number) {
          return moodEmojis[value as number] || "";
        },
      },
    },
  },
}));

/*
 * ============================================================
 * EMOJI PLUGIN
 * ============================================================
 */

/*
 * Пользовательский плагин Chart.js: рисует эмодзи настроения
 * вместо стандартных точек линии. afterDatasetsDraw вызывается
 * сразу после отрисовки датасета:
 * 1. Берёт контекст canvas и данные первого датасета.
 * 2. Для каждой точки сопоставляет значение с эмодзи
 *    по таблице moodEmojis (шкала 1..5).
 * 3. Центрирует эмодзи в координатах точки через fillText.
 */
const emojiPlugin = {
  id: "moodEmoji",

  afterDatasetsDraw(chart: any) {
    const { ctx, data } = chart;

    /* Первый (единственный) датасет может отсутствовать. */
    const dataset = data.datasets[0];

    if (!dataset) {
      return;
    }

    /* Метаданные точек: координаты узлов после расчёта layout. */
    const meta = chart.getDatasetMeta(0);

    meta.data.forEach((point: any, index: number) => {
      const value = dataset.data[index];

      /* Нет эмодзи (null/неизвестное значение) — пропуск. */
      const emoji = moodEmojis[value];

      if (!emoji) {
        return;
      }

      ctx.save();

      /* Шрифт и выравнивание — эмодзи по центру узла. */
      ctx.font = "22px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillText(emoji, point.x, point.y);

      ctx.restore();
    });
  },
};

/* Регистрация плагина — Chart.js учтёт его при рендере. */
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