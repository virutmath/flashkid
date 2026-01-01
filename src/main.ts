import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Vant from 'vant'
import 'vant/lib/index.css'
import App from './App.vue'
import './styles/main.css'
import { router } from './router'
import { registerSW } from 'virtual:pwa-register'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(Vant)
app.mount('#app')

// Register PWA service worker (handled by VitePWA)
registerSW({ immediate: true })

