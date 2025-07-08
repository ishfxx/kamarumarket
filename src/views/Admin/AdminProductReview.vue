<template>
  <AdminLayout>
    <Breadcrumb :pageTitle="pageTitle" :breadcrumbItems="breadcrumbItems" />

    <div class="px-6 py-8 dark:bg-gray-900 min-h-screen">
      <h1 class="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Review Produk Baru</h1>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        Daftar produk UMKM yang menunggu persetujuan Anda untuk ditampilkan di marketplace.
      </p>

      <div v-if="productStore.loading" class="text-center text-gray-600 dark:text-gray-400">
        Memuat produk untuk review...
      </div>
      <div v-if="productStore.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong class="font-bold">Error:</strong>
        <span class="block sm:inline">{{ productStore.error }}</span>
      </div>

      <div v-if="pendingReviewProducts.length === 0 && !productStore.loading">
        <p class="text-center text-gray-500 dark:text-gray-400">Tidak ada produk yang menunggu review.</p>
      </div>

      <div v-else class="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gambar</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nama Produk</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Harga</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Kategori</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dibuat Oleh</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aksi Review</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="product in pendingReviewProducts" :key="product.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <img :src="product.image_url || '/images/default-product.jpg'" alt="Produk" class="w-16 h-16 object-cover rounded-md">
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ product.name }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">Rp {{ formatRupiah(product.price) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ product.category || '-' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ getCreatorName(product.created_by) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button @click="updateProductStatus(product.id, 'active')" class="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 mr-2">Set Aktif</button>
                  <button @click="updateProductStatus(product.id, 'inactive')" class="px-3 py-1 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600 mr-2">Set Nonaktif</button>
                  <button @click="confirmDeleteProduct(product.id)" class="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600">Hapus</button>
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
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '@/store/userStore'; // Untuk cek user role & ambil nama pembuat
import { useProductStore } from '@/store/productStore'; // Untuk aksi produk
import AdminLayout from '@/components/layout/AdminLayout.vue';
import Breadcrumb from '@/components/common/PageBreadcrumb.vue';
import { supabase } from '@/supabase'; // Untuk fetch nama UMKM
import { useRouter } from 'vue-router'; // Untuk redirect

const userStore = useUserStore();
const productStore = useProductStore();
const router = useRouter();

const pageTitle = ref('Review Produk');
const breadcrumbItems = ref([
  { label: 'Admin', path: '/admin' },
  { label: 'Review Produk', path: '/admin/product-review' }
]);

// Hanya tampilkan produk dengan status 'pending_review'
const pendingReviewProducts = computed(() => {
  return (productStore.products || []).filter(p => p.status === 'pending_review');
});

const creators = ref({}); // Untuk menyimpan map { user_id: { first_name, last_name, username } }

const fetchCreators = async (productUsers: string[]) => {
  if (productUsers.length === 0) return;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, username')
      .in('id', productUsers);

    if (error) {
      console.error('Error fetching creators for product review:', error.message);
      return;
    }

    data.forEach(user => {
      creators.value[user.id] = user;
    });
  } catch (error) {
    console.error('Error in fetchCreators product review:', error);
  }
};

const getCreatorName = (userId: string) => {
  const creator = creators.value[userId];
  if (creator) {
    return creator.first_name || creator.username;
  }
  return 'Tidak Diketahui';
};

const formatRupiah = (angka: number) => {
  if (typeof angka !== 'number') return '0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

const updateProductStatus = async (productId: string, newStatus: string) => {
  if (confirm(`Apakah Anda yakin ingin mengubah status produk ini menjadi ${newStatus === 'active' ? 'Aktif' : 'Nonaktif'}?`)) {
    const success = await productStore.updateProduct(productId, { status: newStatus });
    if (success) {
      alert('Status produk berhasil diperbarui!');
      // Produk akan otomatis hilang dari daftar pendingReviewProducts karena statusnya berubah.
      // Kita bisa memuat ulang semua produk untuk admin agar daftar productStore.products up-to-date.
      await productStore.fetchProducts({ status: undefined }); // Fetch semua status untuk admin
      // Atau, jika ini adalah halaman khusus pending, bisa filter ulang list lokal
    } else {
      alert('Gagal memperbarui status produk: ' + (productStore.error || 'Terjadi kesalahan.'));
    }
  }
};

const confirmDeleteProduct = async (productId: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.')) {
    const success = await productStore.deleteProduct(productId);
    if (success) {
      alert('Produk berhasil dihapus!');
      // Produk akan otomatis hilang dari daftar pendingReviewProducts
    } else {
      // Error sudah diset di store
    }
  }
};

onMounted(async () => {
  await userStore.initializeUser();

  if (userStore.isLoggedIn && userStore.profile?.role === 'admin') {
    // Admin mengambil semua produk dengan status 'pending_review'
    // productStore.fetchProducts akan mengambil data ke productStore.products
    await productStore.fetchProducts({ status: 'pending_review' });

    // Setelah produk dimuat, ambil informasi pembuatnya
    const uniqueCreatorIds = [...new Set(productStore.products.map(p => p.created_by))].filter(Boolean);
    await fetchCreators(uniqueCreatorIds);
  } else {
    // Redirect jika bukan Admin atau belum login
    alert('Anda tidak memiliki izin untuk mengakses halaman ini.');
    router.push('/dashboard');
  }
});
</script>

<style scoped>
/* Styling khusus */
</style>
