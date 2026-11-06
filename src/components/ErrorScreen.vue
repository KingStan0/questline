<script setup lang="ts">
import { ref } from 'vue'
import Icon from './Icon.vue'
import { initialize, state } from '@/store'

const retrying = ref(false)

async function retry() {
  if (retrying.value) return
  retrying.value = true
  await initialize(true)
  retrying.value = false
}

function quit() {
  window.close()
}
</script>

<template>
  <div class="error-screen">
    <div class="error-card">
      <span class="error-icon"><Icon name="alert" :size="26" /></span>
      <span class="eyebrow">Startup problem</span>
      <h1>Questline could not start</h1>
      <p class="error-message">{{ state.fatalError || 'An unknown error interrupted startup.' }}</p>

      <div class="error-hints">
        <strong>Try this</strong>
        <ul>
          <li>Close any other Questline window and open the app again.</li>
          <li>Make sure the <span class="mono">resources</span> folder is next to the app.</li>
          <li>Run <span class="mono">npm install</span> and start the app from its project folder.</li>
        </ul>
      </div>

      <div class="error-actions">
        <button class="btn btn-primary" type="button" :disabled="retrying" @click="retry">
          <Icon name="refresh" :size="15" :class="{ spin: retrying }" />
          {{ retrying ? 'Retrying...' : 'Try again' }}
        </button>
        <button class="btn btn-secondary" type="button" @click="quit">Close app</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-screen {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: grid;
  place-items: center;
  padding: 30px;
  background:
    radial-gradient(620px 420px at 50% 22%, rgba(255, 99, 116, 0.1), transparent 70%),
    var(--bg);
}

.error-card {
  position: relative;
  width: min(520px, 100%);
  padding: 30px;
  border: 1px solid rgba(255, 99, 116, 0.2);
  border-radius: 22px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.035), transparent 45%),
    var(--panel-solid);
  box-shadow: var(--shadow);
}

.error-icon {
  display: grid;
  width: 54px;
  height: 54px;
  margin-bottom: 18px;
  place-items: center;
  border: 1px solid rgba(255, 99, 116, 0.22);
  border-radius: 16px;
  color: var(--red);
  background: var(--red-soft);
}

.error-card h1 {
  margin-top: 8px;
  font-size: 25px;
  font-weight: 720;
  letter-spacing: -0.04em;
}

.error-message {
  padding: 13px;
  margin-top: 14px;
  border: 1px solid var(--line);
  border-radius: 11px;
  color: var(--text-soft);
  background: var(--bg-soft);
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.6;
  word-break: break-word;
}

.error-hints {
  margin-top: 18px;
}

.error-hints strong {
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.error-hints ul {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 8px;
}

.error-hints li {
  position: relative;
  padding-left: 14px;
  color: var(--text-muted);
  font-size: 12.5px;
  line-height: 1.55;
}

.error-hints li::before {
  content: "";
  position: absolute;
  top: 7px;
  left: 2px;
  width: 3px;
  height: 3px;
  border-radius: 99px;
  background: var(--text-faint);
}

.error-actions {
  display: flex;
  gap: 8px;
  margin-top: 24px;
}
</style>
