<template>
  <AdminLayout>
    <Breadcrumb :pageTitle="pageTitle" />

    <div class="flex flex-col gap-10">
      <div class="panel p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-semibold text-gray-800 dark:text-white/90">Laporan Keuangan Lengkap</h2>
          <button
            @click="exportReport"
            class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white transition rounded-lg bg-success-500 shadow-theme-xs hover:bg-success-600"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H4a2 2 0 01-2-2V6a2 2 0 012-2h7l2 2h4a2 2 0 012 2v7a2 2 0 01-2 2z"></path>
            </svg>
            Export Laporan
          </button>
        </div>

        <div class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Total Pemasukan dan Pengeluaran -->
          <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 shadow-sm">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">Ringkasan Keuangan</h3>
            <div class="flex flex-col gap-2">
              <p class="text-gray-700 dark:text-gray-300">Total Pemasukan: <span class="font-bold text-success-600">{{ formatRupiah(totalIncome) }}</span></p>
              <p class="text-gray-700 dark:text-gray-300">Total Pengeluaran: <span class="font-bold text-red-600">{{ formatRupiah(totalExpense) }}</span></p>
              <p class="text-gray-700 dark:text-gray-300">Saldo Bersih: <span :class="{'font-bold': true, 'text-success-600': netBalance >= 0, 'text-red-600': netBalance < 0}">{{ formatRupiah(netBalance) }}</span></p>
            </div>
          </div>

          <!-- Filter Tahun/Bulan untuk Chart (jika diperlukan, bisa lebih kompleks) -->
          <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 shadow-sm flex items-center gap-4">
            <div class="relative w-full">
                <label for="chartMonthFilter" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter Data Chart:</label>
                <select
                  id="chartMonthFilter"
                  v-model="chartFilterPeriod"
                  class="block w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-success-500 focus:border-success-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    <option value="all">Semua Data</option>
                    <option value="last6months">6 Bulan Terakhir</option>
                    <option value="currentYear">Tahun Ini</option>
                </select>
            </div>
          </div>
        </div>


        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Chart Pemasukan Bulanan (Bar Chart) -->
          <div class="bg-white dark:bg-gray-800/50 rounded-lg p-4 shadow-sm">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Pemasukan & Pengeluaran Bulanan</h3>
            <apexchart type="bar" height="350" :options="monthlyChartOptions" :series="monthlyChartSeries"></apexchart>
          </div>

          <!-- Chart Kategori Pengeluaran (Pie Chart) -->
          <div class="bg-white dark:bg-gray-800/50 rounded-lg p-4 shadow-sm">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4">Pengeluaran Berdasarkan Kategori</h3>
            <apexchart type="donut" height="350" :options="categoryChartOptions" :series="categoryChartSeries"></apexchart>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script>
import AdminLayout from '@/components/layout/AdminLayout.vue';
import Breadcrumb from '@/components/common/PageBreadcrumb.vue';
// Hapus atau komentari baris ini karena VueApexCharts sudah didaftarkan global di main.ts
// import VueApexCharts from 'vue-apexcharts';

