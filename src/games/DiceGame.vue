<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { numToChinese } from '../utils/chineseNumber.js'
import { speak, cancelSpeech, speechSupported } from '../composables/useSpeech.js'

// 掷骰子：通用桌游辅助工具，可配置数量、颜色、形状、点数样式，带滚动音效与语音播报

// 传统骰子点阵位置（3x3 grid，索引 0~8）
const pipPositions = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

// 骰子颜色（背景 + 点数颜色搭配，保证对比度）
const diceColors = [
  { name: '白', bg: '#ffffff', dot: '#1f2937' },
  { name: '红', bg: '#ef4444', dot: '#ffffff' },
  { name: '黑', bg: '#1f2937', dot: '#ffffff' },
  { name: '蓝', bg: '#2563eb', dot: '#ffffff' },
  { name: '绿', bg: '#16a34a', dot: '#ffffff' },
  { name: '黄', bg: '#facc15', dot: '#1f2937' },
  { name: '紫', bg: '#9333ea', dot: '#ffffff' },
  { name: '粉', bg: '#ec4899', dot: '#ffffff' },
]

const shapes = [
  { name: '方块', value: 'square' },
  { name: '圆形', value: 'round' },
]
const faceStyles = [
  { name: '点阵', value: 'dots' },
  { name: '数字', value: 'number' },
]

const presets = [
  { name: '大富翁', count: 2, color: '白', shape: 'square', face: 'dots' },
  { name: '单骰', count: 1, color: '红', shape: 'square', face: 'dots' },
  { name: '五骰', count: 5, color: '蓝', shape: 'round', face: 'number' },
  { name: '经典双骰', count: 2, color: '黑', shape: 'square', face: 'dots' },
]

const count = ref(2)
const colorName = ref('白')
const shape = ref('square')
const faceStyle = ref('dots')
const voiceOn = ref(true)

const values = ref([1, 1])
const rolling = ref(false)
const lastTotal = ref(null)
const history = ref([])

let rollTimer = null
let clackTimer = null

const currentColor = computed(() => diceColors.find((c) => c.name === colorName.value))

function setPreset(p) {
  count.value = p.count
  colorName.value = p.color
  shape.value = p.shape
  faceStyle.value = p.face
  values.value = Array(p.count).fill(1)
  lastTotal.value = null
}

function changeCount(n) {
  count.value = n
  values.value = Array(n).fill(1)
  lastTotal.value = null
}

// ---------- 音效（Web Audio API 合成，无需外部音频文件） ----------
let audioCtx
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}
// 骰子撞击的咔哒声
function playClack() {
  const ctx = getCtx()
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'square'
  o.frequency.value = 140 + Math.random() * 130
  g.gain.setValueAtTime(0.0001, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09)
  o.connect(g).connect(ctx.destination)
  o.start()
  o.stop(ctx.currentTime + 0.1)
}
// 落定音
function playSettle() {
  const ctx = getCtx()
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = 'triangle'
  o.frequency.setValueAtTime(660, ctx.currentTime)
  o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08)
  g.gain.setValueAtTime(0.0001, ctx.currentTime)
  g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25)
  o.connect(g).connect(ctx.destination)
  o.start()
  o.stop(ctx.currentTime + 0.26)
}

// ---------- 投掷 ----------
function roll() {
  if (rolling.value) return
  rolling.value = true
  lastTotal.value = null
  // 滚动期间快速变面 + 咔哒音效
  clackTimer = setInterval(() => {
    playClack()
    values.value = Array.from({ length: count.value }, () => Math.floor(Math.random() * 6) + 1)
  }, 110)
  // 850ms 后落定
  rollTimer = setTimeout(() => {
    clearInterval(clackTimer)
    const final = Array.from({ length: count.value }, () => Math.floor(Math.random() * 6) + 1)
    values.value = final
    rolling.value = false
    playSettle()
    const total = final.reduce((a, b) => a + b, 0)
    lastTotal.value = total
    history.value.unshift({
      values: [...final],
      total,
      time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
    })
    if (voiceOn.value && speechSupported) {
      const parts = final.map((v) => numToChinese(v)).join('、')
      speak(`${parts}，共${numToChinese(total)}`, { rate: 0.85 })
    }
  }, 850)
}

function replayResult() {
  const last = history.value[0]
  if (!last || !voiceOn.value) return
  const parts = last.values.map((v) => numToChinese(v)).join('、')
  speak(`${parts}，共${numToChinese(last.total)}`, { rate: 0.8 })
}

