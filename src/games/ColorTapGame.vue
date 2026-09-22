<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { speak, cancelSpeech, speechSupported } from '../composables/useSpeech.js'

// ---------- 高区分度颜色（名称 + 色块 + 文字对比色） ----------
const allColors = [
  { name: '红色', hex: '#ef4444', fg: '#ffffff' },
  { name: '橙色', hex: '#f97316', fg: '#ffffff' },
  { name: '黄色', hex: '#facc15', fg: '#713f12' },
  { name: '绿色', hex: '#22c55e', fg: '#ffffff' },
  { name: '蓝色', hex: '#2563eb', fg: '#ffffff' },
  { name: '紫色', hex: '#9333ea', fg: '#ffffff' },
  { name: '粉色', hex: '#ec4899', fg: '#ffffff' },
  { name: '青色', hex: '#0891b2', fg: '#ffffff' },
  { name: '棕色', hex: '#92400e', fg: '#ffffff' },
  { name: '灰色', hex: '#6b7280', fg: '#ffffff' },
  { name: '黑色', hex: '#1f2937', fg: '#ffffff' },
  { name: '白色', hex: '#ffffff', fg: '#1f2937' },
]

const DEFAULT_PICK = ['红色', '橙色', '黄色', '绿色', '蓝色', '紫色']
const MIN_COLORS = 3
const roundOptions = [5, 10, 15]

// ---------- 状态 ----------
const phase = ref('setup') // setup | countdown | playing | roundEnd | finished
const pickedNames = ref([...DEFAULT_PICK])
const totalRounds = ref(10)
const roundNo = ref(1)
const scores = ref({ p1: 0, p2: 0 })
const target = ref(null)
const leftColumn = ref([])
const rightColumn = ref([])
const roundWinner = ref(null) // p1 | p2
const wrongFlash = ref({ p1: '', p2: '' })
const scoreFlash = ref({ p1: false, p2: false })
const setupError = ref('')

let countdownTimer = null
let advanceTimer = null
let wrongTimer = { p1: null, p2: null }
let flashTimer = { p1: null, p2: null }

const pickedColors = computed(() =>
  pickedNames.value
    .map((n) => allColors.find((c) => c.name === n))
    .filter(Boolean)
)

const colorByName = (name) => allColors.find((c) => c.name === name)

// 左右两列按行配对（各自独立洗牌，防止背位置）
const rows = computed(() =>
  leftColumn.value.map((c, i) => ({ p1: c, p2: rightColumn.value[i] }))
)

const matchResult = computed(() => {
  if (scores.value.p1 > scores.value.p2)
    return { text: '玩家 1 获胜！', emoji: '🎉', who: 'p1' }
  if (scores.value.p2 > scores.value.p1)
    return { text: '玩家 2 获胜！', emoji: '🎉', who: 'p2' }
  return { text: '平局！不分胜负', emoji: '🤝', who: null }
})

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function clearTimers() {
  clearTimeout(countdownTimer)
  clearTimeout(advanceTimer)
  clearTimeout(wrongTimer.p1)
  clearTimeout(wrongTimer.p2)
  clearTimeout(flashTimer.p1)
  clearTimeout(flashTimer.p2)
}

// ---------- 设置 ----------
function toggleColor(name) {
  const idx = pickedNames.value.indexOf(name)
  if (idx >= 0) {
    if (pickedNames.value.length <= MIN_COLORS) return
    pickedNames.value.splice(idx, 1)
  } else {
    pickedNames.value.push(name)
  }
}

function startMatch() {
  if (pickedColors.value.length < MIN_COLORS) {
    setupError.value = `至少选择 ${MIN_COLORS} 种颜色`
    return
  }
  setupError.value = ''
  scores.value = { p1: 0, p2: 0 }
  roundNo.value = 1
  startCountdown()
}

// ---------- 回合流程 ----------
function startCountdown() {
  phase.value = 'countdown'
  roundWinner.value = null
  target.value = null
  leftColumn.value = []
  rightColumn.value = []
  const delay = 900 + Math.random() * 900
  countdownTimer = setTimeout(announceColor, delay)
}

function announceColor() {
  const pool = pickedColors.value
  target.value = pool[Math.floor(Math.random() * pool.length)]
  // 左右两列独立打乱
  leftColumn.value = shuffle(pool)
  rightColumn.value = shuffle(pool)
  phase.value = 'playing'
  speak(`请点${target.value.name}`, { rate: 0.75 })
}

