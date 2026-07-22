<template>
  <q-dialog v-model="opened">
    <q-card class="dialog">
      <div class="header">
        <q-btn round flat dense icon="close" class="close-btn" v-close-popup />

        <div class="title">
          {{ task?.title }}
        </div>

        <q-chip color="green" text-color="white" class="reward-chip">
          +{{ task?.reward }} энергии
        </q-chip>
      </div>

      <q-separator />

      <q-card-section class="content">
        <div class="section-title">Что делать</div>

        <template v-if="task?.type !== 'physical'">
          <div class="text">
            {{ task?.whatDoing }}
          </div>
        </template>

        <template v-else>
          <div class="exercise-block">
            <div class="exercise-title">Спина</div>
            <div class="text">{{ task?.whatDoing?.back }}</div>
          </div>

          <div class="exercise-block">
            <div class="exercise-title">Ноги</div>
            <div class="text">{{ task?.whatDoing?.legs }}</div>
          </div>

          <div class="exercise-block">
            <div class="exercise-title">Пресс</div>
            <div class="text">{{ task?.whatDoing?.abs }}</div>
          </div>
        </template>

        <q-separator class="separator" />

        <div class="section-title">Зачем делать</div>

        <div class="text">
          {{ task?.whyDoing }}
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
  modelValue: Boolean,
  task: Object,
});

const emit = defineEmits(["update:modelValue"]);

const opened = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});
</script>

<style scoped>
.dialog {
  width: 95%;
  max-width: 700px;
  max-height: 90vh;

  border-radius: 28px;
  overflow: hidden;

  display: flex;
  flex-direction: column;
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
  margin-bottom: 4px;
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
}

.separator {
  margin: 24px 0;
}
</style>