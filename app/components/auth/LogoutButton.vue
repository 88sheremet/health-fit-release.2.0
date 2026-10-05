<template>  <!--
    Кнопка выхода из аккаунта: завершает Supabase-сессию
    и перенаправляет пользователя на страницу входа.
  -->
  <!--
    Кнопка с локализованным текстом ("Выйти" / "Вийти") и
    индикатором загрузки, пока идёт завершение сессии.
  -->
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
/*
 * ============================================================
 * IMPORTS
 * ============================================================
 */

/*
 * Централизованный маршрут-объект: используем его для редиректа
 * на страницу входа после выхода.
 */
import { routes } from "~/router/routes";

/*
 * ============================================================
 * DEPENDENCIES
 * ============================================================
 */

/*
 * Клиент Supabase: через него вызываем signOut для завершения сессии.
 */
const supabase = useSupabaseClient();

/*
 * Роутер Nuxt: программная навигация на страницу входа.
 */
const router = useRouter();

/*
 * ============================================================
 * REACTIVE STATE
 * ============================================================
 */

/*
 * loading: true — идёт завершение сессии; показывает индикатор
 * на кнопке и блокирует повторные клики.
 */
const loading = ref(false);

/*
 * ============================================================
 * LOGOUT FLOW
 * ============================================================
 */

/*
 * Выход пользователя из системы.
 *
 * Поток:
 * 1. Защита от повторных вызовов, пока выход уже идёт.
 * 2. Включение индикатора загрузки.
 * 3. Вызов supabase.auth.signOut.
 * 4. При ошибке — лог и завершение функции без редиректа.
 * 5. Редирект на страницу входа через централизованный маршрут.
 * 6. finally — выключение индикатора загрузки.
 */
const logout = async () => {
  // Если выход уже выполняется — игнорируем повторный клик.
  if (loading.value) return;

  // Блокируем кнопку на время операции.
  loading.value = true;

  try {
    console.log("[Logout] Начинаем выход...");

    // Завершаем Supabase-сессию.
    const { error } = await supabase.auth.signOut();

    console.log("[Logout] signOut result:", error);

    // При ошибке — остаёмся на месте и логируем; без редиректа.
    if (error) {
      console.error("[Logout] Ошибка:", error);
      return;
    }

    console.log("[Logout] Сессия завершена");

    // Успешный выход: уходим на страницу входа.
    await router.replace(routes.auth.login);

    console.log("[Logout] Перешли на /login");
  } catch (error) {
    console.error("[Logout] Неожиданная ошибка:", error);
  } finally {
    // Возвращаем кнопку в активное состояние.
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
