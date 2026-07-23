<template>
  <button
    :class="[
      'app-btn',
      variant,
      { 'no-caps': noCaps, 'full-width': fullWidth, dense },
    ]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot>{{ label }}</slot>
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    variant?: "flat" | "unelevated" | "outlined" | "text";
    noCaps?: boolean;
    fullWidth?: boolean;
    dense?: boolean;
    disabled?: boolean;
  }>(),
  { variant: "unelevated", label: "" }
);

defineEmits<{ click: [e: MouseEvent] }>();
</script>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 14px;
  font-family: inherit;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  line-height: 1;
}

.app-btn:not(.no-caps) {
  text-transform: none;
}

.app-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.app-btn:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

/* unelevated (default) */
.app-btn.unelevated {
  background: var(--green);
  color: #fff;
}
.app-btn.unelevated:hover:not(:disabled) {
  filter: brightness(1.05);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}
.app-btn.unelevated:active:not(:disabled) {
  transform: scale(0.97);
}

/* flat */
.app-btn.flat {
  background: transparent;
  color: var(--green);
}
.app-btn.flat:hover:not(:disabled) {
  background: rgba(76, 175, 80, 0.08);
}
.app-btn.flat:active:not(:disabled) {
  transform: scale(0.97);
}

/* text */
.app-btn.text {
  background: transparent;
  color: var(--green);
  border-radius: 8px;
}
.app-btn.text:hover:not(:disabled) {
  background: rgba(76, 175, 80, 0.08);
}
.app-btn.text:active:not(:disabled) {
  transform: scale(0.97);
}

/* outlined */
.app-btn.outlined {
  background: transparent;
  color: var(--green);
  border: 1.5px solid var(--green);
}
.app-btn.outlined:hover:not(:disabled) {
  background: rgba(76, 175, 80, 0.08);
}
.app-btn.outlined:active:not(:disabled) {
  transform: scale(0.97);
}

/* dense */
.app-btn.dense {
  padding: 6px 14px;
  font-size: 13px;
}

/* full-width */
.app-btn.full-width {
  width: 100%;
}
</style>
