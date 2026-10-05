<template>  <!--
    Промежуточная страница обработки callback после входа через
    Google: показывает спиннер, пока код обменивается на сессию
    и определяется пункт назначения для перенаправления.
  -->
  <div class="callback-page">
    <!--
      Индикатор загрузки: виден, пока обрабатывается callback.
    -->
    <q-spinner color="primary" size="50px" />

    <!--
      Текст "авторизация через Google…" — переводится через i18n.
    -->
    <div class="callback-text">
      {{ $t("auth.googleLoading") }}
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
 * onMounted из Vue: обработку callback запускаем после монтирования.
 */
import { onMounted } from "vue";

/*
 * Централизованный маршрут-объект: нужен для редиректа на страницу
 * входа при ошибке обработки callback.
 */
import { routes } from "~/router/routes";

/*
 * Сервис Google-авторизации: обменивает код на сессию и возвращает
 * пункт назначения для дальнейшего редиректа.
 */
import { getGoogleAuthDestination } from "~/services/googleAuth.service";

/*
 * ============================================================
 * PAGE META
 * ============================================================
 */

/*
 * layout: false — страница рендерится без базового макета,
 * так как это техническая промежуточная страница авторизации.
 */
definePageMeta({
  layout: false,
});

/*
 * ============================================================
 * CALLBACK FLOW
 * ============================================================
 */

/*
 * Роутер Nuxt: выполняем программный редирект по результату обработки.
 */
const router = useRouter();

/*
 * Текущий маршрут: из query берём код авторизации от Google.
 */
const route = useRoute();

/*
 * Обработка возврата от OAuth-провайдера.
 *
 * Поток:
 * 1. Получение кода из query и обмен его на сессию (в сервисе).
 * 2. Редирект в приложение (онбординг или восстановление).
 * 3. При любой ошибке — редирект на страницу входа.
 */
onMounted(async () => {
  try {
    // Обмениваем код на сессию и определяем, куда перенаправить.
    const destination = await getGoogleAuthDestination(route.query.code);

    // Переходим на страницу, выбранную по результатам проверки.
    await router.replace(destination);
  } catch (error) {
    // Неожиданная ошибка — возвращаем пользователя на вход.
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
