
<template>
  <AdminLayout>
    <Breadcrumb :pageTitle="pageTitle" :breadcrumbItems="breadcrumbItems" />

    <div class="px-6 py-8 dark:bg-gray-900 min-h-screen">
      <h1 class="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Manajemen Marketplace (Admin)</h1>

      <div v-if="productStore.loading" class="text-center text-gray-600 dark:text-gray-400">
        Memuat produk marketplace...
      </div>
      <div v-if="productStore.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="showToast">
        <strong class="font-bold">Error:</strong>
        <span class="block sm:inline">{{ productStore.error }}</span>
      </div>

      <div class="mb-6 flex gap-4 items-center">
        <input
          type="text"
          v-model="searchQuery"
          @input="debouncedFetchProducts"
          placeholder="Cari produk berdasarkan nama..."
          class="w-full max-w-sm rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 focus:border-emerald-300 focus:outline-none focus:ring-3 focus:ring-emerald-500/10"
        />
        <select
          v-model="statusFilter"
          @change="fetchProductsWithFilters"
          class="rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 dark:bg-gray-900 dark:border-gray-700 dark:text-white/90"
        >
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
          <option value="pending_review">Menunggu Review</option>
        </select>
        <button
          @click="openAddProductModal"
          class="ml-auto px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
        >
          Tambah Produk Admin
        </button>
      </div>

      <div v-if="productStore.products.length === 0 && !productStore.loading">
        <p class="text-center text-gray-500 dark:text-gray-400">Tidak ada produk ditemukan.</p>
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
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dibuat Oleh</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="product in productStore.products" :key="product.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <img :src="product.image_url || '/images/default-product.jpg'" alt="Produk" class="w-16 h-16 object-cover rounded-md">
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ product.name }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">Rp {{ formatRupiah(product.price) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ product.category || '-' }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <select v-model="product.status" @change="updateProductStatus(product.id, product.status)" class="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                    <option value="pending_review">Menunggu Review</option>
                  </select>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ getCreatorName(product.created_by) }}
                  <span v-if="product.store_id" class="text-xs text-gray-400">(UMKM)</span>
                  <span v-else class="text-xs text-gray-400">(Admin)</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button @click="openEditProductModal(product)" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-600 mr-3">Edit</button>
                  <button @click="confirmDeleteProduct(product.id)" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600">Hapus</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="showProductModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div class="relative p-8 bg-white dark:bg-gray-800 w-full max-w-lg mx-auto rounded-lg shadow-lg">
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">{{ isEditMode ? 'Edit Produk' : 'Tambah Produk Baru (Admin)' }}</h3>
        <form @submit.prevent="saveProduct">
          <div class="mb-4">
            <label for="productName" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Nama Produk</label>
            <input type="text" id="productName" v-model="currentProduct.name" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
          </div>
          <div class="mb-4">
            <label for="productDescription" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Deskripsi</label>
            <textarea id="productDescription" v-model="currentProduct.description" rows="3" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
          </div>
          <div class="mb-4">
            <label for="productPrice" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Harga (Rp)</label>
            <input type="number" id="productPrice" v-model.number="currentProduct.price" required min="0" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
          </div>
          <div class="mb-4">
            <label for="productCategory" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Kategori</label>
            <input type="text" id="productCategory" v-model="currentProduct.category" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
          </div>
          <div class="mb-6">
            <label for="productImage" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Gambar Produk</label>
            <input type="file" id="productImage" accept="image/*" @change="handleImageUpload" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100">
            <div v-if="currentProduct.image_url" class="mt-2">
              <img :src="currentProduct.image_url" alt="Preview Produk" class="max-w-[150px] h-auto rounded-md shadow-md">
            </div>
          </div>
          <div class="mb-4">
            <label for="productStatus" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Status Produk</label>
            <select id="productStatus" v-model="currentProduct.status" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
              <option value="pending_review">Menunggu Review</option>
            </select>
          </div>

          <div class="flex justify-end space-x-3">
            <button type="button" @click="closeProductModal" class="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-400 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">Batal</button>
            <button type="submit" :disabled="productStore.loading" class="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {{ productStore.loading ? 'Menyimpan...' : 'Simpan Produk' }}
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
import { useProductStore } from '@/store/productStore';
import AdminLayout from '@/components/layout/AdminLayout.vue';
import Breadcrumb from '@/components/common/PageBreadcrumb.vue';
import { supabase } from '@/supabase';
import { useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';

const { showToast } = useToast();
const userStore = useUserStore();
const productStore = useProductStore();
const router = useRouter();

const pageTitle = ref('Manajemen Marketplace');
const breadcrumbItems = ref([
  { label: 'Admin', path: '/admin' },
  { label: 'Manajemen Marketplace', path: '/admin/marketplace' }
]);

const searchQuery = ref('');
const statusFilter = ref('');
let debounceTimeout: number | undefined;

const showProductModal = ref(false);
const isEditMode = ref(false);
const currentProduct = ref({
  id: null,
  name: '',
  description: '',
  price: 0,
  // stock: 0, // Dihapus
  category: '',
  image_url: '',
  status: 'active'
});
const productImageFile = ref<File | null>(null);

const creators = ref({});

const fetchCreators = async (productUsers: string[]) => {
  if (productUsers.length === 0) return;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, username')
      .in('id', productUsers);

    if (error) {
      console.error('Error fetching creators:', error.message);
      return;
    }

    data.forEach(user => {
      creators.value[user.id] = user;
    });
  } catch (error) {
    console.error('Error in fetchCreators:', error);
  }
};

