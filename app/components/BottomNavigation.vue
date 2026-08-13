<template>
  <div class="bottom-nav">
    <div
      class="nav-item"
      :class="{ active: route.path === '/daily' }"
      @click="navigateTo(routes.recovery.daily)"
    >
      <span class="material-icons">task_alt</span>
      <span class="nav-label">{{ $t("nav.daily") }}</span>
    </div>
    <div
      class="nav-item"
      :class="{ active: route.path === '/weekly' }"
      @click="navigateTo(routes.recovery.weekly)"
    >
      <span class="material-icons">event_note</span>
      <span class="nav-label">{{ $t("nav.weekly") }}</span>
    </div>
    <div
      class="nav-item"
      :class="{ active: route.path === '/journal' }"
      @click="navigateTo(routes.recovery.journal)"
    >
      <span class="material-icons">menu_book</span>
      <span class="nav-label">{{ $t("nav.journal") }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { routes } from "~/router/routes";
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
  border: 1px solid rgba(34, 197, 94, 0.1);
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
  background: rgba(34, 197, 94, 0.1);
  border-color: rgba(34, 197, 94, 0.25);
  transform: translateY(-2px);
  .material-icons {
    transform: scale(1.08);
    filter: drop-shadow(0 4px 10px rgba(76, 175, 80, 0.25));
  }
}
.nav-item:active {
  transform: scale(0.96);
}
</style>
