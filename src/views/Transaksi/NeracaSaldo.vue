<template>
  <AdminLayout>
    <Breadcrumb :pageTitle="pageTitle" :breadcrumbItems="breadcrumbItems" />

    <div class="px-6 py-8 dark:bg-gray-900 min-h-screen">
      <h1 class="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Neraca Saldo (Ringkasan)</h1>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        Ringkasan total pemasukan dan pengeluaran Anda. Ini bukan neraca saldo akuntansi lengkap.
      </p>

      <div v-if="bookkeepingStore.loading" class="text-center text-gray-600 dark:text-gray-400">
        Memuat data saldo...
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
            <input type="date" id="startDate" v-model="filterStartDate" @change="fetchDataForNeraca" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
          </div>
          <div>
            <label for="endDate" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Sampai Tanggal</label>
            <input type="date" id="endDate" v-model="filterEndDate" @change="fetchDataForNeraca" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Total Pemasukan</h3>
          <p class="text-4xl font-extrabold text-green-600 dark:text-green-400"> {{ formatRupiah(filteredTotalIncome) }}</p>
          <p class="text-gray-500 dark:text-gray-400">Pemasukan dalam periode ini</p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Total Pengeluaran</h3>
          <p class="text-4xl font-extrabold text-red-600 dark:text-red-400"> {{ formatRupiah(filteredTotalExpense) }}</p>
          <p class="text-gray-500 dark:text-gray-400">Pengeluaran dalam periode ini</p>
        </div>
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Saldo Akhir</h3>
          <p :class="['text-4xl font-extrabold', { 'text-green-600 dark:text-green-400': filteredEndingBalance >= 0, 'text-red-600 dark:text-red-400': filteredEndingBalance < 0 }]">
             {{ formatRupiah(filteredEndingBalance) }}
          </p>
          <p class="text-gray-500 dark:text-gray-400">Saldo kas bersih Anda</p>
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

const pageTitle = ref('Neraca Saldo');
const breadcrumbItems = ref([
  { label: 'Pembukuan', path: '/pembukuan/neraca-saldo' },
  { label: 'Neraca Saldo', path: '/pembukuan/neraca-saldo' }
]);

const filterStartDate = ref('');
const filterEndDate = ref('');

// --- Computed untuk filter tanggal di UI ---
const filteredTransactionsByDate = computed(() => {
  const transactions = bookkeepingStore.transactions || [];
  if (!filterStartDate.value && !filterEndDate.value) {
    return transactions;
  }

  const start = filterStartDate.value ? new Date(filterStartDate.value + 'T00:00:00Z') : null;
  const end = filterEndDate.value ? new Date(filterEndDate.value + 'T23:59:59Z') : null; // Akhir hari

  return transactions.filter(t => {
    const transactionDate = new Date(t.date + 'T00:00:00Z'); // Pastikan ini juga di UTC untuk perbandingan
    let matchesFilter = true;

    if (start && transactionDate < start) {
      matchesFilter = false;
    }
    if (end && transactionDate > end) {
      matchesFilter = false;
    }
    return matchesFilter;
  });
});

const filteredTotalIncome = computed(() => {
  return filteredTransactionsByDate.value
    .filter(t => t.type === 'pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);
});

const filteredTotalExpense = computed(() => {
  return filteredTransactionsByDate.value
    .filter(t => t.type === 'pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);
});

const filteredEndingBalance = computed(() => {
  return filteredTotalIncome.value - filteredTotalExpense.value;
});

const formatRupiah = (angka: number) => {
  if (typeof angka !== 'number') return '0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

// Fungsi ini akan dipanggil setiap kali filter tanggal berubah atau saat mounted
const fetchDataForNeraca = async () => {
  if (!userStore.user?.id) {
    alert('User ID tidak ditemukan. Mohon login ulang.');
    return;
  }

  const umkmIdToFetch = userStore.profile?.role === 'umkm' ? userStore.user.id : undefined; // Admin fetch all by undefined

  // Ambil semua transaksi tanpa filter tipe dari store, filtering akan dilakukan di computed property
  await bookkeepingStore.fetchTransactions(umkmIdToFetch as string, null);
};


onMounted(async () => {
  await userStore.initializeUser(); // Pastikan user state sudah terisi

  if (userStore.isLoggedIn && (userStore.profile?.role === 'umkm' || userStore.profile?.role === 'admin')) {
    await fetchDataForNeraca(); // Memuat data awal
  } else {
    alert('Anda tidak memiliki izin untuk mengakses halaman ini.');
    router.push('/dashboard');
  }
});
</script>

<style scoped>
/* Styling khusus */
</style>
