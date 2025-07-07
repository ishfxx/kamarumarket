<template>
  <div>
    <Navbar />

    <div class="space-y-8 p-4 sm:p-8 dark:bg-gray-900 min-h-screen">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-3xl font-extrabold text-gray-900 dark:text-white">Jelajahi Produk UMKM</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end mb-8">
        <div class="md:col-span-1">
          <label for="filterKategori" class="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-400">Filter Kategori</label>
          <select
            id="filterKategori"
            v-model="selectedKategori"
            @change="fetchProductsWithFilters"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 ease-in-out appearance-none bg-white pr-8 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            style="background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%20viewBox%3D%220%200%20292.4%20292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%20197.6L146.2%2056.8%205.4%20197.6c-4.8%204.8-12.5%204.8-17.3%200l-5.4-5.4c-4.8-4.8-4.8-12.5%200-17.3L137.6%2025.2c4.8-4.8%2012.5-4.8%2017.3%200l132.8%20132.8c4.8%204.8%204.8%2012.5%200%2017.3l-5.4%205.4z%22%2F%3E%3C%2Fsvg%3E'); background-repeat: no-repeat; background-position: right 0.7em top 50%, 0 0; background-size: 0.65em auto, 100%;"
          >
            <option value="">Semua Kategori</option>
            <option v-for="kategori in kategoriUnik" :key="kategori" :value="kategori">
              {{ kategori }}
            </option>
          </select>
        </div>

        <div class="md:col-span-2 lg:col-span-3">
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
      <div v-else-if="productStore.products.length === 0" class="text-center text-gray-600 dark:text-gray-400 py-12 text-lg">
        Tidak ada produk ditemukan. Coba kategori atau kata kunci lain.
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-7">
        <router-link
          v-for="produk in productStore.products"
          :key="produk.id"
          :to="`/marketplace/product/${produk.id}`"
          class="bg-white shadow-md rounded-xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-103 hover:shadow-lg group dark:bg-gray-800"
        >
          <div class="relative w-full h-48 overflow-hidden">
            <img
              :src="produk.image_url || '/images/default-product.jpg'"
              :alt="produk.name"
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <span
              :class="[
                'absolute bottom-2 right-2 px-3 py-1 text-xs rounded-full font-bold',
                produk.status === 'active' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
              ]"
            >
              {{ formatStatus(produk.status) }}
            </span>
          </div>
          <div class="p-4 space-y-2">
            <h4 class="font-bold text-gray-900 text-lg line-clamp-1 dark:text-white">{{ produk.name }}</h4>
            <p class="text-sm text-gray-700 dark:text-gray-300">Rp {{ formatRupiah(produk.price) }}</p>
            </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useProductStore } from '@/store/productStore';
import Navbar from '@/Views/Marketplace/Navbar.vue';

const productStore = useProductStore();

const searchQuery = ref('');
const selectedKategori = ref('');
let debounceTimeout = null;

const kategoriUnik = computed(() => {
  const categories = productStore.products.map(p => p.category).filter(Boolean);
  return [...new Set(categories)].sort();
});

const fetchProductsWithFilters = () => {
  productStore.fetchProducts({
    search: searchQuery.value,
    category: selectedKategori.value,
    status: 'active'
  });
};

const debouncedFetchProducts = () => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    fetchProductsWithFilters();
  }, 500);
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
  fetchProductsWithFilters();
});
</script>

<style scoped>
select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  padding-right: 2.5rem;
}

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
