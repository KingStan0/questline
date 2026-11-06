<script setup lang="ts">
import { computed, ref } from 'vue'
import GameArt from '@/components/GameArt.vue'
import Icon from '@/components/Icon.vue'
import LiveSessions from '@/components/LiveSessions.vue'
import {
  clearLogs,
  libraryGameFor,
  refreshGames,
  runningCount,
  state,
  stopAllSessions,
} from '@/store'
import type { LogType } from '@/types'
import {
  classNames,
  formatDateTime,
  formatNumber,
  formatRelativeTime,
} from '@/utils'

type Filter = 'all' | LogType

const filters: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'success', label: 'Success' },
  { id: 'info', label: 'Info' },
  { id: 'warning', label: 'Warnings' },
  { id: 'error', label: 'Errors' },
]

const activeFilter = ref<Filter>('all')

const counts = computed(() => {
  const result: Record<Filter, number> = {
    all: state.logs.length,
    success: 0,
    info: 0,
    warning: 0,
    error: 0,
  }
  for (const log of state.logs) result[log.type] += 1
  return result
})

const logs = computed(() =>
  (activeFilter.value === 'all'
    ? state.logs
    : state.logs.filter((entry) => entry.type === activeFilter.value)
  ).map((entry) => ({
    ...entry,
    game: entry.gameId ? libraryGameFor(entry.gameId) : null,
  })),
)

const sessionSummary = computed(() =>
  runningCount.value > 0
    ? `${runningCount.value} session${runningCount.value === 1 ? '' : 's'} active`
    : 'No active sessions',
)

function logIcon(type: LogType) {
  if (type === 'success') return 'check'
  if (type === 'warning' || type === 'error') return 'alert'
  return 'info'
}

async function syncGames() {
  await refreshGames(true)
}

async function stopEverything() {
  await stopAllSessions()
}
</script>

