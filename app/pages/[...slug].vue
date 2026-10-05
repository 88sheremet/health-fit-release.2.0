<template>  <!--
    Страница-ловушка 404: рендерится для любого маршрута,
    который не совпал с существующими страницами.
  -->
  <div class="not-found-page">
    <!--
      Центрированный контент ошибки: код 404, заголовок,
      пояснение и кнопка возврата домой.
    -->
    <div class="content">
      <!--
        Крупный код ошибки 404.
      -->
      <div class="code">404</div>
      <!--
        Заголовок «страница не найдена» (ключ notFound.title,
        $t локализован — зависит от текущей локали i18n).
      -->
      <div class="title">{{ $t("notFound.title") }}</div>
      <!--
        Пояснение к ошибке (ключ notFound.subtitle, локализовано).
      -->
      <div class="subtitle">
        {{ $t("notFound.subtitle") }}
      </div>
      <!--
        Кнопка «На главную»: ведёт на routes.recovery.daily
        (централизованный маршрут вместо хардкода "/daily").
      -->
      <q-btn
        unelevated
        no-caps
        class="home-btn"
        :label="$t('notFound.homeBtn')"
        @click="navigateTo(routes.recovery.daily)"
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
 * Централизованная система маршрутов приложения:
 * catch-all [...slug] перехватывает любой несуществующий
 * путь, а кнопка «На главную» ведёт на routes.recovery.daily,
 * а не на хардкод строки адреса.
 *
 * Семантика catch-all: Nuxt регистрирует эту страницу как
 * fallback для всех маршрутов, не совпавших с другими
 * файлами app/pages/. Содержимое slug доступно через
 * useRoute().params.slug, но здесь не используется —
 * страница всегда показывает статичный 404.
 */
import { routes } from "~/router/routes";
</script>

<style scoped lang="scss">
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--bg-gradient-main);
}
.content {
  max-width: 420px;
  text-align: center;
}
.code {
  font-size: 96px;
  font-weight: 800;
  line-height: 1;
  color: var(--green);
  margin-bottom: 16px;
}
.title {
  font-size: 32px;
  font-weight: 700;
  color: var(--black1);
  margin-bottom: 12px;
}
.subtitle {
  font-size: 16px;
  line-height: 1.6;
  color: var(--grey2);
  margin-bottom: 32px;
}
.home-btn {
  width: 100%;
  height: 56px;
  border-radius: 18px;
  font-size: 16px;
  font-weight: 700;
  background: var(--start-btn);
  color: var(--white);
}
</style>
