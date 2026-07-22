<template>
  <div class="welcome-page flex flex-center">
    <div class="welcome-container">
      <div class="hero-section">
        <div class="hero-icon">
          <div class="glow"></div>
          <span>☀️</span>
        </div>

        <h1 class="title">Твое новое состояние создаеться здесь</h1>

        <p class="subtitle">
          Простая система действий, которая помогает улучшать самочувствие и
          видеть прогресс каждый день
        </p>
      </div>

      <q-card flat class="benefits-card">
        <div class="benefit-item">
          <div class="benefit-icon"><q-icon name="psychology" /></div>
          <div class="benefit-text">Узнай свой текущий уровень состояния</div>
        </div>

        <div class="benefit-item">
          <div class="benefit-icon"><q-icon name="assignment_turned_in" /></div>
          <div class="benefit-text">
            Получай ежедневные персональные задания
          </div>
        </div>

        <div class="benefit-item">
          <div class="benefit-icon"><q-icon name="trending_up" /></div>
          <div class="benefit-text">Отслеживай изменения и свой прогресс</div>
        </div>
      </q-card>

      <div class="bottom-section">
        <q-btn
          unelevated
          no-caps
          class="start-btn"
          label="Начать путь"
          @click="$router.push(routes.onboarding.screening)"
        />

        <div class="hint-text">Это займет 2–3 минуты</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { routes } from "../router/index";
</script>

<style scoped lang="scss">
.welcome-page {
  min-height: 100vh;
  background: var(--bg-gradient-main);
  padding: 24px;
}

.welcome-container {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
}

.hero-section {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.hero-icon {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
  background: var(--hero-icon);
  backdrop-filter: blur(12px);

  span {
    font-size: 54px;
    position: relative;
    z-index: 2;
  }
}

.glow {
  position: absolute;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: var(--glow-gold);
  filter: blur(22px);
  animation: pulse 3s infinite;
}

.title {
  font-size: 36px;
  font-weight: 700;
  line-height: 1.1;
  margin: 0 0 16px;
  color: var(--black1);
}

.subtitle {
  font-size: 18px;
  line-height: 1.6;
  color: var(--grey2);
  margin: 0;
}

.benefits-card {
  margin-top: 40px;
  padding: 24px;
  border-radius: 28px;
  background: var(--hero-icon);
  backdrop-filter: blur(14px);
  box-shadow: 0 10px 40px var(--shadow-lg);
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 16px;

  &:not(:last-child) {
    margin-bottom: 22px;
  }
}

.benefit-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--grey-icon-bg);
  font-size: 20px;
  flex-shrink: 0;
}

.benefit-text {
  font-size: 16px;
  line-height: 1.4;
  color: var(--black1);
  font-weight: 500;
}

.bottom-section {
  margin-top: auto;
  padding-top: 40px;
  padding-bottom: 24px;
}

.start-btn {
  width: 100%;
  height: 60px;
  border-radius: 18px;
  font-size: 18px;
  font-weight: 700;
  background: var(--start-btn);
  color: var(--white);
  box-shadow: var(--start-btn-shadow);
}

.hint-text {
  text-align: center;
  margin-top: 14px;
  font-size: 14px;
  color: var(--grey);
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.7;
  }

  50% {
    transform: scale(1.15);
    opacity: 1;
  }

  100% {
    transform: scale(1);
    opacity: 0.7;
  }
}
</style>