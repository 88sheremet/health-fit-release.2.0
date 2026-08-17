<template>
  <div class="not-found-page">
    <div class="content">
      <div class="code">404</div>
      <div class="title">{{ $t("notFound.title") }}</div>
      <div class="subtitle">
        {{ $t("notFound.subtitle") }}
      </div>
      <q-btn unelevated no-caps class="home-btn" :label="$t('notFound.homeBtn')" @click="navigateTo(routes.recovery.daily)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { routes } from "~/router/routes";
</script>

<style scoped lang="scss">
.not-found-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  padding: 24px; background: var(--bg-gradient-main);
}
.content { max-width: 420px; text-align: center; }
.code { font-size: 96px; font-weight: 800; line-height: 1; color: var(--green); margin-bottom: 16px; }
.title { font-size: 32px; font-weight: 700; color: var(--black1); margin-bottom: 12px; }
.subtitle { font-size: 16px; line-height: 1.6; color: var(--grey2); margin-bottom: 32px; }
.home-btn {
  width: 100%; height: 56px; border-radius: 18px; font-size: 16px; font-weight: 700;
  background: var(--start-btn); color: var(--white);
}
</style>
