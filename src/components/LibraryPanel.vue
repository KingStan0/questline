<script setup lang="ts">
import { computed } from 'vue'
import GameArt from './GameArt.vue'
import Icon from './Icon.vue'
import {
  addToLibrary,
  gameIsRunning,
  gameSession,
  libraryGames,
  openGamesFolder,
  pushToast,
  removeFromLibrary,
  selectGame,
  state,
  suggestedGames,
} from '@/store'
import type { Game } from '@/types'
import { classNames, elapsedFormat, formatNumber } from '@/utils'

const games = libraryGames

const selectedId = computed(() => state.selectedId)

function focusSearch() {
  window.dispatchEvent(new CustomEvent('questline:focus-search'))
  document.querySelector('.search-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function choose(game: Game) {
  addToLibrary(game)
}

function isRunning(game: Game) {
  return gameIsRunning(game.id)
}

function statusLabel(game: Game) {
  if (isRunning(game)) {
    const session = gameSession(game.id)
    return session ? elapsedFormat(session.startedAt, state.now) : 'Live'
  }
  const rows = state.inspect[game.id]
  if (rows && Object.values(rows).some((entry) => entry.installed)) return 'Ready'
  return 'New'
}

function executableCount(game: Game) {
  return game.executables.filter((exe) => exe.os === 'win32').length || game.executables.length
}

async function remove(game: Game) {
  if (isRunning(game)) {
    pushToast('warning', 'Session is running', 'Stop the game before removing it.')
    return
  }
  removeFromLibrary(game)
}
</script>

<template>
  <section class="panel library-panel">
    <div class="panel-head">
      <div class="panel-title">
        Your library
        <span class="count">{{ games.length }}</span>
        <span v-if="state.inspecting" class="inspecting"><Icon name="refresh" :size="11" class="spin" /></span>
      </div>
      <div class="head-actions">
        <button class="icon-btn" type="button" title="Open games folder" @click="openGamesFolder">
          <Icon name="folder" :size="15" />
        </button>
        <button class="btn btn-secondary btn-sm" type="button" @click="focusSearch">
          <Icon name="plus" :size="13" />
          Add game
        </button>
      </div>
    </div>

    <div v-if="games.length" class="library-list scroll-area">
      <div
        v-for="game in games"
        :key="game.id"
        :class="classNames('game-row', selectedId === game.id && 'selected')"
        role="button"
        tabindex="0"
        @click="selectGame(game.id)"
        @keydown.enter="selectGame(game.id)"
        @keydown.space.prevent="selectGame(game.id)"
      >
        <GameArt :game="game" :size="46" :radius="13" />
        <div class="row-copy">
          <div class="row-title">
            <span class="truncate">{{ game.name }}</span>
            <Icon name="verified" :size="13" class="verified" />
          </div>
          <div class="row-meta">
            <span class="mono">{{ game.id }}</span>
            <span class="meta-dot"></span>
            <span>{{ executableCount(game) }} exe{{ executableCount(game) === 1 ? '' : 's' }}</span>
            <span v-if="game.aliases.length" class="meta-dot"></span>
            <span v-if="game.aliases.length" class="truncate alias">{{ game.aliases[0] }}</span>
          </div>
        </div>
        <div class="row-status">
          <span :class="classNames('row-state', isRunning(game) ? 'live' : 'ready')">
            <span v-if="isRunning(game)" class="dot pulse"></span>
            <span v-else class="state-dot"></span>
            {{ statusLabel(game) }}
          </span>
          <button
            class="remove-button"
            type="button"
            title="Remove from library"
            @click.stop="remove(game)"
          >
            <Icon name="x" :size="13" />
          </button>
          <Icon name="chevron" :size="14" class="row-chevron" />
        </div>
      </div>
    </div>

    <div v-else class="library-empty">
      <div class="empty-orbit">
        <span class="empty-ring"></span>
        <span class="empty-core"><Icon name="gamepad" :size="24" /></span>
        <span class="empty-star one"><Icon name="sparkles" :size="11" /></span>
        <span class="empty-star two"><Icon name="sparkles" :size="8" /></span>
      </div>
      <h3>Your quest shelf is empty</h3>
      <p>
        Add a Discord-verified game. Questline creates a tiny runner with the game's executable
        name, so Discord detects it without the full install.
      </p>
      <button class="btn btn-primary" type="button" @click="focusSearch">
        <Icon name="search" :size="15" />
        Find a game
      </button>

      <div class="empty-suggestions">
        <span class="suggestions-label">Popular picks</span>
        <div class="suggestion-chips">
          <button
            v-for="game in suggestedGames"
            :key="game.id"
            class="chip"
            type="button"
            @click="choose(game)"
          >
            <GameArt :game="game" :size="18" :radius="5" />
            {{ game.name }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="games.length" class="library-foot">
      <button class="foot-path" type="button" title="Open games folder" @click="openGamesFolder">
        <Icon name="folder" :size="12" />
        <span class="truncate mono">{{ state.settings.gamesDirectory }}</span>
      </button>
      <span class="foot-count">{{ formatNumber(state.games.length) }} games indexed</span>
    </div>
  </section>
</template>

<style scoped>
.library-panel {
  display: flex;
  flex-direction: column;
  min-height: 540px;
  overflow: hidden;
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.inspecting {
  display: inline-flex;
  color: var(--text-faint);
}

.library-list {
  flex: 1;
  max-height: calc(100vh - 480px);
  min-height: 220px;
  padding: 0 10px 10px;
}

.game-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  margin-bottom: 3px;
  border: 1px solid transparent;
  border-radius: 14px;
  cursor: pointer;
  outline: none;
  transition: 0.16s ease;
}

.game-row:hover,
.game-row:focus-visible {
  border-color: var(--line);
  background: var(--panel-hover);
}

.game-row:focus-visible {
  outline: 2px solid var(--accent-strong);
  outline-offset: 2px;
}

.game-row.selected {
  border-color: rgba(124, 108, 255, 0.3);
  background:
    linear-gradient(90deg, rgba(124, 108, 255, 0.14), transparent 75%),
    var(--panel-raised);
  box-shadow:
    inset 2px 0 0 var(--accent),
    0 6px 20px rgba(0, 0, 0, 0.12);
}

.row-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 3px;
}

.row-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 5px;
  color: var(--text);
  font-size: 13.5px;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.row-title .verified {
  flex: none;
  color: var(--accent-blue);
}

.row-meta {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  color: var(--text-faint);
  font-size: 11.5px;
  white-space: nowrap;
}

.meta-dot {
  width: 2px;
  height: 2px;
  flex: none;
  border-radius: 99px;
  background: var(--text-faint);
}

.alias {
  max-width: 120px;
}

.row-status {
  display: flex;
  flex: none;
  align-items: center;
  gap: 5px;
}

.row-state {
  display: inline-flex;
  height: 23px;
  align-items: center;
  gap: 5px;
  padding: 0 8px;
  border: 1px solid var(--line);
  border-radius: 99px;
  color: var(--text-faint);
  background: var(--panel-raised);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
}

.row-state.live {
  color: var(--green);
  border-color: rgba(61, 220, 151, 0.18);
  background: var(--green-soft);
}

.state-dot {
  width: 4px;
  height: 4px;
  border-radius: 99px;
  background: var(--text-faint);
}

.row-state.ready .state-dot {
  background: var(--accent);
}

.remove-button {
  display: grid;
  width: 23px;
  height: 23px;
  place-items: center;
  border-radius: 6px;
  color: var(--text-faint);
  opacity: 0;
  transition: 0.15s ease;
}

.game-row:hover .remove-button,
.game-row:focus-visible .remove-button {
  opacity: 1;
}

.remove-button:hover {
  color: var(--red);
  background: var(--red-soft);
}

.row-chevron {
  color: var(--text-faint);
  opacity: 0.5;
}

.game-row.selected .row-chevron {
  color: var(--accent-strong);
  opacity: 1;
}

.library-empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 30px 34px;
  text-align: center;
}

