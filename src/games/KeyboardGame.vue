<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { speak, cancelSpeech, speechSupported } from '../composables/useSpeech.js'

// 按键盘游戏：按下按键时在屏幕大键盘上高亮并发出敲击音 + 语音播报
// 兼容中文/英文输入法，覆盖 0-9、字母、+ - > < ( ) [ ] 、 等字符

// 虚拟键盘布局
const rows = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ['+', '-', '>', '<', '(', ')', '[', ']', '、'],
]

// 所有可识别的按键（归一化为小写）
const allKeys = rows.flat().map((k) => k.toLowerCase())

const activeKey = ref('')
const displayKey = ref('') // 屏幕中央显示的大字符
const voiceOn = ref(true)
let activeTimer = null
let displayTimer = null

// ---------- 音效（Web Audio 合成打字机敲击声） ----------
let audioCtx
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}
function playKeySound() {
  const ctx = getCtx()
  const now = ctx.currentTime
  // 短促敲击声：方波 + 高通滤波
  const o = ctx.createOscillator()
  const f = ctx.createBiquadFilter()
  const g = ctx.createGain()
  o.type = 'square'
  o.frequency.value = 720 + Math.random() * 360
  f.type = 'highpass'
  f.frequency.value = 300
  g.gain.setValueAtTime(0.0001, now)
  g.gain.exponentialRampToValueAtTime(0.18, now + 0.004)
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08)
  o.connect(f).connect(g).connect(ctx.destination)
  o.start(now)
  o.stop(now + 0.09)
}

// ---------- 归一化按键：兼容中英文输入法 ----------
// keydown 的 event.key 在中英文下表现不同，这里把各类写法统一映射
function normalizeKey(raw) {
  if (!raw || raw.length > 2) return null
  const k = raw.trim()
  // 输入法候选弹窗触发的 Process 键忽略
  if (k === 'Process' || k === 'Unidentified') return null
  if (k === '/') return '、' // 中文输入法下 / 通常是顿号
  if (k === 'Backspace' || k === 'Space' || k === 'Enter' || k === 'Tab') return null
  return k
}

function triggerKey(rawKey) {
  const key = normalizeKey(rawKey)
  if (!key) return
  const lower = key.toLowerCase()
  if (!allKeys.includes(lower)) return

  // 敲击音
  playKeySound()
  // 高亮虚拟键盘
  activeKey.value = lower
  clearTimeout(activeTimer)
  activeTimer = setTimeout(() => (activeKey.value = ''), 280)

  // 中央大字显示
  displayKey.value = key
  clearTimeout(displayTimer)
  displayTimer = setTimeout(() => (displayKey.value = ''), 1100)

  // 语音播报（中英兼容：字母读英文名，符号读中文名）
  if (voiceOn.value && speechSupported) {
    speak(sayLabel(key), { rate: 1 })
  }
}

// 生成语音播报文本：兼容中文读法
function sayLabel(key) {
  const map = {
    '+': '加号', '-': '减号', '>': '大于号', '<': '小于号',
    '(': '左括号', ')': '右括号', '[': '左方括号', ']': '右方括号',
    '、': '顿号',
  }
  if (map[key]) return map[key]
  if (/^[a-z]$/i.test(key)) return key.toUpperCase() // 字母按英文名读
  return key // 数字直接读
}

// ---------- 全局键盘监听 ----------
function onKeydown(e) {
  triggerKey(e.key)
}
window.addEventListener('keydown', onKeydown)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  clearTimeout(activeTimer)
  clearTimeout(displayTimer)
  cancelSpeech()
  if (audioCtx) audioCtx.close()
})
</script>

<template>
  <div class="kbd-game hp-board">
    <h3 class="title">⌨️ 按键盘游戏</h3>
    <p class="tip">按下键盘上的任意按键，屏幕键盘会亮起来并发出声音和播报。支持数字、字母、加、减、大于、小于、括号、顿号。</p>

    <!-- 中央大字显示 -->
    <div class="display" :class="{ 'display--on': displayKey }">
      <span class="display__char">{{ displayKey || '⌨' }}</span>
    </div>

    <label v-if="speechSupported" class="voice-toggle">
      <input v-model="voiceOn" type="checkbox" /><span>🔊 语音播报按键</span>
    </label>

    <!-- 虚拟键盘 -->
    <div class="keyboard">
      <div v-for="(row, ri) in rows" :key="ri" class="row">
        <button
          v-for="k in row"
          :key="k"
          class="key"
          :class="{ 'key--active': activeKey === k.toLowerCase() }"
          @click="triggerKey(k)"
        >
          <span class="key__label">{{ k }}</span>
          <span class="key__cn">{{ sayLabel(k) }}</span>
        </button>
      </div>
    </div>

    <p class="hint">💡 也可以直接用鼠标点击屏幕上的按键</p>
  </div>
</template>

<style scoped>
.kbd-game { padding: 18px; }
.title { font-size: 19px; margin-bottom: 6px; }
.tip { font-size: 13px; color: var(--text-muted); line-height: 1.7; margin-bottom: 12px; }
.voice-toggle { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; margin: 4px 0 12px; cursor: pointer; }

.display {
  height: 130px; margin: 12px 0 18px; display: grid; place-items: center;
  background: var(--bg-deep); border-radius: var(--radius); border: 2px solid var(--border);
  transition: background 0.2s;
}
.display--on { background: linear-gradient(135deg, #fef3c7, #fde68a); border-color: #f59e0b; }
.display__char { font-size: 72px; font-weight: 900; color: var(--text-h); line-height: 1; }

.keyboard { display: flex; flex-direction: column; gap: 8px; }
.row { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
.key {
  min-width: 52px; height: 56px; padding: 0 8px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 1px;
  background: var(--surface-soft); border: 2px solid var(--border); border-radius: 10px;
  box-shadow: var(--shadow-sm); transition: all 0.1s; cursor: pointer;
}
.key__label { font-size: 18px; font-weight: 800; color: var(--text-h); line-height: 1; }
.key__cn { font-size: 9px; color: var(--text-muted); font-weight: 600; }
.key--active {
  background: linear-gradient(135deg, var(--primary), var(--primary-deep));
  border-color: transparent; transform: translateY(3px) scale(0.96); box-shadow: none;
}
.key--active .key__label { color: #fff; }
.key--active .key__cn { color: rgba(255,255,255,0.8); }

.hint { text-align: center; font-size: 12px; color: var(--text-muted); margin-top: 14px; }

@media (max-width: 560px) {
  .key { min-width: 30px; height: 46px; padding: 0 5px; }
  .key__label { font-size: 14px; }
  .key__cn { display: none; }
  .display__char { font-size: 56px; }
}
</style>
