<template>  <!--
    Корневой диалог деталей задачи (Quasar q-dialog).
    Управляется пропом modelValue через v-model со страницы daily.
  -->
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <!-- Содержимое рисуется только когда выбрана конкретная задача. -->
    <div v-if="task" class="dialog">
      <!-- Шапка: кнопка закрытия, название задачи и чип награды. -->
      <div class="header">
        <!-- Кнопка закрытия диалога — шлёт update:modelValue(false). -->
        <button
          class="close-btn"
          type="button"
          @click="$emit('update:modelValue', false)"
        >
          <span class="material-icons"> close </span>
        </button>

        <!-- Локализованное название задачи. -->
        <div class="title">
          {{ task.title }}
        </div>

        <!-- Чип с наградой за выполнение (task.reward). -->
        <span class="reward-chip">
          {{
            $t("taskDetails.reward", {
              n: task.reward,
            })
          }}
        </span>
      </div>

      <!-- Разделитель между шапкой и телом. -->
      <hr class="separator" />

      <!-- Тело диалога: блоки «что делать» и «зачем». -->
      <div class="content">
        <!-- Заголовок раздела «Что делать». -->
        <div class="section-title">
          {{ $t("taskDetails.whatToDo") }}
        </div>

        <!-- Обычная задача (не физическая): просто текст whatDoing. -->
        <template v-if="task.type !== 'physical'">
          <div class="text">
            {{ getText(task.whatDoing) }}
          </div>
        </template>

        <!--
          Физическая задача: чтоDoing может быть объектом
          с частями упражнений (back/legs/abs) — блоки ниже.
        -->
        <template v-else>
          <!-- Блок упражнений для спины, если такая часть есть. -->
          <div v-if="getExercisePart('back')" class="exercise-block">
            <div class="exercise-title">
              {{ $t("taskDetails.back") }}
            </div>

            <div class="text">
              {{ getExercisePart("back") }}
            </div>
          </div>

          <!-- Блок упражнений для ног, если такая часть есть. -->
          <div v-if="getExercisePart('legs')" class="exercise-block">
            <div class="exercise-title">
              {{ $t("taskDetails.legs") }}
            </div>

            <div class="text">
              {{ getExercisePart("legs") }}
            </div>
          </div>

          <!-- Блок упражнений для пресса, если такая часть есть. -->
          <div v-if="getExercisePart('abs')" class="exercise-block">
            <div class="exercise-title">
              {{ $t("taskDetails.abs") }}
            </div>

            <div class="text">
              {{ getExercisePart("abs") }}
            </div>
          </div>

          <!--
            Фолбэк: у физической задачи нет структурированных упражнений —
            показываем обычный текст whatDoing.
          -->
          <div v-if="!hasExerciseData" class="text">
            {{ getText(task.whatDoing) }}
          </div>
        </template>

        <!-- Разделитель между разделами «что» и «зачем». -->
        <hr class="separator content-separator" />

        <!-- Заголовок раздела «Зачем это важно». -->
        <div class="section-title">
          {{ $t("taskDetails.whyToDo") }}
        </div>

        <!-- Обоснование задачи из поля whyDoing. -->
        <div class="text">
          {{ task.whyDoing }}
        </div>
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
/*
 * ============================================================
 * IMPORTS
 * ============================================================
 */

/* Вычисляемое свойство для признака наличия данных упражнений. */
import { computed } from "vue";

/* Доменная модель задачи, передаваемая со страницы daily. */
import type { Task } from "~/interfaces/Task.interface";

/*
 * ============================================================
 * PROPS & EMITS
 * ============================================================
 */

/* Пропсы диалога: видимость и текущая задача (null — содержимого нет). */
interface Props {
  /* true — диалог открыт; управляет v-model со страницы daily. */
  modelValue: boolean;

  /* Задача для показа; null — блок с содержимым не рендерится. */
  task: Task | null;
}

/*
 * ============================================================
 * INTERFACES
 * ============================================================
 */

/*
 * Структура whatDoing для физических задач: части тела → текст упражнения.
 * Соответствует объекту, который приходит из колонки what_doing.
 */
