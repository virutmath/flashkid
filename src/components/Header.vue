<template>
  <div class="header">
    <van-nav-bar :border="false">
      <template #left>
        <div class="logo">
          <div class="logo-circle">卡</div>
          <div class="logo-text">
            <div class="logo-title">Flashcard Kids</div>
            <div class="logo-sub">HSK3-4 • Chinese for kids</div>
          </div>
        </div>
      </template>
      <template #right>
        <van-space size="10" class="nav-space hide-mobile">
          <router-link to="/">
            <van-button size="small" type="primary" plain round>Home</van-button>
          </router-link>
          <router-link to="/learn">
            <van-button size="small" type="success" plain round>Learn</van-button>
          </router-link>
          <router-link to="/game">
            <van-button size="small" type="warning" plain round>Games</van-button>
          </router-link>
          <router-link to="/bookmarks">
            <van-button size="small" type="primary" plain round>Bookmarks</van-button>
          </router-link>
          <div v-if="userStore.user" class="user-chip">
            <div class="user-meta">
              <span class="user-name">{{ userStore.user?.name }}</span>
              <span class="user-streak" v-if="userStore.streak">🔥 {{ userStore.streak.current }} streak</span>
            </div>
            <van-button size="small" type="danger" plain round @click="handleLogout">Logout</van-button>
          </div>
          <van-button v-else size="small" type="primary" round @click="openLogin">Login</van-button>
          <van-button size="small" type="primary" plain round @click="showSettings = true">⚙️</van-button>
        </van-space>
        <van-button class="mobile-menu-btn" icon="wap-nav" size="small" type="primary" plain round @click="showMobileMenu = true" />
      </template>
    </van-nav-bar>

    <!-- Mobile Menu -->
    <van-popup v-model:show="showMobileMenu" position="left" :style="{ width: '260px', height: '100%' }">
      <div class="mobile-menu">
        <div class="mobile-menu-header">
          <div class="logo">
            <div class="logo-circle">卡</div>
            <div class="logo-text">
              <div class="logo-title">Flashcard Kids</div>
              <div class="logo-sub">HSK3-4 • Chinese for kids</div>
            </div>
          </div>
          <van-button size="small" icon="close" @click="showMobileMenu = false" />
        </div>
        <div class="mobile-menu-links">
          <router-link to="/" @click.native="showMobileMenu = false">
            <van-button type="primary" block plain round>Home</van-button>
          </router-link>
          <router-link to="/learn" @click.native="showMobileMenu = false">
            <van-button type="success" block plain round>Learn</van-button>
          </router-link>
          <router-link to="/game" @click.native="showMobileMenu = false">
            <van-button type="warning" block plain round>Games</van-button>
          </router-link>
          <router-link to="/bookmarks" @click.native="showMobileMenu = false">
            <van-button type="primary" block plain round>Bookmarks</van-button>
          </router-link>
        </div>
        <div class="mobile-menu-auth">
          <template v-if="userStore.user">
            <div class="user-chip">
              <div class="user-meta">
                <span class="user-name">{{ userStore.user?.name }}</span>
                <span class="user-streak" v-if="userStore.streak">🔥 {{ userStore.streak.current }} streak</span>
              </div>
              <van-button size="small" type="danger" plain round @click="handleLogout">Logout</van-button>
            </div>
          </template>
          <template v-else>
            <van-button type="primary" block round @click="openLogin">Login</van-button>
          </template>
          <van-button type="default" block round @click="showSettings = true">Settings</van-button>
        </div>
      </div>
    </van-popup>

    <!-- Login Popup -->
    <van-popup v-model:show="showLogin" position="bottom" :style="{ height: 'auto' }">
      <div class="login-panel">
        <div class="login-header">
          <h3>Login</h3>
          <van-button size="small" icon="close" @click="showLogin = false" />
        </div>
        <div class="login-form">
          <van-field v-model="username" label="Email" placeholder="demo@example.com" clearable />
          <van-field v-model="password" type="password" label="Password" placeholder="••••••" />
          <van-button type="primary" block round :loading="userStore.loading" @click="handleLoginSubmit">
            Login
          </van-button>
          <div class="login-hint">Use any email/password. Mock login returns demo user.</div>
          <div v-if="userStore.error" class="login-error">{{ userStore.error }}</div>
        </div>
      </div>
    </van-popup>

    <!-- Settings Popup -->
    <van-popup v-model:show="showSettings" position="right" :style="{ width: '300px', height: '100%' }">
      <div class="settings-panel">
        <div class="settings-header">
          <h3>Settings</h3>
          <van-button size="small" icon="close" @click="showSettings = false" />
        </div>
        
        <div class="settings-section">
          <div class="settings-label">Global Level Filter:</div>
          <van-space size="8" direction="vertical" style="width: 100%">
            <van-button 
              :type="settingsStore.globalLevel === null ? 'primary' : 'default'"
              size="small" block @click="settingsStore.setGlobalLevel(null)">
              All Levels
            </van-button>
            <van-button 
              :type="settingsStore.globalLevel === 'HSK3' ? 'primary' : 'default'"
              size="small" block @click="settingsStore.setGlobalLevel('HSK3')">
              HSK 3 Only
            </van-button>
            <van-button 
              :type="settingsStore.globalLevel === 'HSK4' ? 'primary' : 'default'"
              size="small" block @click="settingsStore.setGlobalLevel('HSK4')">
              HSK 4 Only
            </van-button>
          </van-space>
        </div>

        <div class="settings-section">
          <div class="settings-label">Audio:</div>
          <van-switch v-model="settingsStore.audioEnabled" />
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useUserStore } from '../stores/user'

