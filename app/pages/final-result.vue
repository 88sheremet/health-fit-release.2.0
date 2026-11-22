<template>
  <div class="page">
    <div v-if="loading" class="loading">
      <q-spinner-dots size="42px" color="primary" />
    </div>

    <div v-else-if="error" class="error-card">
      {{ error }}
    </div>

    <template v-else-if="initialResult && finalResult">
      <!-- Загальний прогрес -->
      <section class="hero">
        <div class="hero-icon">
          <span class="material-icons">emoji_events</span>
        </div>

        <div class="eyebrow">
          {{ $t("program.reportEyebrow") }}
        </div>

        <h1 class="title">
          {{ $t("program.finalTitle") }}
        </h1>

        <p class="subtitle">
          {{ $t("program.finalDescription") }}
        </p>
      </section>

      <section class="overall-card">
        <div class="section-heading">
          {{ $t("program.overallProgress") }}
        </div>

        <div class="overall-result">
          <div class="overall-number">
            {{ totalInitial }}
            <span class="overall-arrow material-icons">arrow_forward</span>
            {{ totalFinal }}
          </div>

          <div class="overall-change" :class="overallStatusClass">
            <span class="material-icons">
              {{ overallIcon }}
            </span>
            {{ overallChangeText }}
          </div>
        </div>

        <div class="overall-labels">
          <span>{{ $t("program.initialScore") }}</span>
          <span>{{ $t("program.finalScore") }}</span>
        </div>

        <div class="overall-bars">
          <div class="overall-bar-row">
            <span>{{ $t("program.initialScore") }}</span>
            <div class="bar-track">
              <div
                class="bar-fill initial-fill"
                :style="{ width: `${(totalInitial / 135) * 100}%` }"
              />
            </div>
            <strong>{{ totalInitial }}</strong>
          </div>

          <div class="overall-bar-row">
            <span>{{ $t("program.finalScore") }}</span>
            <div class="bar-track">
              <div
                class="bar-fill final-fill"
                :style="{ width: `${(totalFinal / 135) * 100}%` }"
              />
            </div>
            <strong>{{ totalFinal }}</strong>
          </div>
        </div>

        <div class="score-explanation">
          <span class="material-icons">info</span>
          {{ $t("program.scoreExplanation") }}
        </div>
      </section>

      <!-- Прогрес за напрямами -->
      <section class="directions-section">
        <div class="section-heading">
          {{ $t("program.directionsTitle") }}
        </div>

        <p class="section-description">
          {{ $t("program.directionsDescription") }}
        </p>

        <q-card
          v-for="item in comparisons"
          :key="item.key"
          flat
          class="direction-card"
        >
          <div class="direction-header">
            <div class="direction-title">
              {{ $t(item.label) }}
            </div>

            <div class="change-badge" :class="item.status">
              <span class="material-icons">
                {{ item.icon }}
              </span>
              {{ item.changeText }}
            </div>
          </div>

          <div class="direction-scores">
            <div class="score-block">
              <div class="score-value">
                {{ item.initial }}
              </div>
              <div class="score-caption">
                {{ $t("program.initialScore") }}
              </div>
            </div>

            <span class="material-icons direction-arrow"> arrow_forward </span>

            <div class="score-block">
              <div class="score-value final-value">
                {{ item.final }}
              </div>
              <div class="score-caption">
                {{ $t("program.finalScore") }}
              </div>
            </div>
          </div>

          <div class="direction-bars">
            <div class="direction-bar-row">
              <span>{{ $t("program.initialScore") }}</span>
              <div class="bar-track">
                <div
                  class="bar-fill initial-fill"
                  :style="{ width: `${(item.initial / 45) * 100}%` }"
                />
              </div>
              <strong>{{ item.initial }}</strong>
            </div>

            <div class="direction-bar-row">
              <span>{{ $t("program.finalScore") }}</span>
              <div class="bar-track">
                <div
                  class="bar-fill final-fill"
                  :style="{ width: `${(item.final / 45) * 100}%` }"
                />
              </div>
              <strong>{{ item.final }}</strong>
            </div>
          </div>

          <div class="direction-insight" :class="item.status">
            <span class="material-icons">
              {{ item.icon }}
            </span>
            {{ item.insight }}
          </div>

          <div class="max-score">
            {{ $t("program.maxScore") }}
          </div>
        </q-card>
      </section>

      <!-- Завершення програми -->
      <section class="finish-banner">
        <div class="finish-icon">
          <span class="material-icons">workspace_premium</span>
        </div>

        <div class="finish-banner-title">
          {{ $t("program.finishBannerTitle") }}
        </div>

        <div class="finish-banner-text">
          {{ $t("program.finishBannerDescription") }}
        </div>

        <div class="finish-message">
          {{ $t("program.finishMotivation") }}
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import {
  getChangeIcon,
  getChangeStatus,
  getOverallChangeText,
  getScoreComparisons,
  getTotalScore,
} from "~/utils/finalResult";

