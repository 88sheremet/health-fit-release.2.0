<template>
  <div class="app-input-wrapper">
    <textarea
      v-if="autogrow"
      :value="modelValue"
      class="app-input app-textarea"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <input
      v-else
      :value="modelValue"
      type="text"
      class="app-input"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    autogrow?: boolean;
  }>(),
  { placeholder: "", autogrow: false }
);

defineEmits<{ "update:modelValue": [value: string] }>();
</script>

<style scoped>
.app-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  font-family: inherit;
  border: 1.5px solid #ccc;
  border-radius: 14px;
  outline: none;
  background: #fff;
  color: var(--black1, #1d1d1f);
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.app-input:focus {
  border-color: var(--green, #4caf50);
}

.app-textarea {
  resize: vertical;
  min-height: 80px;
}
</style>
