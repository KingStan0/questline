<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Game } from '@/types'
import { gameIconUrl, hashHue, initials } from '@/utils'

const props = withDefaults(
  defineProps<{
    game: Pick<Game, 'id' | 'name' | 'icon'>
    size?: number
    radius?: number
    glow?: boolean
  }>(),
  { size: 44, radius: 12, glow: false },
)

const failed = ref(false)
const url = computed(() => gameIconUrl(props.game as Game, props.size > 64 ? 256 : 128))
const label = computed(() => initials(props.game.name) || '?')
const hue = computed(() => hashHue(props.game.id))
const style = computed(() => ({
  '--art-size': `${props.size}px`,
  '--art-radius': `${props.radius}px`,
  '--art-hue': String(hue.value),
}))

watch(url, () => {
  failed.value = false
})
</script>

<template>
  <div class="game-art" :class="{ 'with-glow': glow }" :style="style">
    <img
      v-if="url && !failed"
      :src="url"
      :alt="game.name"
      loading="lazy"
      draggable="false"
      @error="failed = true"
    />
    <span v-else class="initials">{{ label }}</span>
    <span class="shine" aria-hidden="true"></span>
  </div>
</template>

<style scoped>
.game-art {
  position: relative;
  display: grid;
  width: var(--art-size);
  height: var(--art-size);
  flex: none;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--art-radius);
  color: #fff;
  background:
    radial-gradient(circle at 28% 18%, rgba(255, 255, 255, 0.4), transparent 38%),
    linear-gradient(
      145deg,
      hsl(var(--art-hue) 72% 57%),
      hsl(calc(var(--art-hue) + 46) 68% 38%)
    );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 6px 18px rgba(0, 0, 0, 0.22);
}

.with-glow {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 8px 30px hsl(var(--art-hue) 70% 50% / 0.3);
}

.game-art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.initials {
  font-size: calc(var(--art-size) * 0.29);
  font-weight: 750;
  letter-spacing: -0.04em;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.24);
}

.shine {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(140deg, rgba(255, 255, 255, 0.18), transparent 42%);
  mix-blend-mode: overlay;
}
</style>