definePageMeta({
  layout: "authenticated",
  middleware: "auth",
});

interface ScreeningResult {
  physical_score: number;
  food_score: number;
  mind_score: number;
  dominant_problem: string | null;
  completed_at: string;
}

const { t } = useI18n();
const supabase = useSupabaseClient();

const loading = ref(true);
const error = ref("");

const initialResult = ref<ScreeningResult | null>(null);
const finalResult = ref<ScreeningResult | null>(null);

const totalInitial = computed(() => getTotalScore(initialResult.value));

const totalFinal = computed(() => getTotalScore(finalResult.value));

const totalImprovement = computed(() => totalInitial.value - totalFinal.value);

const overallStatusClass = computed(() =>
  getChangeStatus(totalImprovement.value)
);

const overallIcon = computed(() => getChangeIcon(overallStatusClass.value));

const overallChangeText = computed(() =>
  getOverallChangeText(totalImprovement.value, t)
);

const comparisons = computed(() =>
  getScoreComparisons(initialResult.value, finalResult.value, t)
);

onMounted(async () => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) throw userError;

    if (!user) {
      throw new Error("Пользователь не авторизован");
    }

    const [initialResponse, finalResponse] = await Promise.all([
      supabase
        .from("screening_results")
        .select(
          `
          physical_score,
          food_score,
          mind_score,
          dominant_problem,
          completed_at
        `,
        )
        .eq("user_id", user.id)
        .maybeSingle(),

      supabase
        .from("final_screening_results")
        .select(
          `
          physical_score,
          food_score,
          mind_score,
          dominant_problem,
          completed_at
        `,
        )
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (initialResponse.error) throw initialResponse.error;
    if (finalResponse.error) throw finalResponse.error;

    if (!initialResponse.data || !finalResponse.data) {
      throw new Error("Не удалось найти оба результата скрининга");
    }

    initialResult.value = initialResponse.data as ScreeningResult;
    finalResult.value = finalResponse.data as ScreeningResult;
  } catch (err: any) {
    console.error("[FinalResults] Ошибка загрузки:", err);

    error.value = err?.message || "Не удалось загрузить результаты";
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: 20px 18px 48px;
  background: radial-gradient(
      circle at 10% 0%,
      var(--icon-green-bg),
      transparent 40%
    ),
    radial-gradient(circle at 90% 15%, var(--blue-bg), transparent 38%),
    var(--bg-gradient-main);
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.loading {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-card {
  margin-top: 40px;
  padding: 24px;
  border-radius: 20px;
  background: var(--hero-icon);
  color: var(--negative);
  text-align: center;
}

.hero {
  padding: 24px 8px 28px;
  text-align: center;
}

.hero-icon {
  width: 82px;
  height: 82px;
  margin: 0 auto 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 26px;
  background: var(--icon-green-bg);
  color: var(--green);
  box-shadow: 0 12px 30px var(--shadow-green);
}

.hero-icon .material-icons {
  font-size: 44px;
}

.eyebrow {
  margin-bottom: 10px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: var(--green);
}

.title {
  margin: 0;
  font-size: 30px;
  font-weight: 900;
  line-height: 1.2;
  color: var(--black1);
  letter-spacing: -0.6px;
}

.subtitle {
  max-width: 440px;
  margin: 12px auto 0;
  font-size: 15px;
  line-height: 1.65;
  color: var(--grey2);
}

.overall-card {
  padding: 24px 20px;
  border-radius: 26px;
  background: var(--hero-icon);
  border: 1px solid var(--glass-border);
  box-shadow: 0 18px 45px var(--shadow-lg);
}

.section-heading {
  font-size: 21px;
  font-weight: 850;
  color: var(--black1);
}

.overall-result {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 22px;
}

.overall-number {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 34px;
  font-weight: 900;
  color: var(--black1);
  letter-spacing: -1px;
}

.overall-arrow {
  font-size: 22px;
  color: var(--grey);
}

.overall-change {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 13px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 800;
}

.overall-change .material-icons {
  font-size: 19px;
}

.improved {
  color: var(--green);
}

.declined {
  color: var(--negative);
}

.unchanged {
  color: var(--grey);
}

.overall-change.improved,
.change-badge.improved {
  background: var(--icon-green-bg);
}

.overall-change.declined,
.change-badge.declined {
  background: var(--red-bg);
}

.overall-change.unchanged,
.change-badge.unchanged {
  background: var(--grey-hover);
}

.overall-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 11px;
  color: var(--grey2);
}

.overall-bars {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 18px;
}

.overall-bar-row,
.direction-bar-row {
  display: grid;
  grid-template-columns: 78px minmax(0, 1fr) 28px;
  align-items: center;
  gap: 9px;
  font-size: 11px;
  color: var(--grey2);
}

.overall-bar-row strong,
.direction-bar-row strong {
  font-size: 12px;
  color: var(--black1);
  text-align: right;
}

.bar-track {
  height: 11px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--grey-hover);
}

.bar-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.7s ease;
}

