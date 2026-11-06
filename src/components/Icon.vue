<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    name: string
    size?: number | string
    strokeWidth?: number
  }>(),
  { size: 20, strokeWidth: 1.8 },
)

const icons: Record<string, string> = {
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
  gamepad:
    '<path d="M7.5 8.5h9a4.5 4.5 0 0 1 4.2 2.9l1.2 3.4a2.4 2.4 0 0 1-4.2 2.3l-1.4-1.6H7.7l-1.4 1.6a2.4 2.4 0 0 1-4.2-2.3l1.2-3.4a4.5 4.5 0 0 1 4.2-2.9Z"/><path d="M7 12v2.5M5.75 13.25h2.5"/><circle cx="16.4" cy="12.3" r=".8" fill="currentColor" stroke="none"/><circle cx="18.3" cy="14.2" r=".8" fill="currentColor" stroke="none"/>',
  activity: '<path d="M3 12h3.5l2-5 3.5 10 2.2-6.2L16 12h5"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 .6 1.1 1.7 1.7 0 0 0 1.1.4 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.12.38.34.73.6 1 .3.26.67.4 1.1.4H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51.6Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  verified:
    '<path d="m12 2.6 2.2 2.1 3-.2.9 2.9 2.6 1.6-1.2 2.8 1.2 2.8-2.6 1.6-.9 2.9-3-.2L12 21.4l-2.2-2.1-3 .2-.9-2.9-2.6-1.6L4.5 12 3.3 9.2l2.6-1.6.9-2.9 3 .2L12 2.6Z" fill="currentColor" stroke="none"/><path d="m8.6 12.1 2.2 2.2 4.6-4.6" stroke="var(--icon-cutout, #0b0e16)" stroke-width="2.1"/>',
  play: '<path d="M8 5.5v13l10.2-6.5L8 5.5Z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6.5" y="5" width="3.6" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="13.9" y="5" width="3.6" height="14" rx="1" fill="currentColor" stroke="none"/>',
  stop: '<rect x="6.2" y="6.2" width="11.6" height="11.6" rx="2" fill="currentColor" stroke="none"/>',
  folder:
    '<path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4l2 2h6a2.5 2.5 0 0 1 2.5 2.5v8A2.5 2.5 0 0 1 18 20H6a2.5 2.5 0 0 1-2.5-2.5v-10Z"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.8-3M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.8 3M20 20v-4h-4"/>',
  discord:
    '<path d="M8.4 5.2A15 15 0 0 1 12 4.7c1.2 0 2.4.2 3.6.5l.5.1c.3-.5.7-1 1.1-1.4.2-.2.5-.2.7-.1 1.8.6 3.3 1.6 4.5 2.9.1.1.1.2.1.3.7 2.8 1.2 5.7 1.5 8.7 0 .1 0 .2-.1.3a16 16 0 0 1-4.8 2.5c-.2 0-.4 0-.5-.2l-1-1.6c-.1-.2 0-.4.2-.5.6-.2 1.1-.5 1.6-.8.2-.1.2-.4 0-.5l-.3-.2c-.2-.1-.3-.1-.5 0-1.9 1-4 1.5-6.1 1.5s-4.2-.5-6.1-1.5c-.2-.1-.3-.1-.5 0l-.3.2c-.2.1-.2.4 0 .5.5.3 1 .6 1.6.8.2.1.3.3.2.5l-1 1.6c-.1.2-.3.3-.5.2a16 16 0 0 1-4.8-2.5c-.1-.1-.2-.1-.1-.3.3-3 .8-5.9 1.5-8.7 0-.1 0-.2.1-.3A13.5 13.5 0 0 1 7.4 5c.2-.1.5-.1.7.1.1.1.3.1.3.1Z" fill="currentColor" stroke="none"/><circle cx="9" cy="12.3" r="1.35" fill="var(--icon-cutout, #0b0e16)" stroke="none"/><circle cx="15" cy="12.3" r="1.35" fill="var(--icon-cutout, #0b0e16)" stroke="none"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  trash:
    '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l.8 12a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.8-12"/><path d="M10 11v6M14 11v6"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.2l3.4 2"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4"/>',
  alert: '<path d="M12 3.8 21 20H3L12 3.8Z"/><path d="M12 9v5"/><circle cx="12" cy="17.2" r=".9" fill="currentColor" stroke="none"/>',
  sparkles:
    '<path d="M12 3.5c.7 3.7 2.2 5.2 5.9 5.9-3.7.7-5.2 2.2-5.9 5.9-.7-3.7-2.2-5.2-5.9-5.9 3.7-.7 5.2-2.2 5.9-5.9Z" fill="currentColor" stroke="none"/><path d="M19 14.5c.3 1.7 1 2.4 2.7 2.7-1.7.3-2.4 1-2.7 2.7-.3-1.7-1-2.4-2.7-2.7 1.7-.3 2.4-1 2.7-2.7Z" fill="currentColor" stroke="none"/><path d="M5 15.5c.2 1.2.8 1.8 2 2-1.2.2-1.8.8-2 2-.2-1.2-.8-1.8-2-2 1.2-.2 1.8-.8 2-2Z" fill="currentColor" stroke="none"/>',
  more: '<circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 5H6a2 2 0 0 0-2 2v9"/>',
  shield:
    '<path d="M12 2.8 20 6v5.5c0 4.6-3.3 8.1-8 9.7-4.7-1.6-8-5.1-8-9.7V6l8-3.2Z"/><path d="m8.7 12.1 2.2 2.2 4.4-4.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.8" r=".9" fill="currentColor" stroke="none"/>',
  moon: '<path d="M20 14.3A8.5 8.5 0 0 1 9.7 4a8.5 8.5 0 1 0 10.3 10.3Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>',
  monitor: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8 20h8M12 16.5V20"/>',
  arrowRight: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  download: '<path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5"/><path d="M5 19.5h14"/>',
  rocket:
    '<path d="M13.5 4.2c2.8-.7 5.3-.4 6.3.6 1 1 1.3 3.5.6 6.3-.6 2.5-2.2 5-4.4 6.7L10.9 14 7.2 8.6c1.7-2.2 4.1-3.8 6.3-4.4Z"/><circle cx="15.1" cy="8.9" r="1.7"/><path d="M8.5 15.5c-1.2 1.2-1.6 3.3-1.8 4.8 1.5-.2 3.6-.6 4.8-1.8M7 17c-.8-.5-1.8-1.5-2.3-2.3L7.5 13M17 6.9c.5.8 1.5 1.8 2.3 2.3L17 11"/>',
  key: '<circle cx="8" cy="15.5" r="3.5"/><path d="m10.8 12.7 8.7-8.7M16.5 7l2.5 2.5M14.5 9l2.5 2.5"/>',
}

const body = computed(() => icons[props.name] || icons.info)
const dimension = computed(() =>
  typeof props.size === 'number' ? `${props.size}px` : props.size,
)
</script>

<template>
  <svg
    :width="dimension"
    :height="dimension"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="icon"
    v-html="body"
  />
</template>

<style scoped>
.icon {
  flex: none;
  display: block;
}
</style>
