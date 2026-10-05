<template>  <!--
    Экран-меню восстановления: приветствие, кнопка
    анализа (до прохождения скрининга) и сетка вкладок
    daily / weekly / journal.
  -->
  <div class="menu-page">
    <!--
      Шапка: заголовок, подзаголовок и, при незавершённом
      скрининге, кнопка перехода к тесту.
    -->
    <div class="header">
      <!--
        Заголовок экрана — ключ menu.title ($t локализован).
      -->
      <div class="title">{{ $t("menu.title") }}</div>
      <!--
        Подзаголовок с описанием назначения меню.
      -->
      <div class="subtitle">{{ $t("menu.subtitle") }}</div>
      <!--
        Кнопка «Пройти анализ»: рендерится только когда
        скрининг ещё не завершён (v-if = access gating).
        Ведёт на вопросы онбординга (routes.onboarding.questions).
      -->
      <q-btn
        v-if="!screeningStore.screeningCompleted"
        unelevated
        no-caps
        class="test-btn"
        :label="$t('menu.analysis')"
        @click="navigateTo(routes.onboarding.questions)"
      />
    </div>

    <!--
      Сетка вкладок меню: каждая карточка открывает
      соответствующую зону восстановления.
    -->
    <div class="tabs">
      <!--
        Вкладка «День»: открывает ежедневный план
        (routes.recovery.daily), пиктограмма task_alt.
      -->
      <div class="tab-card" @click="openTab('daily')">
        <!--
          Material-иконка вкладки (task_alt = задачи дня).
        -->
        <span class="material-icons tab-icon">task_alt</span>
        <!--
          Название вкладки (menu.dailyTitle, локализовано).
        -->
        <div class="tab-title">{{ $t("menu.dailyTitle") }}</div>
        <!--
          Пояснение к вкладке (menu.dailyText, локализовано).
        -->
        <div class="tab-text">{{ $t("menu.dailyText") }}</div>
      </div>
      <!--
        Вкладка «Неделя»: открывает недельный план
        (routes.recovery.weekly), пиктограмма event_note.
      -->
      <div class="tab-card" @click="openTab('weekly')">
        <!--
          Material-иконка вкладки (event_note = планы недели).
        -->
        <span class="material-icons tab-icon">event_note</span>
        <!--
          Название вкладки (menu.weeklyTitle, локализовано).
        -->
        <div class="tab-title">{{ $t("menu.weeklyTitle") }}</div>
        <!--
          Пояснение к вкладке (menu.weeklyText, локализовано).
        -->
        <div class="tab-text">{{ $t("menu.weeklyText") }}</div>
      </div>
      <!--
        Вкладка «Дневник»: открывает журнал наблюдений
        (routes.recovery.journal), пиктограмма menu_book.
      -->
      <div class="tab-card" @click="openTab('journal')">
        <!--
          Material-иконка вкладки (menu_book = дневник).
        -->
        <span class="material-icons tab-icon">menu_book</span>
        <!--
          Название вкладки (menu.journalTitle, локализовано).
        -->
        <div class="tab-title">{{ $t("menu.journalTitle") }}</div>
        <!--
          Пояснение к вкладке (menu.journalText, локализовано).
        -->
        <div class="tab-text">{{ $t("menu.journalText") }}</div>
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

/*
 * API уведомлений Quasar: $q.notify показывает блокирующий
 * алерт, когда доступ к вкладкам ещё закрыт скринингом.
 */
import { useQuasar } from "quasar";

/*
 * Pinia-store скрининга: источник флага screeningCompleted;
 * loadScreening() подтягивает статус из БД при монтировании.
 */
import { useScreeningStore } from "~/stores/screening";

/*
 * Централизованная система маршрутов: openTab ведёт на
 * routes.recovery.daily / weekly / journal, кнопка анализа —
 * на routes.onboarding.questions.
 */
import { routes } from "~/router/routes";

/*
 * Компонент кнопки выхода из аккаунта (Logout).
 */
import LogoutButton from "~/components/auth/LogoutButton.vue";

/*
 * ============================================================
 * PAGE META
 * ============================================================
 *
 * middleware: "auth" — гасит неавторизованных пользователей
 * (редирект на экран входа до рендера страницы).
 * layout: "authenticated" — шапка с логотипом и кнопкой настроек.
 */
definePageMeta({
  middleware: "auth",
  layout: "authenticated",
});

/*
 * ============================================================
 * DEPENDENCIES
 * ============================================================
 */

/*
 * Quasar-объект для нотификаций (блокирующий алерт).
 */
const $q = useQuasar();

/*
 * t(...) — функция перевода. Сообщения зависят от текущей
 * локали i18n; при смене языка в settings.vue тексты меняются.
 */
const { t } = useI18n();

/*
 * Store скрининга — gate доступа к вкладкам: без
 * screeningCompleted ежедневный/недельный план не открывается.
 */
const screeningStore = useScreeningStore();

/*
 * ============================================================
 * MENU ACCESS FLOW
 * ============================================================
 */

/*
 * Показывает предупреждение о закрытом доступе.
 *
 * 1. Берём локализованное сообщение t("menu.blockedAlert").
 * 2. $q.notify — всплывашка типа "warning" на 2500 мс.
 */
const showBlockedAlert = () => {
  $q.notify({
    message: t("menu.blockedAlert"),
    type: "warning",
    timeout: 2500,
  });
};

/*
 * Открывает вкладку меню, но только если скрининг завершён.
 *
 * 1. Если !screeningCompleted — showBlockedAlert() и выход
 *    (access-control gating: планы заблокированы).
 * 2. tab === "daily"   → routes.recovery.daily.
 * 3. tab === "weekly"  → routes.recovery.weekly.
 * 4. tab === "journal" → routes.recovery.journal.
 */
const openTab = (tab: string) => {
  /*
   * Gate: без завершённого скрининга навигация запрещена.
   */
  if (!screeningStore.screeningCompleted) {
    showBlockedAlert();
    return;
  }
  /*
   * Маппинг имени вкладки на централизованный маршрут.
   */
  if (tab === "daily") navigateTo(routes.recovery.daily);
  if (tab === "weekly") navigateTo(routes.recovery.weekly);
  if (tab === "journal") navigateTo(routes.recovery.journal);
};

/*
 * ============================================================
 * SCREENING STATUS LOAD FLOW
 * ============================================================
 */

/*
 * При монтировании страницы подтягиваем актуальный статус
 * скрининга, чтобы кнопка анализа и табы сразу отображались
 * корректно (screeningCompleted).
 */
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
