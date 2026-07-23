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
  border: none;
  border-radius: 14px;
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
}

/* unelevated (default) */
.app-btn.unelevated {
  background: var(--green);
  color: #fff;
}

/* flat */
.app-btn.flat {
  background: transparent;
  color: var(--green);
}

/* text */
.app-btn.text {
  background: transparent;
  color: var(--green);
  border-radius: 8px;
}

/* outlined */
.app-btn.outlined {
  background: transparent;
  color: var(--green);
  border: 1.5px solid var(--green);
}

/* dense */
.app-btn.dense {
  padding: 4px 10px;
  font-size: 13px;
}

/* full-width */
.app-btn.full-width {
  width: 100%;
}
</style>
