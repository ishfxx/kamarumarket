<template>
  <AdminLayout> <Breadcrumb :pageTitle="pageTitle" :breadcrumbItems="breadcrumbItems" />

    <div class="px-6 py-8 dark:bg-gray-900 min-h-screen">
      <div v-if="userStore.loading || productStore.loading" class="text-center text-gray-600 dark:text-gray-400">
        Memuat data dashboard...
      </div>
      <div v-if="userStore.error || productStore.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong class="font-bold">Error:</strong>
        <span class="block sm:inline">{{ userStore.error || productStore.error }}</span>
      </div>

      <div v-if="userStore.isAdmin">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Total Pengguna</h3>
            <p class="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">{{ totalUsers }}</p>
            <p class="text-gray-500 dark:text-gray-400">Pengguna terdaftar di sistem</p>
          </div>
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Produk Menunggu Review</h3>
            <p class="text-4xl font-extrabold text-yellow-600 dark:text-yellow-400">{{ pendingProducts }}</p>
            <p class="text-gray-500 dark:text-gray-400">Produk UMKM yang perlu diverifikasi</p>
          </div>
          <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">UMKM Terdaftar</h3>
            <p class="text-4xl font-extrabold text-blue-600 dark:text-blue-400">{{ totalUmkms }}</p>
            <p class="text-gray-500 dark:text-gray-400">Jumlah UMKM yang aktif</p>
          </div>
        </div>

        <div class="mt-8">
            <h3 class="text-xl font-semibold text-gray-700 dark:text-white mb-4">Produk Terbaru</h3>
            <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nama Produk</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Harga</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dibuat Oleh</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            <tr v-for="product in latestProductsAdmin" :key="product.id">
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ product.name }}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ formatRupiah(product.price) }}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ formatStatus(product.status) }}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ getCreatorName(product.created_by) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

      </div>

      <div v-else-if="userStore.getUserRole === 'umkm'">
        <h2 class="text-2xl font-semibold text-gray-700 dark:text-white mb-4">Ringkasan Toko Anda</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Nama Toko</h3>
                <p class="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{{ userStore.myStore?.store_name || 'Belum diatur' }}</p>
                <button v-if="!userStore.myStore" @click="createUmkmStore" class="mt-2 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600">Buat Toko Sekarang</button>
            </div>
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Total Produk Anda</h3>
                <p class="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">{{ productStore.umkmProducts.length }}</p>
                <p class="text-gray-500 dark:text-gray-400">Produk yang Anda jual</p>
            </div>
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Produk Menunggu Review</h3>
                <p class="text-4xl font-extrabold text-yellow-600 dark:text-yellow-400">{{ pendingUmkmProducts }}</p>
                <p class="text-gray-500 dark:text-gray-400">Produk Anda yang perlu verifikasi admin</p>
            </div>
        </div>

        <div class="mt-8">
            <h3 class="text-xl font-semibold text-gray-700 dark:text-white mb-4">Produk Anda Terbaru</h3>
            <div class="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead class="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nama Produk</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Harga</th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            <tr v-for="product in latestUmkmProducts" :key="product.id">
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ product.name }}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ formatRupiah(product.price) }}</td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ formatStatus(product.status) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>

      <div v-else-if="userStore.getUserRole === 'user'">
        <h2 class="text-2xl font-semibold text-gray-700 dark:text-white mb-4">Selamat Datang, Pengguna!</h2>
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <p class="text-gray-600 dark:text-gray-400">
            Ini adalah dashboard default Anda. Jelajahi marketplace kami untuk menemukan produk menarik atau <router-link to="/signup-umkm" class="text-emerald-500 hover:underline">daftar sebagai UMKM</router-link> untuk mulai menjual!
          </p>
        </div>
      </div>

      <div v-else class="text-center text-gray-600 dark:text-gray-400 py-12 text-lg">
        Memuat informasi dashboard...
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '@/store/userStore';
import { useProductStore } from '@/store/productStore';
import AdminLayout from '@/components/layout/AdminLayout.vue';
import Breadcrumb from '@/components/common/PageBreadcrumb.vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/supabase';

const userStore = useUserStore();
const productStore = useProductStore();
const router = useRouter();

const pageTitle = computed(() => `Dashboard ${getRoleDisplayName(userStore.getUserRole)}`);
const breadcrumbItems = ref([
  { label: 'Beranda', path: '/' },
  { label: 'Dashboard', path: '/dashboard' }
]);

