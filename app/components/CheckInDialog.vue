<template>
  <q-dialog v-model="opened" persistent class="checkin-dialog">
    <q-card class="checkin-card">
      <div class="hero">
        <div class="title">
          Давай зафиксируем
          <br />
          свое состояние
        </div>

        <div class="subtitle">Это займет меньше минуты</div>
      </div>

      <div class="section-title">Как ты себя чувствуешь?</div>

      <div class="moods">
        <button
          v-for="item in moods"
          :key="item.value"
          class="mood-btn"
          :class="{ active: mood === item.value }"
          @click="mood = item.value"
        >
          <div class="emoji">
            {{ item.emoji }}
          </div>

          <div class="emoji-label">
            {{ item.label }}
          </div>
        </button>
      </div>

      <div class="section-title">Опиши свое состояние</div>

      <q-input
        v-model="note"
        outlined
        autogrow
        class="note-input"
        placeholder="Например: устал, нет энергии, тревога, много мыслей..."
      />

      <div class="tip-card">
        <div class="tip-title">📈 Зачем это нужно?</div>

        <div class="tip-text">
          Мы будем строить график состояния и показывать, как меняется твое
          самочувствие день за днем.
        </div>
      </div>

      <q-btn
        unelevated
        class="save-btn"
        :disable="!mood"
        label="Зафиксировать"
        @click="save"
      />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { moodOptions } from "../constants/moods";

const props = defineProps({
  modelValue: Boolean,
});

const emit = defineEmits(["update:modelValue", "save"]);

const note = ref("");

const mood = ref<number | null>(null);

const moods = moodOptions;

const opened = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

function save() {
  emit("save", {
    mood: mood.value,
    note: note.value,
    date: new Date().toISOString(),
  });

  opened.value = false;
  mood.value = null;
  note.value = "";
}
</script>

<style>
.checkin-card {
  width: 92%;
  max-width: 460px;
  padding: 28px;
  border-radius: 28px;
  background: var(--grey-hover) !important;
  box-shadow: 0 25px 70px var(--shadow-xl), 0 10px 30px var(--shadow-md);
}

.hero {
  text-align: center;
  margin-bottom: 28px;
}

.hero-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 16px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;
  background: var(--green-bg);
}

.title {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--black1);
}

.subtitle {
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

.note-input :deep(.q-field__control) {
  border-radius: 18px;
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

.save-btn {
  width: 100%;
  height: 56px;
  border-radius: 18px;
  color: white;
  font-size: 16px;
  font-weight: 700;
  background: var(--gradient-green-bright);
}

.save-btn:disabled {
  opacity: 0.5;
}
</style>