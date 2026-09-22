<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { speak, cancelSpeech, speechSupported } from '../composables/useSpeech.js'

// 顺口溜/古诗接龙：APP 语音播报上半句，显示 4 个文字选项，家人抢点正确下半句

const banks = {
  古诗: [
    { q: '床前明月光', a: '疑是地上霜' },
    { q: '举头望明月', a: '低头思故乡' },
    { q: '春眠不觉晓', a: '处处闻啼鸟' },
    { q: '夜来风雨声', a: '花落知多少' },
    { q: '白日依山尽', a: '黄河入海流' },
    { q: '欲穷千里目', a: '更上一层楼' },
    { q: '两个黄鹂鸣翠柳', a: '一行白鹭上青天' },
    { q: '窗含西岭千秋雪', a: '门泊东吴万里船' },
    { q: '锄禾日当午', a: '汗滴禾下土' },
    { q: '谁知盘中餐', a: '粒粒皆辛苦' },
    { q: '离离原上草', a: '一岁一枯荣' },
    { q: '野火烧不尽', a: '春风吹又生' },
    { q: '千山鸟飞绝', a: '万径人踪灭' },
    { q: '孤舟蓑笠翁', a: '独钓寒江雪' },
  ],
  成语: [
    { q: '一不做', a: '二不休' },
    { q: '三天打鱼', a: '两天晒网' },
    { q: '吃一堑', a: '长一智' },
    { q: '耳听为虚', a: '眼见为实' },
    { q: '近朱者赤', a: '近墨者黑' },
    { q: '精诚所至', a: '金石为开' },
    { q: '万事俱备', a: '只欠东风' },
    { q: '少壮不努力', a: '老大徒伤悲' },
    { q: '书读百遍', a: '其义自见' },
    { q: '水能载舟', a: '亦能覆舟' },
    { q: '桃李不言', a: '下自成蹊' },
    { q: '亡羊补牢', a: '犹未为晚' },
  ],
  顺口溜: [
    { q: '小白兔', a: '白又白' },
    { q: '两只耳朵', a: '竖起来' },
    { q: '爱吃萝卜', a: '爱吃菜' },
    { q: '蹦蹦跳跳', a: '真可爱' },
    { q: '一二三四五', a: '上山打老虎' },
    { q: '老虎没打到', a: '打到小松鼠' },
    { q: '松鼠有几个', a: '让我数一数' },
    { q: '数来又数去', a: '一二三四五' },
    { q: '拉大锯', a: '扯大锯' },
    { q: '姥姥家', a: '唱大戏' },
    { q: '接姑娘', a: '请女婿' },
    { q: '小毛驴', a: '不吃草' },
  ],
}

const bankNames = Object.keys(banks)
const phase = ref('setup')
const voiceOn = ref(true)
const bank = ref('古诗')
const totalRounds = ref(10)

const roundNo = ref(0)
const score = ref(0)
const current = ref(null) // { q, a, options }
const feedback = ref(null) // { picked, correct, a }
const usedQs = ref(new Set())
const wrongFlash = ref('')
const pendingPick = ref('') // 两步选择：第一次点击只播报读音，第二次点击才提交判定

function say(text, rate = 0.8) {
  if (voiceOn.value && speechSupported) speak(text, { rate })
}

