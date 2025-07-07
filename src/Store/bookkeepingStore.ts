// src/stores/bookkeepingStore.ts
import { defineStore } from 'pinia';
import { supabase } from '@/supabase';
import { useUserStore } from './userStore';

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
      if (userStore.profile?.role !== 'admin' && userStore.user.id !== umkmId) {
        this.error = 'Anda tidak memiliki izin untuk melihat transaksi ini.';
        return false;
      }

      try {
        let query = supabase.from('pembukuan').select('*').eq('umkm_id', umkmId);

        // Admin fetch semua data UMKM jika umkmId tidak diberikan
        if (userStore.profile?.role === 'admin' && !umkmId) {
             query = supabase.from('pembukuan').select('*'); // Ambil semua dari semua UMKM
        } else {
             query = supabase.from('pembukuan').select('*').eq('umkm_id', umkmId);
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
        console.log(`BookkeepingStore: Fetched ${this.transactions.length} transactions of type ${type || 'all'} for UMKM ${umkmId || 'all'} in range ${startDate || 'start'} to ${endDate || 'end'}.`);
        return true;
      } catch (err: any) {
        this.error = err.message || 'Terjadi kesalahan tidak terduga saat memuat transaksi.';
        console.error('BookkeepingStore: Fetch transactions error:', err.message);
        return false;
      } finally {
        this.loading = false;
      }
    },

    // ... (createTransaction, updateTransaction, deleteTransaction - aksi tetap sama) ...
  },
  getters: {
    // Getters akan tetap sama, mereka akan bekerja pada 'transactions' yang sudah difilter oleh fetchTransactions
    incomeTransactions: (state) => (state.transactions || []).filter(t => t.type === 'pemasukan'),
    expenseTransactions: (state) => (state.transactions || []).filter(t => t.type === 'pengeluaran'),
    totalIncome: (state) => (state.transactions || []).filter(t => t.type === 'pemasukan').reduce((sum, t) => sum + t.amount, 0),
    totalExpense: (state) => (state.transactions || []).filter(t => t.type === 'pengeluaran').reduce((sum, t) => sum + t.amount, 0),
  }
});
