<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { speak, cancelSpeech, speechSupported } from '../composables/useSpeech.js'

// 模仿动作（动作记忆接龙）：每轮播报一个新动作，家人需按顺序做完整个序列
// 序列越来越长，跟不上即结束；自报完成情况

const actionPool = [
  '摸鼻子', '摸耳朵', '拍拍头', '拍膝盖', '举右手', '举左手',
  '点点头', '摇摇头', '眨眨眼', '张张嘴', '拍拍手', '跺跺脚',
  '扭扭腰', '耸耸肩', '摸摸肚子', '伸个懒腰',
]

const phase = ref('setup') // setup | announce | recall | finished
const voiceOn = ref(true)

const sequence = ref([])
const revealIdx = ref(-1) // 正在播报第几个
const current = ref(null) // 当前播报的动作
const best = ref(0) // 历史最长
const roundLen = ref(0)

function say(text, rate = 0.8) {
  if (voiceOn.value && speechSupported) speak(text, { rate })
}

function startGame() {
  sequence.value = []
  best.value = 0
  roundLen.value = 0
  phase.value = 'announce'
  addAndAnnounce()
}

function addAndAnnounce() {
  // 加入一个新动作
  const next = actionPool[Math.floor(Math.random() * actionPool.length)]
  sequence.value.push(next)
  roundLen.value = sequence.value.length
  revealIdx.value = -1
  current.value = null
  say(`第${roundLen.value}轮，注意听完整动作序列`, 0.85)
  setTimeout(playNext, 1400)
}

let playTimer = null
function playNext() {
  revealIdx.value += 1
  if (revealIdx.value >= sequence.value.length) {
    // 播报完毕，进入模仿阶段
    current.value = null
    phase.value = 'recall'
    say('请按顺序做完所有动作', 0.85)
    return
  }
  current.value = sequence.value[revealIdx.value]
  say(current.value, 0.75)
  playTimer = setTimeout(playNext, 1600)
}

function replayAll() {
  clearTimeout(playTimer)
  revealIdx.value = -1
  current.value = null
  phase.value = 'announce'
  say('重新播报', 0.9)
  setTimeout(playNext, 800)
}

function recallDone(success) {
  if (success) {
    best.value = Math.max(best.value, roundLen.value)
    say('做得好！进入下一轮', 0.9)
    setTimeout(() => { phase.value = 'announce'; addAndAnnounce() }, 1200)
  } else {
    say(`没关系！你最长完成了${best.value}个动作`, 0.85)
    phase.value = 'finished'
  }
}

function backToSetup() {
  clearTimeout(playTimer)
  cancelSpeech()
  phase.value = 'setup'
  sequence.value = []
  current.value = null
}

const rating = computed(() => {
  if (best.value >= 8) return { emoji: '🤸', text: '协调大师！' }
  if (best.value >= 5) return { emoji: '🌟', text: '身手不凡' }
  if (best.value >= 3) return { emoji: '🙂', text: '不错哦' }
  return { emoji: '💪', text: '多练几次' }
})

onBeforeUnmount(() => { clearTimeout(playTimer); cancelSpeech() })
</script>

