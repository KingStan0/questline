<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'
import GameArt from './GameArt.vue'
import logoUrl from '@/assets/logo.svg'
import {
  elapsedFor,
  libraryGameFor,
  runningCount,
  setPage,
  state,
} from '@/store'
import { classNames, formatDuration } from '@/utils'

const navigation = [
  { id: 'board', label: 'Quest board', icon: 'grid' },
  { id: 'activity', label: 'Activity', icon: 'activity' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
] as const

const liveSessions = computed(() =>
  state.sessions.slice(0, 2).map((session) => ({
    ...session,
    game: libraryGameFor(session.gameId),
  })),
)

const version = computed(() => state.appInfo?.version || '1.0.0')

function navigate(page: (typeof navigation)[number]['id']) {
  setPage(page)
}

function openBoard() {
  setPage('board')
}
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <img class="brand-mark" :src="logoUrl" alt="" />
      <div class="brand-copy">
        <strong>Questline</strong>
        <span>Discord quest companion</span>
      </div>
    </div>

    <div class="nav-label">Workspace</div>
    <nav class="nav">
      <button
        v-for="item in navigation"
        :key="item.id"
        :class="classNames('nav-item', state.page === item.id && 'active')"
        type="button"
        @click="navigate(item.id)"
      >
        <span class="nav-icon"><Icon :name="item.icon" :size="18" /></span>
        <span>{{ item.label }}</span>
        <span v-if="item.id === 'board' && runningCount" class="nav-badge live">
          {{ runningCount }}
        </span>
        <span v-else-if="item.id === 'board' && state.library.length" class="nav-badge">
          {{ state.library.length }}
        </span>
      </button>
    </nav>

    <div class="sidebar-grow"></div>

    <button v-if="state.sessions.length" class="live-card" type="button" @click="openBoard">
      <div class="live-head">
        <span class="live-title"><span class="dot pulse"></span> Live now</span>
        <span class="live-total">{{ runningCount }} active</span>
      </div>
      <div
        v-for="session in liveSessions"
        :key="session.key"
        class="live-row"
      >
        <GameArt
          v-if="session.game"
          :game="session.game"
          :size="28"
          :radius="8"
        />
        <div v-else class="live-fallback"><Icon name="gamepad" :size="14" /></div>
        <div class="live-copy">
          <span class="truncate">{{ session.gameName || session.game?.name || 'Game session' }}</span>
          <span class="live-time mono">{{ formatDuration(elapsedFor(session)) }}</span>
        </div>
      </div>
      <div class="live-footer">
        Open quest board
        <Icon name="arrowRight" :size="13" />
      </div>
    </button>

    <button class="discord-card" type="button" @click="openBoard">
      <span :class="classNames('discord-orb', state.discordOnline && 'online')">
        <Icon name="discord" :size="17" />
      </span>
      <span class="discord-copy">
        <strong>{{ state.discordOnline ? 'Discord detected' : 'Discord not detected' }}</strong>
        <span>{{ state.discordOnline ? 'Ready to complete quests' : 'Open Discord before launching' }}</span>
      </span>
      <span :class="classNames('status-dot', state.discordOnline ? 'online' : 'offline')"></span>
    </button>

    <div class="sidebar-footer">
      <span>v{{ version }}</span>
      <span class="footer-dot"></span>
      <span>Local build</span>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  width: 248px;
  flex: none;
  flex-direction: column;
  min-height: 0;
  padding: 22px 14px 18px;
  border-right: 1px solid var(--line);
  background:
    linear-gradient(180deg, rgba(124, 108, 255, 0.045), transparent 32%),
    var(--sidebar);
  backdrop-filter: blur(24px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 2px 8px 0;
  margin-bottom: 30px;
}

.brand-mark {
  width: 38px;
  height: 38px;
  flex: none;
  border-radius: 11px;
  box-shadow: 0 8px 20px rgba(108, 92, 231, 0.24);
}

.brand-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  line-height: 1.22;
}