<template>
  <div class="page activity-page">
    <header class="page-heading activity-heading">
      <div>
        <span class="eyebrow">Workspace history</span>
        <h1>Activity</h1>
        <p>Every launch, stop, catalog sync, and runner error is recorded locally.</p>
      </div>
      <div class="heading-actions">
        <button
          v-if="state.sessions.length"
          class="btn btn-danger"
          type="button"
          @click="stopEverything"
        >
          <Icon name="stop" :size="14" />
          Stop all sessions
        </button>
        <button
          class="btn btn-secondary"
          type="button"
          :disabled="!state.logs.length"
          @click="clearLogs"
        >
          <Icon name="trash" :size="14" />
          Clear log
        </button>
      </div>
    </header>

    <div class="summary-strip">
      <div class="summary-cell">
        <span class="summary-icon"><Icon name="activity" :size="15" /></span>
        <div>
          <strong>{{ sessionSummary }}</strong>
          <span>Session monitor</span>
        </div>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-cell">
        <span class="summary-icon"><Icon name="gamepad" :size="15" /></span>
        <div>
          <strong>{{ state.library.length }} games</strong>
          <span>In your library</span>
        </div>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-cell">
        <span class="summary-icon"><Icon name="download" :size="15" /></span>
        <div>
          <strong>{{ formatNumber(state.games.length) }} games</strong>
          <span>Catalog indexed</span>
        </div>
      </div>
      <div class="summary-divider"></div>
      <div class="summary-cell">
        <span class="summary-icon"><Icon name="clock" :size="15" /></span>
        <div>
          <strong>{{ state.logs.length }} entries</strong>
          <span>Local activity log</span>
        </div>
      </div>
    </div>

    <div class="activity-grid">
      <section class="panel log-panel">
        <div class="log-toolbar">
          <div class="filter-row">
            <button
              v-for="filter in filters"
              :key="filter.id"
              :class="classNames('filter-chip', activeFilter === filter.id && 'active')"
              type="button"
              @click="activeFilter = filter.id"
            >
              {{ filter.label }}
              <span class="filter-count">{{ counts[filter.id] }}</span>
            </button>
          </div>
          <span class="log-retention">Last 300 events</span>
        </div>

        <div v-if="logs.length" class="log-list scroll-area">
          <article v-for="log in logs" :key="log.id" class="log-row">
            <span :class="classNames('log-icon', log.type)">
              <Icon :name="logIcon(log.type)" :size="14" />
            </span>
            <div class="log-copy">
              <p>{{ log.message }}</p>
              <div class="log-meta">
                <span class="log-time">{{ formatDateTime(log.timestamp) }}</span>
                <span class="meta-dot"></span>
                <span>{{ formatRelativeTime(log.timestamp) }}</span>
                <template v-if="log.game">
                  <span class="meta-dot"></span>
                  <span class="log-game">
                    <GameArt :game="log.game" :size="13" :radius="4" />
                    {{ log.game.name }}
                  </span>
                </template>
              </div>
            </div>
            <span :class="classNames('log-tag', log.type)">{{ log.type }}</span>
          </article>
        </div>

        <div v-else class="log-empty">
          <span class="empty-icon"><Icon name="activity" :size="23" /></span>
          <h3>{{ state.logs.length ? 'Nothing in this filter' : 'The log is empty' }}</h3>
          <p>
            {{
              state.logs.length
                ? 'Try another filter to see the rest of your history.'
                : 'Launch a game or sync the catalog and events will show up here.'
            }}
          </p>
        </div>
      </section>

      <aside class="activity-aside">
        <LiveSessions compact />

        <section class="panel source-panel">
          <div class="panel-head">
            <div class="panel-title">
              <Icon name="discord" :size="15" />
              Game catalog
            </div>
            <span :class="classNames('pill', state.discordOnline ? 'green' : 'amber')">
              <span :class="classNames('status-dot', state.discordOnline ? 'online' : 'offline')"></span>
              {{ state.discordOnline ? 'Discord online' : 'Discord offline' }}
            </span>
          </div>

          <div class="source-body">
            <div class="source-row">
              <span>Source</span>
              <strong>{{ state.source || 'Bundled snapshot' }}</strong>
            </div>
            <div class="source-row">
              <span>Entries</span>
              <strong class="mono">{{ formatNumber(state.games.length) }}</strong>
            </div>
            <div class="source-row">
              <span>Updated</span>
              <strong>{{ state.updatedAt ? formatRelativeTime(state.updatedAt) : 'Bundled' }}</strong>
            </div>
            <div class="source-row">
              <span>Storage</span>
              <strong>{{ state.source === 'Bundled snapshot' ? 'Bundled' : 'Cached locally' }}</strong>
            </div>

            <button
              class="btn btn-secondary source-refresh"
              type="button"
              :disabled="state.refreshing"
              @click="syncGames"
            >
              <Icon
                name="refresh"
                :size="14"
                :class="{ spin: state.refreshing }"
              />
              {{ state.refreshing ? state.refreshMessage || 'Syncing...' : 'Refresh catalog' }}
            </button>
          </div>
        </section>

        <section class="panel notice-panel">
          <span class="notice-icon"><Icon name="info" :size="16" /></span>
          <div>
            <strong>Detection is Discord's job</strong>
            <p>
              Questline only starts a process that Discord recognizes. Whether a quest is credited,
              and how long it takes, is controlled entirely by Discord.
            </p>
          </div>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.activity-heading {
  margin-bottom: 20px;
}

.heading-actions {
  display: flex;
  flex: none;
  gap: 8px;
}

.summary-strip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  margin-bottom: 20px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--panel);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(20px);
}

.summary-cell {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 4px 10px;
}

.summary-icon {
  display: grid;
  width: 31px;
  height: 31px;
  flex: none;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 9px;
  color: var(--text-faint);
  background: var(--panel-raised);
}

.summary-cell strong {
  display: block;
  overflow: hidden;
  color: var(--text-soft);
  font-size: 13px;
  font-weight: 650;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.summary-cell span {
  color: var(--text-faint);
  font-size: 11.5px;
}

.summary-divider {
  width: 1px;
  height: 30px;
  flex: none;
  background: var(--line);
}

.activity-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.85fr);
  gap: 20px;
  align-items: start;
}

.log-panel {
  overflow: hidden;
}

.log-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 16px;
  border-bottom: 1px solid var(--line);
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 11px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  transition: 0.15s ease;
}

.filter-chip:hover {
  color: var(--text-soft);
  background: var(--panel-raised);
}

