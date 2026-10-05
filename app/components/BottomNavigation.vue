<template>  <!--
    Нижняя навигация: три вкладки — daily / weekly / journal.
    Активная вкладка определяется совпадением route.path,
    переход — через централизованные routes.recovery.* .
  -->
  <div class="bottom-nav">
    <!--
      Вкладка «День»: активна при route.path === "/daily",
      клик ведёт на routes.recovery.daily.
    -->
    <div
      class="nav-item"
      :class="{ active: route.path === '/daily' }"
      @click="navigateTo(routes.recovery.daily)"
    >
      <!--
        Material-иконка вкладки (task_alt = план дня).
      -->
      <span class="material-icons">task_alt</span>
      <!--
        Подпись вкладки (ключ nav.daily, $t локализован).
      -->
      <span class="nav-label">{{ $t("nav.daily") }}</span>
    </div>
    <!--
      Вкладка «Неделя»: активна при route.path === "/weekly",
      клик ведёт на routes.recovery.weekly.
    -->
    <div
      class="nav-item"
      :class="{ active: route.path === '/weekly' }"
      @click="navigateTo(routes.recovery.weekly)"
    >
      <!--
        Material-иконка вкладки (event_note = недельный план).
      -->
      <span class="material-icons">event_note</span>
      <!--
        Подпись вкладки (ключ nav.weekly, $t локализован).
      -->
      <span class="nav-label">{{ $t("nav.weekly") }}</span>
    </div>
    <!--
      Вкладка «Дневник»: активна при route.path === "/journal",
      клик ведёт на routes.recovery.journal.
    -->
    <div
      class="nav-item"
      :class="{ active: route.path === '/journal' }"
      @click="navigateTo(routes.recovery.journal)"
    >
      <!--
        Material-иконка вкладки (menu_book = дневник/журнал).
      -->
      <span class="material-icons">menu_book</span>
      <!--
        Подпись вкладки (ключ nav.journal, $t локализован).
      -->
      <span class="nav-label">{{ $t("nav.journal") }}</span>
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
 * Централизованная система маршрутов: клики по вкладкам
 * ведут на routes.recovery.daily / weekly / journal
 * (вместо хардкода строк в навигации).
 */
import { routes } from "~/router/routes";

/*
 * ============================================================
 * DEPENDENCIES
 * ============================================================
 */

/*
 * Текущий route: route.path сравнивается с "/daily" / "/weekly"
 * / "/journal", чтобы подсветить активную вкладку классом active.
 * Значения совпадают с путями, которые отдают routes.recovery.*.
 */
const route = useRoute();
</script>

<style scoped lang="scss">
.bottom-nav {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: 0px;
  height: 84px;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  background: var(--glass-heavy);
  border: 1px solid var(--green-bright-bg);
  box-shadow: 0 -4px 20px var(--shadow-md);
  backdrop-filter: blur(24px);
  border-radius: 28px;
  z-index: 100;
}
.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 20px;
  color: var(--grey-light);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid transparent;
  min-height: 100%;
  .material-icons {
    font-size: 24px;
    transition: all 0.3s ease;
  }
  span {
    font-size: 11px;
    line-height: 1.2;
    font-weight: 600;
    text-align: center;
  }
}
.nav-item.active {
  color: var(--green-bright);
  background: var(--green-bright-bg);
  border-color: var(--green-bright-border);
  transform: translateY(-2px);
  .material-icons {
    transform: scale(1.08);
    filter: drop-shadow(0 4px 10px var(--glow-green));
  }
}
.nav-item:active {
  transform: scale(0.96);
}
</style>
