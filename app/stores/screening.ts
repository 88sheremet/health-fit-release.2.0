/*
 * ============================================================
 * IMPORTS
 * ============================================================
 */

/* Пинья: defineStore — фабрика описания хранилища с состоянием. */
import { defineStore } from "pinia";

/*
 * Перечисление доминирующей проблемы: значение записывается
 * в колонку dominant_problem и совпадает с маршрутом страницы
 * результата (см. enums/DominantProblem.enum.ts).
 */
import { DominantProblem } from "../enums/DominantProblem.enum";

/* Интерфейс блока опросника — тип данных SCREENING_BLOCKS. */
import type { Block } from "../interfaces/Block.interface";

/* Интерфейс словаря ответов пользователя (state.answers). */
import type { Answers } from "../interfaces/Answers.interface";

/* Интерфейс словаря баллов по блокам (state.blockScores). */
import type { BlockScores } from "../interfaces/BlockScores.interface";

/*
 * ============================================================
 * ДАННЫЕ: БЛОКИ СКРИНИНГА
 * ============================================================
 */

/*
 * Статичная конфигурация опросника: три блока по девять вопросов.
 * id блока — ключ в blockScores; id вопроса — ключ в answers.
 * Поля title и text — i18n-ключи, локаль-зависимые, переводятся
 * через $t() на странице вопросов.
 */
const SCREENING_BLOCKS: Block[] = [
  /*
   * Блок 1 — физическое здоровье. Заголовок берётся по ключу
   * screeningBlocks.physical.title; вопросы имеют id 101..109
   * и тексты screeningBlocks.physical.q101..q109.
   */
  {
    id: 1,
    title: "screeningBlocks.physical.title",
    questions: [
      { id: 101, text: "screeningBlocks.physical.q101" },
      { id: 102, text: "screeningBlocks.physical.q102" },
      { id: 103, text: "screeningBlocks.physical.q103" },
      { id: 104, text: "screeningBlocks.physical.q104" },
      { id: 105, text: "screeningBlocks.physical.q105" },
      { id: 106, text: "screeningBlocks.physical.q106" },
      { id: 107, text: "screeningBlocks.physical.q107" },
      { id: 108, text: "screeningBlocks.physical.q108" },
      { id: 109, text: "screeningBlocks.physical.q109" },
    ],
  },

  /*
   * Блок 2 — питание. Заголовок по ключу
   * screeningBlocks.food.title; вопросы id 201..209, тексты
   * screeningBlocks.food.q201..q209.
   */
  {
    id: 2,
    title: "screeningBlocks.food.title",
    questions: [
      { id: 201, text: "screeningBlocks.food.q201" },
      { id: 202, text: "screeningBlocks.food.q202" },
      { id: 203, text: "screeningBlocks.food.q203" },
      { id: 204, text: "screeningBlocks.food.q204" },
      { id: 205, text: "screeningBlocks.food.q205" },
      { id: 206, text: "screeningBlocks.food.q206" },
      { id: 207, text: "screeningBlocks.food.q207" },
      { id: 208, text: "screeningBlocks.food.q208" },
      { id: 209, text: "screeningBlocks.food.q209" },
    ],
  },

  /*
   * Блок 3 — ментальное здоровье. Заголовок по ключу
   * screeningBlocks.mind.title; вопросы id 301..309, тексты
   * screeningBlocks.mind.q301..q309.
   */
  {
    id: 3,
    title: "screeningBlocks.mind.title",
    questions: [
      { id: 301, text: "screeningBlocks.mind.q301" },
      { id: 302, text: "screeningBlocks.mind.q302" },
      { id: 303, text: "screeningBlocks.mind.q303" },
      { id: 304, text: "screeningBlocks.mind.q304" },
      { id: 305, text: "screeningBlocks.mind.q305" },
      { id: 306, text: "screeningBlocks.mind.q306" },
      { id: 307, text: "screeningBlocks.mind.q307" },
      { id: 308, text: "screeningBlocks.mind.q308" },
      { id: 309, text: "screeningBlocks.mind.q309" },
    ],
  },
];

