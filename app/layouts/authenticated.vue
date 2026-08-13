<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="app-header">
      <q-toolbar>
        <div class="logo-wrapper">
          <img :src="logo" alt="Health Fit Release" class="app-logo" />
        </div>

        <q-space />

        <LogoutButton />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <slot />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import LogoutButton from "~/components/auth/LogoutButton.vue";
import logo from "~/assets/main-logo.png";
</script>

<style scoped>
.app-header {
  background: var(--white);
  color: var(--black1);
  box-shadow: 0 2px 10px var(--shadow-sm);
}

.q-toolbar {
  min-height: 64px;
  padding: 0 16px;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  height: 100%;
}

.app-logo {
  display: block;
  width: 115px;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
}

:deep(.logout-btn) {
  width: auto;
  max-width: none;
}
</style>