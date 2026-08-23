<template>
  <div class="menu-page">
    <div class="header">
      <div class="title">{{ $t("menu.title") }}</div>
      <div class="subtitle">{{ $t("menu.subtitle") }}</div>
      <q-btn
        v-if="!screeningStore.screeningCompleted"
        unelevated
        no-caps
        class="test-btn"
        :label="$t('menu.analysis')"
        @click="navigateTo(routes.onboarding.questions)"
      />
    </div>

    <div class="tabs">
      <div class="tab-card" @click="openTab('daily')">
        <span class="material-icons tab-icon">task_alt</span>
        <div class="tab-title">{{ $t("menu.dailyTitle") }}</div>
        <div class="tab-text">{{ $t("menu.dailyText") }}</div>
      </div>
      <div class="tab-card" @click="openTab('weekly')">
        <span class="material-icons tab-icon">event_note</span>
        <div class="tab-title">{{ $t("menu.weeklyTitle") }}</div>
        <div class="tab-text">{{ $t("menu.weeklyText") }}</div>
      </div>
      <div class="tab-card" @click="openTab('journal')">
        <span class="material-icons tab-icon">menu_book</span>
        <div class="tab-title">{{ $t("menu.journalTitle") }}</div>
        <div class="tab-text">{{ $t("menu.journalText") }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from "quasar";
import { useScreeningStore } from "~/stores/screening";
import { routes } from "~/router/routes";
import LogoutButton from "~/components/auth/LogoutButton.vue";
definePageMeta({
  middleware: "auth",
  layout: "authenticated",
});
const $q = useQuasar();
const { t } = useI18n();
const screeningStore = useScreeningStore();

const showBlockedAlert = () => {
  $q.notify({
    message: t("menu.blockedAlert"),
    type: "warning",
    timeout: 2500,
  });
};

const openTab = (tab: string) => {
  if (!screeningStore.screeningCompleted) {
    showBlockedAlert();
    return;
  }
  if (tab === "daily") navigateTo(routes.recovery.daily);
  if (tab === "weekly") navigateTo(routes.recovery.weekly);
  if (tab === "journal") navigateTo(routes.recovery.journal);
};
onMounted(async () => {
  await screeningStore.loadScreening();
});
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
.logout-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding: 0 20px 32px;
}

.logout-wrapper :deep(.q-btn) {
  width: 100%;
  max-width: 400px;
}
</style>
