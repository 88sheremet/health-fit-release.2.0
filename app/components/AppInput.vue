<template>
  <div class="app-input-wrapper">
    <textarea
      v-if="autogrow"
      :value="modelValue"
      class="app-input app-textarea"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <input
      v-else
      :value="modelValue"
      type="text"
      class="app-input"
      :placeholder="placeholder"
      :disabled="disabled"
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
    disabled?: boolean;
  }>(),
  { placeholder: "", autogrow: false, disabled: false }
);

defineEmits<{ "update:modelValue": [value: string] }>();
</script>

<style scoped>
.app-input {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  font-family: inherit;
  border: 1.5px solid var(--border-default);
  border-radius: 14px;
  outline: none;
  background: #fff;
  color: var(--black1);
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.app-input::placeholder {
  color: var(--grey-light);
}

.app-input:focus {
  border-color: var(--green);
  box-shadow: var(--focus-ring);
}

.app-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--grey-hover);
}

.app-textarea {
  resize: vertical;
  min-height: 80px;
}
</style>
