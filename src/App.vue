<template>
  <div class="app-container">
    <Header />
    <main class="main-content">
      <div class="container">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import Header from './components/Header.vue'
export default { components: { Header } }
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 50%, #ede9fe 100%);
}

.main-content {
  padding: 1.5rem;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
}
</style>