const formatRupiah = (angka: number) => {
  if (typeof angka !== 'number') return '0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

const formatStatus = (status: string) => {
  if (!status) return '';
  switch (status) {
    case 'active': return 'Aktif';
    case 'inactive': return 'Nonaktif';
    case 'pending_review': return 'Menunggu Review';
    default: return status;
  }
};

const getRoleDisplayName = (role: string | null) => {
  if (!role) return '';
  switch (role) {
    case 'admin': return 'Admin';
    case 'umkm': return 'UMKM';
    case 'user': return 'Pengguna';
    default: return '';
  }
};

// --- Data & Fungsi Khusus Admin ---
// totalUsers dan totalUmkms berasal dari userStore.allUsers
const totalUsers = computed(() => userStore.allUsers.length);
const totalUmkms = computed(() => userStore.allUsers.filter(u => u.role === 'umkm').length);
// pendingProducts berasal dari productStore.products (yang di-fetch Admin)
const pendingProducts = computed(() => (productStore.products || []).filter(p => p.status === 'pending_review').length);

const latestProductsAdmin = computed(() => {
  return [...(productStore.products || [])] // Pastikan array tidak undefined
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
});

const creators = ref({});
const fetchCreators = async (productUsers: string[]) => {
  if (productUsers.length === 0) return;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, username')
      .in('id', productUsers);
    if (error) {
      console.error('Error fetching creators for dashboard:', error.message);
      return;
    }
    data.forEach(user => {
      creators.value[user.id] = user;
    });
  } catch (error) {
    console.error('Error in fetchCreators dashboard:', error);
  }
};
const getCreatorName = (userId: string) => {
  const creator = creators.value[userId];
  if (creator) {
    return creator.first_name || creator.username;
  }
  return 'Tidak Diketahui';
};


// --- Data & Fungsi Khusus UMKM ---
// pendingUmkmProducts berasal dari productStore.umkmProducts
const pendingUmkmProducts = computed(() => (productStore.umkmProducts || []).filter(p => p.status === 'pending_review').length);
const latestUmkmProducts = computed(() => {
    return [...(productStore.umkmProducts || [])] // Pastikan array tidak undefined
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
});

const createUmkmStore = async () => {
  if (userStore.getUserRole !== 'umkm') {
    alert('Hanya pengguna dengan role UMKM yang dapat membuka toko.');
    return;
  }

  if (confirm('Anda belum memiliki toko. Apakah Anda ingin membuat toko sekarang?')) {
    const storeName = prompt('Masukkan Nama Toko Anda:');
    if (storeName && storeName.trim()) {
      // Panggil createStore dari productStore
      const success = await productStore.createStore({ store_name: storeName.trim() });
      if (success) {
        alert('Toko berhasil dibuat!');
        // userStore.myStore sudah otomatis diupdate oleh productStore.createStore
      } else {
        alert('Gagal membuat toko: ' + (productStore.error || 'Terjadi kesalahan.'));
      }
    } else if (storeName !== null) {
      alert('Nama toko tidak boleh kosong.');
    }
  }
};


// --- onMounted Logic ---
onMounted(async () => {
  await userStore.initializeUser(); // Pastikan user diinisialisasi pertama

  if (!userStore.isLoggedIn) {
    alert('Anda harus login untuk mengakses dashboard.');
    router.push('/signin'); // Mengarahkan ke signin jika tidak login
    return; // Hentikan eksekusi lebih lanjut
  }

  // Jika sudah login, lanjutkan berdasarkan peran
  if (userStore.isAdmin) {
    await userStore.fetchAllUsers();
    // Admin fetch SEMUA produk (status: undefined) untuk menghitung pending
    await productStore.fetchProducts({ status: 'all' }); // Ubah menjadi 'all' agar admin bisa melihat semua status
    const uniqueCreatorIds = [...new Set((productStore.products || []).map(p => p.created_by))].filter(Boolean);
    await fetchCreators(uniqueCreatorIds);
  } else if (userStore.getUserRole === 'umkm') {
    if (userStore.user?.id) {
        // Ambil produk UMKM milik user
        await productStore.fetchUmkmProducts(userStore.user.id);
        // Ambil data toko UMKM milik user
        await userStore.fetchUserStore(userStore.user.id); // Panggil fetchUserStore dari userStore
    } else {
        console.error("Dashboard: User ID not available for UMKM fetching.");
        // Handle case where user.id is null/undefined for UMKM
        // Maybe redirect or show a specific message.
    }
  }
});
</script>

<style scoped>
/* Gaya khusus dashboard jika diperlukan */
</style>
