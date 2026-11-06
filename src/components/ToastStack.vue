<script setup lang="ts">
import Icon from './Icon.vue'
import { dismissToast, state } from '@/store'

function iconFor(type: 'success' | 'error' | 'info' | 'warning') {
  if (type === 'success') return 'check'
  if (type === 'error' || type === 'warning') return 'alert'
  return 'info'
}
</script>

<template>
  <div class="toast-stack" aria-live="polite">
    <TransitionGroup name="toast">
      <article
        v-for="toast in state.toasts"
        :key="toast.id"
        class="toast"
        :class="toast.type"
      >
        <span class="toast-icon">
          <Icon :name="iconFor(toast.type)" :size="15" />
        </span>
        <div class="toast-copy">
          <strong>{{ toast.title }}</strong>
          <p v-if="toast.message">{{ toast.message }}</p>
        </div>
        <button
          class="toast-close"
          type="button"
          aria-label="Dismiss notification"
          @click="dismissToast(toast.id)"
        >
          <Icon name="x" :size="12" />
        </button>
      </article>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  top: 64px;
  right: 18px;
  z-index: 200;
  display: flex;
  width: min(330px, calc(100vw - 36px));
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--line-strong);
  border-radius: 14px;
  background: var(--panel-solid);
  box-shadow: var(--shadow);
  pointer-events: auto;
}

.toast.success {
  border-color: rgba(61, 220, 151, 0.24);
}

.toast.error {
  border-color: rgba(255, 99, 116, 0.26);
}

.toast.warning {
  border-color: rgba(245, 184, 95, 0.26);
}

.toast-icon {
  display: grid;
  width: 29px;
  height: 29px;
  flex: none;
  place-items: center;
  border-radius: 9px;
  color: var(--accent-strong);
  background: var(--accent-soft);
}

.toast.success .toast-icon {
  color: var(--green);
  background: var(--green-soft);
}

.toast.error .toast-icon {
  color: var(--red);
  background: var(--red-soft);
}

.toast.warning .toast-icon {
  color: var(--amber);
  background: var(--amber-soft);
}

.toast-copy {
  min-width: 0;
  flex: 1;
  padding-top: 1px;
}

.toast-copy strong {
  display: block;
  color: var(--text);
  font-size: 13px;
  font-weight: 650;
}

.toast-copy p {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.5;
  word-break: break-word;
}

.toast-close {
  display: grid;
  width: 22px;
  height: 22px;
  flex: none;
  place-items: center;
  border-radius: 6px;
  color: var(--text-faint);
}

.toast-close:hover {
  color: var(--text);
  background: var(--panel-raised);
}
</style>
