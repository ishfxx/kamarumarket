<template>
  <nav class="bg-emerald-500 p-4 shadow-lg">
    <div class="container mx-auto flex justify-between items-center">
      <div class="flex items-center space-x-3">
        <img src="@/assets/images/kapas_madya.png" alt="KAMARU Logo" class="h-10 w-10 rounded-full object-cover shadow-sm" />
        <router-link to="/" class="text-white text-2xl font-extrabold tracking-wide">
          KAMARU Market
        </router-link>
      </div>

      <div>
        <button
          class="px-5 py-2 bg-white text-emerald-600 text-base font-semibold rounded-full hover:bg-emerald-50 hover:text-emerald-700 transition duration-300 ease-in-out transform hover:scale-105"
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
