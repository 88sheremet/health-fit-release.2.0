<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="app-header">
      <q-toolbar>
        <img :src="logo" alt="Health Fit" class="app-logo" />

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

    <q-page-container>
      <slot />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

import { routes } from "~/router/routes";
import { useScreeningStore } from "~/stores/screening";

import logo from "~/assets/main-logo.png";

const screeningStore = useScreeningStore();

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