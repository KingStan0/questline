<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/Icon.vue'
import logoUrl from '@/assets/logo.svg'
import {
  chooseGamesFolder,
  openGamesFolder,
  pushToast,
  refreshGames,
  runningCount,
  state,
  stopAllSessions,
  updateSetting,
} from '@/store'
import type { Theme } from '@/types'
import {
  classNames,
  formatDateTime,
  formatNumber,
  formatRelativeTime,
  normalizePlatform,
} from '@/utils'

const themes: Array<{ id: Theme; label: string; icon: string; hint: string }> = [
  { id: 'dark', label: 'Dark', icon: 'moon', hint: 'Low light' },
  { id: 'light', label: 'Light', icon: 'sun', hint: 'Daylight' },
  { id: 'system', label: 'System', icon: 'monitor', hint: 'Match OS' },
]

const sourceLabel = computed(() => state.source || 'Bundled snapshot')

const updatedLabel = computed(() =>
  state.updatedAt ? formatRelativeTime(state.updatedAt) : 'Bundled with the app',
)

const updatedExact = computed(() =>
  state.updatedAt ? formatDateTime(state.updatedAt) : 'Unknown',
)

const platformLabel = computed(() =>
  normalizePlatform(state.appInfo?.platform || 'win32'),
)

async function setTheme(theme: Theme) {
  await updateSetting('theme', theme)
}

async function toggleStopOnQuit() {
  await updateSetting('stopGamesOnQuit', !state.settings.stopGamesOnQuit)
}

async function toggleAutoRefresh() {
  await updateSetting('autoRefresh', !state.settings.autoRefresh)
}

async function copyPath(path: string | undefined, label: string) {
  if (!path) return
  try {
    await navigator.clipboard.writeText(path)
    pushToast('info', `${label} copied`, path)
  } catch {
    pushToast('error', 'Could not copy', 'Clipboard access is unavailable.')
  }
}

