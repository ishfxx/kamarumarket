// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/store/userStore'; // Pastikan path ini benar

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // --- 1. Rute Autentikasi (Tidak memerlukan autentikasi) ---
    {
      path: '/signin',
      name: 'Signin',
      component: () => import('@/views/Auth/Signin.vue'),
      meta: { requiresAuth: false, layout: 'FullScreenLayout' }
    },
    {
      path: '/signup',
      name: 'Signup',
      component: () => import('@/views/Auth/Signup.vue'),
      meta: { requiresAuth: false, layout: 'FullScreenLayout' }
    },
    {
      path: '/email-verification',
      name: 'EmailVerif',
      component: () => import('@/views/Auth/EmailVerification.vue'),
      meta: { requiresAuth: false, layout: 'FullScreenLayout' }
    },

    // --- 2. Rute Publik / Umum (Tidak memerlukan autentikasi) ---
    {
      path: '/', // Halaman utama (misal, Marketplace Umum)
      name: 'MarketplaceUmum', // Nama rute yang lebih jelas
      component: () => import('@/views/Marketplace/MarketplaceUmum.vue'), // Perbaiki path jika di root views
      meta: { requiresAuth: false } // Tidak memerlukan autentikasi untuk marketplace umum
    },
    // {
    //   path: '/marketplace/product/:id', // Rute detail produk
    //   name: 'ProductDetail',
    //   component: () => import('@/views/Marketplace/ProductDetail.vue'), // Perlu membuat komponen ini
    //   meta: { requiresAuth: false } // Detail produk juga publik
    // },

    // --- 3. Rute Dashboard (Membutuhkan autentikasi, role-dependent) ---
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/Dashboard/Dashboard.vue'), // Komponen Dashboard tunggal
      meta: { requiresAuth: true, layout: 'AdminLayout' } // Membutuhkan autentikasi
    },

    // --- 4. Rute Umum Terautentikasi (Membutuhkan autentikasi, untuk semua role yang login) ---
    {
      path: '/profile', // Halaman profil pengguna
      name: 'Profile',
      component: () => import('@/views/Profile/Profile.vue'), // Asumsi di views/Profile.vue
      meta: { requiresAuth: true, layout: 'AdminLayout' } // Membutuhkan autentikasi
    },
    {
      path: '/income', // Contoh halaman transaksi
      name: 'Income',
      component: () => import('@/views/Transaksi/Income.vue'), // Sesuaikan path jika perlu
      meta: { requiresAuth: true, layout: 'AdminLayout' }
    },
    // Tambahkan rute-rute umum terautentikasi lainnya di sini
    // {
    //   path: '/account-settings',
    //   name: 'AccountSettings',
    //   component: () => import('@/views/AccountSettings.vue'),
    //   meta: { requiresAuth: true, layout: 'AdminLayout' }
    // },


    // --- 5. Rute Manajemen UMKM (Membutuhkan autentikasi, hanya untuk role UMKM/Admin) ---
    // {
    //   path: '/umkm/marketplace', // Path sesuai yang kita diskusikan sebelumnya
    //   name: 'UmkmProductManagement', // Nama rute yang lebih jelas
    //   component: () => import('@/views/Umkm/UmkmProductManagement.vue'), // Perbaiki path jika perlu
    //   meta: { requiresAuth: true, umkmOnly: true, layout: 'AdminLayout' } // Hanya UMKM/Admin
    // },
    // Tambahkan rute manajemen UMKM lainnya di sini, misal:
    {
      path: '/produksaya',
      name: 'UmkmStoreManagement',
      component: () => import('@/views/Marketplace/UmkmProductManagement.vue'),
      meta: { requiresAuth: true, umkmOnly: true, layout: 'AdminLayout' }
    },
    {
      path: '/review',
      name: 'Review',
      component: () => import('@/views/Admin/AdminProductReview.vue'),
      meta: { requiresAuth: true, adminOnly: true, layout: 'AdminLayout' }
    },
    {
      path: '/manageproduct',
      name: 'ManagementProduct',
      component: () => import('@/views/Admin/AdminProductManagement.vue'),
      meta: { requiresAuth: true, adminOnly: true, layout: 'AdminLayout' }
    },

    {
      path: '/pemasukan', // Contoh halaman transaksi
      name: 'Pemasukan',
      component: () => import('@/views/Transaksi/Income.vue'), // Sesuaikan path jika perlu
      meta: { requiresAuth: true, layout: 'AdminLayout' }
    },
    {
      path: '/pengeluaran', // Contoh halaman transaksi
      name: 'Pengeluaran',
      component: () => import('@/views/Transaksi/Outcome.vue'), // Sesuaikan path jika perlu
      meta: { requiresAuth: true, layout: 'AdminLayout' }
    },
    {
      path: '/neracasaldo', // Contoh halaman transaksi
      name: 'NeracaSaldo',
      component: () => import('@/views/Transaksi/NeracaSaldo.vue'), // Sesuaikan path jika perlu
      meta: { requiresAuth: true, layout: 'AdminLayout' }
    },
    {
      path: '/aruskas', // Contoh halaman transaksi
      name: 'ArusKas',
      component: () => import('@/views/Transaksi/ArusKas.vue'), // Sesuaikan path jika perlu
      meta: { requiresAuth: true, layout: 'AdminLayout' }
    },
    {
      path: '/labarugi', // Contoh halaman transaksi
      name: 'LabaRugi',
      component: () => import('@/views/Transaksi/LabaRugi.vue'), // Sesuaikan path jika perlu
      meta: { requiresAuth: true, layout: 'AdminLayout' }
    },
    // --- 6. Rute Manajemen Admin (Membutuhkan autentikasi, hanya untuk role Admin) ---
    {
      path: '/verifikasi', // Halaman manajemen pengguna oleh admin
      name: 'UserVerification', // Menggunakan nama rute yang lebih deskriptif
      component: () => import('@/views/Verifikasi/User/VerifikasiUser.vue'), // Perbaiki path jika perlu src\views\Verifikasi\User\VerifikasiUser.vue
      meta: { requiresAuth: true, adminOnly: true, layout: 'AdminLayout' } // Hanya Admin
    },
    // {
    //   path: '/admin/marketplace', // Path sesuai yang kita diskusikan sebelumnya
    //   name: 'AdminMarketplaceManagement', // Nama rute yang lebih jelas
    //   component: () => import('@/views/Admin/AdminMarketplaceManagement.vue'), // Perbaiki path jika perlu
    //   meta: { requiresAuth: true, adminOnly: true, layout: 'AdminLayout' } // Hanya Admin
    // },
    // Tambahkan rute manajemen Admin lainnya di sini


    // --- 7. Catch-all route untuk 404 (Harus di paling bawah) ---
    // {
    //   path: '/:pathMatch(.*)*',
    //   name: 'NotFound',
    //   component: () => import('@/views/NotFound.vue'), // Buat komponen NotFound.vue
    //   meta: { requiresAuth: false, layout: 'FullScreenLayout' } // Layout bebas untuk 404
    // }
  ]
});

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();

  // Pastikan data user sudah dimuat sebelum guard berjalan
  // Ini penting agar userStore.user dan userStore.profile memiliki nilai yang benar
  // Hanya panggil initializeUser jika user belum login DAN bukan dalam proses loading
  if (!userStore.isLoggedIn && !userStore.loading) {
    await userStore.initializeUser();
  }

  const isLoggedIn = userStore.isLoggedIn;
  const userRole = userStore.getUserRole; // Dapatkan role dari getter userStore

  // --- Alur Pengecekan Akses ---

  // 1. Jika sudah login dan mencoba mengakses Signin/Signup, redirect ke Dashboard
  if ((to.name === 'Signin' || to.name === 'Signup') && isLoggedIn) {
    next({ name: 'Dashboard' });
  }
  // 2. Jika rute membutuhkan autentikasi tapi user belum login
  else if (to.meta.requiresAuth && !isLoggedIn) {
    alert('Anda harus login untuk mengakses halaman ini.');
    next({ name: 'Signin' });
  }
  // 3. Jika rute hanya untuk Admin tapi user bukan Admin
  else if (to.meta.adminOnly && userRole !== 'admin') {
    alert('Anda tidak memiliki izin untuk mengakses halaman ini (Hanya Admin).');
    // Arahkan ke dashboard jika sudah login, atau signin jika belum (tapi ini harusnya tidak tercapai jika requiresAuth sudah menangani)
    next({ name: 'Dashboard' }); // Arahkan ke dashboard umum
  }
  // 4. Jika rute hanya untuk UMKM (atau Admin) tapi user bukan UMKM/Admin
  else if (to.meta.umkmOnly && userRole !== 'umkm' && userRole !== 'admin') {
    alert('Anda tidak memiliki izin untuk mengakses halaman ini (Hanya UMKM dan Admin).');
    next({ name: 'Dashboard' }); // Arahkan ke dashboard umum
  }
  // 5. Jika semua pengecekan lolos, izinkan navigasi
  else {
    next();
  }
});

export default router;
