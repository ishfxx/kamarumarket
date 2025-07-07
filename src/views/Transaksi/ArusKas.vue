<template>
  <AdminLayout>
    <Breadcrumb :pageTitle="pageTitle" :breadcrumbItems="breadcrumbItems" />

    <div class="px-6 py-8 dark:bg-gray-900 min-h-screen">
      <h1 class="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Laporan Arus Kas (Sederhana)</h1>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        Ringkasan aliran kas masuk dan kas keluar dalam periode waktu tertentu.
      </p>

      <div v-if="bookkeepingStore.loading" class="text-center text-gray-600 dark:text-gray-400">
        Memuat laporan...
      </div>
      <div v-if="bookkeepingStore.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong class="font-bold">Error:</strong>
        <span class="block sm:inline">{{ bookkeepingStore.error }}</span>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">Filter Periode</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="startDate" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Dari Tanggal</label>
            <input type="date" id="startDate" v-model="filterStartDate" @change="fetchReportData" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
          </div>
          <div>
            <label for="endDate" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Sampai Tanggal</label>
            <input type="date" id="endDate" v-model="filterEndDate" @change="fetchReportData" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Total Kas Masuk</h3>
          <p class="text-4xl font-extrabold text-green-600 dark:text-green-400"> {{ formatRupiah(bookkeepingStore.totalIncome) }}</p>
          <p class="text-gray-500 dark:text-gray-400">Total uang yang diterima</p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Total Kas Keluar</h3>
          <p class="text-4xl font-extrabold text-red-600 dark:text-red-400"> {{ formatRupiah(bookkeepingStore.totalExpense) }}</p>
          <p class="text-gray-500 dark:text-gray-400">Total uang yang dikeluarkan</p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Perubahan Kas Bersih</h3>
          <p :class="['text-4xl font-extrabold', { 'text-green-600 dark:text-green-400': netCashChange >= 0, 'text-red-600 dark:text-red-400': netCashChange < 0 }]">
             {{ formatRupiah(netCashChange) }}
          </p>
          <p class="text-gray-500 dark:text-gray-400">Perubahan total kas dalam periode ini</p>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '@/store/userStore';
import { useBookkeepingStore } from '@/store/bookkeepingStore';
import AdminLayout from '@/components/layout/AdminLayout.vue';
import Breadcrumb from '@/components/common/PageBreadcrumb.vue';
import { useRouter } from 'vue-router';

const userStore = useUserStore();
const bookkeepingStore = useBookkeepingStore();
const router = useRouter();

const pageTitle = ref('Arus Kas');
const breadcrumbItems = ref([
  { label: 'Laporan Keuangan', path: '/laporan/arus-kas' }, // Sesuaikan path jika ada halaman utama laporan
  { label: 'Arus Kas', path: '/laporan/arus-kas' }
]);

const filterStartDate = ref('');
const filterEndDate = ref('');

const netCashChange = computed(() => {
  return bookkeepingStore.totalIncome - bookkeepingStore.totalExpense;
});

const formatRupiah = (angka: number) => {
  if (typeof angka !== 'number') return '0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

const fetchReportData = async () => {
  if (!userStore.user?.id) {
    alert('User ID tidak ditemukan. Mohon login ulang.');
    return;
  }

  const umkmIdToFetch = userStore.profile?.role === 'umkm' ? userStore.user.id : undefined;

  // Ambil semua transaksi tanpa filter tipe, filtering tanggal di store action
  await bookkeepingStore.fetchTransactions(
    umkmIdToFetch as string,
    null, // Ambil semua tipe transaksi
    filterStartDate.value || null,
    filterEndDate.value || null
  );
};

onMounted(async () => {
  await userStore.initializeUser();

  if (userStore.isLoggedIn && (userStore.profile?.role === 'umkm' || userStore.profile?.role === 'admin')) {
    fetchReportData(); // Memuat data awal
  } else {
    alert('Anda tidak memiliki izin untuk mengakses halaman ini.');
    router.push('/dashboard');
  }
});
</script>

<style scoped>
/* Styling khusus */
</style>
