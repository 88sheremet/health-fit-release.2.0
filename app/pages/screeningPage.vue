<template>
  <div class="screening-page">
    <div class="screening-container">
      <div class="top-section">
        <div class="hero-icon">
          <div class="glow"></div>

          <q-icon name="psychology" class="main-icon" />
        </div>

        <div class="title">Анализ состояния</div>

        <div class="subtitle">
          Ответь на несколько вопросов, чтобы получить персональный план
          восстановления
        </div>
      </div>

      <q-card flat class="info-card">
        <div class="info-item">
          <div class="info-icon green">
            <q-icon name="schedule" />
          </div>

          <div class="info-content">
            <div class="info-title">~2 минуты</div>

            <div class="info-text">Быстрый анализ состояния</div>
          </div>
        </div>

        <div class="info-item">
          <div class="info-icon blue">
            <q-icon name="monitoring" />
          </div>

          <div class="info-content">
            <div class="info-title">Персональный результат</div>

            <div class="info-text">Узнай свои основные точки роста</div>
          </div>
        </div>

        <div class="info-item">
          <div class="info-icon orange">
            <q-icon name="task_alt" />
          </div>

          <div class="info-content">
            <div class="info-title">Ежедневные задания</div>

            <div class="info-text">Система подстроится под тебя</div>
          </div>
        </div>
      </q-card>

      <div class="bottom-section">
        <div class="hint-text">
          Твой путь начинается с понимания текущего состояния
        </div>

        <q-btn
          unelevated
          no-caps
          class="start-btn"
          label="Начать скрининг"
          @click="startQuestions"
        />

        <q-btn flat no-caps class="skip-btn" label="Пропустить" @click="skip" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useScreeningStore } from "../stores/screening";
import { routes } from "../router/index";

const router = useRouter();
const store = useScreeningStore();

const skip = () => {
  store.completeScreening();
  router.push(routes.recovery.menu);
};

const startQuestions = () => {
  router.push(routes.onboarding.questions);
};
</script>

<style scoped lang="scss">
.screening-page {
  min-height: 100vh;
  padding: 24px;
  background: var(--bg-gradient-main);
}

.screening-container {
  max-width: 430px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.top-section {
  padding-top: 48px;
  text-align: center;
}

.hero-icon {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--hero-icon);
  backdrop-filter: blur(12px);
}

.glow {
  position: absolute;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: var(--glow-green);
  filter: blur(24px);
  animation: pulse 3s infinite;
}

.main-icon {
  position: relative;
  z-index: 2;
  font-size: 54px;
  color: var(--green);
}

.title {
  font-size: 34px;
  font-weight: 700;
  line-height: 1.15;
  color: var(--black1);
  margin-bottom: 16px;
}

.subtitle {
  font-size: 18px;
  line-height: 1.6;
  color: var(--grey2);
}

.info-card {
  margin-top: 42px;
  padding: 26px 22px;
  border-radius: 28px;
  background: var(--hero-icon);
  backdrop-filter: blur(16px);
  box-shadow: 0 10px 40px var(--shadow-lg);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 18px;

  &:not(:last-child) {
    margin-bottom: 28px;
  }
}

.info-icon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.green {
  background: var(--icon-green-bg);
  color: var(--green);
}

.blue {
  background: var(--icon-blue-bg);
  color: var(--blue);
}

.orange {
  background: var(--icon-orange-bg);
  color: var(--orange);
}

.info-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--black1);
  margin-bottom: 4px;
}

.info-text {
  font-size: 15px;
  line-height: 1.5;
  color: var(--grey2);
}

.bottom-section {
  margin-top: auto;
  padding-top: 42px;
  padding-bottom: 24px;
}

.hint-text {
  text-align: center;
  font-size: 15px;
  line-height: 1.5;
  color: var(--grey);
  margin-bottom: 22px;
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