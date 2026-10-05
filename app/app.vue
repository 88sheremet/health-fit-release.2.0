<template>  <!--
    Корневой компонент приложения: связывает layout-обёртку
    Nuxt с рендером страницы текущего маршрута.
  -->
  <!--
    Обёртка active layout: Nuxt сам выбирает layout по
    definePageMeta страницы (напр. "authenticated").
  -->
  <NuxtLayout>
    <!--
      Точка рендера активной страницы из app/pages/.
    -->
    <NuxtPage />
  </NuxtLayout>
</template>