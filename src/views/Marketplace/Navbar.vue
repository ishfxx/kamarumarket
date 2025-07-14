<template>
  <nav class="bg-emerald-500 px-4 py-3 shadow-lg ">
    <div class="container mx-auto flex justify-between items-center">
      <!-- Logo dan Nama -->
      <div class="flex items-center space-x-3">
        <img
          src="@/assets/images/kapas_madya.png"
          alt="KAMARU Logo"
          class="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover shadow-sm"
        />
        <router-link
          to="/"
          class="text-white text-lg sm:text-2xl font-extrabold tracking-wide"
        >
          KAMARU Market
        </router-link>
      </div>

      <div>
        <button
          class="bg-transparent border-none text-white hover:drop-shadow-[0_0_6px_#ffffff] hover:font-bold transition duration-200"
          @click="goToSignIn"
        >
          Sign In
        </button>

      </div>
    </div>
  </nav>
</template>

<script>
export default {
  name: 'Navbar',
  methods: {
    goToSignIn() {
      // Ini adalah contoh bagaimana Anda dapat mengarahkan pengguna ke halaman sign-in.
      // Anda perlu memiliki rute '/signin' yang terdefinisi di Vue Router Anda.
      this.$router.push('/signin');
    },
  },
};
</script>

<style scoped>
/* Tidak ada style khusus di sini karena menggunakan Tailwind CSS */
</style>