function replayAnnounce() {
  if (target.value) speak(`请点${target.value.name}`, { rate: 0.75 })
}

function tap(side, color) {
  if (phase.value !== 'playing' || !target.value) return

  if (color.name === target.value.name) {
    // 抢到！
    roundWinner.value = side
    phase.value = 'roundEnd'
    scores.value[side] += 1
    scoreFlash.value[side] = true
    flashTimer[side] = setTimeout(() => (scoreFlash.value[side] = false), 600)
    speak(side === 'p1' ? '玩家一得分' : '玩家二得分', { rate: 1 })
    advanceTimer = setTimeout(nextRound, 2200)
  } else {
    // 点错：色块抖动提示，不扣分，对方仍可继续抢
    wrongFlash.value[side] = color.name
    clearTimeout(wrongTimer[side])
    wrongTimer[side] = setTimeout(() => (wrongFlash.value[side] = ''), 350)
  }
}

function nextRound() {
  if (roundNo.value >= totalRounds.value) {
    phase.value = 'finished'
    const r = matchResult.value
    speak(
      r.who
        ? `${r.who === 'p1' ? '玩家一' : '玩家二'}获胜，${scores.value.p1}比${scores.value.p2}`
        : `双方打成平手，${scores.value.p1}比${scores.value.p2}`,
      { rate: 0.95 }
    )
  } else {
    roundNo.value += 1
    startCountdown()
  }
}

function playAgain() {
  scores.value = { p1: 0, p2: 0 }
  roundNo.value = 1
  startCountdown()
}

function backToSetup() {
  clearTimers()
  cancelSpeech()
  phase.value = 'setup'
  target.value = null
  roundWinner.value = null
}

onBeforeUnmount(() => {
  clearTimers()
  cancelSpeech()
})
</script>

