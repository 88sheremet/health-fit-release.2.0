<template>
  <div class="result-page physical">
    <div class="hero">
      <div class="hero-icon">⚠️</div>

      <div class="hero-title">Твое тело работает на износ</div>

      <div class="hero-subtitle">
        Физическая перегрузка разрушает энергию, питание и нервы
      </div>
    </div>

    <q-card flat class="result-card">
      <div class="card-title">🔥 Главная зона риска</div>

      <div class="card-main">Физическое состояние</div>

      <div class="divider"></div>

      <div class="card-list">
        <div>• постоянная усталость и “разбитость”</div>
        <div>• низкая выносливость</div>
        <div>• напряжение и боли в спине/шее</div>
        <div>• организм не успевает восстанавливаться</div>
        <div>• нехватка энергии с самого утра</div>
      </div>
    </q-card>

    <q-card flat class="info-card">
      <div class="info-title">🍽️ Как это связано с питанием</div>

      <div class="info-text">
        Из-за физической перегрузки организм требует быстрых углеводов.
        Появляется тяга к сладкому, переедание, резкие скачки энергии и
        усталость после еды.
      </div>
    </q-card>

    <q-card flat class="info-card">
      <div class="info-title">🧠 Связь с нервной системой</div>

      <div class="info-text">
        Физическое истощение усиливает стресс. Нарушается сон, падает мотивация,
        появляется прокрастинация и эмоциональное выгорание.
      </div>
    </q-card>

    <q-card flat class="recovery-card">
      <div class="info-title">✨ Что восстановит все три сферы</div>

      <div class="card-list">
        <div>• мягкая физическая активность</div>
        <div>• восстановление энергии через питание</div>
        <div>• снижение физической и нервной перегрузки</div>
        <div>• улучшение мобильности тела</div>
      </div>
    </q-card>

    <div class="bottom-action">
    <q-btn unelevated no-caps class="main-btn" label="Начать восстановление" @click="$router.push(routes.recovery.daily)"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import { routes } from "../router/index";
</script>

<style scoped lang="scss">
.result-page {
  min-height: 100vh;
  padding: 24px 20px 140px;
  background: var(--result-page-btn);
}

.hero {
  text-align: center;
  margin-bottom: 32px;
}

.hero-icon {
  width: 110px;
  height: 110px;
  margin: 0 auto 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52px;
  background: var(--hero-icon);
  box-shadow: var(--hero-icon-shadow);
}

.hero-title {
  font-size: 34px;
  font-weight: 700;
  line-height: 1.15;
  color: var(--black1);
  margin-bottom: 16px;
}

.hero-subtitle {
  font-size: 17px;
  line-height: 1.6;
  color: var(--grey2);
}

.result-card,
.info-card,
.recovery-card {
  padding: 24px;
  border-radius: 28px;
  margin-bottom: 18px;
  background: var(--hero-icon);
  backdrop-filter: blur(16px);
  box-shadow: 0 10px 35px var(--shadow-md);
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--orange);
  margin-bottom: 14px;
}

.card-main {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--black1);
}

.divider {
  height: 1px;
  background: var(--shadow-lg);
  margin: 20px 0;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 16px;
  line-height: 1.5;
  color: var(--grey-dark);
}

.info-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 14px;
}

.info-text {
  font-size: 16px;
  line-height: 1.7;
  color: var(--grey2);
}

.bottom-action {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16px 20px calc(16px + env(safe-area-inset-bottom));
  background: var(--glass-bar);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-top: 1px solid var(--glass-border);
  z-index: 100;
}

.main-btn {
  width: 100%;
  height: 62px;
  border-radius: 22px;
  font-size: 18px;
  font-weight: 700;
  background: var(--main-btn);
  color: var(--white);
  box-shadow: 0 10px 30px rgba(251, 140, 0, 0.35);
}
</style>