const getCreatorName = (userId: string) => {
  const creator = creators.value[userId];
  if (creator) {
    return creator.first_name || creator.username;
  }
  return 'Loading...';
};

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

const fetchProductsWithFilters = async () => {
  await productStore.fetchProducts({
    search: searchQuery.value,
    status: statusFilter.value === '' ? undefined : statusFilter.value,
  });

  const uniqueCreatorIds = [...new Set(productStore.products.map(p => p.created_by))].filter(Boolean);
  await fetchCreators(uniqueCreatorIds);
};

const debouncedFetchProducts = () => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    fetchProductsWithFilters();
  }, 500);
};

const openAddProductModal = () => {
  isEditMode.value = false;
  currentProduct.value = {
    id: null,
    name: '',
    description: '',
    price: 0,
    // stock: 0, // Dihapus
    category: '',
    image_url: '',
    status: 'active'
  };
  productImageFile.value = null;
  showProductModal.value = true;
};

const openEditProductModal = (product: any) => {
  isEditMode.value = true;
  currentProduct.value = { ...product };
  productImageFile.value = null;
  showProductModal.value = true;
};

const closeProductModal = () => {
  showProductModal.value = false;
  productStore.error = null;
};

const handleImageUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    productImageFile.value = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      currentProduct.value.image_url = e.target?.result as string;
    };
    reader.readAsDataURL(input.files[0]);
  }
};

const uploadImage = async (file: File) => {
  if (!file) return null;

  const fileExtension = file.name.split('.').pop();
  const filePath = `admin-uploads/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;

  try {
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error('Gagal mengunggah gambar: ' + error.message);
    }

    const publicURL = supabase.storage.from('product-images').getPublicUrl(filePath).data.publicUrl;
    return publicURL;

  } catch (uploadError: any) {
    console.error('Error saat mengunggah gambar:', uploadError.message);
    productStore.error = uploadError.message;
    return null;
  }
};

const saveProduct = async () => {
  let imageUrl = currentProduct.value.image_url;

  if (productImageFile.value) {
    const uploadedUrl = await uploadImage(productImageFile.value);
    if (uploadedUrl) {
      imageUrl = uploadedUrl;
    } else {
      return;
    }
  }

  const productDataToSave = {
    name: currentProduct.value.name,
    description: currentProduct.value.description,
    price: currentProduct.value.price,
    // stock: currentProduct.value.stock, // Dihapus
    category: currentProduct.value.category,
    image_url: imageUrl,
    status: currentProduct.value.status,
  };

  let success = false;
  if (isEditMode.value) {
    success = await productStore.updateProduct(currentProduct.value.id, productDataToSave);
  } else {
    success = await productStore.createProduct(productDataToSave);
  }

  if (success) {
    showToast(`Produk berhasil di${isEditMode.value ? 'perbarui' : 'tambahkan'}!`);
    closeProductModal();
    await fetchProductsWithFilters();
  } else {
    // Error sudah diset di store
  }
};

const updateProductStatus = async (productId: string, newStatus: string) => {
  const success = await productStore.updateProduct(productId, { status: newStatus });
  if (success) {
    showToast('Status produk berhasil diperbarui!');
  } else {
    showToast('Gagal memperbarui status produk: ' + (productStore.error || 'Terjadi kesalahan.'));
    await fetchProductsWithFilters();
  }
};

const confirmDeleteProduct = async (productId: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.')) {
    const success = await productStore.deleteProduct(productId);
    if (success) {
      showToast('Produk berhasil dihapus!');
    } else {
      // Error sudah diset di store
    }
  }
};

onMounted(async () => {
  await userStore.initializeUser();

  if (userStore.isLoggedIn && userStore.profile?.role === 'admin') {
    await fetchProductsWithFilters();
  } else {
    showToast('Anda tidak memiliki izin untuk mengakses halaman ini.');
    router.push('/dashboard');
  }
});
</script>

<style scoped>
/* Gaya untuk clamping text */
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
