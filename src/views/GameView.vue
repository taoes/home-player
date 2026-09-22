<script setup>
import { computed } from 'vue'
import { getGame } from '../data/games.js'

const props = defineProps({
  id: { type: String, required: true },
})

const game = computed(() => getGame(props.id))

const coverStyle = computed(() =>
  game.value
    ? {
        background: `linear-gradient(135deg, ${game.value.gradient[0]} 0%, ${game.value.gradient[1]} 100%)`,
      }
    : {}
)
</script>

<template>
  <div class="game-view">
    <header class="nav-bar">
      <div class="nav-bar__inner">
        <router-link to="/" class="nav-back" aria-label="返回游戏列表">
          <span class="nav-back__arrow">‹</span>
          <span>返回</span>
        </router-link>
        <h2 class="nav-bar__title">{{ game ? game.name : '游戏不存在' }}</h2>
        <span class="nav-bar__placeholder" />
      </div>
    </header>

    <main v-if="game" class="game-container">
      <!-- 游戏信息卡 -->
      <section class="game-info">
        <div class="game-info__icon" :style="coverStyle">
          <span>{{ game.icon }}</span>
        </div>
        <div class="game-info__text">
          <h3 class="game-info__name">{{ game.name }}</h3>
          <p class="game-info__desc">{{ game.description }}</p>
          <div class="game-info__tags">
            <span class="info-tag">🏷️ {{ game.category }}</span>
            <span class="info-tag">👥 {{ game.players }}</span>
            <span class="info-tag">🔞 {{ game.age }} 岁以上</span>
          </div>
        </div>
      </section>

      <!-- 游戏主体：每个游戏都是独立的 Vue 页面组件 -->
      <component :is="game.component" />
    </main>

    <main v-else class="game-container">
      <div class="not-found">
        <span class="not-found__emoji">🤔</span>
        <h3>没有找到这款游戏</h3>
        <p>它可能还在开发中，先看看其他游戏吧～</p>
        <router-link to="/" class="hp-btn hp-btn-primary">回到游戏列表</router-link>
      </div>
    </main>
  </div>
</template>

<style scoped>
.game-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
}

/* ---------- 顶部导航 ---------- */
.nav-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 248, 242, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}
.nav-bar__inner {
  max-width: 720px;
  margin: 0 auto;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.nav-back {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  text-decoration: none;
  color: var(--text-h);
  font-size: 15px;
  font-weight: 700;
  padding: 6px 12px 6px 8px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  transition: transform 0.15s ease;
}
.nav-back:active {
  transform: scale(0.94);
}
.nav-back__arrow {
  font-size: 22px;
  line-height: 1;
  margin-top: -2px;
}
.nav-bar__title {
  font-size: 17px;
}
.nav-bar__placeholder {
  width: 72px;
}

.game-container {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: 18px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ---------- 游戏信息 ---------- */
.game-info {
  display: flex;
  gap: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  box-shadow: var(--shadow-sm);
}
.game-info__icon {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  font-size: 32px;
  box-shadow: var(--shadow-sm);
}
.game-info__text {
  min-width: 0;
}
.game-info__name {
  font-size: 19px;
  margin-bottom: 4px;
}
.game-info__desc {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 8px;
}
.game-info__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.info-tag {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 3px 10px;
}

.not-found {
  margin-top: 40px;
  text-align: center;
  padding: 48px 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.not-found__emoji {
  font-size: 52px;
}
.not-found p {
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 8px;
}

@media (max-width: 560px) {
  .nav-bar__title {
    font-size: 16px;
  }
  .game-container {
    padding: 14px 12px 32px;
  }
  .game-info {
    padding: 14px;
    gap: 12px;
  }
  .game-info__icon {
    width: 54px;
    height: 54px;
    font-size: 26px;
    border-radius: 15px;
  }
  .game-info__name {
    font-size: 17px;
  }
}
</style>
