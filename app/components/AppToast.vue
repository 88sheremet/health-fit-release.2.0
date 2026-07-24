<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="toast-container" aria-live="assertive">
      <div
        v-for="t in toasts"
        :key="t.id"
        v-show="t.visible"
        class="toast"
        :class="t.type"
        role="alert"
      >
        <span class="toast-icon">
          <template v-if="t.type === 'warning'">⚠️</template>
          <template v-else-if="t.type === 'success'">✅</template>
          <template v-else>ℹ️</template>
        </span>
        {{ t.message }}
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from "~/utils/toast";
const { toasts } = useToast();
</script>

<style>
.toast-container {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
  width: 90%;
  max-width: 400px;
}
.toast {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 14px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  pointer-events: auto;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}
.toast-icon {
  flex-shrink: 0;
  font-size: 16px;
}
.toast.warning {
  background: var(--toast-warning);
}
.toast.success {
  background: var(--toast-success);
}
.toast.info {
  background: var(--toast-info);
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}
</style>