.brand-copy strong {
  font-size: 16px;
  font-weight: 720;
  letter-spacing: -0.035em;
}

.brand-copy span {
  margin-top: 3px;
  color: var(--text-faint);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.nav-label {
  padding: 0 11px;
  margin-bottom: 8px;
  color: var(--text-faint);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  height: 42px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 11px;
  color: var(--text-muted);
  font-size: 13.5px;
  font-weight: 600;
  text-align: left;
  transition: 0.16s ease;
}

.nav-item:hover {
  color: var(--text-soft);
  background: var(--accent-softer);
}

.nav-item.active {
  border-color: rgba(124, 108, 255, 0.16);
  color: var(--text);
  background:
    linear-gradient(90deg, rgba(124, 108, 255, 0.16), transparent 90%),
    var(--accent-softer);
  box-shadow: inset 2px 0 0 var(--accent);
}

.nav-icon {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border-radius: 8px;
  color: var(--text-faint);
  transition: 0.16s ease;
}

.nav-item.active .nav-icon,
.nav-item:hover .nav-icon {
  color: var(--accent-strong);
}

.nav-badge {
  min-width: 21px;
  height: 20px;
  padding: 0 6px;
  margin-left: auto;
  border: 1px solid var(--line);
  border-radius: 99px;
  color: var(--text-muted);
  background: var(--panel-raised);
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 18px;
  text-align: center;
}

.nav-badge.live {
  color: var(--green);
  border-color: rgba(61, 220, 151, 0.18);
  background: var(--green-soft);
}

.sidebar-grow {
  flex: 1;
  min-height: 18px;
}

.live-card {
  width: 100%;
  padding: 12px;
  margin-bottom: 10px;
  border: 1px solid rgba(61, 220, 151, 0.15);
  border-radius: 14px;
  text-align: left;
  background:
    radial-gradient(circle at 90% 0%, rgba(61, 220, 151, 0.08), transparent 60%),
    var(--panel);
  transition: 0.18s ease;
}

.live-card:hover {
  border-color: rgba(61, 220, 151, 0.28);
  transform: translateY(-1px);
}

.live-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.live-title {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--green);
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.live-total {
  color: var(--text-faint);
  font-size: 11px;
}

.live-row {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 7px;
}

.live-fallback {
  display: grid;
  width: 28px;
  height: 28px;
  flex: none;
  place-items: center;
  border-radius: 8px;
  color: var(--text-faint);
  background: var(--panel-raised);
}

.live-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--text-soft);
  font-size: 12px;
  font-weight: 600;
}

.live-time {
  color: var(--text-faint);
  font-size: 11px;
  font-weight: 500;
}

.live-footer {
  display: flex;
  align-items: center;
  gap: 5px;
  padding-top: 9px;
  margin-top: 10px;
  border-top: 1px solid var(--line);
  color: var(--text-faint);
  font-size: 11px;
  font-weight: 600;
}

.discord-card {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 9px;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 13px;
  text-align: left;
  background: var(--panel);
  transition: 0.16s ease;
}

.discord-card:hover {
  border-color: var(--line-strong);
  background: var(--panel-hover);
}

.discord-orb {
  display: grid;
  width: 30px;
  height: 30px;
  flex: none;
  place-items: center;
  border-radius: 9px;
  color: var(--text-faint);
  background: var(--panel-raised);
}

.discord-orb.online {
  color: #9a8fff;
  background: var(--accent-soft);
}

.discord-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  line-height: 1.25;
}

.discord-copy strong {
  color: var(--text-soft);
  font-size: 11.5px;
  font-weight: 650;
}

.discord-copy span {
  margin-top: 2px;
  overflow: hidden;
  color: var(--text-faint);
  font-size: 11px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.sidebar-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding-top: 14px;
  color: var(--text-faint);
  font-size: 11px;
  letter-spacing: 0.02em;
}

.footer-dot {
  width: 2px;
  height: 2px;
  border-radius: 99px;
  background: var(--text-faint);
}
</style>
