import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Learn from '../views/Learn.vue'
import Game from '../views/Game.vue'
import Bookmarks from '../views/Bookmarks.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/learn', component: Learn },
  { path: '/game', component: Game },
  { path: '/bookmarks', component: Bookmarks }
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})
