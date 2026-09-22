<script setup>
import { computed, ref } from 'vue'
import { games, categories } from '../data/games.js'
import GameCard from '../components/GameCard.vue'

const keyword = ref('')
const activeCategory = ref('全部')

const filteredGames = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return games.filter((g) => {
    const matchCategory = activeCategory.value === '全部' || g.category === activeCategory.value
    const matchKeyword =
      !kw ||
      g.name.toLowerCase().includes(kw) ||
      g.tagline.toLowerCase().includes(kw) ||
      g.tags.some((t) => t.toLowerCase().includes(kw))
    return matchCategory && matchKeyword
  })
})

function pickCategory(cat) {
  activeCategory.value = cat
}
</script>

<template>
  <div class="home">
    <!-- 顶部应用栏 -->
    <header class="topbar">
      <div class="topbar__inner">
        <div class="brand">
          <span class="brand__logo">🎮</span>
          <div class="brand__text">
            <h1 class="brand__name">家庭游乐场</h1>
            <span class="brand__slogan">全家一起玩的小游戏</span>
          </div>
        </div>
        <span class="topbar__count">{{ games.length }} 款游戏</span>
      </div>
    </header>

    <main class="container">
      <!-- 欢迎横幅 -->
      <section class="hero">
        <div class="hero__content">
          <span class="hero__badge">🏡 家庭时光 · 免费畅玩</span>
          <h2 class="hero__title">放下手机刷屏，<br />一家人一起玩点游戏吧！</h2>
          <p class="hero__desc">
            精选适合老人和孩子的休闲小游戏，无广告、无内购，打开即玩。
          </p>
          <div class="hero__stats">
            <div class="hero-stat">
              <strong>{{ games.length }}</strong>
              <span>精选游戏</span>
            </div>
            <div class="hero-stat">
              <strong>0</strong>
              <span>广告内购</span>
            </div>
            <div class="hero-stat">
              <strong>3+</strong>
              <span>岁就能玩</span>
            </div>
          </div>
        </div>
        <div class="hero__deco" aria-hidden="true">
          <span class="float-emoji e1">🔊</span>
          <span class="float-emoji e2">🔢</span>
          <span class="float-emoji e3">🌈</span>
          <span class="float-emoji e4">🎨</span>
          <span class="float-emoji e5">👨‍👩‍👧</span>
          <span class="float-emoji e6">🎯</span>
        </div>
      </section>

      <!-- 搜索 + 分类 -->
      <section class="toolbar">
        <label class="search">
          <span class="search__icon">🔍</span>
          <input
            v-model="keyword"
            type="search"
            placeholder="搜索游戏，比如：益智、贪吃蛇"
            aria-label="搜索游戏"
          />
        </label>
        <div class="chips" role="tablist">
          <button
            v-for="cat in categories"
            :key="cat"
            class="chip"
            :class="{ 'chip--active': activeCategory === cat }"
            role="tab"
            :aria-selected="activeCategory === cat"
            @click="pickCategory(cat)"
          >
            {{ cat }}
          </button>
        </div>
      </section>

      <!-- 游戏网格 -->
      <section class="games">
        <div v-if="filteredGames.length" class="games__grid">
          <GameCard v-for="game in filteredGames" :key="game.id" :game="game" />
        </div>
        <div v-else class="empty">
          <span class="empty__emoji">🧐</span>
          <h3>没有找到相关游戏</h3>
          <p>换个关键词，或者看看其他分类吧</p>
          <button class="hp-btn hp-btn-primary" @click="keyword = ''; pickCategory('全部')">
            查看全部游戏
          </button>
        </div>
      </section>
    </main>

    <footer class="footer">
      <p>家庭游乐场 · 陪孩子、陪父母度过欢乐时光 🧡</p>
    </footer>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
}