async function openDataFolder() {
  const target = state.appInfo?.userData
  if (!target) return
  try {
    await window.questline.openPath(target)
  } catch (error) {
    pushToast('error', 'Could not open folder', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function revealRunner() {
  const target = state.appInfo?.runnerPath
  if (!target) return
  try {
    await window.questline.revealPath(target)
  } catch (error) {
    pushToast('error', 'Could not reveal runner', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function stopEverything() {
  await stopAllSessions()
}

async function syncCatalog() {
  await refreshGames(true)
}
</script>

<template>
  <div class="page settings-page">
    <header class="page-heading">
      <div>
        <span class="eyebrow">Preferences</span>
        <h1>Settings</h1>
        <p>Storage, appearance, catalog updates, and session behaviour. Changes save automatically.</p>
      </div>
      <span class="save-hint">
        <Icon name="shield" :size="13" />
        Stored locally
      </span>
    </header>

    <div class="settings-grid">
      <section class="panel setting-card">
        <div class="card-head">
          <span class="card-icon"><Icon name="sun" :size="17" /></span>
          <div>
            <h2>Appearance</h2>
            <p>Choose how Questline looks on this device.</p>
          </div>
        </div>

        <div class="theme-grid">
          <button
            v-for="theme in themes"
            :key="theme.id"
            :class="classNames('theme-card', state.settings.theme === theme.id && 'active')"
            type="button"
            @click="setTheme(theme.id)"
          >
            <span class="theme-icon"><Icon :name="theme.icon" :size="17" /></span>
            <span class="theme-copy">
              <strong>{{ theme.label }}</strong>
              <span>{{ theme.hint }}</span>
            </span>
            <span v-if="state.settings.theme === theme.id" class="theme-check">
              <Icon name="check" :size="12" />
            </span>
          </button>
        </div>
      </section>

      <section class="panel setting-card">
        <div class="card-head">
          <span class="card-icon"><Icon name="folder" :size="17" /></span>
          <div>
            <h2>Storage</h2>
            <p>Where Questline creates the lightweight game runners.</p>
          </div>
        </div>

        <div class="setting-block">
          <label class="setting-label">Games folder</label>
          <div class="path-row">
            <span class="mono-path" :title="state.settings.gamesDirectory">
              {{ state.settings.gamesDirectory }}
            </span>
            <button
              class="icon-btn path-copy"
              type="button"
              title="Copy path"
              @click="copyPath(state.settings.gamesDirectory, 'Games folder')"
            >
              <Icon name="copy" :size="14" />
            </button>
          </div>
          <div class="inline-actions">
            <button class="btn btn-secondary btn-sm" type="button" @click="chooseGamesFolder">
              <Icon name="folder" :size="13" />
              Change folder
            </button>
            <button class="btn btn-ghost btn-sm" type="button" @click="openGamesFolder">
              <Icon name="external" :size="13" />
              Open
            </button>
          </div>
        </div>

        <div class="setting-row">
          <div class="row-copy">
            <strong>Stop games when Questline quits</strong>
            <span>End every active runner before the window closes.</span>
          </div>
          <button
            :class="classNames('switch', state.settings.stopGamesOnQuit && 'on')"
            type="button"
            role="switch"
            :aria-checked="state.settings.stopGamesOnQuit"
            @click="toggleStopOnQuit"
          ></button>
        </div>
      </section>

      <section class="panel setting-card">
        <div class="card-head">
          <span class="card-icon"><Icon name="download" :size="17" /></span>
          <div>
            <h2>Game catalog</h2>
            <p>The list of games Discord can detect.</p>
          </div>
        </div>

        <div class="source-summary">
          <div class="source-stat">
            <strong class="mono">{{ formatNumber(state.games.length) }}</strong>
            <span>games indexed</span>
          </div>
          <div class="source-stat">
            <strong>{{ sourceLabel }}</strong>
            <span>current source</span>
          </div>
          <div class="source-stat">
            <strong>{{ updatedLabel }}</strong>
            <span>last refreshed</span>
          </div>
        </div>

        <div class="setting-row compact-row">
          <div class="row-copy">
            <strong>Refresh automatically</strong>
            <span>Sync in the background when the cached list gets old.</span>
          </div>
          <button
            :class="classNames('switch', state.settings.autoRefresh && 'on')"
            type="button"
            role="switch"
            :aria-checked="state.settings.autoRefresh"
            @click="toggleAutoRefresh"
          ></button>
        </div>

        <div class="catalog-actions">
          <button
            class="btn btn-secondary btn-sm"
            type="button"
            :disabled="state.refreshing"
            @click="syncCatalog"
          >
            <Icon name="refresh" :size="13" :class="{ spin: state.refreshing }" />
            {{ state.refreshing ? 'Syncing...' : 'Refresh now' }}
          </button>
          <span v-if="state.refreshMessage" class="refresh-note">{{ state.refreshMessage }}</span>
          <span v-else class="refresh-note">Last synced {{ updatedExact }}</span>
        </div>
      </section>

      <section class="panel setting-card">
        <div class="card-head">
          <span class="card-icon"><Icon name="activity" :size="17" /></span>
          <div>
            <h2>Sessions</h2>
            <p>Manage the runners that Discord currently sees.</p>
          </div>
        </div>

        <div class="session-stat-row">
          <div class="session-orb" :class="{ live: runningCount > 0 }">
            <Icon :name="runningCount > 0 ? 'activity' : 'pause'" :size="19" />
          </div>
          <div class="row-copy">
            <strong>
              {{ runningCount > 0 ? `${runningCount} active session${runningCount === 1 ? '' : 's'}` : 'No active sessions' }}
            </strong>
            <span>
              {{ runningCount > 0 ? 'Discord can see these games right now.' : 'Launch a game from the quest board to start one.' }}
            </span>
          </div>
          <button
            class="btn btn-danger btn-sm"
            type="button"
            :disabled="runningCount === 0"
            @click="stopEverything"
          >
            <Icon name="stop" :size="12" />
            Stop all
          </button>
        </div>

        <div class="setting-divider"></div>

        <div class="data-row">
          <div class="row-copy">
            <strong>Runner template</strong>
            <span class="mono-path small">{{ state.appInfo?.runnerPath || 'resources/runner.exe' }}</span>
          </div>
          <button class="icon-btn" type="button" title="Reveal runner" @click="revealRunner">
            <Icon name="external" :size="14" />
          </button>
        </div>

        <div class="data-row">
          <div class="row-copy">
            <strong>Data folder</strong>
            <span class="mono-path small">{{ state.appInfo?.userData || 'Loading...' }}</span>
          </div>
          <button class="icon-btn" type="button" title="Open data folder" @click="openDataFolder">
            <Icon name="folder" :size="14" />
          </button>
        </div>
      </section>

      <section class="panel setting-card about-card">
        <div class="about-main">
          <div class="about-brand">
            <img :src="logoUrl" alt="" class="about-logo" />
            <div>
              <h2>Questline</h2>
              <span class="about-version">Version {{ state.appInfo?.version || '1.0.0' }} · {{ platformLabel }}</span>
            </div>
          </div>
          <p class="about-copy">
            An independent desktop companion for Discord quests. Questline prepares a named
            process so Discord's own detection can see an activity — it never touches your Discord
            account, tokens, or quest data.
          </p>
          <div class="about-tags">
            <span class="pill"><Icon name="shield" :size="12" /> No account access</span>
            <span class="pill"><Icon name="folder" :size="12" /> Local files only</span>
            <span class="pill"><Icon name="key" :size="12" /> MIT licensed</span>
          </div>
        </div>

        <div class="about-side">
          <div class="about-section">
            <span class="about-label">Credits</span>
            <p>
              Built and maintained by
              <a
                href="https://github.com/ibrahimarchive"
                target="_blank"
                rel="noreferrer"
              >
                Ibrahim Chowdhury
              </a>
              . Questline is not affiliated with Discord Inc.
            </p>
          </div>
          <div class="about-section">
            <span class="about-label">Disclaimer</span>
            <p>
              Use at your own risk. Automated game detection may conflict with Discord's Terms of
              Service. Quest credit is always decided by Discord.
            </p>
          </div>
          <div class="about-links">
            <a href="https://discord.com/terms" target="_blank" rel="noreferrer">
              Discord Terms
              <Icon name="external" :size="11" />
            </a>
            <a
              href="https://github.com/ibrahimarchive/questline"
              target="_blank"
              rel="noreferrer"
            >
              GitHub repository
              <Icon name="external" :size="11" />
            </a>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
  padding-bottom: 10px;
}

.save-hint {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 99px;
  color: var(--text-faint);
  background: var(--panel);
  font-size: 11.5px;
  font-weight: 600;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  align-items: start;
}

.setting-card {
  padding: 22px;
}

.card-head {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  margin-bottom: 18px;
}

.card-icon {
  display: grid;
  width: 35px;
  height: 35px;
  flex: none;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 11px;
  color: var(--accent-strong);
  background:
    linear-gradient(145deg, rgba(124, 108, 255, 0.14), transparent 70%),
    var(--panel-raised);
}

.card-head h2 {
  font-size: 14.5px;
  font-weight: 680;
  letter-spacing: -0.025em;
}

.card-head p {
  margin-top: 3px;
  color: var(--text-faint);
  font-size: 12.5px;
  line-height: 1.5;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.theme-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px;
  border: 1px solid var(--line);
  border-radius: 12px;
  text-align: left;
  background: var(--panel-raised);
  transition: 0.16s ease;
}

.theme-card:hover {
  border-color: var(--line-strong);
  background: var(--panel-hover);
}

.theme-card.active {
  border-color: rgba(124, 108, 255, 0.42);
  background:
    linear-gradient(135deg, rgba(124, 108, 255, 0.16), transparent 80%),
    var(--panel-raised);
  box-shadow: 0 0 0 3px var(--accent-softer);
}

.theme-icon {
  display: grid;
  width: 29px;
  height: 29px;
  flex: none;
  place-items: center;
  border-radius: 8px;
  color: var(--text-muted);
  background: var(--panel);
}

.theme-card.active .theme-icon {
  color: var(--accent-strong);
  background: var(--accent-soft);
}

.theme-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  line-height: 1.22;
}

.theme-copy strong {
  color: var(--text-soft);
  font-size: 12.5px;
  font-weight: 650;
}

.theme-copy span {
  margin-top: 1px;
  color: var(--text-faint);
  font-size: 11px;
}

.theme-check {
  position: absolute;
  top: 5px;
  right: 5px;
  display: grid;
  width: 16px;
  height: 16px;
  place-items: center;
  border-radius: 99px;
  color: #fff;
  background: var(--accent);
}

.setting-block {
  padding-bottom: 3px;
}

.setting-label {
  display: block;
  margin-bottom: 7px;
  color: var(--text-faint);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.path-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.path-row .mono-path {
  flex: 1;
  min-width: 0;
}

.path-copy {
  flex: none;
  border-color: var(--line);
}

.inline-actions {
  display: flex;
  gap: 6px;
  margin-top: 9px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid var(--line);
}

.row-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.row-copy strong {
  color: var(--text-soft);
  font-size: 13px;
  font-weight: 650;
}

.row-copy span {
  color: var(--text-faint);
  font-size: 12px;
  line-height: 1.5;
}

.source-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
}

.source-stat {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
  padding: 10px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: var(--panel-raised);
}

.source-stat strong {
  overflow: hidden;
  color: var(--text-soft);
  font-size: 12.5px;
  font-weight: 650;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.source-stat .mono {
  font-size: 15px;
  letter-spacing: -0.03em;
}

.source-stat span {
  color: var(--text-faint);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.compact-row {
  padding-top: 14px;
  margin-top: 14px;
}

.catalog-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid var(--line);
}

.refresh-note {
  color: var(--text-faint);
  font-size: 11.5px;
}

.session-stat-row {
  display: flex;
  align-items: center;
  gap: 11px;
}

.session-orb {
  display: grid;
  width: 40px;
  height: 40px;
  flex: none;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 12px;
  color: var(--text-faint);
  background: var(--panel-raised);
}

.session-orb.live {
  color: var(--green);
  border-color: rgba(61, 220, 151, 0.2);
  background: var(--green-soft);
  box-shadow: 0 0 22px rgba(61, 220, 151, 0.12);
}

.setting-divider {
  height: 1px;
  margin: 16px 0;
  background: var(--line);
}

.data-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
}

.data-row .mono-path {
  padding: 0;
  border: 0;
  background: transparent;
  font-size: 11px;
}

.small {
  margin-top: 2px;
}

.about-card {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
  gap: 28px;
  padding: 24px;
  overflow: hidden;
  background:
    radial-gradient(500px 220px at 0% -10%, rgba(124, 108, 255, 0.1), transparent 70%),
    var(--panel);
}

.about-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.about-logo {
  width: 43px;
  height: 43px;
  border-radius: 12px;
  box-shadow: 0 8px 22px rgba(108, 92, 231, 0.24);
}

.about-brand h2 {
  font-size: 18px;
  font-weight: 720;
  letter-spacing: -0.035em;
}

.about-version {
  display: block;
  margin-top: 2px;
  color: var(--text-faint);
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.about-copy {
  max-width: 590px;
  margin-top: 14px;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.65;
}

.about-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 15px;
}

.about-side {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 26px;
  border-left: 1px solid var(--line);
}

.about-label {
  display: block;
  margin-bottom: 4px;
  color: var(--text-faint);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.about-section p {
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.55;
}

.about-section a {
  color: var(--accent-strong);
  font-weight: 600;
}

.about-section a:hover {
  text-decoration: underline;
}

.about-links {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  padding-top: 4px;
}

.about-links a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--text-faint);
  font-size: 11.5px;
  font-weight: 600;
}

.about-links a:hover {
  color: var(--text-soft);
}

@media (max-width: 1060px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }

  .about-card {
    grid-template-columns: 1fr;
  }

  .about-side {
    padding-left: 0;
    border-left: 0;
    border-top: 1px solid var(--line);
    padding-top: 16px;
  }
}

@media (max-width: 760px) {
  .theme-grid {
    grid-template-columns: 1fr;
  }

  .source-summary {
    grid-template-columns: 1fr;
  }

  .session-stat-row {
    flex-wrap: wrap;
  }
}
</style>
