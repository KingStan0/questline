<script setup lang="ts">
import { computed } from 'vue'
import GameDetail from '@/components/GameDetail.vue'
import Icon from '@/components/Icon.vue'
import LibraryPanel from '@/components/LibraryPanel.vue'
import LiveSessions from '@/components/LiveSessions.vue'
import SearchBox from '@/components/SearchBox.vue'
import { runningCount, state } from '@/store'
import { formatNumber } from '@/utils'

const stats = computed(() => [
  {
    label: 'Detectable games',
    value: formatNumber(state.games.length),
    icon: 'download',
  },
  {
    label: 'In your library',
    value: String(state.library.length),
    icon: 'gamepad',
  },
  {
    label: 'Live sessions',
    value: String(runningCount.value),
    icon: 'activity',
    live: runningCount.value > 0,
  },
])

const steps = [
  {
    number: '01',
    title: 'Add a game',
    body: 'Search the Discord detectable catalog and pin a title to your library.',
    icon: 'search',
  },
  {
    number: '02',
    title: 'Launch the runner',
    body: 'Questline writes a tiny executable named like the game and starts it for you.',
    icon: 'rocket',
  },
  {
    number: '03',
    title: 'Let Discord count it',
    body: 'Keep Discord open while the session runs. Quest progress is handled by Discord.',
    icon: 'discord',
  },
] as const
</script>

<template>
  <div class="page board-page">
    <section class="board-hero">
      <div class="hero-copy">
        <span class="eyebrow">
          <span class="eyebrow-dot"></span>
          Discord quest companion
        </span>
        <h1>Quest credit,<br /><span>without the download.</span></h1>
        <p>
          Pick any game Discord can detect. Questline prepares a lightweight session runner so you
          can earn quest progress without installing gigabytes of files.
        </p>
        <div class="hero-tags">
          <span class="pill"><Icon name="shield" :size="12" /> Local only</span>
          <span class="pill"><Icon name="download" :size="12" /> No real install</span>
          <span class="pill" :class="{ green: state.discordOnline }">
            <span class="status-dot" :class="state.discordOnline ? 'online' : 'offline'"></span>
            {{ state.discordOnline ? 'Discord detected' : 'Discord not detected' }}
          </span>
        </div>
      </div>

      <div class="hero-stats">
        <div class="stats-glow"></div>
        <div v-for="stat in stats" :key="stat.label" class="stat-row">
          <span class="stat-icon" :class="{ live: stat.live }">
            <Icon :name="stat.icon" :size="15" />
          </span>
          <span class="stat-copy">
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </span>
          <span v-if="stat.live" class="dot pulse stat-pulse"></span>
        </div>
        <div class="stats-foot">
          <span class="status-dot" :class="state.discordOnline ? 'online' : 'offline'"></span>
          {{ state.discordOnline ? 'Ready for a quest session' : 'Open Discord before launching' }}
        </div>
      </div>
    </section>

    <SearchBox />

    <LiveSessions v-if="state.sessions.length" />

    <div class="grid-two board-grid">
      <LibraryPanel />
      <section class="panel detail-panel">
        <GameDetail />
      </section>
    </div>

    <section class="steps-band">
      <div class="steps-intro">
        <span class="eyebrow">How it works</span>
        <h2>Three steps to a detected session</h2>
      </div>
      <div class="steps-grid">
        <article v-for="step in steps" :key="step.number" class="step-card">
          <div class="step-top">
            <span class="step-number mono">{{ step.number }}</span>
            <span class="step-icon"><Icon :name="step.icon" :size="16" /></span>
          </div>
          <h3>{{ step.title }}</h3>
          <p>{{ step.body }}</p>
        </article>
      </div>
    </section>

    <footer class="board-foot">
      <span>
        Questline is an unofficial companion app. Discord quests are completed through Discord's
        own game detection.
      </span>
      <span class="mono">Questline v{{ state.appInfo?.version || '1.0.0' }}</span>
    </footer>
  </div>
</template>

<style scoped>
.board-page {
  padding-top: 6px;
}

.board-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 250px;
  gap: 28px;
  align-items: stretch;
  padding: 23px 28px;
  margin-bottom: 18px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  background:
    radial-gradient(560px 240px at 88% -20%, rgba(124, 108, 255, 0.17), transparent 70%),
    radial-gradient(420px 200px at 0% 120%, rgba(79, 140, 255, 0.08), transparent 65%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.035), transparent 40%),
    var(--panel);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(22px);
}

