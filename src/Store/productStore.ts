// src/stores/productStore.ts
import { defineStore } from 'pinia';
import { supabase } from '@/supabase';
import { useUserStore } from './userStore'; // Import userStore untuk otorisasi

// Definisikan tipe data untuk produk jika belum ada
// Ini membantu dengan Type Safety di TypeScript
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  category?: string;
  status: 'active' | 'inactive' | 'pending_review';
  created_at: string;
  created_by: string;
  store_id?: string | null;
  contact_wa?: string; // Menambahkan ini agar tipe lebih akurat
  ecommerce_link?: string; // Menambahkan ini agar tipe lebih akurat
  created_by_user?: {
    first_name?: string;
    last_name?: string;
    username?: string;
  };
  store?: {
    store_name?: string;
    contact_whatsapp?: string;
    e_commerce_link?: string;
  };
}

// Definisikan tipe data untuk filter produk
interface ProductFilters {
  category?: string;
  search?: string;
  status?: 'active' | 'inactive' | 'pending_review' | 'all';
}

interface Store {
  id: string;
  store_name: string;
  store_description?: string;
  contact_whatsapp?: string;
  e_commerce_link?: string;
  user_id: string;
  created_at: string;
}

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [] as Product[], // Daftar produk untuk marketplace umum dan admin
    umkmProducts: [] as Product[], // Daftar produk UMKM spesifik
    userStore: null as Store | null, // Toko milik user yang sedang login
    loading: false,
    error: null as string | null,
    currentProductDetail: null as Product | null, // Untuk halaman detail produk
  }),
  actions: {
    // --- Fetch Products for General Marketplace and Admin ---
    async fetchProducts(filters: ProductFilters = {}) {
      this.loading = true;
      this.error = null;
      try {
        let query = supabase.from('products').select('*, created_by_user:users(first_name, last_name, username), store:stores(store_name, contact_whatsapp, e_commerce_link)');

        if (filters.category) {
          query = query.eq('category', filters.category);
        }
        if (filters.search) {
          query = query.ilike('name', `%${filters.search}%`);
        }

        // Perubahan di sini: Mengizinkan 'all' untuk admin
        if (filters.status && filters.status !== 'all') {
             query = query.eq('status', filters.status);
        } else if (!filters.status) {
             query = query.eq('status', 'active'); // Default untuk tampilan marketplace umum
        }
        // Jika filters.status === 'all', tidak ada filter status yang diterapkan,
        // sehingga semua produk dengan berbagai status akan diambil.

        const { data, error } = await query.order('created_at', { ascending: false }); // Urutkan dari yang terbaru

        if (error) {
          console.error('ProductStore: Error fetching products:', error.message);
          this.error = 'Gagal memuat produk: ' + error.message;
          return false;
        }

        this.products = data as Product[] || []; // Pastikan tipe data Product[]
        console.log(`ProductStore: Fetched ${this.products.length} products.`);
        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat memuat produk.';
        console.error('ProductStore: Fetch products error:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // --- Fetch Products for a Specific UMKM ---
    async fetchUmkmProducts(umkmId: string) {
      const userStore = useUserStore();
      this.loading = true;
      this.error = null;
      try {
        // Logika otorisasi ini bisa diganti dengan RLS di Supabase jika lebih disukai
        if (!userStore.profile || (userStore.profile.role !== 'admin' && userStore.profile.id !== umkmId)) {
          this.error = 'Anda tidak memiliki izin untuk melihat produk ini.';
          return false;
        }

        const { data, error } = await supabase
          .from('products')
          .select('id, name, description, price, contact_wa, ecommerce_link, created_at, image_url, created_by, store_id, category, status, created_by_user:users(first_name, last_name, username), store:stores(store_name, contact_whatsapp, e_commerce_link)') // Tambah select join
          .eq('created_by', umkmId)
          .order('created_at', { ascending: false }); // Urutkan terbaru dulu

        if (error) {
          console.error('ProductStore: Error fetching UMKM products:', error.message);
          this.error = 'Gagal memuat produk UMKM: ' + error.message;
          return false;
        }

        this.umkmProducts = data as Product[] || []; // Pastikan tipe data Product[]
        console.log(`ProductStore: Fetched ${this.umkmProducts.length} UMKM products for ${umkmId}.`);
        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat memuat produk UMKM.';
        console.error('ProductStore: Fetch UMKM products error:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // --- Fetch Single Product by ID ---
    async fetchProductById(productId: string) {
      this.loading = true;
      this.error = null;
      this.currentProductDetail = null;

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, created_by_user:users(first_name, last_name, username), store:stores(store_name, contact_whatsapp, e_commerce_link)')
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

        this.currentProductDetail = data as Product; // Pastikan tipe data Product
        console.log('ProductStore: Fetched product detail:', this.currentProductDetail.name);
        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat memuat detail produk.';
        console.error('ProductStore: Fetch product by ID error:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // --- Create a Product ---
    async createProduct(productData: { name: string; description: string; price: number; image_url?: string; category?: string; status?: 'active' | 'inactive' | 'pending_review'; store_id?: string | null; contact_wa?: string; ecommerce_link?: string }) {
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
          name: productData.name,
          description: productData.description,
          price: productData.price,
          image_url: productData.image_url,
          category: productData.category,
          status: productData.status || (userStore.profile?.role === 'admin' ? 'active' : 'pending_review'),
          created_by: userStore.user.id,
          // userStore.myStore?.id digunakan untuk memastikan ID toko UMKM terkait
          store_id: userStore.profile?.role === 'umkm' ? userStore.myStore?.id || null : null, // Menggunakan userStore.myStore
          contact_wa: productData.contact_wa,
          ecommerce_link: productData.ecommerce_link,
        };

        const { data, error } = await supabase.from('products').insert(productToInsert).select();

        if (error) {
          console.error('ProductStore: Error creating product:', error.message);
          this.error = 'Gagal membuat produk: ' + error.message;
          return false;
        }

        if (userStore.profile?.role === 'umkm' && data && data.length > 0) {
          // Tambahkan ke umkmProducts jika pembuatnya adalah UMKM
          this.umkmProducts.push(data[0] as Product);
        }
        // Juga tambahkan ke products agar terlihat di daftar umum jika relevan
        // Misalnya, jika statusnya langsung active, bisa langsung tampil di marketplace
        // this.products.push(data[0] as Product); // Opsional, tergantung kebutuhan

        console.log('ProductStore: Product created successfully:', data[0]);
        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat membuat produk.';
        console.error('ProductStore: Create product error:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // --- Update a Product ---
    async updateProduct(productId: string, productData: Partial<Product>) { // Menggunakan Partial<Product> untuk fleksibilitas
      const userStore = useUserStore();
      this.loading = true;
      this.error = null;
      if (!userStore.user) {
        this.error = 'Anda harus login untuk memperbarui produk.';
        return false;
      }

      // Ambil produk yang ada dari salah satu state atau detail
      // Mengambil data lengkap dari API lagi untuk cek otorisasi yang lebih akurat
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
          .select('*, created_by_user:users(first_name, last_name, username), store:stores(store_name, contact_whatsapp, e_commerce_link)'); // Select ulang join untuk data terbaru

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

        // Update currentProductDetail jika yang diupdate adalah produk yang sedang dilihat
        if (this.currentProductDetail && this.currentProductDetail.id === productId) {
            this.currentProductDetail = updatedProduct;
        }

        console.log('ProductStore: Product updated successfully:', updatedProduct);
        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat memperbarui produk.';
        console.error('ProductStore: Update product error:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // --- Delete a Product ---
    async deleteProduct(productId: string) {
      const userStore = useUserStore();
      this.loading = true;
      this.error = null;
      if (!userStore.user) {
        this.error = 'Anda harus login untuk menghapus produk.';
        return false;
      }

      // Ambil produk yang ada dari API untuk cek otorisasi yang lebih akurat
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
        // Bersihkan currentProductDetail jika yang dihapus adalah produk yang sedang dilihat
        if (this.currentProductDetail && this.currentProductDetail.id === productId) {
            this.currentProductDetail = null;
        }
        console.log(`ProductStore: Product ${productId} deleted.`);
        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat menghapus produk.';
        console.error('ProductStore: Delete product error:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // --- Create UMKM Store ---
    async createStore(storeData: { store_name: string; store_description?: string; contact_whatsapp?: string; e_commerce_link?: string }) {
      const userStore = useUserStore();
      this.loading = true;
      this.error = null;
      if (!userStore.user || userStore.profile?.role !== 'umkm') {
        this.error = 'Hanya UMKM yang bisa membuat toko.';
        return false;
      }
      // Memeriksa keberadaan toko bisa lebih akurat dengan memanggil fetchUserStore terlebih dahulu
      await userStore.fetchUserStore(userStore.user.id); // Memastikan userStore.myStore up-to-date
      if (userStore.myStore) { // Menggunakan userStore.myStore dari userStore
        this.error = 'Anda sudah memiliki toko.';
        return false;
      }

      try {
        const storeToInsert = {
          ...storeData,
          user_id: userStore.user.id,
        };
        const { data, error } = await supabase.from('stores').insert(storeToInsert).select();

        if (error) {
          console.error('ProductStore: Error creating store:', error.message);
          this.error = 'Gagal membuat toko: ' + error.message;
          return false;
        }
        userStore.setMyStore(data[0] as Store); // Update userStore.myStore juga
        console.log('ProductStore: Store created successfully:', data[0]);
        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat membuat toko.';
        console.error('ProductStore: Create store error:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // --- Fetch User's Store ---
    async fetchUserStore(userId: string) {
      this.loading = true;
      this.error = null;
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('ProductStore: Error fetching user store:', error.message);
          this.error = 'Gagal memuat data toko: ' + error.message;
          // this.userStore = null; // Ini adalah productStore.userStore, lebih baik userStore.myStore
          return false;
        }

        this.userStore = data as Store || null; // Update local state jika Anda masih menggunakannya
        // Ini adalah tempat Anda mungkin ingin memperbarui state di userStore juga
        // const userStore = useUserStore();
        // userStore.setMyStore(data as Store || null); // Jika userStore memiliki setter untuk myStore
        console.log('ProductStore: User store fetched:', this.userStore);
        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat memuat toko.';
        console.error('ProductStore: Fetch user store error:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // --- Update User's Store ---
    async updateStore(storeId: string, storeData: Partial<Store>) { // Menggunakan Partial<Store>
      const userStore = useUserStore();
      this.loading = true;
      this.error = null;
      if (!userStore.user || (userStore.profile?.role !== 'umkm' && userStore.profile?.role !== 'admin')) {
        this.error = 'Anda tidak memiliki izin untuk memperbarui toko.';
        return false;
      }
      // Pastikan UMKM hanya bisa memperbarui tokonya sendiri
      if (userStore.profile?.role === 'umkm' && userStore.user.id !== this.userStore?.user_id) { // Menggunakan user_id dari userStore lokal atau dari userStore pinia
          this.error = 'Anda hanya bisa memperbarui toko Anda sendiri.';
          return false;
      }
      // Fetch the store to verify ownership if current store state is not reliable
      // Or rely solely on RLS policies in Supabase for strict security

      try {
        const { data, error } = await supabase
          .from('stores')
          .update(storeData)
          .eq('id', storeId)
          .select();

        if (error) {
          console.error('ProductStore: Error updating store:', error.message);
          this.error = 'Gagal memperbarui toko: ' + error.message;
          return false;
        }
        this.userStore = data[0] as Store; // Update local state jika Anda masih menggunakannya
        userStore.setMyStore(data[0] as Store); // Update userStore.myStore
        console.log('ProductStore: Store updated successfully:', this.userStore);
        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat memperbarui toko.';
        console.error('ProductStore: Update store error:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },
  },
  getters: {
    allMarketplaceProducts: (state) => state.products,
    myUmkmProducts: (state) => state.umkmProducts,
    myStore: (state) => state.userStore, // Getter untuk toko di productStore
    // Anda mungkin juga memiliki getter serupa di userStore untuk toko pengguna
  }
});
