<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'
import logoUrl from '@/assets/logo.svg'
import { state } from '@/store'

const steps = [
  'Reading your library...',
  'Indexing Discord games...',
  'Checking running sessions...',
]

const activeStep = computed(() => {
  const message = state.bootStep.toLowerCase()
  if (message.includes('index')) return 1
  if (message.includes('session') || message.includes('check')) return 2
  return 0
})
</script>

<template>
  <div class="boot-screen">
    <div class="boot-aura"></div>
    <div class="boot-grid"></div>

    <div class="boot-content">
      <div class="boot-mark-wrap">
        <span class="boot-ring ring-a"></span>
        <span class="boot-ring ring-b"></span>
        <img :src="logoUrl" alt="" class="boot-mark" />
      </div>

      <span class="boot-eyebrow">Discord quest companion</span>
      <h1>Questline</h1>
      <p class="boot-message">{{ state.bootStep }}</p>

      <div class="boot-progress">
        <span class="boot-progress-bar"></span>
      </div>

      <div class="boot-steps">
        <span
          v-for="(step, index) in steps"
          :key="step"
          class="boot-step"
          :class="{ active: index === activeStep, done: index < activeStep }"
        >
          <span class="boot-step-dot">
            <Icon v-if="index < activeStep" name="check" :size="9" />
          </span>
          {{ step }}
        </span>
      </div>
    </div>

    <div class="boot-foot">
      <span>Questline v{{ state.appInfo?.version || '1.0.0' }}</span>
      <span class="foot-dot"></span>
      <span>Local-first desktop app</span>
    </div>
  </div>
</template>

<style scoped>
.boot-screen {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: grid;
  place-items: center;
  overflow: hidden;
  color: var(--text);
  background:
    radial-gradient(720px 480px at 50% 20%, rgba(124, 108, 255, 0.16), transparent 70%),
    var(--bg);
}

.boot-aura {
  position: absolute;
  top: 14%;
  left: 50%;
  width: 420px;
  height: 420px;
  border-radius: 99px;
  background: radial-gradient(circle, rgba(124, 108, 255, 0.14), transparent 68%);
  transform: translateX(-50%);
  filter: blur(8px);
}

.boot-grid {
  position: absolute;
  inset: 0;
  opacity: 0.5;
  background:
    linear-gradient(rgba(255, 255, 255, 0.022) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.022) 1px, transparent 1px);
  background-size: 52px 52px;
  mask-image: radial-gradient(circle at 50% 40%, black, transparent 72%);
}

.boot-content {
  position: relative;
  z-index: 1;
  display: flex;
  max-width: 420px;
  flex-direction: column;
  align-items: center;
  padding: 32px;
  text-align: center;
}

.boot-mark-wrap {
  position: relative;
  display: grid;
  width: 132px;
  height: 132px;
  margin-bottom: 28px;
  place-items: center;
}

.boot-ring {
  position: absolute;
  border: 1px dashed rgba(124, 108, 255, 0.26);
  border-radius: 99px;
}

.ring-a {
  inset: 0;
  animation: boot-spin 22s linear infinite;
}

.ring-b {
  inset: 17px;
  border-style: solid;
  border-color: var(--line-strong);
}

.boot-mark {
  width: 66px;
  height: 66px;
  border-radius: 18px;
  box-shadow:
    0 18px 50px rgba(108, 92, 231, 0.36),
    0 0 0 1px rgba(255, 255, 255, 0.08);
}

@keyframes boot-spin {
  to {
    transform: rotate(360deg);
  }
}

.boot-eyebrow {
  color: var(--accent-strong);
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.boot-content h1 {
  margin-top: 8px;
  font-size: 36px;
  font-weight: 740;
  letter-spacing: -0.05em;
  line-height: 1;
}

.boot-message {
  margin-top: 10px;
  color: var(--text-muted);
  font-size: 13px;
}

.boot-progress {
  width: 260px;
  height: 3px;
  margin-top: 22px;
  overflow: hidden;
  border-radius: 99px;
  background: var(--panel-raised);
}

.boot-progress-bar {
  display: block;
  width: 42%;
  height: 100%;
  border-radius: 99px;
  background: linear-gradient(90deg, var(--accent), var(--accent-blue));
  box-shadow: 0 0 16px rgba(124, 108, 255, 0.6);
  animation: boot-progress 1.6s var(--ease) infinite;
}

@keyframes boot-progress {
  0% {
    transform: translateX(-110%);
  }
  100% {
    transform: translateX(360%);
  }
}

.boot-steps {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-top: 22px;
  text-align: left;
}

.boot-step {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-faint);
  font-size: 12px;
  transition: color 0.2s ease;
}

.boot-step-dot {
  display: grid;
  width: 13px;
  height: 13px;
  flex: none;
  place-items: center;
  border: 1px solid var(--line-strong);
  border-radius: 99px;
  color: #fff;
}

.boot-step.active {
  color: var(--text-soft);
}

.boot-step.active .boot-step-dot {
  border-color: rgba(124, 108, 255, 0.6);
  background: var(--accent-soft);
  box-shadow: 0 0 0 3px var(--accent-softer);
}

.boot-step.done {
  color: var(--text-muted);
}

.boot-step.done .boot-step-dot {
  border-color: transparent;
  background: var(--green);
}

.boot-foot {
  position: absolute;
  bottom: 22px;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--text-faint);
  font-size: 11px;
  transform: translateX(-50%);
}

.foot-dot {
  width: 2px;
  height: 2px;
  border-radius: 99px;
  background: var(--text-faint);
}
</style>