.board-hero::after {
  content: "";
  position: absolute;
  top: -60px;
  right: 170px;
  width: 180px;
  height: 180px;
  border: 1px dashed rgba(124, 108, 255, 0.18);
  border-radius: 99px;
  pointer-events: none;
}

.hero-copy {
  position: relative;
  z-index: 1;
}

.eyebrow-dot {
  width: 6px;
  height: 6px;
  border-radius: 99px;
  background: linear-gradient(135deg, var(--accent), var(--accent-blue));
  box-shadow: 0 0 10px rgba(124, 108, 255, 0.8);
}

.hero-copy h1 {
  margin-top: 10px;
  font-size: clamp(30px, 3.3vw, 41px);
  font-weight: 740;
  letter-spacing: -0.045em;
  line-height: 0.99;
}

.hero-copy h1 span {
  color: var(--text-muted);
}

.hero-copy p {
  max-width: 555px;
  margin-top: 12px;
  color: var(--text-muted);
  font-size: 13.5px;
  line-height: 1.58;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 15px;
}

.hero-stats {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  padding: 14px;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 18px;
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.05), transparent 55%),
    var(--panel-raised);
}

.stats-glow {
  position: absolute;
  top: -50px;
  right: -30px;
  width: 120px;
  height: 120px;
  border-radius: 99px;
  background: radial-gradient(circle, rgba(124, 108, 255, 0.26), transparent 68%);
  pointer-events: none;
}

.stat-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 8px;
  border-bottom: 1px solid var(--line);
}

.stat-row:last-of-type {
  border-bottom: 0;
}

.stat-icon {
  display: grid;
  width: 30px;
  height: 30px;
  flex: none;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 9px;
  color: var(--text-faint);
  background: var(--panel);
}

.stat-icon.live {
  color: var(--green);
  border-color: rgba(61, 220, 151, 0.2);
  background: var(--green-soft);
}

.stat-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  line-height: 1.15;
}

.stat-value {
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 17px;
  font-weight: 650;
  letter-spacing: -0.03em;
}

.stat-label {
  margin-top: 2px;
  color: var(--text-faint);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.stat-pulse {
  margin-left: auto;
}

.stats-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 8px 2px;
  margin-top: 4px;
  border-top: 1px solid var(--line);
  color: var(--text-faint);
  font-size: 11.5px;
  font-weight: 500;
}

.board-grid {
  margin-top: 0;
}

.detail-panel {
  overflow: hidden;
  min-height: 540px;
}

.steps-band {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 22px;
  align-items: start;
  padding: 24px 28px;
  margin-top: 22px;
  border: 1px solid var(--line);
  border-radius: var(--radius-xl);
  background: var(--panel);
  box-shadow: var(--shadow-soft);
}

.steps-intro h2 {
  margin-top: 8px;
  font-size: 19px;
  font-weight: 680;
  letter-spacing: -0.03em;
  line-height: 1.22;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.step-card {
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--panel-raised);
}

.step-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 11px;
}

.step-number {
  color: var(--accent-strong);
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.step-icon {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 8px;
  color: var(--text-faint);
  background: var(--panel);
}

.step-card h3 {
  margin-bottom: 4px;
  color: var(--text-soft);
  font-size: 13.5px;
  font-weight: 650;
}

.step-card p {
  color: var(--text-faint);
  font-size: 12.5px;
  line-height: 1.55;
}

.board-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 6px 4px;
  color: var(--text-faint);
  font-size: 11.5px;
}

.board-foot span:first-child {
  max-width: 640px;
}

@media (max-width: 1160px) {
  .board-hero {
    grid-template-columns: minmax(0, 1fr) 225px;
    padding: 24px;
  }

  .steps-band {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 980px) {
  .board-hero {
    grid-template-columns: 1fr;
  }

  .hero-stats {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }

  .stat-row {
    flex: 1;
    min-width: 150px;
    border-bottom: 0;
  }

  .stats-foot {
    width: 100%;
    margin-top: 0;
  }

  .steps-grid {
    grid-template-columns: 1fr;
  }
}
</style>
