<template>  <!--
    Модальный диалог ежедневного чек-ина: выбор настроения
    (шкала 1..5), необязательная заметка и совет-карточка.
    Результат уходит родителю через emit события "save".
  -->
  <q-dialog v-model="dialogModel" persistent>
    <!--
      Карточка диалога; persistent заставляет закрывать окно
      только явным действием пользователя.
    -->
    <q-card class="checkin-card">
      <!-- Шапка: заголовок и подзаголовок из i18n (checkin.*). -->
      <div class="hero">
        <div class="title">
          {{ $t("checkin.title") }}
        </div>

        <div class="subtitle">
          {{ $t("checkin.subtitle") }}
        </div>
      </div>

      <!-- Заголовок блока выбора настроения. -->
      <div class="section-title">
        {{ $t("checkin.moodTitle") }}
      </div>

      <!--
        Кнопки настроения: по одной на значение 1..5
        (moodOptions из constants/moods). Подсветка активной,
        подпись — перевод labelKey (зависит от локали).
      -->
      <div class="moods">
        <button
          v-for="item in moods"
          :key="item.value"
          type="button"
          class="mood-btn"
          :class="{ active: mood === item.value }"
          @click="selectMood(item.value)"
        >
          <!-- Эмодзи и текстовая подпись варианта настроения. -->
          <div class="emoji">
            {{ item.emoji }}
          </div>

          <div class="emoji-label">
            {{ $t(item.labelKey) }}
          </div>
        </button>
      </div>

      <!-- Заголовок блока заметки. -->
      <div class="section-title">
        {{ $t("checkin.noteTitle") }}
      </div>

      <!--
        Текст заметки к чек-ину (необязательное поле);
        отправляется в payload события save.
      -->
      <q-input
        v-model="note"
        type="textarea"
        autogrow
        outlined
        class="note-input"
        :placeholder="$t('checkin.notePlaceholder')"
      />

      <!-- Совет-карточка дня: текст из i18n (checkin.tip*). -->
      <div class="tip-card">
        <div class="tip-title">
          {{ $t("checkin.tipTitle") }}
        </div>

        <div class="tip-text">
          {{ $t("checkin.tipText") }}
        </div>
      </div>

      <!--
        Сохранение: кнопка неактивна, пока настроение
        не выбрано (mood === null). Данные передаёт
        событием "save" методу save().
      -->
      <q-btn
        unelevated
        no-caps
        color="primary"
        text-color="white"
        class="save-btn"
        :label="$t('checkin.saveBtn')"
        :disable="mood === null"
        @click="save"
      />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
/*
 * ============================================================
 * IMPORTS
 * ============================================================
 */

/* computed — v-model-обёртка диалога; ref — поля формы. */
import { computed, ref } from "vue";

/* Готовые варианты настроения (value/emoji/ключ i18n). */
import { moodOptions } from "~/constants/moods";

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

/* Шкала настроения чек-ина: 1 (худшее) .. 5 (лучшее). */
type Mood = 1 | 2 | 3 | 4 | 5;

/* Данные события save: выбранное настроение и текст заметки. */
interface CheckinPayload {
  /* Оценка дня; сохраняется в journal_entries.mood. */
  mood: Mood;

  /* Обрезанный текст заметки (может быть пустой строкой). */
  note: string;
}

/* Локальная форма элемента moodOptions для шаблона. */
interface MoodOption {
  /* Числовая оценка настроения 1..5. */
  value: Mood;

  /* Эмодзи из таблицы moodEmojis. */
  emoji: string;

  /* Ключ i18n (moods.*) — подпись в текущей локали. */
  labelKey: string;
}

/*
 * ============================================================
 * DEPENDENCIES
 * ============================================================
 */

/* Входные пропсы: modelValue управляет видимостью диалога. */
const props = defineProps<{
  modelValue: boolean;
}>();

/*
 * Отдаваемые события:
 * "update:modelValue" — синхронизация v-model;
 * "save" — заполненный чек-ин на обработку родителем.
 */
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  save: [payload: CheckinPayload];
}>();

/*
 * ============================================================
 * COMPUTED
 * ============================================================
 */

/* Двусторонняя модель: чтение берёт из props.modelValue,
   запись шлёт emit — стандартный паттерн v-model компонента. */
const dialogModel = computed({
  get: (): boolean => props.modelValue,
  set: (value: boolean) => {
    emit("update:modelValue", value);
  },
});

/*
 * ============================================================
 * REACTIVE STATE
 * ============================================================
 */

/* Текст заметки к чек-ину (поле textarea). */
const note = ref("");

/* Выбранное настроение; null — ничего не выбрано, кнопка
   сохранения остаётся неактивной. */
const mood = ref<Mood | null>(null);

/* Варианты для v-for; приведение к MoodOption[] для шаблона. */
const moods = moodOptions as MoodOption[];

/*
 * ============================================================
 * METHODS
 * ============================================================
 */

/* Запоминает выбранную оценку — подсвечивает кнопку
   и активирует кнопку сохранения. */
function selectMood(value: Mood) {
  mood.value = value;
}

/*
 * САВЕ FLOW (клиентская часть).
 * 1. Выход, если настроение не выбрано.
 * 2. emit "save" с payload: mood и обрезанный note.
 *    Саму запись в Supabase выполняет родитель через стор.
 */
function save() {
  if (mood.value === null) {
    return;
  }

  emit("save", {
    mood: mood.value,
    note: note.value.trim(),
  });
}
</script>

<style>
.checkin-card {
  width: min(92vw, 460px);
  padding: 28px;
  border-radius: 24px;
  background: var(--grey-hover);
}
.note-input .q-field--outlined .q-field__control,
.note-input .q-field--outlined .q-field__control:before {
  border-radius: 14px;
}
.hero {
  text-align: center;
  margin-bottom: 28px;
}
.hero .title {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--black1);
}
.hero .subtitle {
  margin-top: 8px;
  font-size: 14px;
  color: var(--grey);
}
.section-title {
  margin-bottom: 14px;
  font-size: 18px;
  font-weight: 700;
  color: var(--black1);
}
.moods {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-bottom: 28px;
}
.mood-btn {
  border: none;
  border-radius: 18px;
  padding: 12px 4px;
  cursor: pointer;
  background: var(--grey-hover);
  transition: 0.2s;
}
.mood-btn.active {
  background: var(--green-bg);
  transform: translateY(-2px);
  box-shadow: 0 0 0 2px var(--green), 0 10px 20px var(--shadow-green);
}
.emoji {
  font-size: 28px;
}
.emoji-label {
  margin-top: 6px;
  font-size: 11px;
  color: var(--grey-dark);
}
.note-input {
  margin-bottom: 20px;
}
.tip-card {
  padding: 16px;
  border-radius: 18px;
  background: var(--green-bg);
  margin-bottom: 22px;
}
.tip-title {
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--green-deep);
}
.tip-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--green-deep);
}
.checkin-card .save-btn {
  width: 100%;
  height: 56px;
  border-radius: 18px;
  color: var(--white);
  font-size: 16px;
  font-weight: 700;
  background: var(--gradient-green-bright);
}
.checkin-card .save-btn:disabled {
  opacity: 0.5;
}
</style>