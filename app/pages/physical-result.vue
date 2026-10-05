<template>  <!--
    Страница результата скрининга по физической активности.
    Показывает hero, карточку итога, смежные советы
    и кнопку перехода к плану восстановления.
  -->
  <div class="result-page physical">
    <!--
      Верхний блок с заголовком результата.
    -->
    <div class="hero">
      <!--
        Иконка-эмодзи категории «физическая активность»:
        визуальный ярлык доминирующей проблемы.
      -->
      <div class="hero-icon">⚠️</div>
      <!--
        Заголовок hero. Ключ results.physical.heroTitle —
        $t зависит от текущей локали (i18n).
      -->
      <div class="hero-title">{{ $t("results.physical.heroTitle") }}</div>
      <!--
        Подзаголовок hero: кратко расшифровывает итог.
      -->
      <div class="hero-subtitle">
        {{ $t("results.physical.heroSubtitle") }}
      </div>
    </div>

    <!--
      Главная карточка результата: надзаголовок, вывод
      скрининга и список из пяти признаков проблемы.
    -->
    <q-card flat class="result-card">
      <!--
        Надзаголовок карточки (напр. «Результат анализа»),
        локализован через $t.
      -->
      <div class="card-title">{{ $t("results.physical.cardTitle") }}</div>
      <!--
        Крупный вывод: суть доминирующей проблемы
        «физическая активность».
      -->
      <div class="card-main">{{ $t("results.physical.cardMain") }}</div>
      <!--
        Горизонтальный разделитель между выводом и списком.
      -->
      <div class="divider"></div>
      <!--
        Список признаков: 5 пунктов с ключами
        results.physical.list.0…4; тексты зависят от локали.
      -->
      <div class="card-list">
        <!--
          Один пункт списка признаков (v-for по 1…5).
        -->
        <div v-for="item in 5" :key="item">
          {{ $t("results.physical.list." + (item - 1)) }}
        </div>
      </div>
    </q-card>

    <!--
      Смежная info-карточка: как физическая активность
      влияет на питание (results.physical.food*).
    -->
    <q-card flat class="info-card">
      <!--
        Заголовок связки с питанием.
      -->
      <div class="info-title">{{ $t("results.physical.foodTitle") }}</div>
      <!--
        Текст связки (локализован, $t → текущая локаль).
      -->
      <div class="info-text">
        {{ $t("results.physical.foodText") }}
      </div>
    </q-card>

    <!--
      Смежная info-карточка: как физическая активность
      влияет на психику (results.physical.mind*).
    -->
    <q-card flat class="info-card">
      <!--
        Заголовок связки с ментальным здоровьем.
      -->
      <div class="info-title">{{ $t("results.physical.mindTitle") }}</div>
      <!--
        Текст связки (локализован, $t → текущая локаль).
      -->
      <div class="info-text">
        {{ $t("results.physical.mindText") }}
      </div>
    </q-card>

    <!--
      Recovery-карточка: practical-советы, с которых
      начинается путь к восстановлению.
    -->
    <q-card flat class="recovery-card">
      <!--
        Заголовок блока советов (локализован через $t).
      -->
      <div class="info-title">{{ $t("results.physical.recoveryTitle") }}</div>
      <!--
        Список из 4 советов: ключи
        results.physical.recoveryList.0…3, перевод зависит
        от текущей локали.
      -->
      <div class="card-list">
        <!--
          Один совет из recovery-списка (v-for по 1…4).
        -->
        <div v-for="item in 4" :key="item">
          {{ $t("results.physical.recoveryList." + (item - 1)) }}
        </div>
      </div>
    </q-card>

    <!--
      Фиксированная нижняя панель с единственным
      основным действием страницы результата.
    -->
    <div class="bottom-action">
      <!--
        Кнопка «Начать восстановление»: подпись локализована
        ($t), переход идёт через централизованный маршрут
        routes.recovery.daily (ежедневный план).
      -->
      <q-btn
        unelevated
        no-caps
        class="main-btn"
        :label="$t('results.startRecovery')"
        @click="navigateTo(routes.recovery.daily)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/*
 * ============================================================
 * RESULT PRESENTATION FLOW
 * ============================================================
 *
 * Страница показывает итог скрининга для доминирующей
 * проблемы «физическая активность» (physical).
 *
 * Score → route mapping (см. stores/screening):
 *   1. Баллы блоков скрининга суммируются по категориям.
 *   2. Категория с максимальным баллом = dominant problem.
 *   3. dominant = "physical" → /physical-result (эта страница);
 *      dominant = "food"    → /food-result;
 *      dominant = "mind"    → /mind-result.
 *   4. Дальше рендерятся hero, карточка результата,
 *      смежные info-карточки и recovery-советы.
 *   5. Кнопка внизу уводит на routes.recovery.daily.
 *
 * Все тексты — через $t: при смене локали в settings.vue
 * переводы обновляются автоматически.
 */

/*
 * ============================================================
 * IMPORTS
 * ============================================================
 */

/*
 * Централизованная система маршрутов приложения.
 *
 * Вместо хардкода "/recovery/daily" используется
 * routes.recovery.daily — цель кнопки «Начать восстановление».
 */
import { routes } from "~/router/routes";
</script>

<style scoped lang="scss">
.result-page {
  min-height: 100vh;
  padding: 24px 20px 140px;
  background: var(--result-page-btn);
}
.hero {
  text-align: center;
  margin-bottom: 32px;
}
.hero-icon {
  width: 110px;
  height: 110px;
  margin: 0 auto 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 52px;
  background: var(--hero-icon);
  box-shadow: var(--hero-icon-shadow);
}
.hero-title {
  font-size: 34px;
  font-weight: 700;
  line-height: 1.15;
  color: var(--black1);
  margin-bottom: 16px;
}
.hero-subtitle {
  font-size: 17px;
  line-height: 1.6;
  color: var(--grey2);
}
.result-card,
.info-card,
.recovery-card {
  padding: 24px;
  border-radius: 28px;
  margin-bottom: 18px;
  background: var(--hero-icon);
  backdrop-filter: blur(16px);
  box-shadow: 0 10px 35px var(--shadow-md);
}
.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--orange);
  margin-bottom: 14px;
}
.card-main {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--black1);
}
.divider {
  height: 1px;
  background: var(--shadow-lg);
  margin: 20px 0;
}
.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 16px;
  line-height: 1.5;
  color: var(--grey-dark);
}
.info-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 14px;
}
.info-text {
  font-size: 16px;
  line-height: 1.7;
  color: var(--grey2);
}
.bottom-action {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16px 20px calc(16px + env(safe-area-inset-bottom));
  background: var(--glass-bar);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-top: 1px solid var(--glass-border);
  z-index: 100;
}
.main-btn {
  width: 100%;
  height: 62px;
  border-radius: 22px;
  font-size: 18px;
  font-weight: 700;
  background: var(--main-btn);
  color: var(--white);
  box-shadow: 0 10px 30px var(--shadow-orange);
}
</style>