/* ---------- 顶部栏 ---------- */
.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 248, 242, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
}
.topbar__inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}
.brand__logo {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  font-size: 22px;
  border-radius: 14px;
  background: linear-gradient(135deg, #ffb199, #ff7a45);
  box-shadow: 0 6px 14px -4px rgba(249, 93, 36, 0.5);
}
.brand__name {
  font-size: 18px;
  line-height: 1.2;
}
.brand__slogan {
  font-size: 12px;
  color: var(--text-muted);
}
.topbar__count {
  font-size: 13px;
  font-weight: 700;
  color: var(--primary-deep);
  background: var(--primary-soft);
  border: 1px solid #ffd9c8;
  border-radius: 999px;
  padding: 5px 13px;
  white-space: nowrap;
}

.container {
  flex: 1;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 20px 20px 32px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* ---------- 横幅 ---------- */
.hero {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg);
  padding: 38px 40px;
  background: linear-gradient(120deg, #ff9a6c 0%, #ff7a8a 55%, #b07cf5 100%);
  box-shadow: var(--shadow);
  display: flex;
  align-items: center;
}
.hero__content {
  position: relative;
  z-index: 2;
  max-width: 460px;
}
.hero__badge {
  display: inline-block;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 999px;
  padding: 5px 14px;
  margin-bottom: 14px;
}
.hero__title {
  color: #fff;
  font-size: 30px;
  line-height: 1.3;
  margin-bottom: 10px;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
}
.hero__desc {
  color: rgba(255, 255, 255, 0.92);
  font-size: 15px;
  margin-bottom: 20px;
}
.hero__stats {
  display: flex;
  gap: 26px;
}
.hero-stat {
  display: flex;
  flex-direction: column;
}
.hero-stat strong {
  color: #fff;
  font-size: 24px;
  line-height: 1.2;
}
.hero-stat span {
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
}

.hero__deco {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}
.float-emoji {
  position: absolute;
  font-size: 46px;
  opacity: 0.9;
  filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.15));
  animation: floaty 3.6s ease-in-out infinite;
}
.e1 { right: 12%; top: 18%; animation-delay: 0s; }
.e2 { right: 28%; bottom: 14%; font-size: 56px; animation-delay: 0.5s; }
.e3 { right: 6%; bottom: 22%; font-size: 40px; animation-delay: 1s; }
.e4 { right: 38%; top: 12%; font-size: 38px; animation-delay: 1.4s; }
.e5 { right: 20%; top: 8%; font-size: 34px; animation-delay: 0.8s; }
.e6 { right: 40%; bottom: 8%; font-size: 34px; animation-delay: 1.8s; }

@keyframes floaty {
  0%, 100% { transform: translateY(0) rotate(-4deg); }
  50% { transform: translateY(-12px) rotate(5deg); }
}

/* ---------- 搜索 & 分类 ---------- */
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 999px;
  padding: 10px 18px;
  box-shadow: var(--shadow-sm);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.search:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(255, 122, 69, 0.12);
}
.search__icon {
  font-size: 15px;
}
.search input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  font-family: inherit;
  color: var(--text-h);
  min-width: 0;
}
.search input::placeholder {
  color: var(--text-muted);
}

.chips {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}
.chips::-webkit-scrollbar {
  display: none;
}
.chip {
  flex-shrink: 0;
  padding: 8px 20px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  background: var(--surface);
  border: 1.5px solid var(--border);
  transition: all 0.18s ease;
}
.chip--active {
  color: #fff;
  background: linear-gradient(135deg, var(--primary), var(--primary-deep));
  border-color: transparent;
  box-shadow: 0 6px 14px -4px rgba(249, 93, 36, 0.5);
}

/* ---------- 游戏网格 ---------- */
.games__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.empty {
  text-align: center;
  padding: 60px 20px;
  background: var(--surface);
  border: 1.5px dashed var(--border);
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.empty__emoji {
  font-size: 48px;
}
.empty p {
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 10px;
}

.footer {
  text-align: center;
  padding: 24px 20px calc(28px + env(safe-area-inset-bottom));
  font-size: 13px;
  color: var(--text-muted);
}

/* ---------- 平板 ---------- */
@media (max-width: 900px) {
  .games__grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .hero {
    padding: 30px 28px;
  }
  .hero__title {
    font-size: 25px;
  }
  .float-emoji {
    font-size: 38px;
  }
  .e4,
  .e5,
  .e6 {
    display: none;
  }
}

/* ---------- 手机 ---------- */
@media (max-width: 560px) {
  .topbar__inner {
    padding: 10px 16px;
  }
  .brand__logo {
    width: 38px;
    height: 38px;
    font-size: 20px;
  }
  .brand__name {
    font-size: 16px;
  }
  .brand__slogan {
    font-size: 11px;
  }
  .topbar__count {
    font-size: 12px;
    padding: 4px 11px;
  }

  .container {
    padding: 14px 14px 24px;
    gap: 16px;
  }

  .hero {
    padding: 24px 20px;
    border-radius: var(--radius);
  }
  .hero__badge {
    font-size: 12px;
    padding: 4px 12px;
  }
  .hero__title {
    font-size: 21px;
  }
  .hero__desc {
    font-size: 13px;
    margin-bottom: 16px;
  }
  .hero__stats {
    gap: 20px;
  }
  .hero-stat strong {
    font-size: 20px;
  }
  .hero-stat span {
    font-size: 12px;
  }
  .float-emoji {
    opacity: 0.55;
  }

  .games__grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>
