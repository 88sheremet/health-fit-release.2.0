<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="app-header">
      <q-toolbar>
        <q-toolbar-title>
          Health Fit Release
        </q-toolbar-title>

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
</script>

<style scoped>
.app-header {
  background: var(--white);
  color: var(--black1);
  box-shadow: 0 2px 10px var(--shadow-sm);
}

.q-toolbar {
  min-height: 56px;
}

.q-toolbar-title {
  font-size: 18px;
  font-weight: 700;
}

:deep(.logout-btn) {
  width: auto;
  max-width: none;
}
</style>