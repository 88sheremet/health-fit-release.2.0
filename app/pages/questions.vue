<template>  <!--
    Страница опросника: показывает блоки вопросов по одному,
    вопросы с 5-балльной шкалой, прогресс, валидацию ответов
    и завершение — с расчётом баллов, сохранением результата
    и редиректом на страницу итогов по доминирующей проблеме.
  -->
  <div class="questions-page" ref="pageRef">
    <!-- Шапка: счётчики блока и вопросов, полоса прогресса. -->
    <div class="header">
      <!-- Верхний ряд шапки: номер блока и число ответов. -->
      <div class="header-top">
        <!-- Номер активного блока из общего числа (i18n: questions.block). -->
        <div class="block-counter">
          {{
            $t("questions.block", {
              current: screeningStore.currentBlock + 1,
              total: screeningStore.blocks.length,
            })
          }}
        </div>
        <!-- Сколько вопросов текущего блока уже отвечено. -->
        <div class="questions-counter">
          {{ answeredQuestions }} /
          {{ screeningStore.currentBlockData.questions.length }}
        </div>
      </div>
      <!-- Полоса прогресса по всем блокам (значение из progress). -->
      <q-linear-progress
        :value="screeningStore.progress"
        color="primary"
        track-color="grey-4"
        rounded
        size="10px"
      />
    </div>

    <!-- Заголовок активного блока и общий подзаголовок шкалы. -->
    <div class="title-section">
      <!-- Заголовок через i18n-ключ блока — локаль-зависимый текст. -->
      <div class="title">{{ $t(screeningStore.currentBlockData.title) }}</div>
      <!-- Инструкция о шкале ответов (i18n: questions.subtitle). -->
      <div class="subtitle">{{ $t("questions.subtitle") }}</div>
    </div>

    <!-- Список карточек вопросов текущего блока. -->
    <div class="questions-list">
      <!--
        Карточка одного вопроса: номер, текст и шкала 1..5.
        Класс invalid подсвечивает неотвеченный вопрос при
        попытке перейти дальше. ref questionRefs — для скролла
        к первому незаполненному вопросу.
      -->
      <q-card
        v-for="(question, index) in screeningStore.currentBlockData.questions"
        :key="question.id"
        ref="questionRefs"
        flat
        class="question-card"
        :class="{
          invalid:
            showValidation && screeningStore.answers[question.id] === undefined,
        }"
      >
        <!-- Верхняя часть карточки: номер и текст вопроса. -->
        <div class="question-top">
          <!-- Порядковый номер вопроса в блоке (нумерация с 1). -->
          <div class="question-number">{{ index + 1 }}</div>
          <!-- Текст вопроса по i18n-ключу (screeningBlocks.*.qXXX). -->
          <div class="question-text">{{ $t(question.text) }}</div>
        </div>
        <!-- Ряд кнопок-оценок по 5-балльной шкале. -->
        <div class="answers">
          <!--
            Кнопка оценки от 1 до 5. Класс active — выбранный
            ответ; клик сохраняет оценку в хранилище через
            screeningStore.setAnswer.
          -->
          <button
            v-for="item in 5"
            :key="item"
            class="answer-btn"
            :class="{ active: screeningStore.answers[question.id] === item }"
            @click="screeningStore.setAnswer(question.id, item)"
          >
            {{ item }}
          </button>
        </div>
        <!-- Подписи полюсов шкалы: хорошо / плохо (i18n). -->
        <div class="scale-labels">
          <span>{{ $t("questions.scaleGood") }}</span>
          <span>{{ $t("questions.scaleBad") }}</span>
        </div>
      </q-card>
    </div>

    <!-- Закреплённая внизу часть: кнопка «Далее» / «Завершить». -->
    <div class="footer">
      <!-- На последнем блоке кнопка завершает опросник (i18n). -->
      <q-btn
        unelevated
        no-caps
        class="next-btn"
        :label="
          screeningStore.isLastBlock()
            ? $t('common.finish')
            : $t('questions.next')
        "
        @click="goNext"
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
 * Vue: computed — счётчик отвеченных вопросов, ref — ссылки
 * на DOM, nextTick — ожидание перерисовки перед скроллом.
 */
import { computed, ref, nextTick } from "vue";

/* Quasar: useQuasar даёт $q для всплывающих уведомлений. */
import { useQuasar } from "quasar";

/* Хранилище скрининга: ответы, блоки, баллы и итоговый результат. */
import { useScreeningStore } from "~/stores/screening";

