<template>  <!--
    Страница-заглушка восстановления пароля: сообщает, что функция
    ещё в разработке, и предлагает вернуться на страницу входа.
  -->
  <div class="auth-placeholder-page">
    <div class="card">
      <!--
        Заголовок страницы: переводится через i18n
        ("Восстановление пароля" / "Відновлення пароля").
      -->
      <h1>{{ $t("auth.forgotTitle") }}</h1>

      <!--
        Служебная пометка о том, что страница пока не реализована.
      -->
      <p>{{ $t("auth.comingSoon") }}</p>

      <!--
        Кнопка возврата на вход: использует централизованный маршрут
        routes.auth.login с автоимпортом navigateTo (вместо "/login").
      -->
      <q-btn
        unelevated
        no-caps
        color="primary"
        class="full-width"
        :label="$t('auth.backToLogin')"
        @click="navigateTo(routes.auth.login)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/*
 * ============================================================
 * IMPORTS
 * ============================================================
 */

/*
 * Централизованный маршрут-объект: используем его для навигации
 * вместо жёстко прописанных URL-строк.
 */
import { routes } from "~/router/routes";

/*
 * ============================================================
 * PAGE META
 * ============================================================
 */

/*
 * Middleware "guest": страница доступна только неавторизованным
 * пользователям; авторизованных перенаправляет в приложение.
 */
definePageMeta({
  middleware: "guest",
});
</script>

<style scoped>
.auth-placeholder-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.card {
  width: 100%;
  max-width: 400px;
  text-align: center;
}
.card p {
  color: var(--grey);
  margin-bottom: 24px;
}
</style>
