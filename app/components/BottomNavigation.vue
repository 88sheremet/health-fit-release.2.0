<template>
  <div class="bottom-nav">
    <div
      class="nav-item"
      :class="{ active: route.path === '/daily' }"
      @click="router.push(routes.recovery.daily)"
    >
      <q-icon name="task_alt" />

      <span>Ежедневные<br />задания</span>
    </div>

    <div
      class="nav-item"
      :class="{ active: route.path === '/weekly' }"
      @click="router.push(routes.recovery.weekly)"
    >
      <q-icon name="event_note" />

      <span>Еженедельное<br />задание</span>
    </div>

    <div
      class="nav-item"
      :class="{ active: route.path === '/journal' }"
      @click="router.push(routes.recovery.journal)"
    >
      <q-icon name="menu_book" />

      <span>Дневник</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";
import { routes } from "../router/index";
const router = useRouter();

const route = useRoute();
</script>

<style scoped lang="scss">
.page {
  padding-bottom: 120px;
}

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
  box-shadow: 0 10px 25px var(--shadow-sm);
  backdrop-filter: blur(24px);
  border: 1px solid var(--hero-icon);
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
  transition: all 0.25s ease;
  cursor: pointer;
  border: 1px solid transparent;
  min-height: 100%;

  .q-icon {
    font-size: 24px;
    transition: 0.25s ease;
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

  .q-icon {
    transform: scale(1.08);
    filter: drop-shadow(0 4px 10px rgba(76, 175, 80, 0.25));
  }
}

.nav-item:active {
  transform: scale(0.96);
}
</style>