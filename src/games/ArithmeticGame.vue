<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { numToChinese } from '../utils/chineseNumber.js'
import { speak, cancelSpeech, speechSupported } from '../composables/useSpeech.js'

// 算术抢答：APP 语音播报算式，家人手持数字卡片抢答，公布答案后自行核对

const phases = ['setup', 'playing', 'reveal']
const phase = ref('setup')
const voiceOn = ref(true)
const difficulty = ref('easy') // easy 加减 | medium 加减乘 | hard 乘除
const rangeLevel = ref(10) // 数字范围上限
const totalRounds = ref(10)

const roundNo = ref(0)
const score = ref(0)
const current = ref(null) // { a, b, op, answer, spoken }
const lastResult = ref(null) // { ...current, correct: bool }
const history = ref([])

const opSymbols = { add: '+', sub: '−', mul: '×', div: '÷' }
const opSpoken = { add: '加', sub: '减', mul: '乘以', div: '除以' }

function say(text, rate = 0.8) {
  if (voiceOn.value && speechSupported) speak(text, { rate })
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function genProblem() {
  const ops = difficulty.value === 'easy' ? ['add', 'sub'] : difficulty.value === 'medium' ? ['add', 'sub', 'mul'] : ['mul', 'div']
  const op = ops[randInt(0, ops.length - 1)]
  const max = rangeLevel.value
  let a, b, answer
  if (op === 'add') {
    a = randInt(1, max)
    b = randInt(1, max)
    answer = a + b
  } else if (op === 'sub') {
    a = randInt(1, max)
    b = randInt(1, a)
    answer = a - b
  } else if (op === 'mul') {
    const m = Math.max(2, Math.floor(max / 2))
    a = randInt(2, m)
    b = randInt(2, m)
    answer = a * b
  } else {
    // div: 保证整除
    b = randInt(2, Math.max(2, Math.floor(max / 2)))
    answer = randInt(2, Math.max(2, Math.floor(max / b)))
    a = b * answer
  }
  return { a, b, op, answer, spoken: `${numToChinese(a)}${opSpoken[op]}${numToChinese(b)}等于几` }
}

function startGame() {
  roundNo.value = 0
  score.value = 0
  history.value = []
  lastResult.value = null
  phase.value = 'playing'
  nextRound()
}

function nextRound() {
  if (roundNo.value >= totalRounds.value) {
    phase.value = 'reveal'
    say(`游戏结束！你答对了${numToChinese(score.value)}题`, 0.85)
    return
  }
  roundNo.value += 1
  current.value = genProblem()
  lastResult.value = null
  say(current.value.spoken, 0.75)
}

function revealAnswer() {
  if (!current.value) return
  lastResult.value = { ...current.value }
  history.value.unshift({ ...current.value })
  say(`答案是${numToChinese(current.value.answer)}`, 0.7)
}

function markResult(correct) {
  if (correct) score.value += 1
  if (lastResult.value) lastResult.value.marked = correct
  setTimeout(nextRound, 600)
}

function backToSetup() {
  cancelSpeech()
  phase.value = 'setup'
  current.value = null
  lastResult.value = null
}

const rating = computed(() => {
  const p = totalRounds.value ? score.value / totalRounds.value : 0
  if (p >= 0.9) return { emoji: '🏆', text: '算术小天才！' }
  if (p >= 0.7) return { emoji: '🌟', text: '反应真快' }
  if (p >= 0.5) return { emoji: '🙂', text: '继续练习哦' }
  return { emoji: '💪', text: '下次更棒' }
})

onBeforeUnmount(cancelSpeech)
</script>

<template>
  <div class="arith hp-board">
    <!-- 设置 -->
    <div v-if="phase === 'setup'" class="setup">
      <h3 class="panel-title">➕ 算术抢答</h3>
      <p class="panel-tip">
        APP 语音播报算式，家人手持数字卡片抢出答案。公布答案后自行核对，答对加分！
      </p>

      <h4 class="setup-label">难度</h4>
      <div class="opt-row">
        <button class="opt" :class="{ active: difficulty === 'easy' }" @click="difficulty = 'easy'">加减法</button>
        <button class="opt" :class="{ active: difficulty === 'medium' }" @click="difficulty = 'medium'">加减乘</button>
        <button class="opt" :class="{ active: difficulty === 'hard' }" @click="difficulty = 'hard'">乘除法</button>
      </div>

      <h4 class="setup-label">数字范围</h4>
      <div class="opt-row">
        <button class="opt" :class="{ active: rangeLevel === 10 }" @click="rangeLevel = 10">1 ~ 10</button>
        <button class="opt" :class="{ active: rangeLevel === 20 }" @click="rangeLevel = 20">1 ~ 20</button>
        <button class="opt" :class="{ active: rangeLevel === 50 }" @click="rangeLevel = 50">1 ~ 50</button>
      </div>

      <h4 class="setup-label">回合数</h4>
      <div class="opt-row">
        <button class="opt" :class="{ active: totalRounds === 5 }" @click="totalRounds = 5">5 题</button>
        <button class="opt" :class="{ active: totalRounds === 10 }" @click="totalRounds = 10">10 题</button>
        <button class="opt" :class="{ active: totalRounds === 20 }" @click="totalRounds = 20">20 题</button>
      </div>

      <label v-if="speechSupported" class="voice-toggle">
        <input v-model="voiceOn" type="checkbox" /><span>🔊 语音播报算式</span>
      </label>
      <p v-else class="no-voice">当前浏览器不支持语音，请看屏幕上的算式</p>

      <button class="hp-btn hp-btn-primary start-btn" @click="startGame">▶ 开始答题</button>
    </div>

    <!-- 答题 -->
    <div v-else-if="phase === 'playing'" class="playing">
      <div class="hp-hud">
        <div class="hp-stat"><span class="hp-stat-label">第几题</span><span class="hp-stat-value">{{ roundNo }}/{{ totalRounds }}</span></div>
        <div class="hp-stat"><span class="hp-stat-label">答对</span><span class="hp-stat-value">{{ score }}</span></div>
      </div>

      <div class="stage">
        <span class="stage__label">🎙️ 听算式</span>
        <span v-if="current" class="stage__formula">{{ current.a }} {{ opSymbols[current.op] }} {{ current.b }} = ?</span>
        <p class="stage__hint">听到算式后，抢出你的数字答案卡</p>
        <button v-if="speechSupported && voiceOn" class="replay-btn" @click="current && say(current.spoken, 0.7)">🔊 再听一遍</button>
      </div>

      <template v-if="!lastResult">
        <button class="hp-btn hp-btn-primary big-btn" @click="revealAnswer">📢 公布答案</button>
      </template>
      <template v-else>
        <div class="answer-show">
          <span class="answer-show__label">正确答案</span>
          <span class="answer-show__num">{{ lastResult.answer }}</span>
        </div>
        <p class="judge-tip">你抢对了吗？</p>
        <div class="judge-row">
          <button class="hp-btn judge judge--yes" @click="markResult(true)">✅ 答对了</button>
          <button class="hp-btn judge judge--no" @click="markResult(false)">❌ 答错了</button>
        </div>
      </template>

      <button class="hp-btn hp-btn-ghost quit" @click="backToSetup">↺ 重新设置</button>
    </div>

    <!-- 结算 -->
    <div v-else class="playing">
      <div class="result-card">
        <span class="result-emoji">{{ rating.emoji }}</span>
        <h3>{{ rating.text }}</h3>
        <p class="result-score">答对 <strong>{{ score }}</strong> / {{ totalRounds }} 题</p>
      </div>
      <button class="hp-btn hp-btn-primary" @click="startGame">▶ 再来一局</button>
      <button class="hp-btn" @click="backToSetup">重新设置</button>
    </div>
  </div>
</template>

<style scoped>
.arith { padding: 18px; }
.panel-title { font-size: 19px; margin-bottom: 6px; }
.panel-tip { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; line-height: 1.7; }
.setup-label { font-size: 14px; color: var(--text); margin: 0 0 10px; }
.opt-row { display: flex; gap: 8px; margin-bottom: 16px; }
.opt { flex: 1; padding: 11px 4px; font-size: 14px; font-weight: 700; border-radius: var(--radius-sm); background: var(--surface-soft); border: 2px solid var(--border); color: var(--text); transition: all 0.15s; }
.opt.active { color: #fff; background: linear-gradient(135deg, var(--primary), var(--primary-deep)); border-color: transparent; }
.voice-toggle { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; margin-bottom: 14px; cursor: pointer; }
.no-voice { font-size: 12px; color: var(--text-muted); margin-bottom: 12px; }
.start-btn { width: 100%; padding: 15px; font-size: 16px; }

.playing { display: flex; flex-direction: column; gap: 14px; }
.stage { min-height: 150px; border-radius: var(--radius); background: linear-gradient(160deg, #f0f7ff, #e8f0fe); border: 2px solid #cfe2fb; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 18px; }
.stage__label { font-size: 13px; font-weight: 700; color: #5b83b8; }
.stage__formula { font-size: 44px; font-weight: 900; color: #1d4ed8; font-variant-numeric: tabular-nums; }
.stage__hint { font-size: 13px; color: #64748b; }
.replay-btn { font-size: 12px; font-weight: 700; color: var(--accent); background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 999px; padding: 4px 12px; }
.big-btn { width: 100%; padding: 16px; font-size: 17px; }

.answer-show { text-align: center; background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: var(--radius); padding: 16px; }
.answer-show__label { display: block; font-size: 13px; font-weight: 700; color: #15803d; margin-bottom: 4px; }
.answer-show__num { font-size: 56px; font-weight: 900; color: #16a34a; }
.judge-tip { text-align: center; font-size: 14px; font-weight: 700; color: var(--text); }
.judge-row { display: flex; gap: 10px; }
.judge { flex: 1; padding: 14px; font-size: 15px; }
.judge--yes { background: #dcfce7; border-color: #86efac; color: #15803d; }
.judge--no { background: #fee2e2; border-color: #fca5a5; color: #b91c1c; }
.quit { font-size: 13px; color: var(--text-muted); }

.result-card { text-align: center; background: var(--surface-soft); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px 20px; }
.result-emoji { font-size: 56px; display: block; }
.result-score { font-size: 16px; color: var(--text); margin-top: 8px; }
.result-score strong { font-size: 28px; color: var(--primary-deep); }
@media (max-width: 560px) { .arith { padding: 14px; } .stage__formula { font-size: 36px; } }
</style>
