<template>
  <div>
    <div class="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow">
      <Navbar />
    </div>

    <section
      class="relative bg-cover bg-center bg-no-repeat text-white mb-8 mx-4 sm:mx-8 mt-5 shadow-md overflow-hidden min-h-[450px] flex items-center justify-center"
      :style="{ backgroundImage: `url(${kelurahanImage})` }"
    >
      <div class="absolute inset-0 backdrop-blur grayscale"></div> <div class="relative z-10 flex flex-col items-center justify-center text-center h-full p-8 sm:p-12">
        <h2 class="text-3xl sm:text-5xl font-extrabold mb-2">KAPAS MADYA BARU</h2> <p class="text-sm sm:text-base">
          <span class="font-semibold">Jumlah Produk:</span> {{ productStore.products.length }}
        </p>
      </div>
    </section>

    <div class="px-4 sm:px-8 dark:bg-gray-900">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">

        <aside class="col-span-1 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md h-fit">
          <h3 class="text-base font-semibold text-gray-700 dark:text-gray-300 mb-4">Kategori</h3>
          <div class="flex flex-wrap gap-2">
            <button
              class="px-4 py-2 text-sm rounded-full font-medium border transition duration-200"
              :class="selectedKategori === ''
                ? 'bg-blue-600 text-white border-blue-600'
                : 'text-gray-700 border-gray-300 dark:text-white dark:border-gray-600'"
              @click="filterByCategory('')"
            >
              Semua
            </button>
            <button
              v-for="kategori in kategoriUnik"
              :key="kategori"
              class="px-4 py-2 text-sm rounded-full font-medium border transition duration-200 flex items-center gap-2"
              :class="selectedKategori === kategori
                ? 'bg-blue-600 text-white border-blue-600'
                : 'text-gray-700 border-gray-300 dark:text-white dark:border-gray-600'"
              @click="filterByCategory(kategori)"
            >
              {{ kategori }}
              <span v-if="selectedKategori === kategori" @click.stop="filterByCategory('')" class="ml-1 font-bold text-white">✕</span>
            </button>
          </div>
        </aside>

        <section class="col-span-1 md:col-span-3 space-y-6">
          <div>
            <label for="cariProduk" class="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-400">Cari Produk</label>
            <input
              id="cariProduk"
              v-model="searchQuery"
              @input="debouncedFetchProducts"
              type="text"
              placeholder="Cari nama produk..."
              class="w-full px-4 py-2 border border-gray-300 rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>

          <div v-if="productStore.loading" class="text-center text-gray-500 dark:text-gray-400">Memuat produk...</div>
          <div v-else-if="productStore.products.length === 0" class="text-center text-gray-500 dark:text-gray-400">Tidak ada produk ditemukan.</div>

          <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            <div
              v-for="produk in productStore.products"
              :key="produk.id"
              @click="openProductDetailOverlay(produk.id)"
              class="cursor-pointer bg-white dark:bg-gray-800 p-4 rounded-xl shadow hover:shadow-lg transition"
            >
              <img
                :src="produk.image_url || '/images/default-product.jpg'"
                alt="product image"
                class="w-full h-40 object-cover rounded mb-3"
              />
              <h4 class="text-base font-bold text-gray-900 dark:text-white line-clamp-1">{{ produk.name }}</h4>
              <p class="text-sm text-gray-600 dark:text-gray-300">{{ formatRupiah(produk.price) }}</p>
            </div>
          </div>
        </section>
      </div>
    </div>

    <transition name="fade">
      <div
        v-if="showDetailOverlay"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 md-blur dropset-blur-md backdrop-blur-sm"
        @click.self="closeProductDetailOverlay"
      >
        <transition name="slide-up">
          <div
            v-if="showDetailOverlay"
            class="relative bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all duration-300"
          >
            <button
              @click="closeProductDetailOverlay"
              class="absolute top-3 right-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 z-10 p-2 rounded-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm transition-colors duration-200"
              aria-label="Tutup"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>

            <div
              v-if="productStore.loading"
              class="flex-grow flex items-center justify-center py-12 text-lg text-gray-600 dark:text-gray-400"
            >
              Memuat detail produk...
            </div>

            <div
              v-else-if="productStore.error"
              class="flex-grow bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded relative m-4 flex flex-col justify-center items-center text-center"
              role="alert"
            >
              <strong class="font-bold text-xl mb-2">Error:</strong>
              <span class="block text-lg">{{ productStore.error }}</span>
              <p
                v-if="productStore.error && productStore.error.includes('Produk tidak ditemukan')"
                class="text-sm mt-3"
              >
                Produk ini mungkin telah dihapus atau tidak aktif.
              </p>
            </div>

            <div
              v-else-if="productStore.currentProductDetail"
              class="flex-grow overflow-y-auto custom-scrollbar"
            >
              <div class="md:flex h-full">
                <div
                  class="md:w-1/2 flex items-center justify-center p-4 md:p-8 bg-gray-50 dark:bg-gray-900"
                >
                  <img
                    :src="productStore.currentProductDetail.image_url || '/images/default-product.jpg'"
                    :alt="productStore.currentProductDetail.name"
                    class="max-w-full max-h-full object-contain rounded-lg shadow-md"
                  />
                </div>

                <div class="md:w-1/2 p-4 md:p-8 flex flex-col">
                  <span class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {{ productStore.currentProductDetail.category || 'Tidak Berkategori' }}
                  </span>
                  <h1
                    class="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-3"
                  >
                    {{ productStore.currentProductDetail.name }}
                  </h1>
                  <p
                    class="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-6"
                  >
                    {{ formatRupiah(productStore.currentProductDetail.price) }}
                  </p>

                  <div class="mb-6">
                    <h3
                      class="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2"
                    >
                      Deskripsi Produk:
                    </h3>
                    <p
                      class="text-gray-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base"
                    >
                      {{ productStore.currentProductDetail.description }}
                    </p>
                  </div>

                  <div
                    class="border-t border-gray-200 dark:border-gray-700 pt-6 mt-auto"
                  >
                    <h2
                      class="text-xl font-bold text-gray-900 dark:text-white mb-3"
                    >
                      Informasi Penjual
                    </h2>

                    <p
                      v-if="productStore.currentProductDetail.created_by_user"
                      class="text-gray-700 dark:text-gray-300 text-sm sm:text-base"
                    >
                      <span class="font-semibold">Dibuat Oleh:</span>
                      {{
                        productStore.currentProductDetail.created_by_user.first_name ||
                        productStore.currentProductDetail.created_by_user.username ||
                        'Tidak Diketahui'
                      }}
                      <span class="ml-1">
                        ({{ productStore.currentProductDetail.contact_wa }})
                      </span>
                    </p>

                    <p
                      v-else
                      class="text-gray-700 dark:text-gray-300 text-sm sm:text-base"
                    >
                      <span class="font-semibold">Dibuat Oleh:</span> Tidak Diketahui
                    </p>

                    <p
                      v-if="productStore.currentProductDetail.store"
                      class="text-gray-700 dark:text-gray-300 mt-1 text-sm sm:text-base"
                    >
                      <span class="font-semibold">Toko:</span>
                      {{ productStore.currentProductDetail.store.store_name }}
                    </p>

                    <p
                      v-if="productStore.currentProductDetail.store?.contact_whatsapp"
                      class="text-gray-700 dark:text-gray-300 mt-1 text-sm sm:text-base"
                    >
                      <span class="font-semibold">WhatsApp:</span>
                      <a
                        :href="`https://wa.me/${productStore.currentProductDetail.store.contact_whatsapp}`"
                        target="_blank"
                        class="text-blue-500 hover:underline"
                      >
                        {{ productStore.currentProductDetail.store.contact_whatsapp }}
                      </a>
                    </p>

                    <p
                      v-if="productStore.currentProductDetail.store?.ecommerce_link"
                      class="text-gray-700 dark:text-gray-300 mt-1 text-sm sm:text-base"
                    >
                      <span class="font-semibold">Link E-commerce:</span>
                      <a
                        :href="formatLink(productStore.currentProductDetail.store.ecommerce_link)"
                        target="_blank"
                        class="text-blue-500 hover:underline break-words"
                      >
                        {{ productStore.currentProductDetail.store.ecommerce_link }}
                      </a>
                    </p>

                    <p
                      v-else-if="productStore.currentProductDetail.created_by_user &&
                        productStore.currentProductDetail.created_by_user.role === 'umkm' &&
                        !productStore.currentProductDetail.store"
                      class="text-gray-700 dark:text-gray-300 mt-1 text-sm sm:text-base"
                    >
                      UMKM ini belum memiliki profil toko yang lengkap.
                    </p>
                  </div>

                  <div class="mt-8 flex gap-4 flex-wrap">
                    <button
                      @click="redirectToWhatsApp(productStore.currentProductDetail.store?.contact_whatsapp, productStore.currentProductDetail.name)"
                      class="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors duration-200 flex-grow sm:flex-grow-0"
                    >
                      Hubungi Penjual
                    </button>

                    <button
                      v-if="productStore.currentProductDetail.store?.ecommerce_link"
                      @click="redirectToEcommerce(productStore.currentProductDetail.store.ecommerce_link)"
                      class="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 flex-grow sm:flex-grow-0"
                    >
                      Kunjungi Toko
                    </button>

                    <span
                      v-else
                      class="px-6 py-3 text-gray-500 dark:text-gray-400 text-sm italic flex-grow sm:flex-grow-0 flex items-center justify-center"
                    >
                      Link E-commerce tidak tersedia.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-else-if="!productStore.loading && !productStore.error"
              class="flex-grow flex items-center justify-center py-12 text-lg text-gray-600 dark:text-gray-400"
            >
              Produk tidak ditemukan.
            </div>
          </div>
        </transition>
      </div>
    </transition>

  </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue';