interface ExerciseData {
  /* Текст упражнений на пресс. */
  abs?: string;

  /* Текст упражнений на спину. */
  back?: string;

  /* Текст упражнений на ноги. */
  legs?: string;
}

/* Разбор пропсов диалога. */
const props = defineProps<Props>();

/* События: только закрытие/открытие через update:modelValue. */
defineEmits<{
  (event: "update:modelValue", value: boolean): void;
}>();

/*
 * ============================================================
 * FUNCTIONS
 * ============================================================
 */

/*
 * Type-guard: является ли значение объектом-упражнением (не массивом, не null).
 * Используется getText/getExercisePart/hasExerciseData для безопасного доступа к частям.
 *
 * 1. Проверяем, что это объект и не null.
 * 2. Исключаем массивы.
 */
function isExerciseData(value: unknown): value is ExerciseData {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/*
 * Приводит whatDoing к строке для показа в блоках .text.
 *
 * 1. Строка — возвращаем как есть.
 * 2. Объект упражнений — склеиваем все строковые части через перенос.
 * 3. Иначе — пустая строка.
 */
function getText(value: unknown): string {
  /* Случай обычной текстовой задачи. */
  if (typeof value === "string") {
    return value;
  }

  /* Случай структурированных упражнений — все части в один текст. */
  if (isExerciseData(value)) {
    return Object.values(value)
      .filter((item): item is string => typeof item === "string")
      .join("\n");
  }

  /* Неизвестный формат — ничего не показываем. */
  return "";
}

/*
 * Достаёт одну часть упражнений (back/legs/abs) из whatDoing текущей задачи.
 *
 * 1. Задачи нет — пустая строка.
 * 2. whatDoing не объект упражнений — пустая строка.
 * 3. Возвращаем строковую часть либо пустую строку.
 */
function getExercisePart(part: keyof ExerciseData): string {
  /* Диалог открыт без задачи — частей нет. */
  if (!props.task) {
    return "";
  }

  /* Берём поле инструкции текущей задачи. */
  const value = props.task.whatDoing;

  /* Формат не структурированный — части недоступны. */
  if (!isExerciseData(value)) {
    return "";
  }

  /* Искомая часть объекта (может отсутствовать). */
  const partValue = value[part];

  /* Возвращаем только строковые значения. */
  return typeof partValue === "string" ? partValue : "";
}

/*
 * ============================================================
 * COMPUTED
 * ============================================================
 */

/*
 * Есть ли у задачи хотя бы одна часть упражнений.
 * true — показываем блоки back/legs/abs; false — фолбэк на обычный текст.
 *
 * 1. Нет задачи — false.
 * 2. Не объект упражнений — false.
 * 3. true, если заполнено abs, back или legs.
 */
const hasExerciseData = computed(() => {
  /* Задача не выбрана — данных нет. */
  if (!props.task) {
    return false;
  }

  /* Свободный текст вместо структуры — упражнений нет. */
  const value = props.task.whatDoing;

  if (!isExerciseData(value)) {
    return false;
  }

  /* Есть хотя бы одна заполненная часть тела. */
  return Boolean(value.abs || value.back || value.legs);
});
</script>

<style scoped>
.dialog {
  width: min(92vw, 700px);
  max-width: 700px;
  max-height: 90vh;
  border-radius: 28px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--white);
}
.header {
  position: relative;
  padding: 20px 24px 16px 24px;
}
.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--white);
  border: none;
  cursor: pointer;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}
.title {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.3;
  padding-right: 40px;
  margin-bottom: 12px;
}
.reward-chip {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--green);
  color: var(--white);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}
.separator {
  border: none;
  height: 1px;
  background: var(--border-default);
  margin: 0;
}
.content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
.section-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 14px;
}
.exercise-block {
  margin-bottom: 20px;
}
.exercise-title {
  font-size: 17px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--green);
}
.text {
  font-size: 15px;
  line-height: 1.7;
  color: var(--grey-dark);
  white-space: pre-line;
}
.content-separator {
  margin: 24px 0;
}
</style>