/* Доминирующая проблема: определяет маршрут страницы результата. */
import { DominantProblem } from "~/enums/DominantProblem.enum";

/* Централизованный роутер: маршруты результатов physical/food/mind. */
import { routes } from "~/router/routes";

/*
 * ============================================================
 * PAGE META
 * ============================================================
 */

/*
 * layout: authenticated — страница для авторизованного
 * пользователя; middleware: auth — доступ только после входа.
 */
definePageMeta({
  layout: "authenticated",
  middleware: "auth",
});

/*
 * ============================================================
 * DEPENDENCIES
 * ============================================================
 */

/* Экземпляр хранилища скрининга (ответы и блоки опросника). */
const screeningStore = useScreeningStore();

/* Объект Quasar $q: используют для уведомлений об ошибках. */
const $q = useQuasar();

/* Функция перевода i18n для сообщений валидации. */
const { t } = useI18n();

/*
 * ============================================================
 * REACTIVE STATE
 * ============================================================
 */

/* Ссылка на корневой скролл-контейнер страницы (прокрутка вверх). */
const pageRef = ref<HTMLElement | null>(null);

/*
 * Ссылки на DOM карточек вопросов текущего блока (по порядку).
 * Пригодятся для скролла к первому неотвеченному вопросу.
 */
const questionRefs = ref<any[]>([]);

/*
 * Флаг режима валидации: после первого клика «Далее» неотвеченные
 * карточки подсвечиваются классом invalid.
 */
const showValidation = ref(false);

/*
 * ============================================================
 * COMPUTED
 * ============================================================
 */

/*
 * Количество отвеченных вопросов текущего блока. Выводится
 * в счётчике шапки («Х / всего вопросов»).
 */
const answeredQuestions = computed(
  () =>
    screeningStore.currentBlockData.questions.filter(
      (q) => screeningStore.answers[q.id] !== undefined
    ).length
);

/*
 * ============================================================
 * METHODS/FUNCTIONS
 * ============================================================
 */

/*
 * СКРОЛЛ К ПЕРВОМУ НЕОТВЕЧЕННОМУ ВОПРОСУ
 * Поток:
 * 1. Дождаться перерисовки списка (nextTick).
 * 2. Найти первый вопрос без ответа в текущем блоке.
 * 3. Плавно прокрутить его карточку в центр экрана.
 */
const scrollToFirstEmpty = async () => {
  await nextTick();
  const questions = screeningStore.currentBlockData.questions;
  const index = questions.findIndex(
    (q) => screeningStore.answers[q.id] === undefined
  );
  if (index === -1) return;
  const el = questionRefs.value?.[index];
  el?.$el?.scrollIntoView({ behavior: "smooth", block: "center" });
};

/*
 * УВЕДОМЛЕНИЕ О НЕЗАПОЛНЕННЫХ ОТВЕТАХ
 * Показывает предупреждение, что вопросы блока требуют ответа.
 * Текст — локаль-зависимый, берётся через t("screening.validationText").
 */
const showValidationAlert = () => {
  $q.notify({
    message: t("screening.validationText"),
    type: "warning",
    timeout: 2500,
  });
};

/*
 * ПЕРЕХОД ВПЕРЁД / ЗАВЕРШЕНИЕ ОПРОСНИКА
 * Поток:
 * 1. Включить режим валидации и проверить полноту блока.
 * 2. При пропусках — показать предупреждение и скролл к ним.
 * 3. На последнем блоке — рассчитать баллы, сохранить результат
 *    и перейти на страницу по доминирующей проблеме.
 * 4. Иначе — зачесть балл блока, перейти к следующему и вверх.
 */
