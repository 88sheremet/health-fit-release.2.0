<template>
  <q-layout view="lHh Lpr lFf">
    <q-header class="app-header">
      <q-toolbar>
        <img
          :src="logo"
          alt="Health Fit"
          class="app-logo"
        />

        <LogoutButton />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <slot />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import LogoutButton from "~/components/auth/LogoutButton.vue";
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

:deep(.logout-btn) {
  width: auto;
  max-width: none;
  margin-left: auto;
}
</style>