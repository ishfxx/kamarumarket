// src/stores/bookkeepingStore.ts
import { defineStore } from 'pinia';
import { supabase } from '@/supabase';
import { useUserStore } from './userStore'; // Import userStore untuk otorisasi

// SESUAIKAN INI DENGAN NILAI ENUM YANG BENAR DI DATABASE ANDA (huruf kecil semua)
type TransactionType = 'pemasukan' | 'pengeluaran';

export const useBookkeepingStore = defineStore('bookkeeping', {
  state: () => ({
    transactions: [] as any[], // Daftar semua transaksi (pemasukan/pengeluaran)
    loading: false,
    error: null as string | null,
  }),
  actions: {
    // --- Mengambil Transaksi (Pemasukan atau Pengeluaran) ---
    async fetchTransactions(umkmId: string, type: TransactionType | null = null, startDate: string | null = null, endDate: string | null = null) {
      const userStore = useUserStore();
      this.loading = true;
      this.error = null;

      // Otentikasi & Otorisasi
      if (!userStore.user) {
        this.error = 'Anda harus login.';
        return false;
      }
      // Hanya UMKM yang bisa melihat transaksinya sendiri, Admin bisa melihat semua
      // Pastikan umkmId ini adalah ID yang diizinkan untuk dilihat oleh userStore.user
      // Jika user adalah admin, dan umkmId tidak diberikan, maka akan mengambil semua transaksi dari semua UMKM.
      if (userStore.profile?.role !== 'admin' && userStore.user.id !== umkmId) { // Perbaikan: Cek ini hanya jika umkmId diberikan dan tidak null/undefined
        // Jika admin, dan umkmId tidak diberikan, itu berarti admin ingin fetch semua transaksi
        // jika admin dan umkmId diberikan, itu berarti admin ingin fetch transaksi umkm spesifik
        // if (!umkmId) sudah dihandle di query di bawah
      } else if (!umkmId && userStore.profile?.role !== 'admin') { // Hanya user non-admin yang tidak memberikan umkmId akan error
        this.error = 'ID UMKM tidak diberikan. Mohon login sebagai UMKM atau berikan ID UMKM.';
        return false;
      }

      try {
        let query = supabase.from('pembukuan').select('*');

        // Jika admin dan tidak ada umkmId spesifik, ambil semua transaksi dari semua UMKM.
        // Jika bukan admin atau ada umkmId spesifik, filter berdasarkan umkmId.
        if (userStore.profile?.role === 'admin' && !umkmId) {
             // query sudah .select('*') di atas
        } else {
             query = query.eq('umkm_id', umkmId);
        }

        if (type) {
          query = query.eq('type', type);
        }

        // Filter berdasarkan rentang tanggal
        if (startDate) {
          query = query.gte('date', startDate);
        }
        if (endDate) {
          query = query.lte('date', endDate);
        }

        query = query.order('date', { ascending: false }); // Urutkan berdasarkan tanggal terbaru

        const { data, error } = await query;

        if (error) {
          console.error('BookkeepingStore: Error fetching transactions:', error.message);
          this.error = 'Gagal memuat transaksi: ' + error.message;
          return false;
        }

        this.transactions = data || [];
        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat memuat transaksi.';
        console.error('BookkeepingStore: Fetch transactions error:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // --- Membuat Transaksi Baru (PASTIKAN BLOK INI ADA LENGKAP DAN TIDAK DIKOMENTARI) ---
    async createTransaction(transactionData: { umkm_id: string; date: string; type: TransactionType; amount: number; description: string }) {
      const userStore = useUserStore();
      this.loading = true;
      this.error = null;

      if (!userStore.user || userStore.user.id !== transactionData.umkm_id) {
        this.error = 'Anda tidak memiliki izin untuk membuat transaksi untuk UMKM ini.';
        return false;
      }
      if (userStore.profile?.role === 'admin' && userStore.user.id !== transactionData.umkm_id) {
         this.error = 'Admin tidak dapat membuat transaksi langsung untuk UMKM lain dari UI ini.';
         return false;
      }

      try {
        const { data, error } = await supabase.from('pembukuan').insert(transactionData).select();

        if (error) {
          console.error('BookkeepingStore: Error creating transaction:', error.message);
          this.error = 'Gagal membuat transaksi: ' + error.message;
          return false;
        }

        if (data && data.length > 0) {
          this.transactions.unshift(data[0]);
          return true;
        }
        return false;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat membuat transaksi.';
        console.error('BookkeepingStore: Create transaction error:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // --- Memperbarui Transaksi (PASTIKAN BLOK INI ADA LENGKAP DAN TIDAK DIKOMENTARI) ---
    async updateTransaction(id: string, transactionData: { date?: string; type?: TransactionType; amount?: number; description?: string }) {
      const userStore = useUserStore();
      this.loading = true;
      this.error = null;

      const existingTransaction = this.transactions.find(t => t.id === id);
      if (!existingTransaction || (userStore.profile?.role !== 'admin' && existingTransaction.umkm_id !== userStore.user?.id)) {
        this.error = 'Anda tidak memiliki izin untuk memperbarui transaksi ini.';
        return false;
      }

      try {
        const { data, error } = await supabase.from('pembukuan').update(transactionData).eq('id', id).select();

        if (error) {
          console.error('BookkeepingStore: Error updating transaction:', error.message);
          this.error = 'Gagal memperbarui transaksi: ' + error.message;
          return false;
        }

        if (data && data.length > 0) {
          const index = this.transactions.findIndex(t => t.id === id);
          if (index !== -1) {
            this.transactions[index] = data[0];
          }
          return true;
        }
        return false;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat memperbarui transaksi.';
        console.error('BookkeepingStore: Update transaction error:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // --- Menghapus Transaksi (PASTIKAN BLOK INI ADA LENGKAP DAN TIDAK DIKOMENTARI) ---
    async deleteTransaction(id: string) {
      const userStore = useUserStore();
      this.loading = true;
      this.error = null;

      const existingTransaction = this.transactions.find(t => t.id === id);
      if (!existingTransaction || (userStore.profile?.role !== 'admin' && existingTransaction.umkm_id !== userStore.user?.id)) {
        this.error = 'Anda tidak memiliki izin untuk menghapus transaksi ini.';
        return false;
      }

      try {
        const { error } = await supabase.from('pembukuan').delete().eq('id', id);

        if (error) {
          console.error('BookkeepingStore: Error deleting transaction:', error.message);
          this.error = 'Gagal menghapus transaksi: ' + error.message;
          return false;
        }

        this.transactions = this.transactions.filter(t => t.id !== id);
        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat menghapus transaksi.';
        console.error('BookkeepingStore: Delete transaction error:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },
  },
  getters: {
    incomeTransactions: (state) => (state.transactions || []).filter(t => t.type === 'pemasukan'),
    expenseTransactions: (state) => (state.transactions || []).filter(t => t.type === 'pengeluaran'),
    totalIncome: (state) => (state.transactions || []).filter(t => t.type === 'pemasukan').reduce((sum, t) => sum + t.amount, 0),
    totalExpense: (state) => (state.transactions || []).filter(t => t.type === 'pengeluaran').reduce((sum, t) => sum + t.amount, 0),
  }
});
