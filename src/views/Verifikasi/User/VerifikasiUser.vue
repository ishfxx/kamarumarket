<template>
  <AdminLayout>
    <Breadcrumb :pageTitle="pageTitle" :breadcrumbItems="breadcrumbItems" />

    <div class="px-6 py-8 dark:bg-gray-900 min-h-screen">
      <h1 class="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Manajemen Pengguna</h1>

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
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="userStore.allUsers.length === 0 && !userStore.loading">
                  <td colspan="5" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">
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
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <select
                    v-model="user.role"
                    @change="handleRoleChange(user.id, user.role)"
                    class="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    :disabled="user.id === userStore.user?.id"
                  >
                    <option v-for="roleOption in userStore.userRoles" :key="roleOption" :value="roleOption">
                      {{ formatRole(roleOption) }}
                    </option>
                  </select>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    @click="confirmDelete(user)"
                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600 ml-4"
                    :disabled="user.id === userStore.user?.id"
                  >
                    Hapus
                  </button>
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
import { useUserStore } from '@/store/userStore'; // Menggunakan @/stores/userStore
import { useRouter } from 'vue-router';
import AdminLayout from '@/components/layout/AdminLayout.vue';
import Breadcrumb from '@/components/common/PageBreadcrumb.vue';

const userStore = useUserStore();
const router = useRouter();

const pageTitle = ref('Manajemen Pengguna');
const breadcrumbItems = ref([
  { label: 'Admin', path: '/admin' },
  { label: 'Manajemen Pengguna', path: '/admin/users' }
]);

// Fungsi untuk mengkapitalisasi huruf pertama dari role
const formatRole = (role: string) => {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

// Fungsi untuk menangani perubahan role
const handleRoleChange = async (userId: string, newRole: string) => {
  if (confirm(`Apakah Anda yakin ingin mengubah peran pengguna ini menjadi ${formatRole(newRole)}?`)) {
    const success = await userStore.updateUserRole(userId, newRole);
    if (success) {
      alert('Peran pengguna berhasil diperbarui!');
      // userStore.allUsers sudah diupdate di userStore.updateUserRole
    } else {
      alert('Gagal memperbarui peran pengguna: ' + (userStore.error || 'Terjadi kesalahan.'));
      await userStore.fetchAllUsers(); // Muat ulang data jika gagal update atau dibatalkan
    }
  } else {
    await userStore.fetchAllUsers(); // Muat ulang data jika dibatalkan
  }
};

// Fungsi untuk konfirmasi dan menghapus user
const confirmDelete = async (user: any) => {
  if (user.id === userStore.user?.id) {
    alert('Anda tidak bisa menghapus akun Anda sendiri.');
    return;
  }

  if (confirm(`Apakah Anda yakin ingin menghapus pengguna ${user.username} (${user.email})? Tindakan ini tidak dapat dibatalkan.`)) {
    const success = await userStore.deleteUser(user.id);
    if (success) {
      alert('Pengguna berhasil dihapus dari profil.');
      // userStore.allUsers sudah difilter di userStore.deleteUser
    } else {
      alert('Gagal menghapus pengguna: ' + (userStore.error || 'Terjadi kesalahan.'));
    }
  }
};

onMounted(async () => {
  await userStore.initializeUser();

  // Pastikan user adalah admin sebelum mencoba mengambil daftar user
  if (userStore.isLoggedIn && userStore.profile?.role === 'admin') {
    await userStore.fetchAllUsers();
  } else {
    alert('Anda tidak memiliki izin untuk mengakses halaman ini.');
    router.push('/dashboard');
  }
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
select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3e%3cpath d='M7 7l3-3 3 3m0 6l-3 3-3-3' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3e%3c/path%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em;
  padding-right: 2.5rem;
}
</style>
