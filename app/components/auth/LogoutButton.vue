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
import { routes } from "~/router/routes";

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

    await router.replace(routes.auth.login);

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
  height: 52px;
  margin-top: 4px;
  margin-bottom: 20px;

  border: 1px solid var(--grey-hover);
  border-radius: 16px;

  color: var(--red);
  font-size: 16px;
  font-weight: 600;
}
.logout-btn:hover {
  color: var(--black1);
}
</style>