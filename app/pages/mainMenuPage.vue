<template>
  <div class="menu-page">
    <div class="header">
      <div class="title">Главное меню</div>

      <div class="subtitle">Твои инструменты восстановления и развития</div>

      <q-btn
        v-if="!screeningStore.screeningCompleted"
        unelevated
        no-caps
        class="test-btn"
        label="Пройти анализ состояния"
        @click="router.push(routes.onboarding.questions)"
      />
    </div>

    <div class="tabs">
      <div class="tab-card" @click="openTab('daily')">
        <q-icon name="task_alt" class="tab-icon" />

        <div class="tab-title">Ежедневные задания</div>

        <div class="tab-text">Маленькие шаги каждый день</div>
      </div>

      <div class="tab-card" @click="openTab('weekly')">
        <q-icon name="event_note" class="tab-icon" />

        <div class="tab-title">Еженедельное задание</div>

        <div class="tab-text">Глубокая работа над собой</div>
      </div>

      <div class="tab-card" @click="openTab('journal')">
        <q-icon name="menu_book" class="tab-icon" />

        <div class="tab-title">Дневник</div>

        <div class="tab-text">Отслеживай состояние и прогресс</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import { useScreeningStore } from "../stores/screening";
import { routes } from "../router/index";

const $q = useQuasar();

const router = useRouter();

const screeningStore = useScreeningStore();

const showBlockedAlert = () => {
  $q.notify({
    type: "warning",

    message:
      "Сначала пройди анализ состояния, чтобы открыть персональные задания и дневник",

    position: "top",

    timeout: 2500,
  });
};

const openTab = (tab: string) => {
  if (!screeningStore.screeningCompleted) {
    showBlockedAlert();

    return;
  }

  if (tab === "daily") {
    router.push(routes.recovery.daily);
  }

  if (tab === "weekly") {
    router.push(routes.recovery.weekly);
  }

  if (tab === "journal") {
    router.push(routes.recovery.journal);
  }
};
</script>

<style scoped lang="scss">
.menu-page {
  min-height: 100vh;
  padding: 24px;
  background: var(--bg-gradient-main);
}

.header {
  padding-top: 32px;
  margin-bottom: 32px;
}

.test-btn {
  margin-top: 22px;
  width: 100%;
  height: 54px;
  border-radius: 18px;
  font-size: 16px;
  font-weight: 700;
  background: var(--start-btn);
  color: var(--white);
  box-shadow: 0 10px 24px var(--start-btn-shadow);
}

.title {
  font-size: 32px;
  font-weight: 700;
  color: var(--black1);
  margin-bottom: 12px;
}

.subtitle {
  font-size: 16px;
  line-height: 1.5;
  color: var(--grey2);
}

.tabs {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.tab-card {
  padding: 22px;
  border-radius: 24px;
  background: var(--hero-icon);
  backdrop-filter: blur(12px);
  box-shadow: 0 10px 30px var(--shadow-md);
  cursor: pointer;
  transition: 0.2s ease;

  &:active {
    transform: scale(0.98);
  }
}

.tab-icon {
  font-size: 34px;
  color: var(--green);
  margin-bottom: 14px;
}

.tab-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--black1);
  margin-bottom: 8px;
}

.tab-text {
  font-size: 15px;
  line-height: 1.5;
  color: var(--grey2);
}
</style>