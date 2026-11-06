<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import AppSidebar from '@/components/AppSidebar.vue'
import AppTopbar from '@/components/AppTopbar.vue'
import BootScreen from '@/components/BootScreen.vue'
import ErrorScreen from '@/components/ErrorScreen.vue'
import ToastStack from '@/components/ToastStack.vue'
import { closeSearch, initialize, setPage, state } from '@/store'
import ActivityView from '@/views/ActivityView.vue'
import BoardView from '@/views/BoardView.vue'
import SettingsView from '@/views/SettingsView.vue'

const view = computed(() => {
  if (state.page === 'activity') return ActivityView
  if (state.page === 'settings') return SettingsView
  return BoardView
})

function focusSearch() {
  setPage('board')
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent('questline:focus-search'))
  }, 70)
}

function handleKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null
  const typing = Boolean(
    target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable),
  )

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    focusSearch()
    return
  }

  if (!typing && event.key === '/') {
    event.preventDefault()
    focusSearch()
    return
  }

  if (!typing && !event.ctrlKey && !event.metaKey && !event.altKey) {
    if (event.key === '1') {
      setPage('board')
      return
    }
    if (event.key === '2') {
      setPage('activity')
      return
    }
    if (event.key === '3') {
      setPage('settings')
      return
    }
  }

  if (event.key === 'Escape') closeSearch()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  void initialize()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <BootScreen v-if="state.booting || (!state.ready && !state.fatalError)" />
  <ErrorScreen v-else-if="state.fatalError" />

  <div v-else class="app-shell">
    <AppSidebar />
    <div class="app-body">
      <AppTopbar />
      <main class="app-content">
        <Transition name="page" mode="out-in">
          <KeepAlive>
            <component :is="view" :key="state.page" />
          </KeepAlive>
        </Transition>
      </main>
    </div>
  </div>

  <ToastStack />
</template>
