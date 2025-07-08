
<template>
  <AdminLayout>
    <Breadcrumb :pageTitle="pageTitle" :breadcrumbItems="breadcrumbItems" />

    <div class="px-6 py-8 dark:bg-gray-900 min-h-screen">
      <h1 class="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Manajemen Produk UMKM Saya</h1>

      <div v-if="productStore.loading" class="text-center text-gray-600 dark:text-gray-400">
        Memuat produk Anda...
      </div>
      <div v-if="productStore.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong class="font-bold">Error:</strong>
        <span class="block sm:inline">{{ productStore.error }}</span>
      </div>

      <div class="mb-6 flex justify-end">
        <button
          @click="openAddProductModal"
          class="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
        >
          Tambah Produk Baru
        </button>
      </div>

      <div v-if="productStore.umkmProducts.length === 0 && !productStore.loading">
        <p class="text-center text-gray-500 dark:text-gray-400">Anda belum memiliki produk.</p>
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
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="product in productStore.umkmProducts" :key="product.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <img :src="product.image_url || '/images/default-product.jpg'" alt="Produk" class="w-16 h-16 object-cover rounded-md">
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ product.name }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ formatRupiah(product.price) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ product.category || '-' }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="[
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                    product.status === 'active' ? 'bg-green-100 text-green-800' :
                    product.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  ]">
                    {{ formatStatus(product.status) }}
                  </span>
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

    <div v-if="showProductModal" class="fixed inset-0 md-blur backdrop-blur-md overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div class="relative p-8 bg-white dark:bg-gray-800 w-full max-w-lg mx-auto rounded-lg shadow-lg">
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">{{ isEditMode ? 'Edit Produk' : 'Tambah Produk Baru' }}</h3>
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
          <select id="productCategory" v-model="currentProduct.category" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="" disabled>Pilih Kategori</option>
            <option v-for="categoryOption in categories" :key="categoryOption" :value="categoryOption">{{ categoryOption }}</option>
          </select>
        </div>
          <div class="mb-6">
            <label for="productImage" class="block text-sm font-medium text-gray-700 dark:text-gray-400">Gambar Produk</label>
            <input type="file" id="productImage" accept="image/*" @change="handleImageUpload" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100">
            <div v-if="currentProduct.image_url" class="mt-2">
              <img :src="currentProduct.image_url" alt="Preview Produk" class="max-w-[150px] h-auto rounded-md shadow-md">
            </div>
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

const userStore = useUserStore();
const productStore = useProductStore();
const router = useRouter();

const pageTitle = ref('Manajemen Produk UMKM');
const breadcrumbItems = ref([
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Produk Saya', path: '/umkm/marketplace' }
]);

const showProductModal = ref(false);
const isEditMode = ref(false);
const currentProduct = ref({
  id: null,
  name: '',
  description: '',
  price: 0,
  // stock: 0, // Hapus stock dari sini
  category: '',
  image_url: '',
  status: 'pending_review'
});
const productImageFile = ref<File | null>(null);

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

const categories = ref([
  'Elektronik',
  'Makanan & Minuman',
  'Fashion Pria',
  'Fashion Wanita',
  'Perlengkapan Rumah',
  'Kecantikan',
  'Otomotif',
  'Olahraga',
  'Buku & Alat Tulis',
  'Kerajinan Tangan',
  'Lain-lain'
]);

const openAddProductModal = () => {
  isEditMode.value = false;
  currentProduct.value = {
    id: null,
    name: '',
    description: '',
    price: 0,
    // stock: 0, // Hapus stock dari sini
    category: '',
    image_url: '',
    status: 'pending_review'
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
  const filePath = `${userStore.user?.id}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;

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
    // stock: currentProduct.value.stock, // Hapus stock dari sini
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
    alert(`Produk berhasil di${isEditMode.value ? 'perbarui' : 'tambahkan'}!`);
    closeProductModal();
  } else {
    // Error sudah diset di store
  }
};

const confirmDeleteProduct = async (productId: string) => {
  if (confirm('Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.')) {
    const success = await productStore.deleteProduct(productId);
    if (success) {
      alert('Produk berhasil dihapus!');
    } else {
      // Error sudah diset di store
    }
  }
};

onMounted(async () => {
  await userStore.initializeUser();

  if (userStore.isLoggedIn && (userStore.profile?.role === 'umkm' || userStore.profile?.role === 'admin')) {
    await productStore.fetchUmkmProducts(userStore.user.id);
  } else {
    alert('Anda tidak memiliki izin untuk mengakses halaman ini.');
    router.push('/dashboard');
  }
});
</script>

<style scoped>
/* Styling khusus modal dan form jika diperlukan */
</style>
