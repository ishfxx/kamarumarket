<template>
  <FullScreenLayout>
    <div class="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div
        class="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900"
      >
        <div
          class="relative items-center hidden w-full h-full lg:w-1/2 bg-emerald-700 dark:bg-white/5 lg:grid"
        >
          <div class="flex items-center justify-center z-1">
            <CommonGridShape />
            <div class="flex flex-col items-center max-w-xs">
              <router-link to="/" class="block mb-4">
                <img width="{231}" height="{48}" src="@/assets/images/kapas_madya.png" alt="Logo" />
              </router-link>
              <p class="text-center text-gray-200 dark:text-white/60 text-7xl font-sans">
                BUKAPAS
              </p>
            </div>
          </div>
        </div>

        <div class="flex flex-col flex-1 w-full lg:w-1/2">
          <div class="w-full max-w-md pt-10 mx-auto">
            <router-link
              to="/"
              class="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <svg
                class="stroke-current"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M12.7083 5L7.5 10.2083L12.7083 15.4167"
                  stroke=""
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Back to Home
            </router-link>
            <div class="lg:hidden flex justify-center py-4">
                <router-link to="/" class="block">
                    <img width="{150}" src="@/assets/images/kapas_madya.png" alt="Logo" />
                </router-link>
            </div>
          </div>
          <div class="flex flex-col justify-center flex-1 w-full max-w-md mx-auto text-center">
            <div class="mb-5 sm:mb-8">
              <h1
                class="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md font-sans"
              >
                Verifikasi Email
              </h1>
              <p v-if="verificationStatus === 'verifying'" class="text-lg text-emerald-600 dark:text-emerald-400 font-sans">
                Memverifikasi email Anda...
              </p>
              <p v-else-if="verificationStatus === 'success'" class="text-lg text-green-600 dark:text-green-400 font-sans">
                Email Anda berhasil diverifikasi! Anda sekarang dapat <router-link to="/signin" class="text-blue-500 hover:underline">login</router-link>.
              </p>
              <p v-else-if="verificationStatus === 'error'" class="text-lg text-red-600 dark:text-red-400 font-sans">
                Gagal memverifikasi email Anda: {{ errorMessage }}. Mohon coba lagi atau hubungi dukungan.
              </p>
              <p v-else class="text-lg text-gray-600 dark:text-gray-400 font-sans">
                Mengecek status verifikasi...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </FullScreenLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/supabase';
import FullScreenLayout from '@/components/layout/FullScreenLayout.vue';
import CommonGridShape from '@/components/common/CommonGridShape.vue';
import { useUserStore } from '@/store/userStore'; // Import userStore

const router = useRouter();
const userStore = useUserStore(); // Dapatkan instance userStore

const verificationStatus = ref<'idle' | 'verifying' | 'success' | 'error'>('idle');
const errorMessage = ref<string | null>(null);

onMounted(async () => {
  verificationStatus.value = 'verifying';

  // Supabase secara otomatis menangani verifikasi email saat tautan di email diklik.
  // Yang perlu kita lakukan adalah memastikan sesi diperbarui.
  // Event 'SIGNED_IN' akan terpicu jika verifikasi berhasil dan user langsung login.
  // Atau 'USER_UPDATED' jika hanya email yang diverifikasi pada sesi yang sudah ada.

  // Supabase Auth Listener
  // Ini akan mendeteksi perubahan state autentikasi, termasuk setelah verifikasi email.
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state change detected:', event, session);

    if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
      // Pastikan userStore diinisialisasi untuk mendapatkan profil dan role terbaru
      await userStore.initializeUser();

      if (userStore.isLoggedIn && userStore.user?.email_confirmed_at) { // Cek apakah email sudah terkonfirmasi
        verificationStatus.value = 'success';
        // Opsional: Arahkan pengguna ke dashboard setelah verifikasi berhasil
        // setTimeout(() => {
        //   router.push('/dashboard');
        // }, 3000);
      } else {
        errorMessage.value = 'Email mungkin belum sepenuhnya terverifikasi atau terjadi kesalahan.';
        verificationStatus.value = 'error';
      }
    } else if (event === 'SIGNED_OUT') {
      // Jika user signOut selama proses ini, mungkin karena sesi kedaluwarsa atau error
      errorMessage.value = 'Sesi berakhir. Mohon login kembali.';
      verificationStatus.value = 'error';
    } else if (event === 'INITIAL_SESSION' && !session) {
      // Jika halaman dimuat dan tidak ada sesi (mungkin belum klik link verifikasi, atau link kedaluwarsa)
      errorMessage.value = 'Tidak ada sesi aktif atau tautan verifikasi tidak valid/kadaluarsa.';
      verificationStatus.value = 'error';
    }
  });

  // Penting: Hentikan langganan saat komponen di-unmount
  // onUnmounted(() => {
  //   subscription.unsubscribe();
  // });

  // Sebagai fallback, kita juga bisa mencoba mendapatkan sesi saat mount.
  // Supabase secara internal akan memproses redirect dari link verifikasi.
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      errorMessage.value = error.message;
      verificationStatus.value = 'error';
      return;
    }

    if (session && session.user.email_confirmed_at) {
      await userStore.initializeUser(); // Pastikan userStore diperbarui
      verificationStatus.value = 'success';
    } else {
      errorMessage.value = 'Tautan verifikasi mungkin tidak valid, sudah digunakan, atau belum ada sesi. Silakan cek email Anda atau coba login.';
      verificationStatus.value = 'error';
    }
  } catch (err: any) {
    errorMessage.value = err.message || 'Terjadi kesalahan tidak terduga.';
    verificationStatus.value = 'error';
  }
});
</script>

<style scoped>
/* Tambahkan gaya spesifik halaman jika diperlukan */
</style>
