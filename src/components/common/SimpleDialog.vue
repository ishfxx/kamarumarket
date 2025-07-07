<template>
  <transition name="dialog-fade">
    <div
      v-if="isVisible"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70"
      @click.self="closeOnOverlayClick && $emit('close')"
    >
      <div
        class="bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-lg mx-4 relative"
        @click.stop
      >
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-2xl font-semibold text-gray-800 dark:text-white/90">
            <slot name="title">{{ title }}</slot>
          </h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div class="dialog-content mb-6">
          <slot></slot>
        </div>

        <div v-if="$slots.footer" class="dialog-footer flex justify-end gap-3">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
// Tidak ada impor komponen lain, hanya Vue dasar
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'Dialog',
  },
  closeOnOverlayClick: {
    type: Boolean,
    default: true, // Izinkan menutup dengan mengklik di luar modal secara default
  },
});

const emits = defineEmits(['close']); // Mendefinisikan event 'close'

// Opsi untuk menyembunyikan scrollbar body saat modal terbuka
// import { watch } from 'vue';
// watch(() => props.isVisible, (newVal) => {
//   if (newVal) {
//     document.body.style.overflow = 'hidden';
//   } else {
//     document.body.style.overflow = '';
//   }
// });
</script>

<style scoped>
/* Transisi untuk efek fade in/out */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

/* Transisi untuk efek scale/zoom pada konten dialog */
.dialog-fade-enter-active .bg-white,
.dialog-fade-leave-active .bg-white,
.dialog-fade-enter-active .dark\:bg-gray-900,
.dialog-fade-leave-active .dark\:bg-gray-900 {
  transition: transform 0.3s ease;
}

.dialog-fade-enter-from .bg-white,
.dialog-fade-leave-to .bg-white,
.dialog-fade-enter-from .dark\:bg-gray-900,
.dialog-fade-leave-to .dark\:bg-gray-900 {
  transform: scale(0.95);
}
</style>
