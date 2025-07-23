<template>
  <AdminLayout>
    <Breadcrumb :pageTitle="pageTitle" :breadcrumbItems="breadcrumbItems" />

    <div class="space-y-8 dark:bg-gray-900">
      <div class="flex justify-between items-center mb-6">
        <button
          @click="fetchProducts"
          class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Refresh Produk
        </button>
        <button
          v-if="selectedProductIds.length > 0"
          @click="deleteSelectedProducts"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Hapus {{ selectedProductIds.length }} Produk yang Dipilih
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end mb-8">
        <div class="md:col-span-1">
          <label for="filterStatus" class="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-400">Filter Status</label>
          <select
            id="filterStatus"
            v-model="selectedStatus"
            @change="fetchProducts"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out appearance-none bg-white pr-8 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%20viewBox%3D%220%200%20292.4%20292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%20197.6L146.2%2056.8%205.4%20197.6c-4.8%204.8-12.5%204.8-17.3%200l-5.4-5.4c-4.8-4.8-4.8-12.5%200-17.3L137.6%2025.2c4.8-4.8%2012.5-4.8%2017.3%200l132.8%20132.8c4.8%204.8%204.8-12.5%200%2017.3l-5.4%205.4z%22%2F%3E%3C%2Fsvg%3E'); background-repeat: no-repeat; background-position: right 0.7em top 50%, 0 0; background-size: 0.65em auto, 100%;"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="pending_review">Menunggu Review</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
        <div class="md:col-span-1">
          <label for="filterKategori" class="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-400">Filter Kategori</label>
          <select
            id="filterKategori"
            v-model="selectedKategori"
            @change="fetchProducts"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out appearance-none bg-white pr-8 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%20viewBox%3D%220%200%20292.4%20292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%20197.6L146.2%2056.8%205.4%20197.6c-4.8%204.8-12.5%204.8-17.3%200l-5.4-5.4c-4.8-4.8-4.8-12.5%200-17.3L137.6%2025.2c4.8-4.8%2012.5-4.8%2017.3%200l132.8%20132.8c4.8%204.8%204.8-12.5%200%2017.3l-5.4%205.4z%22%2F%3E%3C%2Fsvg%3E'); background-repeat: no-repeat; background-position: right 0.7em top 50%, 0 0; background-size: 0.65em auto, 100%;"
          >
            <option value="">Semua Kategori</option>
            <option v-for="kategori in kategoriUnik" :key="kategori" :value="kategori">
              {{ kategori }}
            </option>
          </select>
        </div>
        <div class="md:col-span-2">
          <label for="cariProduk" class="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-400">Cari Produk</label>
          <input
            id="cariProduk"
            v-model="searchQuery"
            @input="debouncedFetchProducts"
            type="text"
            placeholder="Cari nama produk..."
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div v-if="productStore.loading" class="text-center text-gray-600 dark:text-gray-400 py-12 text-lg">
        Memuat produk...
      </div>
      <div v-else-if="productStore.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="showToast">
        <strong class="font-bold">Error:</strong>
        <span class="block sm:inline">{{ productStore.error }}</span>
      </div>
      <div v-else-if="productStore.products.length === 0" class="text-center text-gray-600 dark:text-gray-400 py-12 text-lg">
        Tidak ada produk ditemukan dengan filter yang dipilih.
      </div>

      <div v-else class="overflow-x-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" class="px-6 py-3 text-left">
                <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" class="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out rounded dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-500 dark:ring-offset-gray-800 focus:ring-blue-500" />
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Gambar
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Nama Produk
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Kategori
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Harga
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Status
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Dibuat Oleh
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            <tr v-for="produk in productStore.products" :key="produk.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <input type="checkbox" :value="produk.id" v-model="selectedProductIds" class="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out rounded dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-500 dark:ring-offset-gray-800 focus:ring-blue-500" />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <img
                  :src="produk.image_url || '/images/default-product.jpg'"
                  alt="Product Image"
                  class="h-12 w-12 object-cover rounded-md"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                <button @click="openProductPreviewModal(produk)" class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer text-left">
                  {{ produk.name }}
                </button>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {{ produk.category || 'N/A' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {{ formatRupiah(produk.price) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                    produk.status === 'active' ? 'bg-green-100 text-green-800' :
                    produk.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  ]"
                >
                  {{ formatStatus(produk.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {{ produk.created_by_user?.first_name || produk.created_by_user?.username || 'Tidak Diketahui' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="openEditProductStatusModal(produk)"
                  class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 mr-4"
                  title="Ubah Status"
                >
                  Edit Status
                </button>
                <button
                  @click="confirmDeleteProduct(produk.id, produk.name)"
                  class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                  title="Hapus Produk"
                >
                  Hapus
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showDeleteConfirmModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Konfirmasi Hapus Produk</h3>
        <p v-if="productToDeleteId" class="text-gray-700 dark:text-gray-300 mb-6">
          Anda yakin ingin menghapus produk <b>{{ productToDeleteName }}</b>? Aksi ini tidak dapat dibatalkan.
        </p>
        <p v-else-if="selectedProductIds.length > 0" class="text-gray-700 dark:text-gray-300 mb-6">
          Anda yakin ingin menghapus <b>{{ selectedProductIds.length }}</b> produk yang dipilih? Aksi ini tidak dapat dibatalkan.
        </p>
        <div class="flex justify-end gap-3">
          <button
            @click="cancelDeleteProduct"
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Batal
          </button>
          <button
            @click="deleteProduct"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>

    <div v-if="showEditStatusModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Ubah Status Produk: {{ productToEdit?.name }}</h3>
        <div class="mb-4">
          <label for="newStatus" class="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-400">Status Baru</label>
          <select
            id="newStatus"
            v-model="newProductStatus"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out appearance-none bg-white pr-8 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="active">Aktif</option>
            <option value="pending_review">Menunggu Review</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
        <div class="flex justify-end gap-3">
          <button
            @click="cancelEditStatus"
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Batal
          </button>
          <button
            @click="updateProductStatus"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>

    <div v-if="showProductPreviewModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg overflow-y-auto max-h-[90vh]">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Detail Produk</h3>
          <button @click="closeProductPreviewModal" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl leading-none">&times;</button>
        </div>

        <div v-if="productToPreview" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="md:col-span-1 flex justify-center items-center">
            <img
              :src="productToPreview.image_url || '/images/default-product.jpg'"
              alt="Product Image"
              class="max-h-64 object-contain rounded-md shadow-md w-full"
            />
          </div>
          <div class="md:col-span-1 space-y-3 text-gray-700 dark:text-gray-300">
            <p><strong>Nama:</strong> {{ productToPreview.name }}</p>
            <p><strong>Kategori:</strong> {{ productToPreview.category || 'N/A' }}</p>
            <p><strong>Harga:</strong> {{ formatRupiah(productToPreview.price) }}</p>
            <p><strong>Status:</strong>
              <span
                :class="[
                  'px-2 py-1 inline-flex text-sm leading-5 font-semibold rounded-full',
                  productToPreview.status === 'active' ? 'bg-green-100 text-green-800' :
                  productToPreview.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                ]"
              >
                {{ formatStatus(productToPreview.status) }}
              </span>
            </p>
            <p><strong>Dibuat Oleh:</strong> {{ productToPreview.created_by_user?.first_name || productToPreview.created_by_user?.username || 'Tidak Diketahui' }}</p>
            <p class="text-sm">
              <strong>Deskripsi:</strong> {{ productToPreview.description || 'Tidak ada deskripsi.' }}
            </p>
          </div>
        </div>
        <div v-else class="text-center text-gray-600 dark:text-gray-400">
          Memuat detail produk...
        </div>

        <div class="flex justify-end mt-6">
          <button
            @click="closeProductPreviewModal"
            class="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>

  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useProductStore } from '@/store/productStore';
import AdminLayout from '@/components/layout/AdminLayout.vue';
import Breadcrumb from '@/components/common/PageBreadcrumb.vue';
import { useToast } from '@/composables/useToast';

const { showToast } = useToast();
const productStore = useProductStore();

const searchQuery = ref('');
const selectedKategori = ref('');
const selectedStatus = ref('all');
let debounceTimeout = null;

const pageTitle = ref('Manajemen Produk');
const breadcrumbItems = ref([
  { label: 'Admin', to: '/admin/dashboard' },
  { label: 'Produk' }
]);

const showDeleteConfirmModal = ref(false);
const productToDeleteId = ref(null);
const productToDeleteName = ref('');

const showEditStatusModal = ref(false);
const productToEdit = ref(null);
const newProductStatus = ref('');

// --- Fitur Modal Preview Produk ---
const showProductPreviewModal = ref(false);
const productToPreview = ref(null);

const openProductPreviewModal = (product) => {
  productToPreview.value = product;
  showProductPreviewModal.value = true;
};

const closeProductPreviewModal = () => {
  showProductPreviewModal.value = false;
  productToPreview.value = null;
};
// --- Akhir Fitur Modal Preview Produk ---

// --- Fitur Pilih Beberapa Produk ---
const selectedProductIds = ref([]);
const selectAll = ref(false);

watch(productStore.products, (newProducts) => {
  if (newProducts.length === 0) {
    selectAll.value = false;
  }
  selectAll.value = newProducts.every(product => selectedProductIds.value.includes(product.id));
});

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedProductIds.value = productStore.products.map(produk => produk.id);
  } else {
    selectedProductIds.value = [];
  }
};

const deleteSelectedProducts = async () => {
  if (selectedProductIds.value.length === 0) {
    showToast('Pilih setidaknya satu produk untuk dihapus.');
    return;
  }

  productToDeleteId.value = null;
  productToDeleteName.value = 'produk yang dipilih';
  showDeleteConfirmModal.value = true;
};

const confirmMassDelete = async () => {
  try {
    const success = await productStore.deleteMultipleProducts(selectedProductIds.value); // Asumsi ada aksi ini di productStore

    if (success) {
      showToast(`${selectedProductIds.value.length} produk berhasil dihapus!`);
      selectedProductIds.value = [];
      selectAll.value = false;
      fetchProducts();
    } else {
      showToast(`Gagal menghapus produk: ${productStore.error}`);
    }
  } catch (error) {
    console.error("Error during mass delete:", error);
    showToast("Terjadi kesalahan saat menghapus beberapa produk.");
  } finally {
    cancelDeleteProduct();
  }
};

const deleteProduct = async () => {
  if (productToDeleteId.value) {
    const success = await productStore.deleteProduct(productToDeleteId.value);
    if (success) {
      showToast('Produk berhasil dihapus!');
    } else {
      showToast(`Gagal menghapus produk: ${productStore.error}`);
    }
    cancelDeleteProduct();
  } else if (selectedProductIds.value.length > 0) {
    await confirmMassDelete();
  }
};
// --- Akhir Fitur Pilih Beberapa Produk ---

const kategoriUnik = computed(() => {
  const categories = productStore.products.map(p => p.category).filter(Boolean);
  return [...new Set(categories)].sort();
});

const fetchProducts = () => {
  productStore.fetchProducts({
    search: searchQuery.value,
    category: selectedKategori.value,
    status: selectedStatus.value
  });
};

const debouncedFetchProducts = () => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    fetchProducts();
  }, 500);
};

const confirmDeleteProduct = (id, name) => {
  productToDeleteId.value = id;
  productToDeleteName.value = name;
  showDeleteConfirmModal.value = true;
};

const cancelDeleteProduct = () => {
  showDeleteConfirmModal.value = false;
  productToDeleteId.value = null;
  productToDeleteName.value = '';
};

const openEditProductStatusModal = (product) => {
  productToEdit.value = product;
  newProductStatus.value = product.status;
  showEditStatusModal.value = true;
};

const cancelEditStatus = () => {
  showEditStatusModal.value = false;
  productToEdit.value = null;
  newProductStatus.value = '';
};

const updateProductStatus = async () => {
  if (productToEdit.value && newProductStatus.value) {
    const success = await productStore.updateProduct(productToEdit.value.id, { status: newProductStatus.value });
    if (success) {
      showToast('Status produk berhasil diperbarui!');
    } else {
      showToast(`Gagal memperbarui status: ${productStore.error}`);
    }
    cancelEditStatus();
  }
};

const formatRupiah = (angka) => {
  if (typeof angka !== 'number') return '0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

const formatStatus = (status) => {
  if (!status) return '';
  switch (status) {
    case 'active': return 'Aktif';
    case 'inactive': return 'Nonaktif';
    case 'pending_review': return 'Menunggu Review';
    default: return status;
  }
};

onMounted(() => {
  fetchProducts();
});
</script>

<style scoped>
/* Anda bisa menambahkan gaya kustom di sini jika diperlukan */
/* Misalnya, untuk backdrop-blur-md agar berfungsi, pastikan Anda memiliki Tailwind CSS JIT atau plugin backdrop */
</style>
