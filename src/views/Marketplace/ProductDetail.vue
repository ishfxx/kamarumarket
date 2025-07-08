<template>
  <div>
    <Navbar />

    <div class="px-6 py-8 dark:bg-gray-900 min-h-screen">
      <router-link
        to="/" class="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-6"
      >
        <svg
          class="stroke-current w-5 h-5 mr-1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path d="M12.7083 5L7.5 10.2083L12.7083 15.4167" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        Kembali ke Marketplace
      </router-link>

      <div v-if="productStore.loading" class="text-center text-gray-600 dark:text-gray-400 py-12 text-lg">
        Memuat detail produk...
      </div>

      <div v-else-if="productStore.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong class="font-bold">Error:</strong>
        <span class="block sm:inline">{{ productStore.error }}</span>
        <p v-if="productStore.error && productStore.error.includes('Produk tidak ditemukan')" class="text-xs mt-2">
          Produk ini mungkin telah dihapus atau tidak aktif.
        </p>
      </div>

      <div v-else-if="productDetail" class="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden md:flex">
        <div class="md:w-1/2 p-4 md:p-8">
          <img :src="productDetail.image_url || '/images/default-product.jpg'" :alt="productDetail.name" class="w-full h-96 object-contain rounded-lg">
        </div>
        <div class="md:w-1/2 p-4 md:p-8 flex flex-col justify-center">
          <span class="text-sm text-gray-500 dark:text-gray-400 mb-2">{{ productDetail.category || 'Tidak Berkategori' }}</span>
          <h1 class="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">{{ productDetail.name }}</h1>
          <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-6">Rp {{ formatRupiah(productDetail.price) }}</p>
          <p class="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">{{ productDetail.description }}</p>

          <div class="flex items-center justify-between mb-4">
            <span :class="[
              'px-3 py-1 text-sm font-semibold rounded-full',
              productDetail.status === 'active' ? 'bg-green-100 text-green-800' :
              productDetail.status === 'pending_review' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            ]">
              Status: {{ formatStatus(productDetail.status) }}
            </span>
          </div>

          <div class="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-3">Informasi Penjual</h2>
            <p v-if="productDetail.created_by_user" class="text-gray-700 dark:text-gray-300">
              <span class="font-semibold">Dibuat Oleh:</span> {{ productDetail.created_by_user.first_name || productDetail.created_by_user.username || 'Tidak Diketahui' }}
            </p>
            <p v-else class="text-gray-700 dark:text-gray-300">
                <span class="font-semibold">Dibuat Oleh:</span> Tidak Diketahui
            </p>

            <p v-if="productDetail.store" class="text-gray-700 dark:text-gray-300 mt-1">
              <span class="font-semibold">Toko:</span> {{ productDetail.store.store_name }}
            </p>
            <p v-if="productDetail.store?.contact_whatsapp" class="text-gray-700 dark:text-gray-300 mt-1">
              <span class="font-semibold">WhatsApp:</span> <a :href="`https://wa.me/${productDetail.store.contact_whatsapp}`" target="_blank" class="text-blue-500 hover:underline">{{ productDetail.store.contact_whatsapp }}</a>
            </p>
            <p v-if="productDetail.store?.e_commerce_link" class="text-gray-700 dark:text-gray-300 mt-1">
              <span class="font-semibold">Link E-commerce:</span> <a :href="productDetail.store.e_commerce_link" target="_blank" class="text-blue-500 hover:underline">{{ productDetail.store.e_commerce_link }}</a>
            </p>
            <p v-else-if="productDetail.created_by_user && productDetail.created_by_user.role === 'umkm' && !productDetail.store" class="text-gray-700 dark:text-gray-300 mt-1">
              UMKM ini belum memiliki profil toko yang lengkap.
            </p>
          </div>

          <div class="mt-8 flex gap-4">
            <button
                @click="redirectToWhatsApp(productDetail.store?.contact_whatsapp)"
                class="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700"
                :disabled="!productDetail.store?.contact_whatsapp"
            >
              Hubungi Penjual
            </button>
          </div>
        </div>
      </div>

      <div v-else class="text-center text-gray-600 dark:text-gray-400 py-12 text-lg">
        Produk tidak ditemukan.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useProductStore } from '@/store/productStore';
import Navbar from '@/Views/Marketplace/Navbar.vue';

const route = useRoute();
const productStore = useProductStore();

// Gunakan productDetail dari store
const productDetail = computed(() => productStore.productDetail);

// --- Fungsi Helper ---
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

const redirectToWhatsApp = (whatsappNumber?: string) => {
  if (whatsappNumber) {
    window.open(`https://wa.me/${whatsappNumber}`, '_blank');
  } else {
    alert('Nomor WhatsApp tidak tersedia.'); // Atau tampilkan notifikasi yang lebih bagus
  }
};

// --- Logika Pengambilan Data ---
const fetchProductData = async (productId: string) => {
  console.log('ProductDetail.vue: Calling fetchProductById for ID:', productId);
  await productStore.fetchProductById(productId);
  console.log('ProductDetail.vue: fetchProductById finished. Current productStore.productDetail:', productStore.productDetail);
};

// Watch untuk mengambil data produk setiap kali ID di URL berubah
// `immediate: true` akan menjalankan ini segera setelah komponen dipasang
watch(() => route.params.id, (newId) => {
  console.log('ProductDetail.vue: route.params.id changed to (or initial):', newId);
  if (newId) {
    fetchProductData(newId as string);
  } else {
    // Jika ID hilang dari URL, mungkin ada masalah navigasi atau URL yang salah
    productStore.error = 'ID Produk tidak ditemukan di URL. Mohon periksa kembali.';
    console.error('ProductDetail.vue: ID Produk tidak ditemukan di route.params.id');
  }
}, { immediate: true });

onMounted(() => {
  console.log('ProductDetail.vue: Component mounted.');
  // Data produk akan diambil oleh watcher di atas, jadi tidak perlu panggil fetchProductData lagi di sini.
});
</script>

<style scoped>
/* Styling khusus */
</style>