export default {
  components: {
    AdminLayout,
    Breadcrumb,
    // Hapus atau komentari baris ini karena 'apexchart' sudah tersedia global
    // apexchart: VueApexCharts,
  },
  data() {
    return {
      pageTitle: 'Laporan Keuangan',
      chartFilterPeriod: 'last6months', // Default filter untuk chart

      // Data dummy (gunakan data asli dari Pemasukan dan Pengeluaran Anda)
      // Ini harusnya diambil dari sumber data nyata Anda (API, Vuex store, dll.)
      allIncomeData: [
        { id: 1, tanggal: '2025-06-28', deskripsi: 'Penjualan Smartphone', jumlah: '8500000', kategori: 'Penjualan' },
        { id: 2, tanggal: '2025-06-15', deskripsi: 'Penjualan Laptop Gaming', jumlah: '15000000', kategori: 'Penjualan' },
        { id: 3, tanggal: '2025-05-20', deskripsi: 'Penerimaan Jasa Konsultasi', jumlah: '5000000', kategori: 'Jasa' },
        { id: 4, tanggal: '2025-05-01', deskripsi: 'Penjualan Aksesoris', jumlah: '950000', kategori: 'Penjualan' },
        { id: 5, tanggal: '2025-04-10', deskripsi: 'Pemasukan Lain-lain', jumlah: '300000', kategori: 'Lain-lain' },
        { id: 6, tanggal: '2025-04-05', deskripsi: 'Penjualan Software', jumlah: '2100000', kategori: 'Penjualan' },
        { id: 7, tanggal: '2025-03-22', deskripsi: 'Pendapatan Proyek Baru', jumlah: '4500000', kategori: 'Jasa' },
        { id: 8, tanggal: '2025-03-08', deskripsi: 'Penjualan Produk X', jumlah: '700000', kategori: 'Penjualan' },
        { id: 9, tanggal: '2025-02-14', deskripsi: 'Penjualan Produk Y', jumlah: '1200000', kategori: 'Penjualan' },
        { id: 10, tanggal: '2025-01-30', deskripsi: 'Sewa Gudang', jumlah: '4000000', kategori: 'Lain-lain' },
         { id: 11, tanggal: '2024-12-10', deskripsi: 'Penjualan Akhir Tahun', jumlah: '9000000', kategori: 'Penjualan' },
        { id: 12, tanggal: '2024-11-05', deskripsi: 'Pemasukan Event', jumlah: '2500000', kategori: 'Lain-lain' },
      ].map(item => ({ ...item, jumlah: parseFloat(item.jumlah.replace(/[^0-9,-]+/g, "").replace(",", ".")) })), // Konversi jumlah ke float

      allExpenseData: [
        { id: 1, tanggal: '2025-06-20', deskripsi: 'Pembayaran Gaji Karyawan', jumlah: '10000000', kategori: 'Gaji Karyawan' },
        { id: 2, tanggal: '2025-06-01', deskripsi: 'Sewa Kantor Bulan Juni', jumlah: '5000000', kategori: 'Sewa' },
        { id: 3, tanggal: '2025-05-25', deskripsi: 'Tagihan Listrik & Air Mei', jumlah: '750000', kategori: 'Listrik & Air' },
        { id: 4, tanggal: '2025-05-10', deskripsi: 'Biaya Transportasi Dinas', jumlah: '300000', kategori: 'Transportasi' },
        { id: 5, tanggal: '2025-04-15', deskripsi: 'Pembelian Alat Tulis Kantor', jumlah: '150000', kategori: 'Peralatan Kantor' },
        { id: 6, tanggal: '2025-04-02', deskripsi: 'Iklan Digital Bulan April', jumlah: '1000000', kategori: 'Pemasaran' },
        { id: 7, tanggal: '2025-03-30', deskripsi: 'Perbaikan Komputer', jumlah: '400000', kategori: 'Lain-lain' },
        { id: 8, tanggal: '2025-03-05', deskripsi: 'Pembelian Stok Kebersihan', jumlah: '200000', kategori: 'Lain-lain' },
        { id: 9, tanggal: '2025-02-18', deskripsi: 'Langganan Software Akuntansi', jumlah: '600000', kategori: 'Lain-lain' },
        { id: 10, tanggal: '2025-01-20', deskripsi: 'Biaya Perjalanan Bisnis', jumlah: '1200000', kategori: 'Transportasi' },
        { id: 11, tanggal: '2024-12-10', deskripsi: 'Pembayaran Utang Bank', jumlah: '8000000', kategori: 'Lain-lain' },
        { id: 12, tanggal: '2024-11-05', deskripsi: 'Biaya Renovasi', jumlah: '3000000', kategori: 'Sewa' },
      ].map(item => ({ ...item, jumlah: parseFloat(item.jumlah.replace(/[^0-9,-]+/g, "").replace(",", ".")) })), // Konversi jumlah ke float

      monthNames: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
    };
  },
  computed: {
    // === Data Agregat untuk Ringkasan Keuangan ===
    totalIncome() {
      return this.filteredIncomeForCharts.reduce((sum, item) => sum + item.jumlah, 0);
    },
    totalExpense() {
      return this.filteredExpenseForCharts.reduce((sum, item) => sum + item.jumlah, 0);
    },
    netBalance() {
      return this.totalIncome - this.totalExpense;
    },

    // === Filter Data untuk Chart berdasarkan chartFilterPeriod ===
    filteredIncomeForCharts() {
        return this.filterDataByPeriod(this.allIncomeData, this.chartFilterPeriod);
    },
    filteredExpenseForCharts() {
        return this.filterDataByPeriod(this.allExpenseData, this.chartFilterPeriod);
    },

    // === Monthly Chart (Bar Chart) ===
    monthlyChartOptions() {
      const isDarkMode = document.documentElement.classList.contains('dark');
      const textColor = isDarkMode ? '#f2f4f7' : '#475467'; // gray-100 or gray-600
      const gridColor = isDarkMode ? '#1d2939' : '#e4e7ec'; // gray-800 or gray-200

      const categories = this.getMonthlyCategories();
      return {
        chart: {
          id: 'monthly-summary-chart',
          toolbar: { show: false },
          foreColor: textColor // Set text color for labels
        },
        plotOptions: {
          bar: {
            horizontal: false,
            columnWidth: '55%',
            endingShape: 'rounded'
          },
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          show: true,
          width: 2,
          colors: ['transparent']
        },
        xaxis: {
          categories: categories,
          labels: {
            style: {
              colors: textColor,
            },
          },
          axisBorder: {
            show: true,
            color: gridColor,
          },
          axisTicks: {
            show: true,
            color: gridColor,
          },
        },
        yaxis: {
          title: {
            text: 'Jumlah (Rp)',
            style: {
              color: textColor,
            },
          },
          labels: {
            formatter: (value) => this.formatRupiah(value, true), // Format Y-axis labels
            style: {
              colors: textColor,
            },
          },
        },
        fill: {
          opacity: 1
        },
        tooltip: {
          y: {
            formatter: (val) => this.formatRupiah(val)
          },
          theme: isDarkMode ? 'dark' : 'light' // Sesuaikan tema tooltip dengan mode gelap
        },
        colors: ['#12b76a', '#f04438'], // Hijau untuk Pemasukan, Merah untuk Pengeluaran
        grid: {
          borderColor: gridColor, // Set grid line color
        },
        legend: {
          labels: {
            colors: textColor, // Set legend text color
          }
        }
      };
    },
    monthlyChartSeries() {
      const monthlyIncome = this.aggregateDataByMonth(this.filteredIncomeForCharts);
      const monthlyExpense = this.aggregateDataByMonth(this.filteredExpenseForCharts);
      const categories = this.getMonthlyCategories();

      const incomeValues = categories.map(monthYear => monthlyIncome[monthYear] || 0);
      const expenseValues = categories.map(monthYear => monthlyExpense[monthYear] || 0);

      return [
        { name: 'Pemasukan', data: incomeValues },
        { name: 'Pengeluaran', data: expenseValues }
      ];
    },

    // === Category Chart (Pie Chart) ===
    categoryChartOptions() {
      const isDarkMode = document.documentElement.classList.contains('dark');
      const textColor = isDarkMode ? '#f2f4f7' : '#475467';

      const categories = Object.keys(this.aggregateExpenseByCategory());
      return {
        chart: {
          type: 'donut',
          foreColor: textColor // Set text color for labels
        },
        labels: categories,
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'bottom'
            }
          }
        }],
        legend: {
          labels: {
            colors: textColor, // Set legend text color
          }
        },
        dataLabels: {
          enabled: true,
          formatter: function (val, opts) {
            return opts.w.config.series[opts.seriesIndex] + ' (' + val.toFixed(1) + '%)'
          },
          style: {
            fontSize: '12px',
            colors: [isDarkMode ? '#ffffff' : '#344054'] // Warna label di dalam slice
          }
        },
        tooltip: {
          y: {
            formatter: (val) => this.formatRupiah(val)
          },
          theme: isDarkMode ? 'dark' : 'light'
        },
        // Anda bisa menyesuaikan warna di sini jika ingin warna spesifik per kategori
        // colors: ['#FF4560', '#008FFB', '#00E396', '#775DD0', '#FEB019', '#2E93fA', '#66DA26', '#E91E63', '#FF9800']
      };
    },
    categoryChartSeries() {
      const aggregated = this.aggregateExpenseByCategory();
      return Object.values(aggregated);
    }
  },
  methods: {
    // Fungsi utilitas untuk memformat rupiah
    formatRupiah(amount, isAxisLabel = false) {
      if (typeof amount !== 'number') return amount; // Kembali jika bukan angka

      // Menggunakan toLocaleString untuk format mata uang yang lebih baik dan konsisten
      // dengan penanganan locale Indonesia (IDR)
      const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0, // Tidak ada desimal untuk rupiah
        maximumFractionDigits: 0,
      }).format(amount);

      if (isAxisLabel) {
        // Untuk label sumbu, kita mungkin ingin format yang lebih singkat
        if (amount >= 1000000000) { // Miliar
            return `Rp ${ (amount / 1000000000).toFixed(1) } M`;
        } else if (amount >= 1000000) { // Juta
            return `Rp ${ (amount / 1000000).toFixed(1) } Jt`;
        } else if (amount >= 1000) { // Ribu
            return `Rp ${ (amount / 1000).toFixed(0) } Rb`;
        }
      }
      return formatted;
    },

    // Fungsi untuk memfilter data berdasarkan periode
    filterDataByPeriod(data, period) {
        const today = new Date();
        let startDate;

        if (period === 'last6months') {
            startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1); // 6 bulan terakhir termasuk bulan ini
        } else if (period === 'currentYear') {
            startDate = new Date(today.getFullYear(), 0, 1); // Awal tahun ini
        } else { // 'all'
            return data;
        }

        return data.filter(item => {
            const itemDate = new Date(item.tanggal);
            return itemDate >= startDate && itemDate <= today;
        });
    },

    // Fungsi untuk mengagregasi data berdasarkan bulan (untuk bar chart)
    aggregateDataByMonth(data) {
      const monthlyData = {};
      data.forEach(item => {
        const date = new Date(item.tanggal);
        const monthYearKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        if (!monthlyData[monthYearKey]) {
          monthlyData[monthYearKey] = 0;
        }
        monthlyData[monthYearKey] += item.jumlah;
      });
      return monthlyData;
    },

    // Fungsi untuk mendapatkan kategori bulan yang relevan dengan data (untuk x-axis bar chart)
    getMonthlyCategories() {
        const categories = new Set();
        const combinedData = [...this.filteredIncomeForCharts, ...this.filteredExpenseForCharts];

        combinedData.forEach(item => {
            const date = new Date(item.tanggal);
            const monthYearKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            categories.add(monthYearKey);
        });

        // Urutkan kategori secara kronologis
        const sortedCategories = Array.from(categories).sort();

        // Konversi YYYY-MM menjadi NamaBulan YYYY
        return sortedCategories.map(key => {
            const [year, month] = key.split('-');
            return `${this.monthNames[parseInt(month) - 1]} ${year}`;
        });
    },

    // Fungsi untuk mengagregasi data pengeluaran berdasarkan kategori (untuk pie chart)
    aggregateExpenseByCategory() {
      const categoryData = {};
      this.filteredExpenseForCharts.forEach(item => {
        if (!categoryData[item.kategori]) {
          categoryData[item.kategori] = 0;
        }
        categoryData[item.kategori] += item.jumlah;
      });
      return categoryData;
    },

    exportReport() {
      alert('Fungsi Export Laporan akan datang! (Ini bisa berupa generate PDF/Excel)');
      // Di sini Anda akan menambahkan logika untuk export laporan,
      // misalnya memanggil API atau menggunakan library seperti jsPDF / SheetJS
    }
  }
};
</script>

<style scoped>
/* Scoped styles khusus untuk komponen ini jika ada */
</style>
