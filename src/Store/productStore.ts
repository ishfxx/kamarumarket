// src/stores/productStore.ts
import { defineStore } from 'pinia';
import { supabase } from '@/supabase';
import { useUserStore } from './userStore'; // Import userStore untuk otorisasi dan data toko pengguna
import type { Product, Store, ProductStatus, User } from '@/types';

// Definisikan tipe data untuk filter produk
interface ProductFilters {
  category?: string;
  search?: string;
  status?: 'active' | 'inactive' | 'pending_review' | 'all';
}

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [] as Product[], // Daftar produk untuk marketplace umum
    umkmProducts: [] as Product[], // Daftar produk UMKM spesifik
    pendingReviewProducts: [] as Product[], // State baru untuk produk yang menunggu review (admin)
    latestUmkmProducts: [] as Product[], // State baru untuk produk UMKM terbaru (jika diperlukan)
    latestProductsAdmin: [] as Product[], // State baru untuk produk terbaru (admin)
    loading: false,
    error: null as string | null,
    currentProductDetail: null as Product | null, // Untuk halaman detail produk
  }),

  actions: {
    /**
     * Mengambil daftar produk untuk marketplace umum atau tampilan admin.
     * Dapat difilter berdasarkan kategori, pencarian, dan status.
     */
    async fetchProducts(filters: ProductFilters = {}) {
      this.loading = true;
      this.error = null;
      try {
        let query = supabase.from('products').select(`
          *,
          created_by_user:users(id, first_name, last_name, username),
          store:stores(store_name, contact_whatsapp, e_commerce_link)
        `);

        if (filters.category) {
          query = query.eq('category', filters.category);
        }
        if (filters.search) {
          query = query.ilike('name', `%${filters.search}%`);
        }

        const userStore = useUserStore();
        // Logika status:
        // Jika admin, dan statusnya 'all', tidak ada filter status.
        // Jika admin dan status spesifik, terapkan filter status.
        // Jika bukan admin, defaultkan ke 'active'.
        if (userStore.profile?.role === 'admin') {
          if (filters.status && filters.status !== 'all') {
            query = query.eq('status', filters.status);
          }
        } else {
          // Non-admin hanya melihat produk 'active' secara default
          query = query.eq('status', 'active');
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          console.error('ProductStore: Error fetching products:', error.message);
          this.error = 'Gagal memuat produk: ' + error.message;
          return false;
        }

        const normalized = data.map((item) => ({
          ...item,
          created_by_user: item.created_by_user?.[0],
          store: item.store?.[0],
        }));
        this.products = normalized as Product[];

        // Contoh bagaimana mengisi pendingReviewProducts jika statusnya "pending_review"
        if (userStore.profile?.role === 'admin' && filters.status === 'pending_review') {
          this.pendingReviewProducts = data as Product[] || [];
        }

        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat memuat produk.';
        console.error('ProductStore: Fetch products error:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Mengambil daftar produk untuk UMKM tertentu.
     * Membutuhkan user ID dari UMKM tersebut.
     */
    async fetchUmkmProducts(umkmId: string) {
      const userStore = useUserStore();
      this.loading = true;
      this.error = null;

      try {
        // Logika otorisasi: hanya admin atau pemilik UMKM yang bisa melihat semua produk UMKM
        if (!userStore.user || (userStore.profile?.role !== 'admin' && userStore.user.id !== umkmId)) {
          this.error = 'Anda tidak memiliki izin untuk melihat produk ini.';
          return false;
        }

        const { data, error } = await supabase
          .from('products')
          .select(`
            id, name, description, price, contact_wa, ecommerce_link, created_at, image_url, created_by, store_id, category, status,
            created_by_user:users(id, first_name, last_name, username),
            store:stores(id, user_id, store_name, contact_whatsapp, e_commerce_link, store_description)
          `)
          .eq('created_by', umkmId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('ProductStore: Error fetching UMKM products:', error.message);
          this.error = 'Gagal memuat produk UMKM: ' + error.message;
          return false;
        }

        const normalized = data.map((item) => {
          const store = Array.isArray(item.store) ? item.store[0] : item.store;
          const createdByUser = Array.isArray(item.created_by_user) ? item.created_by_user[0] : item.created_by_user;

          return {
            ...item,
            created_by_user: createdByUser,
            store: {
              id: store?.id ?? '',
              user_id: store?.user_id ?? '',
              store_name: store?.store_name ?? '',
              contact_whatsapp: store?.contact_whatsapp ?? '',
              e_commerce_link: store?.e_commerce_link ?? '',
              store_description: store?.store_description ?? '',
            },
          };
        });

        this.products = normalized as Product[];

        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat memuat produk UMKM.';
        console.error('ProductStore: Fetch UMKM products error:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    async createStore(storeData: Partial<Store>) {
      const userStore = useUserStore();
      const { data, error } = await supabase
        .from('stores')
        .insert([{ ...storeData, user_id: userStore.user?.id }])
        .select()
        .single();

      if (error || !data) {
        this.error = error?.message || 'Gagal membuat toko';
        return false;
      }

      userStore.setMyStore;
      return true;
    },



    async fetchProductById(productId: string) {
      this.loading = true;
      this.error = null;
      this.currentProductDetail = null;

      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            created_by_user:users(id, first_name, last_name, username),
            store:stores(store_name, contact_whatsapp, e_commerce_link)
          `)
          .eq('id', productId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            this.error = 'Produk tidak ditemukan.';
          } else {
            this.error = 'Gagal memuat detail produk: ' + error.message;
          }
          console.error('ProductStore: Error fetching product by ID:', error.message);
          return false;
        }

        this.currentProductDetail = data as Product;
        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat memuat detail produk.';
        console.error('ProductStore: Fetch product by ID error:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Membuat produk baru.
     * Status default ditentukan oleh peran pengguna (admin: active, UMKM: pending_review).
     */
    async createProduct(productData: Partial<Product>) {
      const userStore = useUserStore();
      if (!userStore.user) {
        this.error = 'Anda harus login untuk membuat produk.';
        return false;
      }
      if (userStore.profile?.role !== 'admin' && userStore.profile?.role !== 'umkm') {
        this.error = 'Anda tidak memiliki izin untuk membuat produk.';
        return false;
      }

      this.loading = true;
      this.error = null;
      try {
        const productToInsert = {
          ...productData,
          status: productData.status || (userStore.profile?.role === 'admin' ? 'active' : 'pending_review'),
          created_by: userStore.user.id,
          // Menggunakan userStore.myStore untuk mendapatkan store_id UMKM
          store_id: userStore.profile?.role === 'umkm' ? userStore.myStore?.id ?? '' : '',
        };

        const { data, error } = await supabase.from('products').insert(productToInsert).select();

        if (error) {
          console.error('ProductStore: Error creating product:', error.message);
          this.error = 'Gagal membuat produk: ' + error.message;
          return false;
        }

        if (data && data.length > 0) {
          const newProduct = data[0] as Product;
          // Tambahkan ke umkmProducts jika pembuatnya adalah UMKM
          if (userStore.profile?.role === 'umkm') {
            this.umkmProducts.push(newProduct);
          }
          // Tambahkan ke products jika statusnya 'active' atau jika admin yang membuat
          if (newProduct.status === 'active' || userStore.profile?.role === 'admin') {
            this.products.push(newProduct);
          }
          // Tambahkan ke pendingReviewProducts jika statusnya 'pending_review'
          if (newProduct.status === 'pending_review') {
            this.pendingReviewProducts.push(newProduct);
          }
        }
        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat membuat produk.';
        console.error('ProductStore: Create product error:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Memperbarui produk yang sudah ada.
     * Otorisasi dilakukan berdasarkan pemilik produk atau peran admin.
     */
    async updateProduct(productId: string, productData: Partial<Product>) {
      const userStore = useUserStore();
      this.loading = true;
      this.error = null;
      if (!userStore.user) {
        this.error = 'Anda harus login untuk memperbarui produk.';
        return false;
      }

      // Ambil produk yang ada untuk cek otorisasi
      const { data: existingProduct, error: fetchError } = await supabase
        .from('products')
        .select('created_by')
        .eq('id', productId)
        .single();

      if (fetchError || !existingProduct) {
        this.error = 'Produk tidak ditemukan atau ada masalah otorisasi.';
        console.error('ProductStore: Error fetching existing product for update check:', fetchError?.message);
        return false;
      }

      const isOwner = existingProduct.created_by === userStore.user.id;
      if (userStore.profile?.role !== 'admin' && !isOwner) {
        this.error = 'Anda tidak memiliki izin untuk memperbarui produk ini.';
        return false;
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId)
          .select(`
            *,
            created_by_user:users(id, first_name, last_name, username),
            store:stores(store_name, contact_whatsapp, e_commerce_link)
          `);

        if (error) {
          console.error('ProductStore: Error updating product:', error.message);
          this.error = 'Gagal memperbarui produk: ' + error.message;
          return false;
        }

        const updatedProduct = data[0] as Product;

        // Update di state products (untuk daftar umum/admin)
        const productIndex = this.products.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
          this.products[productIndex] = updatedProduct;
        }

        // Update di state umkmProducts jika ada
        const umkmProductIndex = this.umkmProducts.findIndex(p => p.id === productId);
        if (umkmProductIndex !== -1) {
          this.umkmProducts[umkmProductIndex] = updatedProduct;
        }

        // Update di state pendingReviewProducts jika ada perubahan status
        const pendingIndex = this.pendingReviewProducts.findIndex(p => p.id === productId);
        if (pendingIndex !== -1 && updatedProduct.status !== 'pending_review') {
            this.pendingReviewProducts.splice(pendingIndex, 1); // Hapus jika statusnya berubah
        } else if (pendingIndex === -1 && updatedProduct.status === 'pending_review') {
            this.pendingReviewProducts.push(updatedProduct); // Tambahkan jika statusnya baru jadi pending
        } else if (pendingIndex !== -1 && updatedProduct.status === 'pending_review') {
            this.pendingReviewProducts[pendingIndex] = updatedProduct; // Update jika masih pending
        }

        // Update currentProductDetail jika yang diupdate adalah produk yang sedang dilihat
        if (this.currentProductDetail && this.currentProductDetail.id === productId) {
          this.currentProductDetail = updatedProduct;
        }

        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat memperbarui produk.';
        console.error('ProductStore: Update product error:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Menghapus produk.
     * Otorisasi dilakukan berdasarkan pemilik produk atau peran admin.
     */
    async deleteProduct(productId: string) {
      const userStore = useUserStore();
      this.loading = true;
      this.error = null;
      if (!userStore.user) {
        this.error = 'Anda harus login untuk menghapus produk.';
        return false;
      }

      // Ambil produk yang ada untuk cek otorisasi
      const { data: existingProduct, error: fetchError } = await supabase
        .from('products')
        .select('created_by')
        .eq('id', productId)
        .single();

      if (fetchError || !existingProduct) {
        this.error = 'Produk tidak ditemukan atau ada masalah otorisasi.';
        console.error('ProductStore: Error fetching existing product for delete check:', fetchError?.message);
        return false;
      }

      const isOwner = existingProduct.created_by === userStore.user.id;
      if (userStore.profile?.role !== 'admin' && !isOwner) {
        this.error = 'Anda tidak memiliki izin untuk menghapus produk ini.';
        return false;
      }

      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId);

        if (error) {
          console.error('ProductStore: Error deleting product:', error.message);
          this.error = 'Gagal menghapus produk: ' + error.message;
          return false;
        }

        // Hapus dari state products
        this.products = this.products.filter(p => p.id !== productId);
        // Hapus dari state umkmProducts
        this.umkmProducts = this.umkmProducts.filter(p => p.id !== productId);
        // Hapus dari state pendingReviewProducts
        this.pendingReviewProducts = this.pendingReviewProducts.filter(p => p.id !== productId);
        // Bersihkan currentProductDetail jika yang dihapus adalah produk yang sedang dilihat
        if (this.currentProductDetail && this.currentProductDetail.id === productId) {
          this.currentProductDetail = null;
        }
        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat menghapus produk.';
        console.error('ProductStore: Delete product error:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // --- Actions terkait Store dipindahkan ke userStore.ts ---
    // Karena userStore adalah tempat yang lebih logis untuk mengelola data toko milik pengguna
    // Jika Anda membutuhkan akses ke fungsi-fungsi ini di productStore,
    // Anda bisa memanggilnya dari instance userStore.
  },

  getters: {
    allMarketplaceProducts: (state) => state.products,
    myUmkmProducts: (state) => state.umkmProducts,
    productsPendingReview: (state) => state.pendingReviewProducts,
    // Anda bisa menambahkan getter lain sesuai kebutuhan, misalnya:
    // latestProducts: (state) => state.latestProductsAdmin,
  }
});
