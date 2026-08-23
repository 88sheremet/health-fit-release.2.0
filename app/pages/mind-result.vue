<template>
  <div class="result-page">
    <div class="hero">
      <div class="hero-icon">🧠</div>
      <div class="hero-title">{{ $t("results.mind.heroTitle") }}</div>
      <div class="hero-subtitle">
        {{ $t("results.mind.heroSubtitle") }}
      </div>
    </div>

    <q-card flat class="result-card">
      <div class="card-title">{{ $t("results.mind.cardTitle") }}</div>
      <div class="card-main">{{ $t("results.mind.cardMain") }}</div>
      <div class="divider"></div>
      <div class="card-list">
        <div v-for="item in 5" :key="item">{{ $t("results.mind.list." + (item - 1)) }}</div>
      </div>
    </q-card>

    <q-card flat class="info-card">
      <div class="info-title">{{ $t("results.mind.physicalTitle") }}</div>
      <div class="info-text">
        {{ $t("results.mind.physicalText") }}
      </div>
    </q-card>

    <q-card flat class="info-card">
      <div class="info-title">{{ $t("results.mind.foodTitle") }}</div>
      <div class="info-text">
        {{ $t("results.mind.foodText") }}
      </div>
    </q-card>

    <q-card flat class="recovery-card">
      <div class="info-title">{{ $t("results.mind.recoveryTitle") }}</div>
      <div class="card-list">
        <div v-for="item in 4" :key="item">{{ $t("results.mind.recoveryList." + (item - 1)) }}</div>
      </div>
    </q-card>

    <div class="bottom-action">
      <q-btn unelevated no-caps class="main-btn" :label="$t('results.startRecovery')" @click="navigateTo(routes.recovery.daily)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { routes } from "~/router/routes";
</script>

<style scoped lang="scss">
.result-page { min-height: 100vh; padding: 24px 20px 140px; background: var(--bg-gradient-purple); }
.hero { text-align: center; margin-bottom: 32px; }
.hero-icon {
  width: 110px; height: 110px; margin: 0 auto 24px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; font-size: 52px;
  background: var(--hero-icon); box-shadow: 0 10px 40px var(--purple-border);
}
.hero-title { font-size: 34px; font-weight: 700; line-height: 1.15; color: var(--black1); margin-bottom: 16px; }
.hero-subtitle { font-size: 17px; line-height: 1.6; color: var(--grey2); }
.result-card, .info-card, .recovery-card {
  padding: 24px; border-radius: 28px; margin-bottom: 18px;
  background: var(--hero-icon); backdrop-filter: blur(16px); box-shadow: 0 10px 35px var(--shadow-md);
}
.card-title { font-size: 15px; font-weight: 700; color: var(--purple); margin-bottom: 14px; }
.card-main { font-size: 28px; font-weight: 700; line-height: 1.2; margin-bottom: 0; }
.divider { height: 1px; background: var(--shadow-lg); margin: 20px 0; }
.card-list { display: flex; flex-direction: column; gap: 12px; font-size: 16px; line-height: 1.5; color: var(--grey-dark); }
.info-title { font-size: 22px; font-weight: 700; margin-bottom: 14px; }
.info-text { font-size: 16px; line-height: 1.7; color: var(--grey2); }
.bottom-action {
  position: fixed; left: 0; right: 0; bottom: 0;
  padding: 16px 20px calc(16px + env(safe-area-inset-bottom));
  background: var(--glass-bar); backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px); border-top: 1px solid var(--glass-border); z-index: 100;
}
.main-btn {
  width: 100%; height: 62px; border-radius: 22px; font-size: 18px; font-weight: 700;
  background: var(--gradient-purple); color: var(--white); box-shadow: 0 10px 30px var(--shadow-purple);
}
</style>