export default defineComponent({
  setup() {
    const showSettings = ref(false)
    const showLogin = ref(false)
    const showMobileMenu = ref(false)
    const username = ref('demo@example.com')
    const password = ref('password')
    const settingsStore = useSettingsStore()
    const userStore = useUserStore()

    onMounted(async () => {
      settingsStore.loadSettings()
      userStore.loadSession()
      // Don't fetch profile here - let individual views handle it
      // Header just displays the data from the store
    })

    const openLogin = () => {
      showLogin.value = true
    }

    const handleLoginSubmit = async () => {
      try {
        await userStore.login(username.value, password.value)
        showLogin.value = false
        showMobileMenu.value = false
      } catch (e) {
        // error handled in store
      }
    }

    const handleLogout = async () => {
      await userStore.logout()
      showMobileMenu.value = false
    }

    return { showSettings, showLogin, showMobileMenu, settingsStore, userStore, username, password, openLogin, handleLoginSubmit, handleLogout }
  }
})
</script>

<style scoped>
.header {
  background: linear-gradient(90deg, #4f46e5, #ec4899);
  color: white;
  padding: 0.5rem 0.75rem;
  margin-bottom: 1.5rem;
  border-radius: 0 0 1.5rem 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-circle {
  width: 2.75rem;
  height: 2.75rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  font-weight: 800;
}

.logo-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.logo-title {
  font-size: 1.2rem;
  font-weight: 800;
  line-height: 1.1;
}

.logo-sub {
  font-size: 0.75rem;
  opacity: 0.9;
  line-height: 1.1;
}

.van-nav-bar {
  background: transparent;
  padding: 0;
}

.van-nav-bar__right {
  display: flex;
  align-items: center;
}

.nav-space a {
  display: inline-flex;
}

.mobile-menu-btn {
  display: none;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.14);
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
}

.user-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.user-name {
  font-weight: 700;
  color: #fff;
}

.user-streak {
  font-size: 0.8rem;
  color: #fef9c3;
}

.login-panel {
  padding: 1rem;
  border-radius: 1.5rem 1.5rem 0 0;
  background: #fff;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
}

.login-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.login-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #111827;
}

.login-form {
  display: grid;
  gap: 0.75rem;
}

.login-hint {
  font-size: 0.85rem;
  color: #6b7280;
  text-align: center;
}

.login-error {
  color: #dc2626;
  font-weight: 600;
  text-align: center;
}

.settings-panel {
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.settings-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #1f2937;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.settings-label {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .logo-title {
    font-size: 1.05rem;
  }
  .logo-sub {
    font-size: 0.7rem;
  }

  .hide-mobile {
    display: none;
  }

  .mobile-menu-btn {
    display: inline-flex;
  }
}

.mobile-menu {
  height: 100%;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.mobile-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mobile-menu-links {
  display: grid;
  gap: 0.5rem;
}

.mobile-menu-auth {
  margin-top: auto;
  display: grid;
  gap: 0.5rem;
}
</style>