<template>
  <div class="color-tap hp-board">
    <!-- ========== 设置阶段 ========== -->
    <div v-if="phase === 'setup'" class="setup">
      <h3 class="panel-title">🌈 游戏设置</h3>
      <p class="panel-tip">
        两位玩家面对面坐下，玩家 1 点左侧、玩家 2 点右侧。听语音播报颜色，谁先点对谁得分！
      </p>

      <h4 class="setup-label">选择本局颜色（{{ pickedNames.length }} 种，至少 {{ MIN_COLORS }} 种）</h4>
      <div class="color-picker">
        <button
          v-for="c in allColors"
          :key="c.name"
          class="color-chip"
          :class="{ 'color-chip--active': pickedNames.includes(c.name) }"
          @click="toggleColor(c.name)"
        >
          <span
            class="color-chip__dot"
            :style="{ background: c.hex, color: c.fg, borderColor: c.name === '白色' ? '#d1d5db' : c.hex }"
          >
            {{ pickedNames.includes(c.name) ? '✓' : '' }}
          </span>
          <span class="color-chip__name">{{ c.name }}</span>
        </button>
      </div>
      <p v-if="setupError" class="error-msg">⚠️ {{ setupError }}</p>

      <h4 class="setup-label">回合数</h4>
      <div class="round-picker">
        <button
          v-for="n in roundOptions"
          :key="n"
          class="round-btn"
          :class="{ 'round-btn--active': totalRounds === n }"
          @click="totalRounds = n"
        >
          {{ n }} 回合
        </button>
      </div>

      <button class="hp-btn hp-btn-primary start-btn" @click="startMatch">▶ 开始对战</button>
    </div>

    <!-- ========== 对战阶段 ========== -->
    <div v-else class="match">
      <!-- 计分板 -->
      <div class="scoreboard">
        <div class="score score--p1" :class="{ 'score--flash': scoreFlash.p1 }">
          <span class="score__label">玩家 1</span>
          <strong>{{ scores.p1 }}</strong>
        </div>
        <div class="round-info">
          <span class="round-info__no">{{ roundNo }} / {{ totalRounds }}</span>
          <span class="round-info__text">回合</span>
        </div>
        <div class="score score--p2" :class="{ 'score--flash': scoreFlash.p2 }">
          <span class="score__label">玩家 2</span>
          <strong>{{ scores.p2 }}</strong>
        </div>
      </div>

      <!-- 播报区 -->
      <div class="announce">
        <template v-if="phase === 'countdown'">
          <span class="announce__waiting">🎵 注意听……</span>
        </template>
        <template v-else>
          <span class="announce__text">
            请点
            <span
              v-if="target"
              class="announce__color"
              :style="{
                background: target.hex,
                color: target.fg,
                borderColor: target.name === '白色' ? '#d1d5db' : 'transparent',
              }"
            >
              {{ target.name }}
            </span>
          </span>
          <button
            v-if="speechSupported && phase === 'playing'"
            class="announce__replay"
            aria-label="再听一遍"
            @click="replayAnnounce"
          >
            🔊 再听一遍
          </button>
          <p v-else-if="!speechSupported" class="announce__note">当前浏览器不支持语音，请看文字提示</p>
        </template>
      </div>

      <!-- 双色块抢点区 -->
      <div class="tiles" :class="{ 'tiles--dim': phase === 'countdown' }">
        <div v-for="(row, i) in rows" :key="i" class="tile-row">
          <button
            class="tile tile--p1"
            :class="{ 'tile--wrong': wrongFlash.p1 === row.p1.name, 'tile--done': !!roundWinner }"
            :style="{ background: row.p1.hex, color: row.p1.fg }"
            :disabled="phase !== 'playing'"
            @click="tap('p1', row.p1)"
          >
            {{ row.p1.name }}
          </button>
          <button
            class="tile tile--p2"
            :class="{ 'tile--wrong': wrongFlash.p2 === row.p2.name, 'tile--done': !!roundWinner }"
            :style="{ background: row.p2.hex, color: row.p2.fg, borderColor: row.p2.name === '白色' ? '#d1d5db' : 'transparent' }"
            :disabled="phase !== 'playing'"
            @click="tap('p2', row.p2)"
          >
            {{ row.p2.name }}
          </button>
        </div>
      </div>

      <!-- 回合结果横幅 -->
      <transition name="banner">
        <div v-if="phase === 'roundEnd'" class="round-banner">
          <span class="round-banner__emoji">⚡</span>
          <span :class="roundWinner === 'p1' ? 'win-p1' : 'win-p2'">
            玩家 {{ roundWinner === 'p1' ? '1' : '2' }} 抢到！
          </span>
          <button class="hp-btn hp-btn-primary round-banner__btn" @click="nextRound">
            {{ roundNo >= totalRounds ? '查看结果' : '下一回合' }}
          </button>
        </div>
      </transition>

      <button class="hp-btn hp-btn-ghost quit-btn" @click="backToSetup">↺ 结束对战 / 重新设置</button>
    </div>

    <!-- ========== 结算遮罩 ========== -->
    <div v-if="phase === 'finished'" class="hp-overlay">
      <div class="hp-overlay-card">
        <span class="hp-overlay-emoji">{{ matchResult.emoji }}</span>
        <h3>{{ matchResult.text }}</h3>
        <p class="final-score">
          <span class="final-score__p1">玩家 1 · {{ scores.p1 }}</span>
          <span class="final-score__vs">VS</span>
          <span class="final-score__p2">玩家 2 · {{ scores.p2 }}</span>
        </p>
        <div class="overlay-actions">
          <button class="hp-btn hp-btn-primary" @click="playAgain">再来一局</button>
          <button class="hp-btn" @click="backToSetup">重新设置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.color-tap {
  padding: 18px;
}
.panel-title {
  font-size: 19px;
  margin-bottom: 6px;
}
.panel-tip {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 18px;
  line-height: 1.6;
}
.setup-label {
  font-size: 14px;
  color: var(--text);
  margin: 0 0 10px;
}
.error-msg {
  color: var(--danger);
  font-size: 13px;
  font-weight: 600;
  margin: 10px 0 0;
}

/* ---------- 设置：颜色选择 ---------- */
.color-picker {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 18px;
}
.color-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 4px;
  border-radius: var(--radius-sm);
  border: 2px solid transparent;
  background: var(--surface-soft);
  transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.color-chip:active {
  transform: scale(0.93);
}
.color-chip--active {
  border-color: var(--primary);
  background: var(--primary-soft);
}
.color-chip__dot {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 2px solid;
  display: grid;
  place-items: center;
  font-size: 16px;
  font-weight: 900;
  box-shadow: var(--shadow-sm);
}
.color-chip__name {
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
}

