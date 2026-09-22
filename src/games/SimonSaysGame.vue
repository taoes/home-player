<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { speak, cancelSpeech, speechSupported } from '../composables/useSpeech.js'

// 主持人说：只有带「主持人说」前缀的动作才执行，不带前缀却执行就出局

const actions = [
  { name: '举右手', speak: '举右手' },
  { name: '举左手', speak: '举左手' },
  { name: '摸鼻子', speak: '摸鼻子' },
  { name: '摸耳朵', speak: '摸耳朵' },
  { name: '拍拍头', speak: '拍拍头' },
  { name: '拍膝盖', speak: '拍膝盖' },
  { name: '站起来', speak: '站起来' },
  { name: '坐下来', speak: '坐下来' },
  { name: '转个圈', speak: '转个圈' },
  { name: '眨眨眼', speak: '眨眨眼' },
  { name: '点点头', speak: '点点头' },
  { name: '摇摇头', speak: '摇头' },
]

const phase = ref('setup') // setup | playing | finished
const voiceOn = ref(true)
const totalRounds = ref(15)

const roundNo = ref(0)
const lives = ref(3)
const score = ref(0)
const current = ref(null) // { action, hasPrefix, spoken }
const feedback = ref(null) // { correct: bool, action, hasPrefix, userDid }
const streak = ref(0)

function say(text, rate = 0.85) {
  if (voiceOn.value && speechSupported) speak(text, { rate })
}

function startGame() {
  roundNo.value = 0
  lives.value = 3
  score.value = 0
  streak.value = 0
  feedback.value = null
  phase.value = 'playing'
  say('主持人说游戏开始！记住，只有听到「主持人说」三个字，才能做动作哦', 0.85)
  setTimeout(nextRound, 2200)
}

function nextRound() {
  if (roundNo.value >= totalRounds.value || lives.value <= 0) {
    phase.value = 'finished'
    say(`游戏结束！你坚持了${roundNo.value}轮，得${score.value}分`, 0.85)
    return
  }
  roundNo.value += 1
  const action = actions[Math.floor(Math.random() * actions.length)]
  // 约 65% 带前缀
  const hasPrefix = Math.random() < 0.65
  const spoken = hasPrefix ? `主持人说，${action.speak}` : action.speak
  current.value = { action, hasPrefix, spoken }
  feedback.value = null
  say(spoken, 0.8)
}

function judge(did) {
  if (!current.value || feedback.value) return
  const shouldDo = current.value.hasPrefix
  const correct = did === shouldDo
  feedback.value = { correct, action: current.value.action, hasPrefix: shouldDo, userDid: did }
  if (correct) {
    score.value += 1
    streak.value += 1
    say('做对了！', 1)
  } else {
    lives.value -= 1
    streak.value = 0
    say(shouldDo ? '这轮该做动作，你没做！' : '主持人没说，你怎么做了！', 0.9)
  }
  setTimeout(nextRound, 1600)
}

function backToSetup() {
  cancelSpeech()
  phase.value = 'setup'
  current.value = null
  feedback.value = null
}

const rating = computed(() => {
  if (lives.value <= 0) return { emoji: '😵', text: '三次出局！' }
  if (score.value >= totalRounds.value) return { emoji: '👑', text: '完美通关！' }
  if (score.value >= totalRounds.value * 0.7) return { emoji: '🏆', text: '反应超快' }
  return { emoji: '🙂', text: '耳朵真灵' }
})

onBeforeUnmount(cancelSpeech)
</script>

