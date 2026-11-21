<template>
  <div class="page">
    <div v-if="loading" class="loading">
      <q-spinner-dots size="42px" color="primary" />
    </div>

    <div v-else-if="error" class="error-card">
      {{ error }}
    </div>

    <template v-else-if="initialResult && finalResult">
      <div class="hero">
        <div class="hero-icon">
          <span class="material-icons">emoji_events</span>
        </div>

        <div class="title">
          {{ $t("program.finalTitle") }}
        </div>

        <div class="subtitle">
          {{ $t("program.finalDescription") }}
        </div>
      </div>

      <q-card flat class="comparison-card">
        <div class="comparison-title">
          {{ $t("program.comparisonTitle") }}
        </div>

        <div
          v-for="item in comparisons"
          :key="item.key"
          class="comparison-item"
        >
          <div class="item-header">
            <div class="item-title">
              {{ $t(item.label) }}
            </div>

            <div
              class="change"
              :class="{
                improved: item.difference > 0,
                declined: item.difference < 0,
                unchanged: item.difference === 0,
              }"
            >
              <span v-if="item.difference > 0">+</span>
              {{ item.difference }}
            </div>
          </div>

          <div class="scores">
            <div class="score-column">
              <div class="score-value">
                {{ item.initial }}
              </div>
              <div class="score-label">
                {{ $t("program.initialScore") }}
              </div>
            </div>

            <div class="score-arrow">
              <span class="material-icons">arrow_forward</span>
            </div>

            <div class="score-column">
              <div class="score-value">
                {{ item.final }}
              </div>
              <div class="score-label">
                {{ $t("program.finalScore") }}
              </div>
            </div>
          </div>

          <div class="progress-track">
            <div
              class="progress-initial"
              :style="{ width: `${(item.initial / 45) * 100}%` }"
            ></div>
            <div
              class="progress-final"
              :style="{ width: `${(item.final / 45) * 100}%` }"
            ></div>
          </div>

          <div class="max-score">
            {{ $t("program.maxScore") }}
          </div>
        </div>
      </q-card>

      <div class="finish-banner">
        <span class="material-icons">check_circle</span>

        <div class="finish-banner-title">
          {{ $t("program.finishBannerTitle") }}
        </div>

        <div class="finish-banner-text">
          {{ $t("program.finishBannerDescription") }}
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

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

const supabase = useSupabaseClient();

const loading = ref(true);
const error = ref("");

const initialResult = ref<ScreeningResult | null>(null);
const finalResult = ref<ScreeningResult | null>(null);

const comparisons = computed(() => {
  if (!initialResult.value || !finalResult.value) {
    return [];
  }

  return [
    {
      key: "physical",
      label: "program.physical",
      initial: Number(initialResult.value.physical_score),
      final: Number(finalResult.value.physical_score),
      difference:
        Number(finalResult.value.physical_score) -
        Number(initialResult.value.physical_score),
    },
    {
      key: "food",
      label: "program.food",
      initial: Number(initialResult.value.food_score),
      final: Number(finalResult.value.food_score),
      difference:
        Number(finalResult.value.food_score) -
        Number(initialResult.value.food_score),
    },
    {
      key: "mind",
      label: "program.mind",
      initial: Number(initialResult.value.mind_score),
      final: Number(finalResult.value.mind_score),
      difference:
        Number(finalResult.value.mind_score) -
        Number(initialResult.value.mind_score),
    },
  ];
});

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

<style scoped>
.page {
  min-height: 100vh;
  padding: 24px 20px 40px;
  background: var(--bg-gradient-main);
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
  padding: 30px 10px 26px;
  text-align: center;
}

.hero-icon {
  width: 94px;
  height: 94px;
  margin: 0 auto 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 28px;
  background: var(--icon-green-bg);
  color: var(--green);
}

.hero-icon .material-icons {
  font-size: 52px;
}

.title {
  font-size: 30px;
  font-weight: 800;
  line-height: 1.2;
  color: var(--black1);
}

.subtitle {
  max-width: 420px;
  margin: 12px auto 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--grey2);
}

.comparison-card {
  padding: 24px 20px;
  border-radius: 24px;
  background: var(--hero-icon);
  border: 1px solid var(--glass-border);
  box-shadow: 0 18px 45px var(--shadow-lg);
}

.comparison-title {
  margin-bottom: 26px;
  font-size: 21px;
  font-weight: 800;
  color: var(--black1);
}

.comparison-item:not(:last-child) {
  padding-bottom: 24px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--shadow-md);
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.item-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--black1);
}

.change {
  font-size: 18px;
  font-weight: 800;
}

.change.improved {
  color: var(--green);
}

.change.declined {
  color: var(--negative);
}

.change.unchanged {
  color: var(--grey);
}

.scores {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 32px;
  margin: 20px 0;
}

.score-column {
  text-align: center;
}

.score-value {
  font-size: 30px;
  font-weight: 800;
  color: var(--black1);
}

.score-label {
  margin-top: 4px;
  font-size: 12px;
  color: var(--grey2);
}

.score-arrow {
  color: var(--grey);
}

.progress-track {
  position: relative;
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--grey-hover);
}

.progress-initial,
.progress-final {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: inherit;
}

.progress-initial {
  background: var(--blue);
  opacity: 0.45;
}

.progress-final {
  background: var(--green);
  opacity: 0.9;
}

.max-score {
  margin-top: 7px;
  font-size: 11px;
  color: var(--grey);
  text-align: right;
}

.finish-banner {
  margin-top: 22px;
  padding: 26px 22px;
  border-radius: 22px;
  background: var(--green-bg);
  color: var(--green-deep);
  text-align: center;
}

.finish-banner > .material-icons {
  font-size: 42px;
}

.finish-banner-title {
  margin-top: 10px;
  font-size: 20px;
  font-weight: 800;
}

.finish-banner-text {
  margin-top: 8px;
  font-size: 14px;
  line-height: 1.6;
}
</style>