.round-picker {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
}
.round-btn {
  flex: 1;
  padding: 10px;
  font-size: 14px;
  font-weight: 700;
  border-radius: var(--radius-sm);
  background: var(--surface-soft);
  border: 2px solid var(--border);
  color: var(--text);
  transition: all 0.15s ease;
}
.round-btn--active {
  color: #fff;
  background: linear-gradient(135deg, var(--primary), var(--primary-deep));
  border-color: transparent;
}
.start-btn {
  width: 100%;
  padding: 15px;
  font-size: 16px;
}

/* ---------- 计分板 ---------- */
.match {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.scoreboard {
  display: flex;
  align-items: center;
  gap: 10px;
}
.score {
  flex: 1;
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 2px solid transparent;
  transition: transform 0.2s ease;
}
.score--p1 {
  background: #eff6ff;
  border-color: #bfdbfe;
}
.score--p2 {
  background: #fdf2f8;
  border-color: #fbcfe8;
  flex-direction: row-reverse;
}
.score--flash {
  animation: score-pop 0.6s ease;
}
@keyframes score-pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.12); }
  100% { transform: scale(1); }
}
.score__label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}
.score strong {
  font-size: 28px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}
.score--p1 strong {
  color: #2563eb;
}
.score--p2 strong {
  color: #db2777;
}
.round-info {
  flex-shrink: 0;
  text-align: center;
  padding: 0 4px;
}
.round-info__no {
  display: block;
  font-size: 15px;
  font-weight: 800;
  color: var(--text-h);
  font-variant-numeric: tabular-nums;
}
.round-info__text {
  font-size: 11px;
  color: var(--text-muted);
}

/* ---------- 播报区 ---------- */
.announce {
  min-height: 72px;
  border-radius: var(--radius);
  background: var(--surface-soft);
  border: 2px dashed var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px;
  text-align: center;
}
.announce__waiting {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-muted);
  animation: pulse 1s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}
.announce__text {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-h);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
.announce__color {
  display: inline-block;
  padding: 3px 16px;
  border-radius: 999px;
  border: 2px solid;
  font-size: 19px;
  box-shadow: var(--shadow-sm);
}
.announce__replay {
  font-size: 12px;
  font-weight: 700;
  color: var(--accent);
  background: #f5f3ff;
  border: 1px solid #ddd6fe;
  border-radius: 999px;
  padding: 4px 12px;
}
.announce__note {
  font-size: 11px;
  color: var(--text-muted);
}

/* ---------- 色块按钮 ---------- */
.tiles {
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: opacity 0.2s ease;
}
.tiles--dim {
  opacity: 0.45;
  pointer-events: none;
}
.tile-row {
  display: flex;
  gap: 10px;
}
.tile {
  flex: 1;
  min-height: 58px;
  border-radius: var(--radius-sm);
  border: 2px solid transparent;
  font-size: 17px;
  font-weight: 800;
  font-family: inherit;
  box-shadow: var(--shadow-sm);
  transition: transform 0.12s ease, filter 0.15s ease, opacity 0.15s ease;
  user-select: none;
}
.tile:active:not(:disabled) {
  transform: scale(0.96);
  filter: brightness(0.92);
}
.tile--done {
  opacity: 0.55;
}
.tile--wrong {
  animation: shake 0.35s ease;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}
.tile:disabled {
  cursor: default;
}

/* ---------- 回合横幅 ---------- */
.round-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 12px;
  border-radius: var(--radius-sm);
  background: #fffbeb;
  border: 2px solid #fde68a;
  font-size: 17px;
  font-weight: 800;
}
.round-banner__emoji {
  font-size: 22px;
}
.win-p1 {
  color: #2563eb;
}
.win-p2 {
  color: #db2777;
}
.round-banner__btn {
  padding: 8px 18px;
  font-size: 13px;
}
.banner-enter-active,
.banner-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.banner-enter-from,
.banner-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.quit-btn {
  font-size: 13px;
  color: var(--text-muted);
}

.overlay-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.final-score {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 18px;
}
.final-score span {
  font-size: 14px;
  font-weight: 800;
}
.final-score__p1 {
  color: #2563eb;
}
.final-score__p2 {
  color: #db2777;
}
.final-score__vs {
  color: var(--text-muted);
  font-size: 11px;
}

/* ---------- 手机适配 ---------- */
@media (max-width: 560px) {
  .color-tap {
    padding: 14px;
  }
  .color-picker {
    grid-template-columns: repeat(3, 1fr);
  }
  .tile {
    min-height: 52px;
    font-size: 15px;
  }
  .announce__text {
    font-size: 18px;
  }
}
</style>
