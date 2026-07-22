<template>
  <div class="result-page">
    <div class="hero">
      <div class="hero-icon">⚡</div>

      <div class="hero-title">Питание крадет твою энергию</div>

      <div class="hero-subtitle">
        Еда не восстанавливает, а истощает тело и нервную систему
      </div>
    </div>

    <q-card flat class="result-card">
      <div class="card-title">🥗 Главная зона риска</div>

      <div class="card-main">Питание и пищевые привычки</div>

      <div class="divider"></div>

      <div class="card-list">
        <div>• резкие перепады энергии в течение дня</div>
        <div>• сильная тяга к сладкому и мучному</div>
        <div>• переедание и питание “на автомате”</div>
        <div>• постоянная нехватка воды</div>
        <div>• тяжесть и усталость после еды</div>
      </div>
    </q-card>

    <q-card flat class="info-card">
      <div class="info-title">💪 Как это связано с физическим состоянием</div>

      <div class="info-text">
        Неправильное питание лишает тело строительных материалов. Появляется
        постоянная усталость, слабая выносливость, напряжение в мышцах и боли в
        спине/шее.
      </div>
    </q-card>

    <q-card flat class="info-card">
      <div class="info-title">🧠 Связь с нервной системой</div>

      <div class="info-text">
        Скачки сахара и нехватка нутриентов усиливают стресс. Ухудшается сон,
        падает мотивация, появляется эмоциональное выгорание и прокрастинация.
      </div>
    </q-card>

    <q-card flat class="recovery-card">
      <div class="info-title">✨ Что восстановит все три сферы</div>

      <div class="card-list">
        <div>• стабильный уровень энергии через питание</div>
        <div>• снижение тяги к сладкому</div>
        <div>• восстановление физических сил</div>
        <div>• поддержка нервной системы</div>
      </div>
    </q-card>

    <div class="bottom-action">
      <q-btn
        unelevated
        no-caps
        class="main-btn"
        label="Начать восстановление"
        @click="$router.push(routes.recovery.daily)"
      />
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
  background: var(--food-result-btn);
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
  box-shadow: 0 10px 40px rgba(76, 175, 80, 0.2);
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
  color: var(--green);
  margin-bottom: 14px;
}

.card-main {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 0;
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
  background: var(--gradient-food);
  color: var(--white);
  box-shadow: 0 10px 30px rgba(67, 160, 71, 0.35);
}
</style>