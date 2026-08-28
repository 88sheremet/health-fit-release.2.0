<template>
  <q-dialog v-model="dialogModel" persistent>
    <q-card class="checkin-card">
      <div class="hero">
        <div class="title">
          {{ $t("checkin.title") }}
        </div>

        ```
        <div class="subtitle">
          {{ $t("checkin.subtitle") }}
        </div>
      </div>

      <div class="section-title">
        {{ $t("checkin.moodTitle") }}
      </div>

      <div class="moods">
        <button
          v-for="item in moods"
          :key="item.value"
          type="button"
          class="mood-btn"
          :class="{ active: mood === item.value }"
          @click="mood = item.value"
        >
          <div class="emoji">
            {{ item.emoji }}
          </div>

          <div class="emoji-label">
            {{ $t(item.labelKey) }}
          </div>
        </button>
      </div>

      <div class="section-title">
        {{ $t("checkin.noteTitle") }}
      </div>

      <q-input
        v-model="note"
        type="textarea"
        autogrow
        outlined
        class="note-input"
        :placeholder="$t('checkin.notePlaceholder')"
      />

      <div class="tip-card">
        <div class="tip-title">
          {{ $t("checkin.tipTitle") }}
        </div>

        <div class="tip-text">
          {{ $t("checkin.tipText") }}
        </div>
      </div>

      <q-btn
        unelevated
        no-caps
        color="primary"
        text-color="white"
        class="save-btn"
        :label="$t('checkin.saveBtn')"
        :disable="!mood"
        @click="save"
      />
    </q-card>
    ```
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { moodOptions } from "~/constants/moods";

type Mood = 1 | 2 | 3 | 4 | 5;

interface CheckinPayload {
  mood: Mood;
  note: string;
}

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  save: [payload: CheckinPayload];
}>();

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => {
    emit("update:modelValue", value);
  },
});

const note = ref("");
const mood = ref<Mood | null>(null);

const moods = moodOptions;

function save() {
  if (!mood.value) {
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
