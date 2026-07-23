<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="toast-container">
      <div
        v-for="t in toasts"
        :key="t.id"
        v-show="t.visible"
        class="toast"
        :class="t.type"
      >
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
}
.toast {
  padding: 12px 20px;
  border-radius: 12px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  pointer-events: auto;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}
.toast.warning {
  background: #f59e0b;
}
.toast.success {
  background: #22c55e;
}
.toast.info {
  background: #3b82f6;
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
