<template>
  <AdminLayout>
    <Breadcrumb :pageTitle="pageTitle" :breadcrumbItems="breadcrumbItems" />

    <div class="px-6 py-8 dark:bg-gray-900 min-h-screen">
      <div v-if="bookkeepingStore.loading" class="text-center text-gray-600 dark:text-gray-400">
        Memuat data pemasukan...
      </div>
      <div v-if="bookkeepingStore.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="showToast">
        <strong class="font-bold">Error:</strong>
        <span class="block sm:inline">{{ bookkeepingStore.error }}</span>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">Tambah Pemasukan Baru</h2>
        <form @submit.prevent="addTransaction">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label for="date" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Tanggal</label>
              <input type="date" id="date" v-model="newTransaction.date" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            </div>
            <div>
              <label for="amount" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Jumlah (Rp)</label>
              <input type="number" id="amount" v-model.number="newTransaction.amount" required min="0" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            </div>
          </div>
          <div class="mb-4">
            <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Deskripsi</label>
            <textarea id="description" v-model="newTransaction.description" rows="2" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
          </div>
          <div class="flex justify-end">
            <button type="submit" :disabled="bookkeepingStore.loading" class="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {{ bookkeepingStore.loading ? 'Menyimpan...' : 'Tambah Pemasukan' }}
            </button>
          </div>
        </form>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tanggal</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Deskripsi</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Jumlah</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="bookkeepingStore.incomeTransactions.length === 0 && !bookkeepingStore.loading">
                  <td colspan="4" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center">
                      Tidak ada data pemasukan ditemukan.
                  </td>
              </tr>
              <tr v-for="transaksi in bookkeepingStore.incomeTransactions" :key="transaksi.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ formatDate(transaksi.date) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ transaksi.description }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-semibold">{{ formatRupiah(transaksi.amount) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button @click="editTransaction(transaksi)" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-600 mr-3">Edit</button>
                  <button @click="confirmDeleteTransaction(transaksi.id)" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600">Hapus</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="showEditModal" class="fixed inset-0 md-blur backdrop-blur-md overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div class="relative p-8 bg-white dark:bg-gray-800 w-full max-w-lg mx-auto rounded-lg shadow-lg">
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit Pemasukan</h3>
        <form @submit.prevent="saveEditedTransaction">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label for="editDate" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Tanggal</label>
              <input type="date" id="editDate" v-model="editedTransaction.date" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            </div>
            <div>
              <label for="editAmount" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Jumlah (Rp)</label>
              <input type="number" id="editAmount" v-model.number="editedTransaction.amount" required min="0" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            </div>
          </div>
          <div class="mb-4">
            <label for="editDescription" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Deskripsi</label>
            <textarea id="editDescription" v-model="editedTransaction.description" rows="2" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
          </div>
          <div class="flex justify-end space-x-3">
            <button type="button" @click="showEditModal = false" class="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-400 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">Batal</button>
            <button type="submit" :disabled="bookkeepingStore.loading" class="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {{ bookkeepingStore.loading ? 'Menyimpan...' : 'Simpan Perubahan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/store/userStore';
import { useBookkeepingStore } from '@/store/bookkeepingStore';
import AdminLayout from '@/components/layout/AdminLayout.vue';
import Breadcrumb from '@/components/common/PageBreadcrumb.vue';
import { useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';

const { showToast } = useToast();
const userStore = useUserStore();
const bookkeepingStore = useBookkeepingStore();
const router = useRouter();

const pageTitle = ref('Pemasukan');
const breadcrumbItems = ref([
  { label: 'Pembukuan', path: '/income' },
  { label: 'Pemasukan', path: '/income' }
]);

const newTransaction = ref({
  date: new Date().toISOString().split('T')[0],
  amount: 0,
  description: '',
});

const showEditModal = ref(false);
const editedTransaction = ref({
  id: null,
  date: '',
  amount: 0,
  description: '',
});

const formatRupiah = (angka: number) => {
  if (typeof angka !== 'number') return '0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

const addTransaction = async () => {
  if (!userStore.user?.id) {
    showToast('User ID tidak ditemukan. Mohon login ulang.');
    return;
  }
  const transactionData = {
    umkm_id: userStore.user.id,
    date: newTransaction.value.date,
    type: 'pemasukan' as const, // <<< PERBAIKAN: Menggunakan 'pemasukan'
    amount: newTransaction.value.amount,
    description: newTransaction.value.description,
  };

  const success = await bookkeepingStore.createTransaction(transactionData);
  if (success) {
    showToast('Pemasukan berhasil ditambahkan!');
    newTransaction.value = { date: new Date().toISOString().split('T')[0], amount: 0, description: '' };
  } else {
    // Error sudah diset di store
  }
};

const editTransaction = (transaction: any) => {
  editedTransaction.value = { ...transaction };
  showEditModal.value = true;
};

const saveEditedTransaction = async () => {
  if (!editedTransaction.value.id) return;

  const dataToUpdate = {
    date: editedTransaction.value.date,
    amount: editedTransaction.value.amount,
    description: editedTransaction.value.description,
  };

  const success = await bookkeepingStore.updateTransaction(editedTransaction.value.id, dataToUpdate);
  if (success) {
    showToast('Transaksi berhasil diperbarui!');
    showEditModal.value = false;
  } else {
    // Error sudah diset di store
  }
};

const confirmDeleteTransaction = async (id: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
    const success = await bookkeepingStore.deleteTransaction(id);
    if (success) {
      showToast('Transaksi berhasil dihapus!');
    } else {
      // Error sudah diset di store
    }
  }
};

onMounted(async () => {
  await userStore.initializeUser();

  if (userStore.isLoggedIn && (userStore.profile?.role === 'umkm' || userStore.profile?.role === 'admin')) {
    const umkmIdToFetch = userStore.profile?.role === 'umkm' ? userStore.user.id : undefined;
    await bookkeepingStore.fetchTransactions(umkmIdToFetch as string, 'pemasukan'); // <<< PERBAIKAN: Menggunakan 'pemasukan'
  } else {
    showToast('Anda tidak memiliki izin untuk mengakses halaman ini.');
    router.push('/dashboard');
  }
});
</script>

<style scoped>
/* Styling khusus */
</style>
