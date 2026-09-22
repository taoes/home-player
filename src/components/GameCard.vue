<script setup>
import { computed } from 'vue'

const props = defineProps({
  game: { type: Object, required: true },
})

const coverStyle = computed(() => ({
  background: `linear-gradient(135deg, ${props.game.gradient[0]} 0%, ${props.game.gradient[1]} 100%)`,
}))
</script>

<template>
  <router-link class="game-card" :to="`/game/${game.id}`">
    <div class="game-card__cover" :style="coverStyle">
      <span class="game-card__emoji">{{ game.icon }}</span>
      <span class="game-card__category">{{ game.category }}</span>
      <span class="game-card__play">▶ 开始玩</span>
    </div>
    <div class="game-card__body">
      <h3 class="game-card__title">{{ game.name }}</h3>
      <p class="game-card__tagline">{{ game.tagline }}</p>
      <div class="game-card__meta">
        <span class="meta-item">👥 {{ game.players }}</span>
        <span class="meta-item">🔞 {{ game.age }}</span>
      </div>
    </div>
  </router-link>
</template>

<style scoped>
.game-card {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.game-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
}
.game-card:active {
  transform: scale(0.98);
}

.game-card__cover {
  position: relative;
  aspect-ratio: 16 / 10;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.game-card__emoji {
  font-size: 58px;
  filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.18));
  transition: transform 0.25s ease;
}
.game-card:hover .game-card__emoji {
  transform: scale(1.12) rotate(-4deg);
}
.game-card__category {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 999px;
  backdrop-filter: blur(4px);
}
.game-card__play {
  position: absolute;
  bottom: -36px;
  left: 50%;
  transform: translateX(-50%);
  padding: 7px 18px;
  background: rgba(255, 255, 255, 0.95);
  color: var(--text-h);
  font-size: 13px;
  font-weight: 700;
  border-radius: 999px;
  white-space: nowrap;
  transition: bottom 0.25s ease;
}
.game-card:hover .game-card__play {
  bottom: 12px;
}

.game-card__body {
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.game-card__title {
  font-size: 17px;
}
.game-card__tagline {
  font-size: 13px;
  color: var(--text-muted);
  flex: 1;
}
.game-card__meta {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}
.meta-item {
  font-size: 12px;
  color: var(--text);
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 2px 9px;
}

@media (max-width: 560px) {
  .game-card__emoji {
    font-size: 44px;
  }
  .game-card__play {
    bottom: 10px;
    font-size: 12px;
    padding: 5px 14px;
  }
  .game-card__body {
    padding: 10px 12px 12px;
  }
  .game-card__title {
    font-size: 15px;
  }
  .game-card__tagline {
    font-size: 12px;
  }
}
</style>
