<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'
import { state, refreshGames } from '@/store'
import { classNames, formatNumber, formatRelativeTime } from '@/utils'

const pageLabel = computed(
  () =>
    ({
      board: 'Quest board',
      activity: 'Activity',
      settings: 'Settings',
    })[state.page],
)

const dataAge = computed(() => {
  if (state.source === 'Bundled snapshot') return 'bundled'
  return state.updatedAt ? formatRelativeTime(state.updatedAt) : 'local cache'
})

async function sync() {
  await refreshGames(true)
}
</script>

<template>
  <header class="titlebar">
    <div class="titlebar-left">
      <span class="brand-dot"></span>
      <span>Questline</span>
      <Icon name="chevron" :size="12" class="titlebar-separator" />
      <strong>{{ pageLabel }}</strong>
    </div>

    <div class="titlebar-right">
      <div class="data-pill" :title="`Game data: ${state.source}`">
        <Icon name="download" :size="13" />
        <span>{{ formatNumber(state.games.length) }} games</span>
        <span class="data-age">· {{ dataAge }}</span>
      </div>

      <div :class="classNames('discord-pill', state.discordOnline && 'online')">
        <span :class="classNames('status-dot', state.discordOnline ? 'online' : 'offline')"></span>
        <Icon name="discord" :size="14" />
        <span>{{ state.discordOnline ? 'Discord online' : 'Discord offline' }}</span>
      </div>

      <button
        class="btn btn-secondary btn-sm sync-button"
        type="button"
        :disabled="state.refreshing || !state.ready"
        @click="sync"
      >
        <Icon name="refresh" :size="14" :class="{ spin: state.refreshing }" />
        <span>{{ state.refreshing ? 'Syncing' : 'Sync games' }}</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.brand-dot {
  width: 6px;
  height: 6px;
  border-radius: 99px;
  background: linear-gradient(135deg, var(--accent), var(--accent-blue));
  box-shadow: 0 0 12px rgba(124, 108, 255, 0.7);
}

.titlebar-separator {
  color: var(--text-faint);
  transform: rotate(0deg);
}

.data-pill,
.discord-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 30px;
  padding: 0 11px;
  border: 1px solid var(--line);
  border-radius: 99px;
  color: var(--text-muted);
  background: var(--panel);
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
  backdrop-filter: blur(18px);
}

.data-pill {
  color: var(--text-soft);
}

.data-age {
  color: var(--text-faint);
  font-weight: 500;
}

.discord-pill.online {
  border-color: rgba(61, 220, 151, 0.16);
  color: var(--text-soft);
}

.discord-pill svg {
  color: var(--text-faint);
}

.discord-pill.online svg {
  color: #8f83ff;
}

.sync-button {
  height: 32px;
  min-height: 32px;
}

@media (max-width: 1080px) {
  .data-age {
    display: none;
  }
}
</style>
