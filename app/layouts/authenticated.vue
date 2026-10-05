<template>  <!--
    Защищённый layout авторизованных страниц: шапка
    с логотипом и кнопкой настроек + контейнер контента.
    Подключается через definePageMeta layout: "authenticated".
  -->
  <!--
    QLayout (Quasar): каркас из header и page-container.
  -->
  <q-layout view="lHh Lpr lFf">
    <!--
      Шапка приложения: логотип слева, кнопка настроек справа.
    -->
    <q-header class="app-header">
      <q-toolbar>
        <!--
          Логотип Health Fit (статика из ~/assets/main-logo.png).
        -->
        <img :src="logo" alt="Health Fit" class="app-logo" />

        <!--
          Кнопка «Настройки»: ведёт на routes.settings
          (centralized routing), атрибут aria-label локализован
          через $t (зависит от текущей локали i18n).
        -->
        <q-btn
          flat
          round
          dense
          icon="manage_accounts"
          class="settings-btn"
          :aria-label="$t('settings.title')"
          @click="navigateTo(routes.settings)"
        />
      </q-toolbar>
    </q-header>

    <!--
      Контейнер контента активной страницы (slot заполняется
      из NuxtLayout/NuxtPage).
    -->
    <q-page-container>
      <slot />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
/*
 * ============================================================
 * IMPORTS
 * ============================================================
 */

/*
 * Хук жизненного цикла: подгрузка статуса скрининга
 * сразу после монтирования layout'а.
 */
import { onMounted } from "vue";

/*
 * Централизованная система маршрутов: кнопка настроек
 * ведёт на routes.settings вместо хардкода строки.
 */
import { routes } from "~/router/routes";

/*
 * Pinia-store скрининга: загружает screeningCompleted,
 * чтобы защищённые экраны корректно отрисовывали gate.
 */
import { useScreeningStore } from "~/stores/screening";

/*
 * Статичное изображение логотипа (импортируется как asset).
 */
import logo from "~/assets/main-logo.png";

/*
 * ============================================================
 * DEPENDENCIES
 * ============================================================
 */

/*
 * Store скрининга: прокидывает статус прохождения скрининга
 * в страницы, работающие внутри этого layout'а (menu и др.).
 */
const screeningStore = useScreeningStore();

/*
 * ============================================================
 * SCREENING STATUS LOAD FLOW
 * ============================================================
 */

/*
 * При монтировании layout'а подтягиваем актуальный статус
 * скрининга из БД: screeningCompleted нужен для gate
 * доступа в меню (вкладки daily/weekly/journal).
 */
onMounted(async () => {
  await screeningStore.loadScreening();
});
</script>

<style scoped>
.app-header {
  background: var(--white);
  color: var(--black1);
  box-shadow: 0 2px 10px var(--shadow-sm);
}
.q-toolbar {
  min-height: 56px;
  display: flex;
  align-items: center;
}
.app-logo {
  width: 140px;
  height: 42px;
  object-fit: contain;
  object-position: left center;
}
.settings-btn {
  margin-left: auto;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  color: var(--grey);
  font-size: 1.5em;
}
.settings-btn:hover {
  background: var(--grey-hover);
  color: var(--black1);
}
</style>