onBeforeUnmount(() => {
  clearInterval(clackTimer)
  clearTimeout(rollTimer)
  cancelSpeech()
  if (audioCtx) audioCtx.close()
})

const diceStyle = computed(() => ({
  background: currentColor.value.bg,
  borderColor: colorName.value === '白' ? 'rgba(0,0,0,0.12)' : 'transparent',
}))
const dotStyle = computed(() => ({ background: currentColor.value.dot }))
const diceClass = computed(() => ({
  'dice--round': shape.value === 'round',
  'dice--rolling': rolling.value,
}))
</script>

<template>
  <div class="dice-game hp-board">
    <!-- 配置区 -->
    <section class="config">
      <h3 class="panel-title">🎲 掷骰子</h3>
      <p class="panel-tip">
        桌游好帮手！玩大富翁、飞行棋时随开随用。点「投骰」按钮，骰子滚动并语音播报点数。
      </p>

      <h4 class="cfg-label">快捷预设</h4>
      <div class="presets">
        <button v-for="p in presets" :key="p.name" class="preset-btn" @click="setPreset(p)">
          {{ p.name }}
        </button>
      </div>

      <h4 class="cfg-label">骰子数量</h4>
      <div class="num-row">
        <button v-for="n in 6" :key="n" class="num-btn" :class="{ active: count === n }" @click="changeCount(n)">
          {{ n }}
        </button>
      </div>

      <h4 class="cfg-label">骰子颜色</h4>
      <div class="color-row">
        <button
          v-for="c in diceColors"
          :key="c.name"
          class="color-btn"
          :class="{ active: colorName === c.name }"
          :style="{ background: c.bg, borderColor: c.name === '白' ? '#d1d5db' : 'transparent' }"
          :title="c.name + '骰'"
          @click="colorName = c.name"
        >
          <span class="color-dot" :style="{ background: c.dot }"></span>
        </button>
      </div>

      <h4 class="cfg-label">形状</h4>
      <div class="opt-row">
        <button v-for="s in shapes" :key="s.value" class="opt" :class="{ active: shape === s.value }" @click="shape = s.value">
          {{ s.name }}
        </button>
      </div>

      <h4 class="cfg-label">点数显示</h4>
      <div class="opt-row">
        <button v-for="f in faceStyles" :key="f.value" class="opt" :class="{ active: faceStyle === f.value }" @click="faceStyle = f.value">
          {{ f.name }}
        </button>
      </div>

      <label v-if="speechSupported" class="voice-toggle">
        <input v-model="voiceOn" type="checkbox" /><span>🔊 语音播报点数</span>
      </label>
      <p v-else class="no-voice">当前浏览器不支持语音播报，仅播放滚动音效</p>
    </section>

    <!-- 骰子展示区 -->
    <section class="stage" :class="{ 'stage--rolling': rolling }">
      <div class="dice-area">
        <div v-for="(v, i) in values" :key="i" class="dice" :class="diceClass" :style="diceStyle">
          <div v-if="faceStyle === 'dots'" class="face">
            <span v-for="pos in 9" :key="pos" class="pip-cell">
              <span v-if="pipPositions[v] && pipPositions[v].includes(pos - 1)" class="pip" :style="dotStyle"></span>
            </span>
          </div>
          <span v-else class="num-face" :style="{ color: currentColor.dot }">{{ v }}</span>
        </div>
      </div>
      <div v-if="lastTotal !== null && !rolling" class="result">
        <span class="result__label">总计</span>
        <span class="result__total">{{ lastTotal }}</span>
        <button v-if="speechSupported && voiceOn" class="replay-btn" @click="replayResult">🔊 重听</button>
      </div>
    </section>

    <button class="hp-btn hp-btn-primary roll-btn" :disabled="rolling" @click="roll">
      {{ rolling ? '🎲 滚动中…' : '🎲 投骰' }}
    </button>

    <!-- 历史 -->
    <section v-if="history.length" class="history">
      <h4>📋 投掷记录</h4>
      <ul>
        <li v-for="(h, i) in history" :key="i">
          <span class="hist-vals">{{ h.values.join(' + ') }}</span>
          <span class="hist-eq">=</span>
          <span class="hist-total">{{ h.total }}</span>
          <span class="hist-time">{{ h.time }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.dice-game { padding: 18px; }
.panel-title { font-size: 19px; margin-bottom: 6px; }
.panel-tip { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; line-height: 1.7; }
.cfg-label { font-size: 13px; font-weight: 700; color: var(--text); margin: 14px 0 8px; }
.no-voice { font-size: 12px; color: var(--text-muted); margin-top: 10px; }

.presets { display: flex; flex-wrap: wrap; gap: 8px; }
.preset-btn { padding: 8px 14px; font-size: 13px; font-weight: 700; color: var(--text); background: var(--surface-soft); border: 1.5px solid var(--border); border-radius: 999px; transition: transform 0.15s; }
.preset-btn:active { transform: scale(0.95); }

.num-row { display: flex; gap: 8px; }
.num-btn { flex: 1; padding: 11px; font-size: 15px; font-weight: 800; border-radius: var(--radius-sm); background: var(--surface-soft); border: 2px solid var(--border); color: var(--text); transition: all 0.15s; }
.num-btn.active { color: #fff; background: linear-gradient(135deg, var(--primary), var(--primary-deep)); border-color: transparent; }

.color-row { display: flex; flex-wrap: wrap; gap: 8px; }
.color-btn { width: 40px; height: 40px; border-radius: 12px; border: 2px solid var(--border); display: grid; place-items: center; box-shadow: var(--shadow-sm); transition: box-shadow 0.15s, transform 0.15s; }
.color-btn:active { transform: scale(0.92); }
.color-btn.active { box-shadow: 0 0 0 3px rgba(255, 122, 69, 0.3); }
.color-dot { width: 14px; height: 14px; border-radius: 50%; }

.opt-row { display: flex; gap: 8px; }
.opt { flex: 1; padding: 10px; font-size: 14px; font-weight: 700; border-radius: var(--radius-sm); background: var(--surface-soft); border: 2px solid var(--border); color: var(--text); transition: all 0.15s; }
.opt.active { color: #fff; background: linear-gradient(135deg, var(--primary), var(--primary-deep)); border-color: transparent; }

.voice-toggle { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; margin-top: 14px; cursor: pointer; }

.stage { margin-top: 18px; background: var(--bg-deep); border-radius: var(--radius); padding: 24px; display: flex; flex-direction: column; align-items: center; gap: 16px; transition: background 0.2s; }
.stage--rolling { background: linear-gradient(160deg, #fef3c7, #fde68a); }

.dice-area { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
.dice { width: 64px; height: 64px; border-radius: 14px; border: 1.5px solid; box-shadow: var(--shadow); display: grid; place-items: center; transition: transform 0.1s; }
.dice--round { border-radius: 50%; }
.dice--rolling { animation: dice-shake 0.4s ease-in-out infinite; }
@keyframes dice-shake {
  0%, 100% { transform: translateY(0) rotate(0); }
  25% { transform: translateY(-6px) rotate(-8deg); }
  50% { transform: translateY(0) rotate(6deg); }
  75% { transform: translateY(-4px) rotate(-4deg); }
}

.face { width: 82%; height: 82%; display: grid; grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(3, 1fr); place-items: center; }
.pip-cell { display: grid; place-items: center; }
.pip { width: 10px; height: 10px; border-radius: 50%; }
.num-face { font-size: 30px; font-weight: 900; line-height: 1; }

.result { display: flex; align-items: center; gap: 10px; }
.result__label { font-size: 13px; font-weight: 700; color: var(--text-muted); }
.result__total { font-size: 36px; font-weight: 900; color: var(--text-h); font-variant-numeric: tabular-nums; }
.replay-btn { font-size: 12px; font-weight: 700; color: var(--accent); background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 999px; padding: 4px 12px; }

.roll-btn { width: 100%; padding: 16px; font-size: 18px; margin-top: 16px; }

.history { margin-top: 16px; }
.history h4 { font-size: 13px; color: var(--text-muted); margin-bottom: 8px; }
.history ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.history li { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--surface-soft); border: 1px solid var(--border); border-radius: 10px; font-size: 14px; }
.hist-vals { font-weight: 800; color: var(--text-h); font-variant-numeric: tabular-nums; }
.hist-eq { color: var(--text-muted); }
.hist-total { font-weight: 800; color: var(--primary-deep); font-size: 16px; }
.hist-time { margin-left: auto; font-size: 11px; color: var(--text-muted); }

@media (max-width: 560px) {
  .dice-game { padding: 14px; }
  .dice { width: 54px; height: 54px; }
  .num-face { font-size: 24px; }
  .pip { width: 8px; height: 8px; }
}
</style>