import { useProductStore } from '@/store/productStore';
import Navbar from '@/Views/Marketplace/Navbar.vue';
import kelurahanImage from '@/assets/images/kelurahan.jpg';


const productStore = useProductStore();

const searchQuery = ref('');
const selectedKategori = ref('');
let debounceTimeout = null;

const showDetailOverlay = ref(false); // Mengontrol visibilitas modal
const selectedProductId = ref(null); // ID produk yang akan ditampilkan di modal

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

const filterByCategory = (kategori) => {
  selectedKategori.value = kategori;
  fetchProductsWithFilters();
};


const debouncedFetchProducts = () => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    fetchProductsWithFilters();
  }, 500);
};

// --- Fungsi untuk membuka dan menutup overlay ---
const openProductDetailOverlay = async (productId) => {
  selectedProductId.value = productId;
  showDetailOverlay.value = true;
  // Langsung panggil fetchProductById saat modal dibuka
  await productStore.fetchProductById(productId);

  // Opsional: Untuk mencegah scrolling body di belakang modal
  document.body.style.overflow = 'hidden';
};

const closeProductDetailOverlay = () => {
  showDetailOverlay.value = false;
  selectedProductId.value = null;
  productStore.currentProductDetail = null; // Bersihkan detail produk di store
  productStore.error = null; // Bersihkan error juga
  // Kembalikan scrolling body
  document.body.style.overflow = '';
};