.empty-orbit {
  position: relative;
  display: grid;
  width: 92px;
  height: 92px;
  place-items: center;
  margin-bottom: 18px;
}

.empty-ring {
  position: absolute;
  inset: 4px;
  border: 1px dashed var(--line-strong);
  border-radius: 99px;
}

.empty-core {
  display: grid;
  width: 50px;
  height: 50px;
  place-items: center;
  border: 1px solid rgba(124, 108, 255, 0.2);
  border-radius: 16px;
  color: var(--accent-strong);
  background:
    radial-gradient(circle at 30% 20%, rgba(124, 108, 255, 0.3), transparent 72%),
    var(--panel-raised);
  box-shadow: 0 0 30px rgba(124, 108, 255, 0.15);
}

.empty-star {
  position: absolute;
  color: var(--accent-blue);
}

.empty-star.one {
  top: 10px;
  right: 11px;
}

.empty-star.two {
  bottom: 12px;
  left: 9px;
  opacity: 0.6;
}

.library-empty h3 {
  margin-bottom: 6px;
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.library-empty p {
  max-width: 370px;
  margin-bottom: 18px;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.6;
}

.empty-suggestions {
  width: 100%;
  max-width: 430px;
  padding-top: 20px;
  margin-top: 22px;
  border-top: 1px solid var(--line);
}

.suggestions-label {
  display: block;
  margin-bottom: 10px;
  color: var(--text-faint);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.chip {
  height: 30px;
  padding: 0 10px 0 6px;
}

.library-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px;
  border-top: 1px solid var(--line);
  background: var(--accent-softer);
}

.foot-path {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 6px;
  color: var(--text-faint);
  font-size: 11px;
  text-align: left;
}

.foot-path:hover {
  color: var(--text-muted);
}

.foot-count {
  flex: none;
  color: var(--text-faint);
  font-size: 11px;
}
</style>
