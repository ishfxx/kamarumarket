<template>
  <AdminLayout>
    <Breadcrumb :pageTitle="pageTitle" :breadcrumbItems="breadcrumbItems" />

    <div class="px-6 py-8">
      <h1 class="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Daftar Pengguna</h1>

      <div v-if="userStore.loading" class="text-center text-gray-600 dark:text-gray-400">
        Memuat daftar pengguna...
      </div>
      <div v-if="userStore.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong class="font-bold">Error:</strong>
        <span class="block sm:inline">{{ userStore.error }}</span>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nama
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Username
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="userStore.allUsers.length === 0 && !userStore.loading">
                  <td colspan="3" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">
                      Tidak ada pengguna ditemukan.
                  </td>
              </tr>
              <tr v-for="user in userStore.allUsers" :key="user.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {{ user.first_name }} {{ user.last_name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ user.username }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ user.email }}
                </td>
                </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'vue-router';
import AdminLayout from '@/components/layout/AdminLayout.vue';
import Breadcrumb from '@/components/common/PageBreadcrumb.vue';

const userStore = useUserStore();
const router = useRouter();

const pageTitle = ref('Daftar Pengguna'); // Mengubah judul
const breadcrumbItems = ref([
  { label: 'Admin', path: '/admin' },
  { label: 'Daftar Pengguna', path: '/admin/users' } // Mengubah label breadcrumb
]);

// Fungsi formatRole tidak lagi diperlukan di template ini, tapi bisa tetap ada untuk jaga-jaga
// const formatRole = (role: string) => {
//   if (!role) return '';
//   return role.charAt(0).toUpperCase() + role.slice(1);
// };

// Fungsi handleRoleChange dan confirmDelete DIHAPUS karena tidak ada lagi elemen UI yang memanggilnya.
// Jika Anda mengembalikan fungsionalitasnya, Anda perlu mengembalikan fungsi-fungsi ini juga.

onMounted(async () => {
  // Pastikan user data dimuat untuk otentikasi dasar (isLoggedIn)
  await userStore.initializeUser();

  // Jika Anda ingin halaman ini hanya menampilkan data dan sementara tidak peduli role admin
  // Hapus pengecekan role admin untuk debugging atau tampilan sementara.
  // if (userStore.profile?.role === 'admin') {
      await userStore.fetchAllUsers();
  // } else {
  //   alert('Anda tidak memiliki izin untuk mengakses halaman ini.');
  //   router.push('/dashboard');
  // }
});
</script>

<style scoped>
/* Pastikan gaya tabel Anda didefinisikan dengan baik di sini atau secara global */
table {
  border-collapse: collapse;
}
th, td {
  text-align: left;
}
/* Select styling tidak lagi relevan karena dropdown role dihapus sementara */
/* select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3e%3cpath d='M7 7l3-3 3 3m0 6l-3 3-3-3' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3e%3c/path%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em;
  padding-right: 2.5rem;
} */
</style>
