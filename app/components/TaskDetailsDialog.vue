<template>
  <AppDialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <div class="dialog">
      <div class="header">
        <button class="close-btn" @click="$emit('update:modelValue', false)">
          <span class="material-icons">close</span>
        </button>
        <div class="title">{{ task?.title }}</div>
        <span class="reward-chip">+{{ task?.reward }} энергии</span>
      </div>

      <hr class="separator" />

      <div class="content">
        <div class="section-title">Что делать</div>

        <template v-if="task?.type !== 'physical'">
          <div class="text">{{ task?.whatDoing }}</div>
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

        <hr class="separator" />

        <div class="section-title">Зачем делать</div>
        <div class="text">{{ task?.whyDoing }}</div>
      </div>
    </div>
  </AppDialog>
</template>

<script setup lang="ts">
defineProps({
  modelValue: Boolean,
  task: Object,
});

defineEmits(["update:modelValue"]);
</script>

<style scoped>
.dialog {
  width: 100%;
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
  color: white;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}
.separator {
  border: none;
  height: 1px;
  background: #e0e0e0;
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
.exercise-block { margin-bottom: 20px; }
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
.separator:last-of-type {
  margin: 24px 0;
}
</style>
