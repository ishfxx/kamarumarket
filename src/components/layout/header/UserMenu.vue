<template>
  <div class="relative" ref="dropdownRef">
    <button
      class="flex items-center text-gray-700 dark:text-gray-400"
      @click.prevent="toggleDropdown"
    >
      <span class="mr-3 overflow-hidden rounded-full h-11 w-11">
        <img :src="userStore.profile?.profile_picture || '/images/user/owner.jpg'" alt="User" />
      </span>

      <span class="block mr-1 font-medium text-theme-sm">
        <template v-if="userStore.isLoggedIn">
          {{ userStore.getUserFullName || userStore.getUsername || 'Pengguna' }}
        </template>
        <template v-else>
          Guest
        </template>
      </span>

      <ChevronDownIcon :class="{ 'rotate-180': dropdownOpen }" />
    </button>

    <div
      v-if="dropdownOpen"
      class="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
    >
      <div>
        <span class="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
          {{ userStore.getUserFullName || userStore.getUsername || 'Pengguna' }}
        </span>
        <span class="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
          {{ userStore.getUserRole ? formatRole(userStore.getUserRole) : 'Role Tidak Diketahui' }}
        </span>
      </div>

      <ul class="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
        <li v-for="item in filteredMenuItems" :key="item.href">
          <router-link
            :to="item.href"
            class="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
          >
            <component
              :is="item.icon"
              class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
            />
            {{ item.text }}
          </router-link>
        </li>
      </ul>

      <a
        href="#"
        @click.prevent="handleSignOut"
        class="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
      >
        <LogoutIcon
          class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
        />
        Sign out
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/userStore';

import {
  UserCircleIcon,
  ChevronDownIcon,
  LogoutIcon,
  SettingsIcon,
  InfoCircleIcon,
} from '@/icons'; // Pastikan path ikon ini benar

const dropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);
const router = useRouter();
const userStore = useUserStore();

// Definisikan semua item menu yang mungkin ada, beserta role yang diizinkan
const allMenuItems = [
  { href: '/profile', icon: UserCircleIcon, text: 'Edit profile', roles: ['admin', 'umkm', 'user'] }, // Menambahkan 'user' role jika ingin user biasa bisa mengedit profil
  { href: '/account-settings', icon: SettingsIcon, text: 'Account settings', roles: ['admin', 'umkm', 'user'] }, // Menambahkan 'user' role
  { href: '/support', icon: InfoCircleIcon, text: 'Support', roles: ['admin', 'user', 'umkm'] }, // Menambahkan 'umkm' role
];

// Computed property untuk memfilter menu item berdasarkan role pengguna
const filteredMenuItems = computed(() => {
  // Jika user tidak login, tidak perlu memfilter, langsung return array kosong.
  // Ini penting agar tidak mencoba mengakses userStore.getUserRole jika userStore.user null.
  if (!userStore.isLoggedIn) {
    return [];
  }

  // Jika user login, filter berdasarkan role yang dimilikinya
  const userRole = userStore.getUserRole;
  if (!userRole) {
    return []; // Jika role tidak terdefinisi (misalnya belum dimuat), kembalikan kosong
  }

  return allMenuItems.filter(item =>
    item.roles && item.roles.includes(userRole)
  );
});

// Fungsi untuk mengkapitalisasi huruf pertama dari role (misal: 'admin' menjadi 'Admin')
const formatRole = (role: string) => {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};

const closeDropdown = () => {
  dropdownOpen.value = false;
};

const handleSignOut = async () => {
  document.removeEventListener('click', handleClickOutside);
  await userStore.logout();
  closeDropdown();
  router.push('/signin');
};

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && event.target instanceof Node && !dropdownRef.value.contains(event.target)) {
    closeDropdown();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  // Pastikan user data sudah dimuat saat komponen dipasang
  // userStore.initializeUser() sudah dipanggil di main.ts,
  // jadi di sini kita hanya perlu memastikan data sudah tersedia.
  // Jika ada masalah dengan reaktivitas, bisa tambahkan watchEffect
  // tapi biasanya Pinia sudah cukup reaktif.
  console.log('UserMenu.vue: Component mounted. UserStore state - FullName:', userStore.getUserFullName, 'Role:', userStore.getUserRole);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* Styling tambahan jika diperlukan, misalnya untuk transition */
</style>
