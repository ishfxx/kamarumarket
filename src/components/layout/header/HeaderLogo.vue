<template>
  <router-link to="/" class="lg:hidden">
    <img class="dark:hidden" width="70" height="40" src="@/assets/images/kapas_madya.png" alt="Logo" />
    <div class=" flex justify-center">
      <H2>BUKAPAS</H2>
    </div>
    <img class="hidden dark:block" width="70" height="40"  src="@/assets/images/kapas_madya.png" alt="Logo" />
  </router-link>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>