const goNext = async () => {
  /* Шаг 1: подсветить все неотвеченные вопросы блока. */
  showValidation.value = true;

  const isValid = screeningStore.validateCurrentBlock();

  /* Шаг 2: блок неполный — предупреждаем и скроллим к пропускам. */
  if (!isValid) {
    showValidationAlert();
    await scrollToFirstEmpty();
    return;
  }

  /* Шаг 3: завершающий блок — выполняем финал скрининга. */
  if (screeningStore.isLastBlock()) {
    /* Сумма ответов последнего блока попадает в blockScores. */
    screeningStore.calculateCurrentBlockScore();

    try {
      /* Сохраняем полный результат скрининга в Supabase. */
      await screeningStore.completeScreening();

      // Только после успешного сохранения определяем результат
      /* Доминирующая проблема по баллам всех трёх блоков. */
      const result = screeningStore.dominantProblem;

      /* Маршрут результата зависит от доминирующей проблемы. */
      if (result === DominantProblem.Physical) {
        await navigateTo(routes.results.physical);
      } else if (result === DominantProblem.Food) {
        await navigateTo(routes.results.food);
      } else {
        await navigateTo(routes.results.mind);
      }
    } catch (error) {
      console.error("[Questions] Не удалось сохранить скрининг:", error);

      /* При сбое сохранения показываем ошибку и остаёмся на месте. */
      $q.notify({
        message: "Не удалось сохранить результат. Попробуйте ещё раз.",
        type: "negative",
        timeout: 3000,
      });
    }

    return;
  }

  /* Шаг 4: обычный блок — считаем балл и переходим к следующему. */
  screeningStore.nextBlock();

  /* На новом блоке скрываем подсветку неотвеченных вопросов. */
  showValidation.value = false;

  await nextTick();

  /* Прокрутка страницы вверх к началу нового блока. */
  pageRef.value?.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};
</script>

<style scoped lang="scss">
.questions-page {
  height: 100vh;
  overflow-y: auto;
  padding: 24px 20px 140px;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Helvetica, Arial, sans-serif;
  background: radial-gradient(
      circle at 10% 0%,
      var(--icon-green-bg),
      transparent 45%
    ),
    radial-gradient(circle at 90% 20%, var(--blue-bg), transparent 40%),
    var(--bg-gradient-main);
}
.header {
  position: sticky;
  top: 0;
  z-index: 20;
  padding: 14px 14px 16px;
  border-radius: 0 0 22px 22px;
  background: var(--hero-icon);
  backdrop-filter: blur(20px);
  box-shadow: 0 10px 30px var(--shadow-md);
}
.block-counter {
  font-size: 13px;
  font-weight: 800;
  color: var(--green);
  letter-spacing: 0.3px;
}
.questions-counter {
  font-size: 13px;
  font-weight: 600;
  color: var(--grey2);
}
.title-section {
  margin-top: 26px;
  margin-bottom: 30px;
  animation: fadeInUp 0.4s ease;
}
.title {
  font-size: 30px;
  font-weight: 900;
  line-height: 1.15;
  color: var(--black1);
  letter-spacing: -0.5px;
}
.subtitle {
  margin-top: 10px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--grey2);
}
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.question-card {
  padding: 22px;
  border-radius: 26px;
  background: var(--hero-icon);
  backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  box-shadow: 0 18px 45px var(--shadow-lg), inset 0 1px 0 var(--hero-icon);
  transition: all 0.25s ease;
}
.question-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 25px 60px var(--shadow-xl);
}
.question-card.invalid {
  border: 1px solid var(--red-border);
  box-shadow: 0 18px 50px var(--red-bg);
  animation: shake 0.3s ease;
}
.question-top {
  display: flex;
  gap: 14px;
  margin-bottom: 18px;
}
.question-number {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    var(--green-gradient-start),
    var(--green-gradient-end)
  );
  color: var(--green-dark);
  font-size: 14px;
  font-weight: 900;
}
.question-text {
  font-size: 16px;
  font-weight: 650;
  line-height: 1.5;
  color: var(--black1);
}
.answers {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.answer-btn {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  border: 1px solid var(--shadow-lg);
  background: var(--white);
  color: var(--grey-dark);
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
}
.answer-btn:hover {
  transform: translateY(-2px);
  background: var(--grey-hover);
}
.answer-btn.active {
  background: var(--gradient-green-active);
  color: var(--white);
  transform: translateY(-3px);
  box-shadow: 0 12px 28px var(--shadow-green);
}
.scale-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 12px;
  color: var(--grey-light);
}
.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 18px 20px 26px;
  background: var(--hero-icon);
  backdrop-filter: blur(24px);
  border-top: 1px solid var(--shadow-md);
  box-shadow: 0 -10px 35px var(--shadow-lg);
}
.next-btn {
  width: 100%;
  height: 58px;
  border-radius: 18px;
  font-size: 16px;
  font-weight: 900;
  background: var(--gradient-green-bright);
  color: var(--white);
  box-shadow: 0 14px 35px var(--shadow-green);
  transition: all 0.2s ease;
}
.next-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 18px 45px var(--shadow-green-hover);
}
.next-btn:active {
  transform: scale(0.98);
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes shake {
  0% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  50% {
    transform: translateX(4px);
  }
  75% {
    transform: translateX(-4px);
  }
  100% {
    transform: translateX(0);
  }
}
</style>
