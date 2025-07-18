<template>
  <AdminLayout> <Breadcrumb :pageTitle="pageTitle" :breadcrumbItems="breadcrumbItems" />

    <div class="px-6 py-8">
      <div v-if="userStore.loading" class="text-center text-gray-600 dark:text-gray-400">
        Memuat data profil...
      </div>
      <div v-if="userStore.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong class="font-bold">Error:</strong>
        <span class="block sm:inline">{{ userStore.error }}</span>
      </div>

      <div v-if="userProfileData" class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <form @submit.prevent="handleSave">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label for="firstName" class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">Nama Depan<span class="text-red-500">*</span></label>
              <input
                type="text"
                id="firstName"
                v-model="userProfileData.first_name"
                :disabled="!isEditing"
                class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 focus:border-emerald-300 focus:outline-none focus:ring-3 focus:ring-emerald-500/10 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:opacity-75"
              />
            </div>

            <div>
              <label for="lastName" class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">Nama Belakang<span class="text-red-500">*</span></label>
              <input
                type="text"
                id="lastName"
                v-model="userProfileData.last_name"
                :disabled="!isEditing"
                class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 focus:border-emerald-300 focus:outline-none focus:ring-3 focus:ring-emerald-500/10 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:opacity-75"
              />
            </div>

            <div>
              <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">Username<span class="text-red-500">*</span></label>
              <input
                type="text"
                id="username"
                v-model="userProfileData.username"
                :disabled="!isEditing"
                class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 focus:border-emerald-300 focus:outline-none focus:ring-3 focus:ring-emerald-500/10 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:opacity-75"
              />
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                id="email"
                v-model="userProfileData.email"
                disabled="true" class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:opacity-75 cursor-not-allowed"
              />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Email hanya dapat diubah melalui pengaturan akun Anda.</p>
            </div>

            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">Telepon</label>
              <input
                type="text"
                id="phone"
                v-model="userProfileData.phone"
                :disabled="!isEditing"
                class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 focus:border-emerald-300 focus:outline-none focus:ring-3 focus:ring-emerald-500/10 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:opacity-75"
              />
            </div>

            <div>
              <label for="role" class="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">Role</label>
              <input
                type="text"
                id="role"
                :value="formatRole(userProfileData.role)"
                disabled="true"
                class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:opacity-75 cursor-not-allowed"
              />
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button
              type="button"
              v-if="isEditing"
              @click="handleCancel"
              class="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-400 transition rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              v-if="isEditing"
              :disabled="userStore.loading"
              class="px-4 py-2.5 text-sm font-medium text-white transition rounded-lg bg-emerald-500 shadow-theme-xs hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="userStore.loading">Menyimpan...</span>
              <span v-else>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/userStore';
import AdminLayout from '@/components/layout/AdminLayout.vue';
import Breadcrumb from '@/components/common/PageBreadcrumb.vue';

const userStore = useUserStore();
const router = useRouter();

const pageTitle = ref('Profil Saya');
const breadcrumbItems = ref([
  { label: 'Dashboard', path: '/' }, // Sesuaikan dengan path dashboard utama Anda
  { label: 'Profil', path: '/profile' }
]);

const isEditing = ref(false); // State untuk mengaktifkan/menonaktifkan mode edit

// Data lokal untuk form, diinisialisasi dari userStore.profile
const userProfileData = ref({
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  phone: null as string | null,
  role: '',
});

// Watcher untuk mengisi userProfileData ketika userStore.profile berubah
// Ini penting karena userStore.profile mungkin belum terisi saat onMounted pertama kali
watch(() => userStore.profile, (newProfile) => {
  if (newProfile) {
    userProfileData.value = {
      first_name: newProfile.first_name || '',
      last_name: newProfile.last_name || '',
      username: newProfile.username || '',
      email: newProfile.email || userStore.user?.email || '', // Email bisa dari profile atau user obj
      phone: newProfile.phone || null,
      role: newProfile.role || '',
    };
  }
}, { immediate: true }); // immediate: true agar watcher berjalan saat komponen mount jika profile sudah ada

// Fungsi untuk mengkapitalisasi huruf pertama dari role
const formatRole = (role: string) => {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

// Fungsi untuk menangani simpan perubahan
const handleSave = async () => {
  // Validasi sederhana
  if (!userProfileData.value.first_name || !userProfileData.value.last_name || !userProfileData.value.username) {
    alert('Nama Depan, Nama Belakang, dan Username tidak boleh kosong.');
    return;
  }

  const success = await userStore.updateUserProfile(
    userProfileData.value.first_name,
    userProfileData.value.last_name,
    userProfileData.value.username,
    userProfileData.value.phone
  );

  if (success) {
    alert('Profil berhasil diperbarui!');
    isEditing.value = false; // Keluar dari mode edit setelah berhasil
  } else {
    alert('Gagal memperbarui profil: ' + (userStore.error || 'Terjadi kesalahan tidak dikenal.'));
  }
};

// Fungsi untuk membatalkan edit
const handleCancel = () => {
  isEditing.value = false;
  // Kembalikan data ke nilai awal dari store
  if (userStore.profile) {
    userProfileData.value = {
      first_name: userStore.profile.first_name || '',
      last_name: userStore.profile.last_name || '',
      username: userStore.profile.username || '',
      email: userStore.profile.email || userStore.user?.email || '',
      phone: userStore.profile.phone || null,
      role: userStore.profile.role || '',
    };
  }
};

onMounted(async () => {
  // Pastikan user data sudah dimuat
  await userStore.initializeUser();

  // Redirect jika tidak login
  if (!userStore.isLoggedIn) {
    alert('Anda harus login untuk melihat profil Anda.');
    router.push('/signin'); // Atau halaman login Anda
  }
});
</script>

<style scoped>
/* Gaya khusus untuk halaman profil jika diperlukan, atau tambahkan ke global CSS */
</style>
