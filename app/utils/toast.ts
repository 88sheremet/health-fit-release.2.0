import { ref } from "vue";

interface Toast {
  id: number;
  message: string;
  type: "warning" | "success" | "info";
  visible: boolean;
}

const toasts = ref<Toast[]>([]);
let nextId = 0;

export function useToast() {
  function show(
    message: string,
    options: { type?: Toast["type"]; timeout?: number } = {}
  ) {
    const id = nextId++;
    const toast: Toast = {
      id,
      message,
      type: options.type ?? "info",
      visible: true,
    };
    toasts.value.push(toast);

    setTimeout(() => {
      toast.visible = false;
      setTimeout(() => {
        toasts.value = toasts.value.filter((t) => t.id !== id);
      }, 300);
    }, options.timeout ?? 2500);
  }

  return { toasts, show };
}
