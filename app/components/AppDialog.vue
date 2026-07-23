<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div
        v-if="modelValue"
        class="app-dialog-overlay"
        :class="{ persistent }"
        @click.self="close"
      >
        <div class="app-dialog-content" @click.stop>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, onUnmounted } from "vue";

const props = withDefaults(
  defineProps<{ modelValue: boolean; persistent?: boolean }>(),
  { persistent: false }
);

const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();

function close() {
  if (!props.persistent) {
    emit("update:modelValue", false);
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && props.modelValue) {
    close();
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }
);

onUnmounted(() => {
  document.body.style.overflow = "";
});

if (import.meta.client) {
  document.addEventListener("keydown", onKeydown);
  onUnmounted(() => {
    document.removeEventListener("keydown", onKeydown);
  });
}
</script>

<style scoped>
.app-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
}

.app-dialog-content {
  width: 92%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
