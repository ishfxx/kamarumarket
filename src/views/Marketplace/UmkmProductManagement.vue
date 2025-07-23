<template>
  <AdminLayout>
    <Breadcrumb :pageTitle="pageTitle" :breadcrumbItems="breadcrumbItems" />

    <div class="px-6 py-8 dark:bg-gray-900 min-h-screen">
      <div class="mb-6 flex justify-end">
        <button
          @click="openAddProductModal"
          class="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:focus:ring-emerald-800"
        >
          + Tambah Produk Baru
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
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Kontak WA</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Link E-commerce</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="(product, index) in productStore.umkmProducts" :key="product.id ?? `umkm-${index}`">
                <td class="px-6 py-4 whitespace-nowrap">
                  <img :src="product.image_url || '/images/default-product.jpg'" :alt="product.name" class="w-16 h-16 object-cover rounded-md">
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ product.name }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ formatRupiah(product.price) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ product.category || '-' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{{ product.contact_wa || '-' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  <a v-if="product.ecommerce_link" :href="product.ecommerce_link" target="_blank" class="text-blue-500 hover:underline">Link</a>
                  <span v-else>-</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="[
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                    product.status === ProductStatus.ACTIVE ? 'bg-green-100 text-green-800' :
                    product.status === ProductStatus.PENDING_REVIEW ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  ]">
                    {{ formatStatus(product.status ?? ProductStatus.INACTIVE) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button @click="openEditProductModal(product)" class="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-600 mr-3">Edit</button>
                  <button @click="openDeleteConfirmModal(product.id, product.name ?? '')" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-600">Hapus</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="showProductModal" class="fixed inset-0 z-[99999] flex items-start justify-center pt-20 overflow-y-auto backdrop-blur-sm">
  <div class="relative w-full max-w-2xl p-6 mx-4 bg-white rounded-xl shadow-2xl dark:bg-gray-900">
    <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
      {{ isEditMode ? 'Edit Produk' : 'Tambah Produk Baru' }}
    </h3>

    <form @submit.prevent="saveProduct" class="space-y-5">
      <!-- Nama Produk -->
      <div>
        <label for="product-name" class="block text-sm font-semibold text-gray-700 dark:text-gray-300">Nama Produk</label>
        <input type="text" id="product-name" v-model="currentProduct.name"
          class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          required>
      </div>

      <!-- Deskripsi -->
      <div>
        <label for="product-description" class="block text-sm font-semibold text-gray-700 dark:text-gray-300">Deskripsi</label>
        <textarea id="product-description" v-model="currentProduct.description" rows="3"
          class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"></textarea>
      </div>

      <!-- Harga -->
      <div>
        <label for="product-price" class="block text-sm font-semibold text-gray-700 dark:text-gray-300">Harga</label>
        <input type="number" id="product-price" v-model.number="currentProduct.price"
          class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          required>
      </div>

      <!-- Kategori -->
      <div>
        <label for="product-category" class="block text-sm font-semibold text-gray-700 dark:text-gray-300">Kategori</label>
        <select id="product-category" v-model="currentProduct.category"
          class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          required>
          <option value="">Pilih Kategori</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </div>

      <!-- WhatsApp -->
      <div>
        <label for="product-wa" class="block text-sm font-semibold text-gray-700 dark:text-gray-300">Kontak WhatsApp</label>
        <input type="text" id="product-wa" v-model="currentProduct.contact_wa" placeholder="Contoh: 6281234567890"
          class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none">
      </div>

      <!-- E-commerce -->
      <div>
        <label for="product-ecommerce" class="block text-sm font-semibold text-gray-700 dark:text-gray-300">Link E-commerce (opsional)</label>
        <input type="url" id="product-ecommerce" v-model="currentProduct.ecommerce_link"
          placeholder="https://shopee.co.id/produk-saya"
          class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 shadow-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none">
      </div>

      <!-- Gambar Produk -->
      <div>
        <label for="product-image" class="block text-sm font-semibold text-gray-700 dark:text-gray-300">Gambar Produk</label>
        <input type="file" id="product-image" @change="handleImageUpload" accept="image/*"
          class="mt-1 w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 dark:file:bg-emerald-800 dark:file:text-white dark:hover:file:bg-emerald-700 text-sm text-gray-500 dark:text-gray-400" />

        <!-- Preview -->
        <div class="mt-3">
          <img v-if="currentProduct.image_url && !productImageFile" :src="currentProduct.image_url"
            alt="Gambar Produk" class="w-24 h-24 rounded-md object-cover border" />
          <p v-if="productImageFile" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gambar baru akan diunggah: <strong>{{ productImageFile.name }}</strong>
          </p>
        </div>
      </div>

      <!-- Tombol -->
      <div class="flex justify-end space-x-3 pt-4">
        <button type="button" @click="closeProductModal"
          class="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
          Batal
        </button>
        <button type="submit" :disabled="productStore.loading"
          class="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
          {{ productStore.loading ? 'Menyimpan...' : 'Simpan Produk' }}
        </button>
      </div>
    </form>
  </div>
</div>


    <div v-if="showDeleteConfirmModal" class="fixed inset-0 pt-[80px] md-blur dropset-blur-md backdrop-blur-sm overflow-y-auto h-full w-full flex items-start justify-center z-[99999]">
      <div class="relative p-8 bg-white dark:bg-gray-800 w-full max-w-lg mx-auto rounded-lg shadow-lg">
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Konfirmasi Hapus Produk</h3>
        <p class="text-gray-700 dark:text-gray-300 mb-6">Apakah Anda yakin ingin menghapus produk **{{ productToDeleteName }}**? Aksi ini tidak bisa dibatalkan.</p>
        <div class="flex justify-end space-x-3">
          <button type="button" @click="cancelDeleteProduct" class="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-400 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700">Batal</button>
          <button type="button" @click="deleteProduct" :disabled="productStore.loading" class="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {{ productStore.loading ? 'Menghapus...' : 'Hapus' }}
          </button>
        </div>
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
// ✅ Perbaikan: Impor ProductStatus sebagai tipe dan enum
import type { Product, Store, User } from '@/types/index.d'; // or '@/types/index' if it's .ts
import { ProductStatus } from '@/types/index.d'; // or '@/types/index' if it's .ts


const { showToast } = useToast();
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

const currentProduct = ref<Product>({
  id: null, // ✅ Perbaikan: Awalnya bisa null untuk produk baru
  name: '',
  description: '',
  price: 0,
  category: '',
  image_url: '',
  // ✅ Perbaikan: Gunakan anggota enum
  status: ProductStatus.PENDING_REVIEW,
  contact_wa: null, // ✅ Perbaikan: Gunakan null untuk tipe `string | null`
  ecommerce_link: null, // ✅ Perbaikan: Gunakan null untuk tipe `string | null`
  created_at: undefined, // ✅ Perbaikan: Biarkan undefined atau null, Supabase yang mengisi
  created_by: undefined, // ✅ Perbaikan: Biarkan undefined, akan di-set oleh store action
  store_id: null, // ✅ Perbaikan: Gunakan null untuk tipe `string | null`

  // ✅ Perbaikan: Inisialisasi relasi sebagai null
  created_by_user: null,
  store: null
});

const productImageFile = ref<File | null>(null);

const formatRupiah = (angka: number) => {
  if (typeof angka !== 'number') return '0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

// ✅ Perbaikan: Parameter harus menerima ProductStatus atau string, dan penanganan yang benar
const formatStatus = (status: ProductStatus | string) => {
  if (typeof status === 'string') {
    switch (status) {
      case ProductStatus.ACTIVE: return 'Aktif';
      case ProductStatus.INACTIVE: return 'Nonaktif';
      case ProductStatus.PENDING_REVIEW: return 'Menunggu Review';
      default: return status; // Mengembalikan string aslinya jika tidak cocok
    }
  }
  // Jika ini ProductStatus enum (object), langsung gunakan nilainya
  return status; // Ini mungkin akan mengembalikan 'active' atau 'pending_review'
};


const categories = ref([
  'Elektronik',
  'Makanan & Minuman',
  'Fashion',
  'Perlengkapan Rumah',
  'Kecantikan',
  'Otomotif',
  'Olahraga',
  'Buku & Alat Tulis',
  'Usaha Kreatif',
  'Jasa'
]);

const openAddProductModal = () => {
  isEditMode.value = false;
  currentProduct.value = {
    id: null,
    name: '',
    description: '',
    price: 0,
    category: '',
    image_url: '',
    // ✅ Perbaikan: Gunakan anggota enum
    status: ProductStatus.PENDING_REVIEW,
    contact_wa: null, // ✅ Perbaikan: Default ke null
    ecommerce_link: null, // ✅ Perbaikan: Default ke null
    created_at: undefined, // Biarkan undefined
    created_by: userStore.user?.id, // Gunakan id user langsung
    store_id: userStore.profile?.role === 'umkm' ? userStore.myStore?.id ?? null : null, // ✅ Perbaikan: Gunakan null
    created_by_user: null,
    store: null
  };
  productImageFile.value = null;
  showProductModal.value = true;
};


// ✅ Perbaikan: Tipe parameter 'product' harus Product
const openEditProductModal = (product: Product) => {
  isEditMode.value = true;
  // Pastikan untuk menyalin contact_wa dan ecommerce_link dari produk yang ada
  currentProduct.value = {
    ...product,
    // ✅ Perbaikan: Gunakan nullish coalescing untuk properti opsional
    contact_wa: product.contact_wa ?? null,
    ecommerce_link: product.ecommerce_link ?? null,
    image_url: product.image_url ?? '',
    status: product.status ?? ProductStatus.INACTIVE, // ✅ Perbaikan: Default status jika null/undefined
    created_by_user: product.created_by_user ?? null,
    store: product.store ?? null,
    id: product.id ?? null, // Pastikan ID di-handle dengan benar
  };
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

  // ✅ Perbaikan: Pastikan user.id tersedia
  if (!userStore.user?.id) {
    productStore.error = 'User not logged in or ID not available for image upload.';
    console.error('User ID not available for image upload.');
    return null;
  }

  const fileExtension = file.name.split('.').pop();
  const filePath = `${userStore.user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;

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

  // ✅ Perbaikan: Pastikan tipe productDataToSave adalah Partial<Product>
  const productDataToSave: Partial<Product> = {
    name: currentProduct.value.name,
    description: currentProduct.value.description,
    price: currentProduct.value.price,
    category: currentProduct.value.category,
    image_url: imageUrl,
    // ✅ Perbaikan: Gunakan ProductStatus dari enum
    status: currentProduct.value.status,
    contact_wa: currentProduct.value.contact_wa,
    ecommerce_link: currentProduct.value.ecommerce_link,
    // created_by dan store_id akan di-set di productStore action (createProduct)
    // Jika updateProduct memerlukan created_by/store_id secara eksplisit, tambahkan di sini
  };


  let success = false;
  if (isEditMode.value) {
    // ✅ Perbaikan: Pastikan ID tidak null sebelum memanggil updateProduct
    if (currentProduct.value.id) {
      success = await productStore.updateProduct(currentProduct.value.id, productDataToSave);
    } else {
      // Tangani kasus di mana ID produk null saat edit mode
      productStore.error = 'ID produk tidak valid untuk pembaruan.';
      showToast('Gagal memperbarui produk: ID tidak valid.', 'error');
      success = false;
    }
  } else {
    success = await productStore.createProduct(productDataToSave);
  }

  if (success) {
    showToast(`Produk berhasil di${isEditMode.value ? 'perbarui' : 'tambahkan'}!`);
    closeProductModal();
    // ✅ Refresh data setelah berhasil
    if (userStore.user?.id) {
      await productStore.fetchUmkmProducts(userStore.user.id);
    }
  } else {
    // Error sudah diset di store
    showToast(`Gagal ${isEditMode.value ? 'memperbarui' : 'menambahkan'} produk: ${productStore.error}`, 'error');
  }
};

// ✅ Fungsi `confirmDeleteProduct` tidak lagi diperlukan karena sudah menggunakan modal
// Hapus atau komen fungsi ini

const showDeleteConfirmModal = ref(false);
const productToDeleteId = ref<string | null>(null);
const productToDeleteName = ref('');

// ✅ Perbaikan: Parameter id bisa `string | null`
function openDeleteConfirmModal(id: string | null, name: string) {
  if (!id) {
    console.warn('Attempted to open delete confirmation for a product with null ID.');
    showToast('Tidak dapat menghapus produk: ID tidak valid.', 'error');
    return;
  }
  productToDeleteId.value = id;
  productToDeleteName.value = name;
  showDeleteConfirmModal.value = true;
}


const cancelDeleteProduct = () => {
  productToDeleteId.value = null;
  productToDeleteName.value = '';
  showDeleteConfirmModal.value = false;
};

const deleteProduct = async () => {
  // ✅ Perbaikan: Pastikan productToDeleteId.value tidak null
  if (!productToDeleteId.value) {
    showToast('ID produk tidak valid untuk dihapus.', 'error');
    return;
  }

  const success = await productStore.deleteProduct(productToDeleteId.value);
  if (success) {
    showToast('Produk berhasil dihapus!');
    cancelDeleteProduct();
    // ✅ Refresh data setelah berhasil
    if (userStore.user?.id) {
      await productStore.fetchUmkmProducts(userStore.user.id);
    }
  } else {
    showToast('Gagal menghapus produk.', 'error'); // Tambahkan detail error jika tersedia
  }
};


onMounted(async () => {
  await userStore.initializeUser();

  // ✅ Perbaikan: Pastikan user.id tersedia sebelum memanggil fetchUmkmProducts
  if (userStore.isLoggedIn && userStore.user?.id && (userStore.profile?.role === 'umkm' || userStore.profile?.role === 'admin')) {
    await productStore.fetchUmkmProducts(userStore.user.id);
  } else {
    showToast('Anda tidak memiliki izin untuk mengakses halaman ini.', 'error');
    router.push('/dashboard');
  }
});
</script>

<style scoped>
/* Styling khusus modal dan form jika diperlukan */
</style>