/*
 * ============================================================
 * ХРАНИЛИЩЕ SCREENING — ОПИСАНИЕ СТРУКТУРЫ
 * ============================================================
 *
 * Секции хранилища: state (REACTIVE STATE), getters (COMPUTED)
 * и actions (METHODS/FUNCTIONS). Опция persist: true включает
 * автосохранение состояния в localStorage (подключаемый плагин
 * pinia-plugin-persistedstate).
 */
export const useScreeningStore = defineStore("screening", {
  /*
   * ============================================================
   * REACTIVE STATE — СОСТОЯНИЕ ХРАНИЛИЩА
   * ============================================================
   */

  state: () => ({
    /* Флаг: скрининг успешно сохранён либо загружен из БД. */
    screeningCompleted: false,

    /* Индекс активного блока (0..2). Управляет прогрессом и
       навигацией по опроснику. */
    currentBlock: 0,

    /* Ответы пользователя: ключ — id вопроса, значение — 1..5. */
    answers: {} as Answers,

    /* Баллы по блокам: ключ — id блока, значение — сумма ответов. */
    blockScores: {} as BlockScores,

    /* Флаг выполнения запроса к Supabase (загрузка/сохранение). */
    loading: false,

    /* Сообщение об ошибке запроса либо null при успехе. */
    error: null as string | null,
  }),

  /*
   * ============================================================
   * COMPUTED — ВЫЧИСЛЯЕМЫЕ СВОЙСТВА (Getters)
   * ============================================================
   */

  getters: {
    /* Список всех блоков опросника (статичные данные). */
    blocks: () => SCREENING_BLOCKS,

    /*
     * Текущий (активный) блок по индексу currentBlock.
     * Используется на странице вопросов: заголовок блока,
     * список вопросов и валидация полноты ответов.
     */
    currentBlockData(): Block {
      return SCREENING_BLOCKS[this.currentBlock]!;
    },

    /*
     * Доля завершённости скрининга от 0 до 1: сколько блоков
     * пройдено. Питает полосу прогресса q-linear-progress
     * на странице вопросов.
     */
    progress: (state) => (state.currentBlock + 1) / SCREENING_BLOCKS.length,

    /*
     * Доминирующая проблема: блок с наибольшим суммарным баллом.
     * При равенстве баллов приоритет принадлежит физическому
     * блоку (первая проверка). Результат определяет страницу,
     * на которую попадает пользователь после завершения опросника.
     */
    dominantProblem(state): DominantProblem {
      /* Балл каждого блока с защитой от отсутствия ключа (|| 0). */
      const physical = state.blockScores[1] || 0;
      const food = state.blockScores[2] || 0;
      const mind = state.blockScores[3] || 0;

      /* Максимум среди баллов трёх блоков. */
      const max = Math.max(physical, food, mind);

      /* Физический блок лидирует (включая ситуацию ничьей). */
      if (max === physical) {
        return DominantProblem.Physical;
      }

      /* Блок питания лидирует. */
      if (max === food) {
        return DominantProblem.Food;
      }

      /* Во всех остальных случаях доминирует ментальный блок. */
      return DominantProblem.Mind;
    },
  },

  /*
   * ============================================================
   * METHODS/FUNCTIONS — ДЕЙСТВИЯ ХРАНИЛИЩА (Actions)
   * ============================================================
   */

  actions: {
    /*
     * ЗАГРУЗКА РЕЗУЛЬТАТА СКРИНИНГА ИЗ SUPABASE
     * Поток:
     * 1. Получить текущего пользователя через supabase.auth.
     * 2. Выбрать его запись из таблицы screening_results.
     * 3. При ошибке или отсутствии записи — сбросить скрининг.
     * 4. При успехе — восстановить answers, blockScores и флаг.
     */
    async loadScreening() {
      /* Старт загрузки и очистка прошлой ошибки. */
      this.loading = true;
      this.error = null;

      try {
        /* Клиент Supabase (автоимпорт Nuxt) для таблиц и auth. */
        const supabase = useSupabaseClient();

        /* Шаг 1: берём текущего авторизованного пользователя. */
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        /* Сбой чтения пользователя — прерывание загрузки. */
        if (userError) {
          throw userError;
        }

        /* Без пользователя возвращаем хранилище к чистому скринингу. */
        if (!user) {
          this.resetScreening();
          return;
        }

        /* Шаг 2: запрашиваем результат скрининга этого пользователя. */
        const { data, error } = await supabase
          .from("screening_results")
          .select(
            `
              user_id,
              answers,
              physical_score,
              food_score,
              mind_score,
              dominant_problem,
              completed_at,
              updated_at
            `
          )
          .eq("user_id", user.id)
          .maybeSingle();

        /* Ошибка запроса к таблице — пробрасываем выше в catch. */
        if (error) {
          throw error;
        }

        /* Шаг 3: записи нет — пользователь ещё не проходил скрининг. */
        if (!data) {
          console.log("[Screening] Результат не найден — скрининг не пройден");

          this.resetScreening();
          return;
        }

        /* Шаг 4a: восстанавливаем словарь ответов из колонки answers. */
        this.answers = (data.answers || {}) as Answers;

        /* Шаг 4b: баллы блоков из колонок physical/food/mind_score. */
        this.blockScores = {
          1: Number(data.physical_score || 0),
          2: Number(data.food_score || 0),
          3: Number(data.mind_score || 0),
        } as BlockScores;

        /* Шаг 4c: фиксируем пройденность и стартовый (первый) блок. */
        this.screeningCompleted = true;

        this.currentBlock = 0;
      } catch (error: any) {
        console.error("[Screening] Ошибка загрузки:", error);

        /* Формируем сообщение об ошибке для показа в интерфейсе. */
        this.error =
          error?.message || "Не удалось загрузить результат скрининга";

        this.screeningCompleted = false;
      } finally {
        /* Снимаем флаг загрузки при любом исходе. */
        this.loading = false;
      }
    },

    /*
     * СОХРАНЕНИЕ РЕЗУЛЬТАТА СКРИНИНГА В SUPABASE
     * Поток:
     * 1. Взять текущего пользователя (без него — ошибка).
     * 2. Вычислить доминирующую проблему из баллов блоков.
     * 3. Выполнить upsert в screening_results по user_id.
     * 4. Установить флаг screeningCompleted при успехе.
     */
    async saveScreening() {
      /* Старт сохранения и очистка прошлой ошибки. */
      this.loading = true;
      this.error = null;

      try {
        const supabase = useSupabaseClient();

        /* Шаг 1: проверяем текущую авторизацию пользователя. */
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        /* Сбой проверки пользователя — прерывание сохранения. */
        if (userError) {
          throw userError;
        }

        /* Без пользователя писать результат нельзя — отказ. */
        if (!user) {
          throw new Error("Пользователь не авторизован");
        }

        /* Метка времени для служебных колонок completed_at/updated_at. */
        const now = new Date().toISOString();

        /* Шаг 2: итоговая доминирующая проблема для записи в БД. */
        const dominantProblem = this.dominantProblem;

        /* Шаг 3: upsert — создаёт или обновляет строку по user_id. */
        const { error } = await supabase.from("screening_results").upsert(
          {
            /* Связка результата с аккаунтом пользователя. */
            user_id: user.id,

            /* Ответы: объект { id вопроса: оценка 1..5 } (jsonb). */
            answers: this.answers,

            /* Сумма баллов физического блока (0, если не пройден). */
            physical_score: this.blockScores[1] || 0,

            /* Сумма баллов блока питания. */
            food_score: this.blockScores[2] || 0,

            /* Сумма баллов ментального блока. */
            mind_score: this.blockScores[3] || 0,

            /* Доминирующая проблема: physical / food / mind. */
            dominant_problem: dominantProblem,

            /* Момент завершения скрининга. */
            completed_at: now,

            /* Момент последнего обновления записи. */
            updated_at: now,
          },
          {
            /* Конфликт вставки разрешаем по уникальному user_id. */
            onConflict: "user_id",
          }
        );

        if (error) {
          throw error;
        }

        /* Шаг 4: при успехе скрининг считается завершённым. */
        this.screeningCompleted = true;

        console.log("[Screening] Результат сохранён в Supabase", {
          physical: this.blockScores[1],
          food: this.blockScores[2],
          mind: this.blockScores[3],
          dominantProblem,
        });
      } catch (error: any) {
        console.error("[Screening] Ошибка сохранения:", error);

        /* Ошибка пробрасывается вызывающему коду (questions.vue). */
        this.error =
          error?.message || "Не удалось сохранить результат скрининга";

        throw error;
      } finally {
        this.loading = false;
      }
    },

    /*
     * ЗАВЕРШЕНИЕ СКРИНИНГА
     * Поток:
     * 1. Подсчитать балл текущего (последнего в опроснике) блока.
     * 2. Сохранить полный результат в Supabase.
     * Вызывается со страницы вопросов на последнем блоке,
     * а также при пропуске скрининга со страницы screening.vue.
     */
    async completeScreening() {
      this.calculateCurrentBlockScore();

      await this.saveScreening();
    },

    /*
     * СОХРАНЕНИЕ ОТВЕТА НА ВОПРОС
     * Кладёт выбранную пользователем оценку (1..5) в словарь
     * answers по id вопроса. Вызывается кнопками шкалы
     * на странице вопросов.
     */
    setAnswer(questionId: number, value: number) {
      this.answers[questionId] = value;
    },

    /*
     * ВАЛИДАЦИЯ ТЕКУЩЕГО БЛОКА
     * Возвращает true, если на все вопросы активного блока
     * дан ответ. Используется в questions.vue перед переходом
     * к следующему блоку или к завершению опросника.
     */
    validateCurrentBlock() {
      return this.currentBlockData.questions.every(
        (question) => this.answers[question.id] !== undefined
      );
    },

    /*
     * ПОДСЧЁТ БАЛЛА ТЕКУЩЕГО БЛОКА
     * Суммирует ответы на все вопросы активного блока
     * и сохраняет итог в blockScores по id блока.
     */
    calculateCurrentBlockScore() {
      const block = this.currentBlockData;

      /* Накопитель суммы ответов на вопросы блока. */
      let total = 0;

      block.questions.forEach((question) => {
        total += this.answers[question.id] || 0;
      });

      /* Фиксируем полученную сумму за текущим блоком. */
      this.blockScores[block.id] = total;
    },

    /*
     * ПЕРЕХОД К СЛЕДУЮЩЕМУ БЛОКУ
     * Поток:
     * 1. Зачесть балл текущего блока в blockScores.
     * 2. Инкрементировать currentBlock (если блок не последний).
     */
    nextBlock() {
      this.calculateCurrentBlockScore();

      if (this.currentBlock < this.blocks.length - 1) {
        this.currentBlock++;
      }
    },

    /*
     * ПРИЗНАК ПОСЛЕДНЕГО БЛОКА
     * true для третьего блока опросника. На этом шаге страница
     * вопросов завершает скрининг и выполняет редирект
     * на страницу результата.
     */
    isLastBlock() {
      return this.currentBlock === this.blocks.length - 1;
    },

    /*
     * СБРОС СКРИНИНГА
     * Возвращает хранилище в начальное состояние: снимает флаг
     * завершённости, обнуляет индекс блока, ответы, баллы
     * и текст ошибки.
     */
    resetScreening() {
      this.screeningCompleted = false;

      this.currentBlock = 0;

      this.answers = {};

      this.blockScores = {};

      this.error = null;
    },
  },

  /*
   * ============================================================
   * ПЕРСИСТЕНЦИЯ СОСТОЯНИЯ
   * ============================================================
   */

  /* Автосохранение состояния хранилища в localStorage (плагин
     pinia-plugin-persistedstate). */
  persist: true,
});
