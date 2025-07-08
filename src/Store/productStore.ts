// src/stores/productStore.ts
import { defineStore } from 'pinia';
import { supabase } from '@/supabase';
import { useUserStore } from './userStore'; // Import userStore untuk otorisasi

export const useProductStore = defineStore('product', {
  state: () => ({
    products: [] as any[], // Daftar produk untuk marketplace umum
    umkmProducts: [] as any[], // Daftar produk UMKM spesifik
    userStore: null as any | null, // Toko milik user yang sedang login
    loading: false,
    error: null as string | null,

    // PASTIKAN STATE INI ADA UNTUK HALAMAN DETAIL PRODUK
    currentProductDetail: null as any | null,
  }),
  actions: {
    // --- Fetch Products for General Marketplace ---
    async fetchProducts(filters: any = {}) {
      this.loading = true;
      this.error = null;
      try {
        // Ambil semua kolom yang relevan, termasuk created_by_user untuk nama pembuat
        let query = supabase.from('products').select('*, created_by_user:users(first_name, last_name, username)');

        if (filters.category) {
          query = query.eq('category', filters.category);
        }
        if (filters.search) {
          query = query.ilike('name', `%${filters.search}%`);
        }
        if (filters.status !== undefined) {
             query = query.eq('status', filters.status);
        } else {
             query = query.eq('status', 'active');
        }

        const { data, error } = await query;

        if (error) {
          console.error('ProductStore: Error fetching products:', error.message);
          this.error = 'Gagal memuat produk marketplace: ' + error.message;
          return false;
        }

        this.products = data || [];
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
        if (!userStore.profile || (userStore.profile.role !== 'admin' && userStore.profile.id !== umkmId)) {
          this.error = 'Anda tidak memiliki izin untuk melihat produk ini.';
          return false;
        }

        // Ambil semua kolom yang relevan dari tabel products
        const { data, error } = await supabase
          .from('products')
          .select('id, name, description, price, contact_wa, ecommerce_link, created_at, image_url, created_by, store_id, category, status')
          .eq('created_by', umkmId);

        if (error) {
          console.error('ProductStore: Error fetching UMKM products:', error.message);
          this.error = 'Gagal memuat produk UMKM: ' + error.message;
          return false;
        }

        this.umkmProducts = data || [];
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

    // --- NEW ACTION: Fetch Single Product by ID (PASTIKAN INI ADA) ---
    async fetchProductById(productId: string) {
      this.loading = true;
      this.error = null;
      this.currentProductDetail = null; // Bersihkan state detail sebelumnya

      try {
        // SELECT: Ambil semua kolom produk, dan juga JOIN dengan tabel 'users' untuk creator (created_by_user)
        // dan tabel 'stores' untuk informasi toko (store).
        const { data, error } = await supabase
          .from('products')
          .select('*, created_by_user:users(first_name, last_name, username), store:stores(store_name, contact_whatsapp, e_commerce_link)')
          .eq('id', productId)
          .single(); // Ambil hanya satu baris

        if (error) {
          // PGRST116 = no rows found (produk tidak ditemukan)
          if (error.code === 'PGRST116') {
            this.error = 'Produk tidak ditemukan.';
          } else {
            this.error = 'Gagal memuat detail produk: ' + error.message;
          }
          console.error('ProductStore: Error fetching product by ID:', error.message);
          return false;
        }

        this.currentProductDetail = data;
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
    async createProduct(productData: { name: string; description: string; price: number; image_url?: string; category?: string; status?: string; store_id?: string | null; contact_wa?: string; ecommerce_link?: string }) {
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
          store_id: userStore.profile?.role === 'umkm' ? this.userStore?.id || null : null,
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
          this.umkmProducts.push(data[0]);
        }
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
    async updateProduct(productId: string, productData: { name?: string; description?: string; price?: number; image_url?: string; category?: string; status?: string; store_id?: string | null; contact_wa?: string; ecommerce_link?: string }) {
      const userStore = useUserStore();
      this.loading = true;
      this.error = null;
      if (!userStore.user) {
        this.error = 'Anda harus login untuk memperbarui produk.';
        return false;
      }

      const productToUpdate = this.products.find(p => p.id === productId) || this.umkmProducts.find(p => p.id === productId);

      const isOwner = productToUpdate && productToUpdate.created_by === userStore.user.id;
      if (userStore.profile?.role !== 'admin' && !isOwner) {
        this.error = 'Anda tidak memiliki izin untuk memperbarui produk ini.';
        return false;
      }

      this.loading = true;
      this.error = null;
      try {
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId)
          .select();

        if (error) {
          console.error('ProductStore: Error updating product:', error.message);
          this.error = 'Gagal memperbarui produk: ' + error.message;
          return false;
        }

        const productIndex = this.products.findIndex(p => p.id === productId);
        if (productIndex !== -1 && data && data.length > 0) this.products[productIndex] = data[0];

        const umkmProductIndex = this.umkmProducts.findIndex(p => p.id === productId);
        if (umkmProductIndex !== -1 && data && data.length > 0) this.umkmProducts[umkmProductIndex] = data[0];

        console.log('ProductStore: Product updated successfully:', data[0]);
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

      const productToDelete = this.products.find(p => p.id === productId) || this.umkmProducts.find(p => p.id === productId);

      const isOwner = productToDelete && productToDelete.created_by === userStore.user.id;
      if (userStore.profile?.role !== 'admin' && !isOwner) {
        this.error = 'Anda tidak memiliki izin untuk menghapus produk ini.';
        return false;
      }

      this.loading = true;
      this.error = null;
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

        this.products = this.products.filter(p => p.id !== productId);
        this.umkmProducts = this.umkmProducts.filter(p => p.id !== productId);
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
      if (this.userStore) {
        this.error = 'Anda sudah memiliki toko.';
        return false;
      }

      this.loading = true;
      this.error = null;
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
        this.userStore = data[0];
        console.log('ProductStore: Store created successfully:', this.userStore);
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
          this.userStore = null;
          return false;
        }

        this.userStore = data || null;
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
    async updateStore(storeId: string, storeData: any) {
      const userStore = useUserStore();
      this.loading = true;
      this.error = null;
      if (!userStore.user || (userStore.profile?.role !== 'umkm' && userStore.profile?.role !== 'admin')) {
        this.error = 'Anda tidak memiliki izin untuk memperbarui toko.';
        return false;
      }
      if (userStore.profile?.role === 'umkm' && this.userStore?.id !== storeId) {
          this.error = 'Anda hanya bisa memperbarui toko Anda sendiri.';
          return false;
      }

      this.loading = true;
      this.error = null;
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
        this.userStore = data[0];
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
    myStore: (state) => state.userStore,
  }
});