// --- Fungsi Helper ---
const formatRupiah = (angka) => {
  if (typeof angka !== 'number') return '0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

// Fungsi formatStatus tidak digunakan di template utama Anda, tetapi tidak ada salahnya membiarkannya
const formatStatus = (status) => {
  if (!status) return '';
  switch (status) {
    case 'active': return 'Aktif';
    case 'inactive': return 'Nonaktif';
    case 'pending_review': return 'Menunggu Review';
    default: return status;
  }
};

const redirectToWhatsApp = (whatsappNumber, productName) => {
  // fallback: dari store.contact_whatsapp atau langsung dari produk
  const number = productStore.currentProductDetail.store?.contact_whatsapp
              || productStore.currentProductDetail.contact_wa;

  if (number) {
    const message = encodeURIComponent(`Halo, saya tertarik dengan produk "${productName}" yang saya lihat di UMKM Connect. Bisakah Anda memberikan informasi lebih lanjut?`);
    window.open(`https://wa.me/${number}?text=${message}`, '_blank');
  } else {
    alert('Nomor WhatsApp penjual tidak tersedia.');
  }
};



const redirectToEcommerce = (url) => {
  if (url) {
    const formattedUrl = formatLink(url);
    window.open(formattedUrl, '_blank');
  } else {
    alert('Link E-commerce tidak tersedia.');
  }
};

// Pastikan fungsi formatLink tetap ada
const formatLink = (url) => {
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) {
    return 'http://' + url;
  }
  return url;
};

onMounted(() => {
  fetchProductsWithFilters(); // Muat daftar produk saat komponen dipasang
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

/* Transitions for overlay */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s ease-out;
}
.slide-up-enter-from, .slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

/* Custom Scrollbar for the overlay content */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1; /* Light gray track */
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #888; /* Darker gray thumb */
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #555; /* Even darker gray on hover */
}

/* Dark mode scrollbar */
.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: #333; /* Dark track for dark mode */
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #666; /* Lighter thumb for dark mode */
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #888; /* Even lighter thumb on hover */
}
</style>
