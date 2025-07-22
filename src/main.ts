import './assets/main.css'
// Import Swiper styles
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'jsvectormap/dist/jsvectormap.css'
import 'flatpickr/dist/flatpickr.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia' // <--- TAMBAHKAN INI
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia() // <--- TAMBAHKAN INI

app.use(pinia) // <--- TAMBAHKAN INI
app.use(router)

app.mount('#app')
