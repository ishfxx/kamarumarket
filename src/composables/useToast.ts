// composables/useToast.ts
import { h, render } from 'vue';
import BaseToast from '@/components/ui/BaseToast.vue';

export function useToast() {
  const showToast = (
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'success',
    duration = 3000
  ) => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const vnode = h(BaseToast, { message, type, duration });
    render(vnode, container);

    setTimeout(() => {
      render(null, container);
      document.body.removeChild(container);
    }, duration + 300);
  };

  return { showToast };
}