function shuffle(arr) {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickQuestion() {
  const pool = banks[bank.value]
  let avail = pool.filter((p) => !usedQs.value.has(p.q))
  if (avail.length === 0) {
    usedQs.value.clear()
    avail = pool
  }
  const q = avail[Math.floor(Math.random() * avail.length)]
  usedQs.value.add(q.q)
  // 从同一题库抽 3 个干扰项
  const distractors = shuffle(pool.filter((p) => p.a !== q.a)).slice(0, 3).map((p) => p.a)
  const options = shuffle([q.a, ...distractors])
  return { ...q, options }
}

function startGame() {
  usedQs.value = new Set()
  roundNo.value = 0
  score.value = 0
  feedback.value = null
  phase.value = 'playing'
  nextRound()
}

function nextRound() {
  if (roundNo.value >= totalRounds.value) {
    phase.value = 'finished'
    say(`游戏结束！答对${score.value}题`, 0.85)
    return
  }
  roundNo.value += 1
  current.value = pickQuestion()
  feedback.value = null
  say(current.value.q, 0.75)
}

function pick(option) {
  if (!current.value || feedback.value) return
  // 两步逻辑：第一次点击只语音播报该选项，再次点击同一选项才提交判定（照顾不识字的孩子）
  if (pendingPick.value !== option) {
    pendingPick.value = option
    say(option, 0.8)
    return
  }
  // 第二次点击同一选项 → 提交
  const correct = option === current.value.a
  feedback.value = { picked: option, correct, a: current.value.a }
  pendingPick.value = ''
  if (correct) {
    score.value += 1
    say(`答对了！${current.value.q}，${current.value.a}`, 0.85)
  } else {
    wrongFlash.value = option
    setTimeout(() => (wrongFlash.value = ''), 400)
    say(`正确答案是，${current.value.a}`, 0.8)
  }
  setTimeout(nextRound, 1800)
}

function backToSetup() {
  cancelSpeech()
  phase.value = 'setup'
  current.value = null
  feedback.value = null
}

const rating = computed(() => {
  const p = totalRounds.value ? score.value / totalRounds.value : 0
  if (p >= 0.9) return { emoji: '🎓', text: '诗词小达人！' }
  if (p >= 0.7) return { emoji: '🌟', text: '功底扎实' }
  if (p >= 0.5) return { emoji: '🙂', text: '继续积累' }
  return { emoji: '📚', text: '多背多练' }
})

onBeforeUnmount(cancelSpeech)
</script>

<template>
  <div class="idiom hp-board">
    <div v-if="phase === 'setup'" class="setup">
      <h3 class="panel-title">📖 诗词接龙</h3>
      <p class="panel-tip">
        APP 语音播报上半句，显示 4 个选项。家人<span class="hl">抢点正确的下半句</span>，答对加分！
      </p>
      <h4 class="setup-label">题库</h4>
      <div class="opt-row">
        <button v-for="b in bankNames" :key="b" class="opt" :class="{ active: bank === b }" @click="bank = b">{{ b }}</button>
      </div>
      <h4 class="setup-label">回合数</h4>
      <div class="opt-row">
        <button class="opt" :class="{ active: totalRounds === 5 }" @click="totalRounds = 5">5 题</button>
        <button class="opt" :class="{ active: totalRounds === 10 }" @click="totalRounds = 10">10 题</button>
        <button class="opt" :class="{ active: totalRounds === 20 }" @click="totalRounds = 20">20 题</button>
      </div>
      <label v-if="speechSupported" class="voice-toggle">
        <input v-model="voiceOn" type="checkbox" /><span>🔊 语音播报题目</span>
      </label>
      <p v-else class="no-voice">不支持语音请看屏幕题目</p>
      <button class="hp-btn hp-btn-primary start-btn" @click="startGame">▶ 开始答题</button>
    </div>

    <div v-else-if="phase === 'playing'" class="playing">
      <div class="hp-hud">
        <div class="hp-stat"><span class="hp-stat-label">第几题</span><span class="hp-stat-value">{{ roundNo }}/{{ totalRounds }}</span></div>
        <div class="hp-stat"><span class="hp-stat-label">答对</span><span class="hp-stat-value">{{ score }}</span></div>
      </div>

      <div class="stage">
        <span class="stage__label">🎙️ 听上半句，抢点下半句</span>
        <span v-if="current" class="stage__q">{{ current.q }}，___</span>
        <button v-if="speechSupported && voiceOn && current" class="replay-btn" @click="say(current.q, 0.7)">🔊 再听一遍</button>
      </div>

      <p class="pick-tip">👆 点一下听读法，再点一次确认答案</p>
      <div class="options">
        <button
          v-for="opt in (current ? current.options : [])"
          :key="opt"
          class="option"
          :class="{
            'option--pending': !feedback && pendingPick === opt,
            'option--correct': feedback && opt === current.a,
            'option--wrong': feedback && opt === feedback.picked && !feedback.correct,
            'option--shake': wrongFlash === opt,
            'option--dim': feedback && opt !== current.a && opt !== feedback.picked,
          }"
          :disabled="!!feedback"
          @click="pick(opt)"
        >
          {{ opt }}
        </button>
      </div>

      <div v-if="feedback" class="fb" :class="feedback.correct ? 'fb--ok' : 'fb--bad'">
        <span>{{ feedback.correct ? '✅ 答对啦！' : '❌ 正确答案：' + feedback.a }}</span>
      </div>

      <button class="hp-btn hp-btn-ghost quit" @click="backToSetup">↺ 重新设置</button>
    </div>

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
.idiom { padding: 18px; }
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
.stage { min-height: 130px; border-radius: var(--radius); background: linear-gradient(160deg, #fdf4ff, #fae8ff); border: 2px solid #e9d5ff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 18px; }
.stage__label { font-size: 13px; font-weight: 700; color: #7e22ce; }
.stage__q { font-size: 26px; font-weight: 900; color: #581c87; text-align: center; }
.replay-btn { font-size: 12px; font-weight: 700; color: var(--accent); background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 999px; padding: 4px 12px; }

.options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.option { padding: 18px 12px; font-size: 17px; font-weight: 800; font-family: inherit; border-radius: var(--radius-sm); background: var(--surface); border: 2px solid var(--border); color: var(--text-h); box-shadow: var(--shadow-sm); transition: transform 0.12s, border-color 0.15s, opacity 0.15s; }
.option:active:not(:disabled) { transform: scale(0.96); }
.option--correct { background: #dcfce7; border-color: #22c55e; color: #15803d; }
.option--wrong { background: #fee2e2; border-color: #ef4444; color: #b91c1c; }
.option--dim { opacity: 0.45; }
.option--shake { animation: shake 0.4s ease; }
@keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
.option:disabled { cursor: default; }
.fb { text-align: center; padding: 12px; border-radius: var(--radius-sm); font-size: 15px; font-weight: 800; }
.fb--ok { background: #dcfce7; color: #15803d; }
.fb--bad { background: #fee2e2; color: #b91c1c; }
.quit { font-size: 13px; color: var(--text-muted); }
.result-card { text-align: center; background: var(--surface-soft); border: 1px solid var(--border); border-radius: var(--radius); padding: 28px 20px; }
.result-emoji { font-size: 56px; display: block; }
.result-score { font-size: 16px; color: var(--text); margin-top: 8px; }
.result-score strong { font-size: 28px; color: var(--primary-deep); }
@media (max-width: 560px) { .idiom { padding: 14px; } .stage__q { font-size: 21px; } .option { padding: 14px 8px; font-size: 15px; } }
.option--pending { background: #fef3c7; border-color: #f59e0b; color: #92400e; box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.25); }
.pick-tip { text-align: center; font-size: 13px; font-weight: 700; color: var(--text-muted); margin: 0; }
</style>
