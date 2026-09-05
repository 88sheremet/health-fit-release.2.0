<template>
  <div class="callback-page">
    <q-spinner color="primary" size="50px" />

    <div class="callback-text">
      {{ $t("auth.googleLoading") }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { routes } from "~/router/routes";
import { getGoogleAuthDestination } from "~/services/googleAuth.service";

definePageMeta({
  layout: false,
});

const router = useRouter();
const route = useRoute();

onMounted(async () => {
  try {
    const destination = await getGoogleAuthDestination(route.query.code);

    await router.replace(destination);
  } catch (error) {
    console.error("[Auth Callback] Unexpected error:", error);

    await router.replace(routes.auth.login);
  }
});
</script>

<style scoped>
.callback-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: var(--bg-gradient-main);
}

.callback-text {
  font-size: 16px;
  color: var(--grey);
}
</style>
