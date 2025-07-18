<template>
  <Transition name="fade">
    <div
      v-if="visible"
      class="fixed top-24 right-5 z-[9999] flex items-start gap-3 max-w-sm px-4 py-3 rounded-lg shadow-lg text-white"
      :class="{
        'bg-green-600': props.type === 'success',
        'bg-red-600': props.type === 'error',
        'bg-yellow-500': props.type === 'warning',
        'bg-blue-600': props.type === 'info',
      }"
    >
      <div class="flex-1">
        <p class="font-semibold capitalize">
          {{ props.type }}
        </p>
        <p class="text-sm">{{ props.message }}</p>
      </div>
      <button
        @click="visible = false"
        class="ml-2 text-white hover:text-gray-200 transition duration-200"
        aria-label="Close"
      >
        &times;
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const props = defineProps<{
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}>();

const visible = ref(true);

onMounted(() => {
  setTimeout(() => {
    visible.value = false;
  }, props.duration || 3000);
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