.filter-chip.active {
  color: var(--text);
  border-color: var(--line);
  background: var(--panel-raised);
  box-shadow: inset 0 0 0 1px var(--accent-softer);
}

.filter-count {
  display: inline-grid;
  min-width: 18px;
  height: 18px;
  place-items: center;
  padding: 0 4px;
  border-radius: 99px;
  color: var(--text-faint);
  background: var(--bg-soft);
  font-family: var(--font-mono);
  font-size: 11px;
}

.log-retention {
  flex: none;
  color: var(--text-faint);
  font-size: 11px;
}

.log-list {
  max-height: calc(100vh - 356px);
  min-height: 340px;
  padding: 4px 10px 10px;
}

.log-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 8px;
  border-bottom: 1px solid var(--line);
}

.log-row:last-child {
  border-bottom: 0;
}

.log-icon {
  display: grid;
  width: 29px;
  height: 29px;
  flex: none;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 9px;
  color: var(--text-muted);
  background: var(--panel-raised);
}

.log-icon.success {
  color: var(--green);
  border-color: rgba(61, 220, 151, 0.16);
  background: var(--green-soft);
}

.log-icon.warning {
  color: var(--amber);
  border-color: rgba(245, 184, 95, 0.16);
  background: var(--amber-soft);
}

.log-icon.error {
  color: var(--red);
  border-color: rgba(255, 99, 116, 0.16);
  background: var(--red-soft);
}

.log-copy {
  min-width: 0;
  flex: 1;
}

.log-copy p {
  color: var(--text-soft);
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}

.log-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  color: var(--text-faint);
  font-size: 11px;
}

.meta-dot {
  width: 2px;
  height: 2px;
  border-radius: 99px;
  background: var(--text-faint);
}

.log-game {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--text-muted);
  font-weight: 600;
}

.log-tag {
  flex: none;
  padding: 3px 7px;
  border: 1px solid var(--line);
  border-radius: 5px;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.log-tag.success {
  color: var(--green);
  border-color: rgba(61, 220, 151, 0.14);
}

.log-tag.warning {
  color: var(--amber);
  border-color: rgba(245, 184, 95, 0.14);
}

.log-tag.error {
  color: var(--red);
  border-color: rgba(255, 99, 116, 0.14);
}

.log-empty {
  display: flex;
  min-height: 380px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 28px;
  text-align: center;
}

.log-empty h3 {
  margin: 14px 0 5px;
  font-size: 14px;
  font-weight: 650;
}

.log-empty p {
  max-width: 310px;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.6;
}

.activity-aside {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.source-panel {
  overflow: hidden;
}

.source-panel .panel-head {
  padding-bottom: 10px;
}

.source-body {
  padding: 0 20px 16px;
}

.source-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid var(--line);
  font-size: 12px;
}

.source-row span {
  color: var(--text-faint);
}

.source-row strong {
  overflow: hidden;
  color: var(--text-soft);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.source-refresh {
  width: 100%;
  margin-top: 13px;
}

.notice-panel {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 15px 16px;
  border-color: rgba(79, 140, 255, 0.14);
  background:
    linear-gradient(120deg, rgba(79, 140, 255, 0.06), transparent 70%),
    var(--panel);
}

.notice-icon {
  display: grid;
  width: 30px;
  height: 30px;
  flex: none;
  place-items: center;
  border-radius: 9px;
  color: #7fb0ff;
  background: var(--blue-soft);
}

.notice-panel strong {
  display: block;
  margin-bottom: 3px;
  color: var(--text-soft);
  font-size: 12px;
  font-weight: 650;
}

.notice-panel p {
  color: var(--text-faint);
  font-size: 11.5px;
  line-height: 1.55;
}

@media (max-width: 1100px) {
  .activity-grid {
    grid-template-columns: 1fr;
  }

  .activity-aside {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: start;
  }

  .notice-panel {
    grid-column: 1 / -1;
  }

  .log-list {
    max-height: 460px;
  }
}

@media (max-width: 860px) {
  .activity-heading {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-strip {
    flex-wrap: wrap;
  }

  .summary-divider {
    display: none;
  }

  .summary-cell {
    flex-basis: 45%;
  }

  .activity-aside {
    grid-template-columns: 1fr;
  }
}
</style>