.initial-fill {
  background: var(--blue);
}

.final-fill {
  background: var(--green);
}

.score-explanation {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 22px;
  padding: 12px;
  border-radius: 14px;
  background: var(--blue-bg);
  color: var(--grey2);
  font-size: 12px;
  line-height: 1.5;
}

.score-explanation .material-icons {
  flex-shrink: 0;
  font-size: 17px;
  color: var(--blue);
}

.directions-section {
  margin-top: 32px;
}

.section-description {
  margin: 7px 0 18px;
  font-size: 14px;
  line-height: 1.55;
  color: var(--grey2);
}

.direction-card {
  margin-bottom: 14px;
  padding: 20px;
  border-radius: 23px;
  background: var(--hero-icon);
  border: 1px solid var(--glass-border);
  box-shadow: 0 12px 32px var(--shadow-md);
}

.direction-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.direction-title {
  font-size: 17px;
  font-weight: 800;
  color: var(--black1);
}

.change-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 7px 9px;
  border-radius: 11px;
  font-size: 12px;
  font-weight: 800;
}

.change-badge .material-icons {
  font-size: 16px;
}

.direction-scores {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 36px;
  margin: 22px 0;
}

.score-block {
  min-width: 65px;
  text-align: center;
}

.score-value {
  font-size: 34px;
  font-weight: 900;
  color: var(--grey2);
}

.final-value {
  color: var(--green);
}

.score-caption {
  margin-top: 3px;
  font-size: 11px;
  color: var(--grey2);
}

.direction-arrow {
  font-size: 22px;
  color: var(--grey);
}

.direction-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.direction-bar-row {
  grid-template-columns: 75px minmax(0, 1fr) 22px;
}

.direction-insight {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin-top: 18px;
  font-size: 12px;
  line-height: 1.5;
}

.direction-insight .material-icons {
  flex-shrink: 0;
  font-size: 17px;
}

.max-score {
  margin-top: 12px;
  font-size: 11px;
  color: var(--grey);
  text-align: right;
}

.finish-banner {
  margin-top: 28px;
  padding: 28px 22px;
  border-radius: 26px;
  background: var(--green-bg);
  color: var(--green-deep);
  text-align: center;
  border: 1px solid var(--glass-border);
}

.finish-icon {
  width: 66px;
  height: 66px;
  margin: 0 auto 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  background: var(--icon-green-bg);
}

.finish-icon .material-icons {
  font-size: 38px;
  color: var(--green);
}

.finish-banner-title {
  font-size: 21px;
  font-weight: 900;
  line-height: 1.3;
}

.finish-banner-text {
  margin-top: 10px;
  font-size: 14px;
  line-height: 1.65;
}

.finish-message {
  margin-top: 18px;
  padding-top: 17px;
  border-top: 1px solid var(--shadow-md);
  font-size: 14px;
  font-weight: 750;
  line-height: 1.6;
}

@media (max-width: 380px) {
  .page {
    padding-right: 13px;
    padding-left: 13px;
  }

  .overall-card,
  .direction-card {
    padding: 18px 15px;
  }

  .overall-number {
    font-size: 29px;
  }

  .overall-bar-row,
  .direction-bar-row {
    grid-template-columns: 68px minmax(0, 1fr) 24px;
    gap: 6px;
  }
}
</style>