<template>
  <div class="simon hp-board">
    <div v-if="phase === 'setup'" class="setup">
      <h3 class="panel-title">🎙️ 主持人说</h3>
      <p class="panel-tip">
        主持人（APP）会语音下达动作指令。<span class="hl">只有听到「主持人说」三个字，才能做动作！</span>
        没听到这三个字却做了动作，就扣一条命，共 3 条命。
      </p>
      <h4 class="setup-label">回合数</h4>
      <div class="opt-row">
        <button class="opt" :class="{ active: totalRounds === 10 }" @click="totalRounds = 10">10 轮</button>
        <button class="opt" :class="{ active: totalRounds === 15 }" @click="totalRounds = 15">15 轮</button>
        <button class="opt" :class="{ active: totalRounds === 25 }" @click="totalRounds = 25">25 轮</button>
      </div>
      <label v-if="speechSupported" class="voice-toggle">
        <input v-model="voiceOn" type="checkbox" /><span>🔊 语音播报指令</span>
      </label>
      <p v-else class="no-voice">不支持语音将显示文字指令，请仔细判断前缀</p>
      <button class="hp-btn hp-btn-primary start-btn" @click="startGame">▶ 开始游戏</button>
    </div>

    <div v-else-if="phase === 'playing'" class="playing">
      <div class="hp-hud">
        <div class="hp-stat"><span class="hp-stat-label">第几轮</span><span class="hp-stat-value">{{ roundNo }}/{{ totalRounds }}</span></div>
        <div class="hp-stat"><span class="hp-stat-label">得分</span><span class="hp-stat-value">{{ score }}</span></div>
        <div class="hp-stat"><span class="hp-stat-label">剩余命</span><span class="hp-stat-value">{{ '❤'.repeat(lives) || '—' }}</span></div>
      </div>

      <div class="stage" :class="{ 'stage--prefix': current && current.hasPrefix }">
        <span class="stage__label">🎙️ 主持人指令</span>
        <span v-if="current" class="stage__cmd">
          <span v-if="current.hasPrefix" class="prefix">主持人说：</span>{{ current.action.name }}
        </span>
        <button v-if="speechSupported && voiceOn && current" class="replay-btn" @click="say(current.spoken, 0.75)">🔊 再听一遍</button>
      </div>

      <template v-if="!feedback">
        <p class="judge-tip">你听到「主持人说」了吗？</p>
        <div class="judge-row">
          <button class="hp-btn judge judge--yes" @click="judge(true)">✅ 做了动作</button>
          <button class="hp-btn judge judge--no" @click="judge(false)">🚫 没做动作</button>
        </div>
      </template>
      <template v-else>
        <div class="fb" :class="feedback.correct ? 'fb--ok' : 'fb--bad'">
          <span class="fb__emoji">{{ feedback.correct ? '✅' : '❌' }}</span>
          <span class="fb__text">
            {{ feedback.correct ? '判断正确！' : (feedback.hasPrefix ? '该做动作你没做！' : '主持人没说，不能做！') }}
          </span>
        </div>
      </template>

      <button class="hp-btn hp-btn-ghost quit" @click="backToSetup">↺ 重新设置</button>
    </div>

    <div v-else class="playing">
      <div class="result-card">
        <span class="result-emoji">{{ rating.emoji }}</span>
        <h3>{{ rating.text }}</h3>
        <p class="result-score">坚持 <strong>{{ roundNo }}</strong> 轮，得 <strong>{{ score }}</strong> 分</p>
      </div>
      <button class="hp-btn hp-btn-primary" @click="startGame">▶ 再玩一次</button>
      <button class="hp-btn" @click="backToSetup">重新设置</button>
    </div>
  </div>
</template>

<style scoped>
.simon { padding: 18px; }
.panel-title { font-size: 19px; margin-bottom: 6px; }
.panel-tip { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; line-height: 1.7; }
.hl { color: var(--primary-deep); font-weight: 700; }
.setup-label { font-size: 14px; color: var(--text); margin: 0 0 10px; }
.opt-row { display: flex; gap: 8px; margin-bottom: 16px; }
.opt { flex: 1; padding: 11px 4px; font-size: 14px; font-weight: 700; border-radius: var(--radius-sm); background: var(--surface-soft); border: 2px solid var(--border); color: var(--text); transition: all 0.15s; }
.opt.active { color: #fff; background: linear-gradient(135deg, var(--primary), var(--primary-deep)); border-color: transparent; }
.voice-toggle { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; margin-bottom: 14px; cursor: pointer; }
.no-voice { font-size: 12px; color: var(--text-muted); margin-bottom: 12px; }
.start-btn { width: 100%; padding: 15px; font-size: 16px; }

.playing { display: flex; flex-direction: column; gap: 14px; }
.stage { min-height: 140px; border-radius: var(--radius); background: linear-gradient(160deg, #fff7ed, #ffedd5); border: 2px solid #fed7aa; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 18px; transition: all 0.2s; }
.stage--prefix { background: linear-gradient(160deg, #ecfdf5, #d1fae5); border-color: #6ee7b7; }
.stage__label { font-size: 13px; font-weight: 700; color: #c2410c; }
.stage__cmd { font-size: 30px; font-weight: 900; color: #7c2d12; text-align: center; }
.prefix { color: #047857; }
.replay-btn { font-size: 12px; font-weight: 700; color: var(--accent); background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 999px; padding: 4px 12px; }
.judge-tip { text-align: center; font-size: 14px; font-weight: 700; color: var(--text); }
.judge-row { display: flex; gap: 10px; }
.judge { flex: 1; padding: 14px; font-size: 15px; }
.judge--yes { background: #dcfce7; border-color: #86efac; color: #15803d; }
.judge--no { background: #fee2e2; border-color: #fca5a5; color: #b91c1c; }
.fb { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border-radius: var(--radius-sm); font-size: 15px; font-weight: 700; }
.fb--ok { background: #dcfce7; color: #15803d; }
.fb--bad { background: #fee2e2; color: #b91c1c; }
.quit { font-size: 13px; color: var(--text-muted); }
.result-card { text-align: center; background: var(--surface-soft); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px 20px; }
.result-emoji { font-size: 56px; display: block; }
.result-score { font-size: 16px; color: var(--text); margin-top: 8px; }
.result-score strong { font-size: 24px; color: var(--primary-deep); }
@media (max-width: 560px) { .simon { padding: 14px; } .stage__cmd { font-size: 24px; } }
</style>