<template>
  <div class="mimic hp-board">
    <div v-if="phase === 'setup'" class="setup">
      <h3 class="panel-title">🤸 动作记忆接龙</h3>
      <p class="panel-tip">
        APP 语音播报一连串动作，家人需<span class="hl">按顺序做完整个序列</span>。
        每轮加一个新动作，序列越来越长，跟不上就结束！考验记忆和身体协调。
      </p>
      <label v-if="speechSupported" class="voice-toggle">
        <input v-model="voiceOn" type="checkbox" /><span>🔊 语音播报动作</span>
      </label>
      <p v-else class="no-voice">不支持语音将显示动作文字，按顺序记忆</p>
      <button class="hp-btn hp-btn-primary start-btn" @click="startGame">▶ 开始接龙</button>
    </div>

    <div v-else-if="phase === 'announce'" class="playing">
      <div class="hp-hud">
        <div class="hp-stat"><span class="hp-stat-label">第几轮</span><span class="hp-stat-value">{{ roundLen }} 个动作</span></div>
        <div class="hp-stat"><span class="hp-stat-label">最长记录</span><span class="hp-stat-value">{{ best }}</span></div>
      </div>
      <div class="stage">
        <span class="stage__label">🎙️ 听动作 ({{ revealIdx + 1 }}/{{ sequence.length }})</span>
        <span v-if="current" class="stage__action">{{ current }}</span>
        <span v-else class="stage__wait">🎵 准备…</span>
        <div v-if="current" class="dots">
          <span v-for="(a, i) in sequence" :key="i" class="dot" :class="{ 'dot--on': i <= revealIdx }">{{ i + 1 }}</span>
        </div>
      </div>
      <p class="tip">仔细听完整序列，待会儿要按顺序做出来</p>
    </div>

    <div v-else-if="phase === 'recall'" class="playing">
      <div class="hp-hud">
        <div class="hp-stat"><span class="hp-stat-label">本轮长度</span><span class="hp-stat-value">{{ roundLen }} 个</span></div>
        <div class="hp-stat"><span class="hp-stat-label">最长记录</span><span class="hp-stat-value">{{ best }}</span></div>
      </div>
      <div class="stage stage--recall">
        <span class="stage__label">🤔 请按顺序做完</span>
        <div class="seq-list">
          <span v-for="(a, i) in sequence" :key="i" class="seq-item">{{ i + 1 }}.{{ a }}</span>
        </div>
        <button v-if="speechSupported && voiceOn" class="replay-btn" @click="replayAll">🔊 重新听一遍</button>
      </div>
      <p class="tip">全家人一起按顺序做完了吗？</p>
      <div class="judge-row">
        <button class="hp-btn judge judge--yes" @click="recallDone(true)">✅ 全做对了</button>
        <button class="hp-btn judge judge--no" @click="recallDone(false)">😵 跟不上了</button>
      </div>
    </div>

    <div v-else class="playing">
      <div class="result-card">
        <span class="result-emoji">{{ rating.emoji }}</span>
        <h3>{{ rating.text }}</h3>
        <p class="result-score">最长完成 <strong>{{ best }}</strong> 个动作</p>
      </div>
      <button class="hp-btn hp-btn-primary" @click="startGame">▶ 再玩一次</button>
      <button class="hp-btn" @click="backToSetup">重新设置</button>
    </div>
  </div>
</template>

<style scoped>
.mimic { padding: 18px; }
.panel-title { font-size: 19px; margin-bottom: 6px; }
.panel-tip { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; line-height: 1.7; }
.hl { color: var(--primary-deep); font-weight: 700; }
.voice-toggle { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; margin-bottom: 14px; cursor: pointer; }
.no-voice { font-size: 12px; color: var(--text-muted); margin-bottom: 12px; }
.start-btn { width: 100%; padding: 15px; font-size: 16px; }

.playing { display: flex; flex-direction: column; gap: 14px; }
.stage { min-height: 160px; border-radius: var(--radius); background: linear-gradient(160deg, #f0fdf4, #dcfce7); border: 2px solid #86efac; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 18px; }
.stage--recall { background: linear-gradient(160deg, #fffbeb, #fef3c7); border-color: #fcd34d; }
.stage__label { font-size: 13px; font-weight: 700; color: #15803d; }
.stage--recall .stage__label { color: #b45309; }
.stage__action { font-size: 40px; font-weight: 900; color: #166534; }
.stage__wait { font-size: 18px; color: #64748b; }
.dots { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; max-width: 100%; }
.dot { width: 26px; height: 26px; border-radius: 50%; background: #d1fae5; color: #6b7280; font-size: 12px; font-weight: 700; display: grid; place-items: center; border: 1px solid #a7f3d0; }
.dot--on { background: #16a34a; color: #fff; border-color: #16a34a; }
.seq-list { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; max-width: 100%; }
.seq-item { padding: 6px 12px; background: #fff; border: 1px solid #fcd34d; border-radius: 999px; font-size: 14px; font-weight: 700; color: #92400e; }
.replay-btn { font-size: 12px; font-weight: 700; color: var(--accent); background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 999px; padding: 4px 12px; }
.tip { text-align: center; font-size: 13px; color: var(--text-muted); }
.judge-row { display: flex; gap: 10px; }
.judge { flex: 1; padding: 14px; font-size: 15px; }
.judge--yes { background: #dcfce7; border-color: #86efac; color: #15803d; }
.judge--no { background: #fee2e2; border-color: #fca5a5; color: #b91c1c; }
.result-card { text-align: center; background: var(--surface-soft); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px 20px; }
.result-emoji { font-size: 56px; display: block; }
.result-score { font-size: 16px; color: var(--text); margin-top: 8px; }
.result-score strong { font-size: 28px; color: var(--primary-deep); }
@media (max-width: 560px) { .mimic { padding: 14px; } .stage__action { font-size: 32px; } .seq-item { font-size: 12px; padding: 5px 10px; } }
</style>
