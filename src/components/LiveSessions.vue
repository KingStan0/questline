<script setup lang="ts">
import { computed } from 'vue'
import GameArt from './GameArt.vue'
import Icon from './Icon.vue'
import {
  elapsedFor,
  libraryGameFor,
  state,
  stopAllSessions,
  stopSession,
} from '@/store'
import type { Session } from '@/types'
import { formatDuration } from '@/utils'

withDefaults(
  defineProps<{
    compact?: boolean
  }>(),
  { compact: false },
)

const sessions = computed(() =>
  state.sessions.map((session) => ({
    session,
    game: libraryGameFor(session.gameId),
  })),
)

const stoppingKey = computed(() => state.busyKey)

async function stop(session: Session) {
  await stopSession(session)
}

async function stopAll() {
  await stopAllSessions()
}
</script>

<template>
  <section class="panel live-panel" :class="{ compact }">
    <div class="panel-head live-head">
      <div class="panel-title">
        <span class="live-beacon"><span class="dot pulse"></span></span>
        Live sessions
        <span class="count">{{ sessions.length }}</span>
      </div>
      <button
        v-if="sessions.length > 1"
        class="btn btn-secondary btn-sm"
        type="button"
        :disabled="stoppingKey === 'all'"
        @click="stopAll"
      >
        <Icon name="stop" :size="12" />
        Stop all
      </button>
    </div>

    <div v-if="sessions.length" class="live-grid">
      <article
        v-for="entry in sessions"
        :key="entry.session.key"
        class="session-card"
      >
        <GameArt
          v-if="entry.game"
          :game="entry.game"
          :size="compact ? 34 : 42"
          :radius="compact ? 10 : 12"
          glow
        />
        <div v-else class="session-fallback">
          <Icon name="gamepad" :size="compact ? 16 : 19" />
        </div>

        <div class="session-copy">
          <strong class="truncate">
            {{ entry.game?.name || entry.session.gameName || 'Game session' }}
          </strong>
          <span class="session-exe truncate mono">{{ entry.session.executableName }}</span>
        </div>

        <div class="session-time">
          <span class="mono">{{ formatDuration(elapsedFor(entry.session)) }}</span>
          <span>elapsed</span>
        </div>

        <button
          class="btn btn-sm btn-danger session-stop"
          type="button"
          :disabled="stoppingKey === `${entry.session.gameId}::${entry.session.executableName}`"
          @click="stop(entry.session)"
        >
          <Icon
            :name="stoppingKey === `${entry.session.gameId}::${entry.session.executableName}` ? 'refresh' : 'stop'"
            :size="12"
            :class="{ spin: stoppingKey === `${entry.session.gameId}::${entry.session.executableName}` }"
          />
          Stop
        </button>
      </article>
    </div>

    <div v-else class="live-empty">
      <span class="live-empty-icon"><Icon name="activity" :size="17" /></span>
      <div>
        <strong>No sessions right now</strong>
        <span>Launch a game from your library and it will appear here.</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.live-panel {
  margin-bottom: 20px;
  overflow: hidden;
  border-color: rgba(61, 220, 151, 0.14);
  background:
    radial-gradient(600px 200px at 88% -30%, rgba(61, 220, 151, 0.07), transparent 70%),
    var(--panel);
}

.live-panel.compact {
  margin-bottom: 0;
}

.live-head {
  padding-bottom: 12px;
}

.live-beacon {
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  border-radius: 7px;
  background: var(--green-soft);
}

.live-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 9px;
  padding: 0 16px 16px;
}

.session-card {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px;
  border: 1px solid rgba(61, 220, 151, 0.14);
  border-radius: 14px;
  background:
    linear-gradient(120deg, rgba(61, 220, 151, 0.06), transparent 55%),
    var(--panel-raised);
}

.session-fallback {
  display: grid;
  width: 42px;
  height: 42px;
  flex: none;
  place-items: center;
  border-radius: 12px;
  color: var(--green);
  background: var(--green-soft);
}

.session-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.session-copy strong {
  color: var(--text);
  font-size: 13px;
  font-weight: 650;
}

.session-exe {
  color: var(--text-faint);
  font-size: 11px;
}

.session-time {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}

.session-time .mono {
  color: var(--green);
  font-size: 13px;
  font-weight: 650;
}

.session-time span:last-child {
  color: var(--text-faint);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.session-stop {
  min-height: 29px;
  flex: none;
  padding: 0 9px;
}

.live-empty {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 4px 24px 20px;
}

.live-empty-icon {
  display: grid;
  width: 36px;
  height: 36px;
  flex: none;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 11px;
  color: var(--text-faint);
  background: var(--panel-raised);
}

.live-empty strong {
  display: block;
  color: var(--text-soft);
  font-size: 13px;
  font-weight: 650;
}

.live-empty span {
  color: var(--text-faint);
  font-size: 12px;
}

.compact .live-grid {
  grid-template-columns: 1fr;
  padding: 0 12px 12px;
}

.compact .session-card {
  padding: 8px;
}
</style>
