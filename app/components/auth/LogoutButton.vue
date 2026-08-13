<template>
  <q-btn
    :label="$t('auth.logout')"
    flat
    no-caps
    class="logout-btn"
    :loading="loading"
    @click="logout"
  />
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const router = useRouter();

const loading = ref(false);

const logout = async () => {
  if (loading.value) return;

  loading.value = true;

  try {
    console.log("[Logout] Начинаем выход...");

    const { error } = await supabase.auth.signOut();

    console.log("[Logout] signOut result:", error);

    if (error) {
      console.error("[Logout] Ошибка:", error);
      return;
    }

    console.log("[Logout] Сессия завершена");

    await router.replace("/login");

    console.log("[Logout] Перешли на /login");
  } catch (error) {
    console.error("[Logout] Неожиданная ошибка:", error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.logout-btn {
  width: 100%;
  max-width: 400px;
  color: var(--grey);
  font-size: 15px;
}

.logout-btn:hover {
  color: var(--black1);
}
</style>