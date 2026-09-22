<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { numToChinese } from '../utils/chineseNumber.js'
import { speak, cancelSpeech, speechSupported } from '../composables/useSpeech.js'

// 玩法：APP 当发令员 —— 设定范围开始本轮，每点一次从「剩余数字」中随机抽一个
// 并语音播报，本轮内不重复；家人手持数字卡片，听到数字后抢出对应卡片。

// ---------- 状态 ----------
const phase = ref('setup') // setup | playing | finished
const minVal = ref(1)
const maxVal = ref(20)
const voiceOn = ref(true)

const cycle = ref(0) // 当前轮次
const pool = ref([]) // 本轮剩余数字
const total = ref(0)
const drawn = ref(0)
const current = ref(null) // { num, spoken }
const speaking = ref(false)
const rounds = ref([]) // [{ cycle, min, max, items: [{ num, spoken }] }]，新轮在前
const errorMsg = ref('')

const MAX_POOL = 500 // 卡片数量上限，防止范围过大

const quickRanges = [
  { label: '1 ~ 10', min: 1, max: 10 },
  { label: '1 ~ 20', min: 1, max: 20 },
  { label: '1 ~ 50', min: 1, max: 50 },
  { label: '1 ~ 100', min: 1, max: 100 },
]

const progress = computed(() =>
  total.value ? Math.round((drawn.value / total.value) * 100) : 0
)
const remaining = computed(() => total.value - drawn.value)

function say(text, rate = 0.7) {
  if (!voiceOn.value || !speechSupported) return
  const ok = speak(text, {
    rate,
    onStart: () => (speaking.value = true),
    onEnd: () => (speaking.value = false),
  })
  if (!ok) speaking.value = false
}

// ---------- 开始本轮 ----------
function startRound() {
  errorMsg.value = ''
  const min = parseInt(minVal.value, 10)
  const max = parseInt(maxVal.value, 10)

  if (Number.isNaN(min) || Number.isNaN(max)) {
    errorMsg.value = '请输入有效的整数范围'
    return
  }
  if (min < 0 || max > 999) {
    errorMsg.value = '范围需要在 0 ~ 999 之间（数字卡片用整数）'
    return
  }
  if (min >= max) {
    errorMsg.value = '最小值必须小于最大值'
    return
  }
  const count = max - min + 1
  if (count > MAX_POOL) {
    errorMsg.value = `最多 ${MAX_POOL} 张卡片，请缩小范围`
    return
  }

  cycle.value += 1
  // 构建完整数字池
  pool.value = Array.from({ length: count }, (_, i) => min + i)
  total.value = count
  drawn.value = 0
  current.value = null
  rounds.value.unshift({ cycle: cycle.value, min, max, items: [] })
  phase.value = 'playing'

  say(`第${numToChinese(cycle.value)}轮开始，准备抢卡片！范围从${numToChinese(min)}到${numToChinese(max)}，共${numToChinese(count)}张`, 0.85)
}

// ---------- 抽一个：从剩余数字中随机，本轮不重复（swap-pop） ----------
function drawOne() {
  if (phase.value !== 'playing' || pool.value.length === 0) return

  const idx = Math.floor(Math.random() * pool.value.length)
  const num = pool.value[idx]
  pool.value[idx] = pool.value[pool.value.length - 1]
  pool.value.pop()
  drawn.value += 1

  const spoken = numToChinese(num)
  current.value = { num, spoken }
  rounds.value[0].items.unshift({ num, spoken })

  // 慢速清晰播报数字
  speaking.value = voiceOn.value && speechSupported
  say(spoken, 0.7)

  if (pool.value.length === 0) {
    phase.value = 'finished'
    setTimeout(() => say('本轮数字全部抽完啦！', 0.85), 1100)
  }
}

function replay() {
  if (current.value) say(current.value.spoken, 0.65)
}

function backToSetup() {
  cancelSpeech()
  speaking.value = false
  phase.value = 'setup'
  pool.value = []
  current.value = null
  errorMsg.value = ''
}

onBeforeUnmount(() => {
  cancelSpeech()
})
</script>

<template>
  <div class="speaker hp-board">
    <!-- ========== 设置阶段 ========== -->
    <div v-if="phase === 'setup'" class="setup">
      <h3 class="panel-title">� 抢数字卡片</h3>
      <p class="panel-tip">
        先把数字卡片分给家人。开始后每点一次按钮，系统会从剩余数字里随机抽一个并语音播报，
        听到数字就<span class="hl">快速抢出对应卡片</span>，本轮数字不会重复！
      </p>

      <div class="range-row">
        <label class="field">
          <span>最小数字</span>
          <input v-model.number="minVal" type="number" min="0" max="999" inputmode="numeric" placeholder="1" />
        </label>
        <span class="range-sep">~</span>
        <label class="field">
          <span>最大数字</span>
          <input v-model.number="maxVal" type="number" min="0" max="999" inputmode="numeric" placeholder="20" />
        </label>
      </div>

      <div class="quick-ranges">
        <button
          v-for="r in quickRanges"
          :key="r.label"
          class="quick-btn"
          @click="minVal = r.min; maxVal = r.max"
        >
          {{ r.label }}
        </button>
      </div>

      <label v-if="speechSupported" class="voice-toggle">
        <input v-model="voiceOn" type="checkbox" />
        <span>🔊 语音播报数字</span>
      </label>
      <p v-else class="no-voice">当前浏览器不支持语音播报，请看屏幕上的数字抢卡</p>

      <p v-if="errorMsg" class="error-msg">⚠️ {{ errorMsg }}</p>

      <button class="hp-btn hp-btn-primary start-btn" @click="startRound">▶ 开始本轮</button>
    </div>

    <!-- ========== 抽取阶段 ========== -->
    <div v-else class="playing">
      <!-- 进度信息 -->
      <div class="hp-hud">
        <div class="hp-stat">
          <span class="hp-stat-label">第几轮</span>
          <span class="hp-stat-value">第 {{ cycle }} 轮</span>
        </div>
        <div class="hp-stat">
          <span class="hp-stat-label">已抽 / 总数</span>
          <span class="hp-stat-value">{{ drawn }} / {{ total }}</span>
        </div>
        <div class="hp-stat">
          <span class="hp-stat-label">剩余</span>
          <span class="hp-stat-value">{{ remaining }}</span>
        </div>
      </div>

      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progress + '%' }" />
      </div>

      <!-- 播报大屏 -->
      <div class="stage" :class="{ 'stage--speaking': speaking }">
        <span class="stage__label">🎙️ 本次数字</span>
        <span class="stage__num">{{ current ? current.num : '—' }}</span>
        <span class="stage__read">
          <template v-if="current">读作：{{ current.spoken }}</template>
          <template v-else>点击下方按钮抽取第一个数字</template>
        </span>
        <span v-if="speaking" class="stage__wave" aria-hidden="true">
          <i /><i /><i /><i /><i />
        </span>
      </div>

      <!-- 主操作按钮 -->
      <button
        v-if="phase === 'playing'"
        class="draw-btn"
        :class="{ 'draw-btn--pulse': !current }"
        @click="drawOne"
      >
        🎲 抽一个并播报
      </button>

      <div class="sub-controls">
        <button class="hp-btn" :disabled="!current" @click="replay">🔊 再听一遍</button>
        <button class="hp-btn" @click="backToSetup">↺ 重置 / 设置</button>
      </div>

      <!-- 历史记录 -->
      <div v-if="rounds.length" class="history">
        <h4>📋 抽取记录</h4>
        <div class="history__rounds">
          <div v-for="r in rounds" :key="r.cycle" class="history-round">
            <p class="history-round__tag">
              第 {{ r.cycle }} 轮 · 范围 {{ r.min }}~{{ r.max }}（{{ r.items.length }}/{{ r.max - r.min + 1 }}）
            </p>
            <ul v-if="r.items.length">
              <li v-for="(it, i) in r.items" :key="`${r.cycle}-${it.num}-${i}`">
                <span class="history-chip">
                  <strong>{{ it.num }}</strong>
                  <em>{{ it.spoken }}</em>
                </span>
              </li>
            </ul>
            <p v-else class="history-round__empty">还没有抽取数字</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== 本轮完成遮罩 ========== -->
    <div v-if="phase === 'finished'" class="hp-overlay">
      <div class="hp-overlay-card">
        <span class="hp-overlay-emoji">🎊</span>
        <h3>本轮全部抽完！</h3>
        <p>
          第 {{ cycle }} 轮共 {{ total }} 个数字<br />
          看看谁抢到的卡片最多～
        </p>
        <div class="overlay-actions">
          <button class="hp-btn hp-btn-primary" @click="startRound">▶ 开始下一轮</button>
          <button class="hp-btn" @click="backToSetup">重新设置范围</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.speaker {
  padding: 18px;
}
.panel-title {
  font-size: 19px;
  margin-bottom: 6px;
}
.panel-tip {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 16px;
  line-height: 1.7;
}
.hl {
  color: var(--primary-deep);
  font-weight: 700;
}

/* ---------- 设置 ---------- */
.range-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 12px;
}
.field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}
.field input {
  width: 100%;
  padding: 13px 12px;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  font-family: inherit;
  color: var(--text-h);
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  outline: none;
  background: var(--surface-soft);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.field input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(255, 122, 69, 0.12);
}
.field input::-webkit-outer-spin-button,
.field input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.field input[type='number'] {
  -moz-appearance: textfield;
  appearance: textfield;
}
.range-sep {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-muted);
  padding-bottom: 12px;
}

.quick-ranges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.quick-btn {
  padding: 7px 15px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  background: var(--surface-soft);
  border: 1.5px solid var(--border);
  border-radius: 999px;
  transition: all 0.15s ease;
}
.quick-btn:active {
  transform: scale(0.95);
}

.voice-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 14px;
  cursor: pointer;
}
.no-voice {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 12px;
}
.start-btn {
  width: 100%;
  padding: 15px;
  font-size: 16px;
}
.error-msg {
  color: var(--danger);
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 10px;
}

/* ---------- 抽取阶段 ---------- */
.playing {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.progress-track {
  height: 10px;
  background: var(--bg-deep);
  border-radius: 999px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #38bdf8, #2563eb);
  border-radius: 999px;
  transition: width 0.3s ease;
}

/* 播报大屏 */
.stage {
  position: relative;
  min-height: 168px;
  border-radius: var(--radius);
  background: linear-gradient(160deg, #f0f7ff 0%, #e8f0fe 100%);
  border: 2px solid #cfe2fb;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 16px;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}
.stage--speaking {
  border-color: #38bdf8;
  box-shadow: 0 0 0 5px rgba(56, 189, 248, 0.18);
}
.stage__label {
  font-size: 13px;
  font-weight: 700;
  color: #5b83b8;
}
.stage__num {
  font-size: 72px;
  font-weight: 900;
  line-height: 1.1;
  color: #1d4ed8;
  font-variant-numeric: tabular-nums;
}
.stage__read {
  font-size: 15px;
  font-weight: 700;
  color: #4b6584;
}

/* 播报声波动画 */
.stage__wave {
  position: absolute;
  bottom: 12px;
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 16px;
}
.stage__wave i {
  width: 4px;
  border-radius: 2px;
  background: #38bdf8;
  animation: wave 0.7s ease-in-out infinite;
}
.stage__wave i:nth-child(1) { height: 30%; animation-delay: 0s; }
.stage__wave i:nth-child(2) { height: 80%; animation-delay: 0.12s; }
.stage__wave i:nth-child(3) { height: 100%; animation-delay: 0.24s; }
.stage__wave i:nth-child(4) { height: 65%; animation-delay: 0.36s; }
.stage__wave i:nth-child(5) { height: 40%; animation-delay: 0.48s; }
@keyframes wave {
  0%, 100% { transform: scaleY(0.4); }
  50% { transform: scaleY(1); }
}

/* 主抽取按钮 */
.draw-btn {
  width: 100%;
  padding: 20px;
  font-size: 20px;
  font-weight: 800;
  font-family: inherit;
  color: #fff;
  border-radius: var(--radius);
  background: linear-gradient(135deg, #38bdf8 0%, #2563eb 100%);
  box-shadow: 0 10px 24px -8px rgba(37, 99, 235, 0.6);
  transition: transform 0.12s ease, box-shadow 0.2s ease;
  user-select: none;
}
.draw-btn:active {
  transform: scale(0.97);
}
.draw-btn--pulse {
  animation: draw-pulse 1.6s ease-in-out infinite;
}
@keyframes draw-pulse {
  0%, 100% { box-shadow: 0 10px 24px -8px rgba(37, 99, 235, 0.6); }
  50% { box-shadow: 0 10px 30px -4px rgba(37, 99, 235, 0.85); }
}

.sub-controls {
  display: flex;
  gap: 10px;
}
.sub-controls .hp-btn {
  flex: 1;
  padding: 11px;
  font-size: 14px;
}

/* 历史记录 */
.history h4 {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.history__rounds {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 220px;
  overflow-y: auto;
}
.history-round__tag {
  font-size: 12px;
  font-weight: 700;
  color: #2563eb;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 5px 10px;
  margin-bottom: 8px;
}
.history-round ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}
.history-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  padding: 5px 11px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
}
.history-chip strong {
  font-size: 15px;
  font-weight: 800;
  color: var(--text-h);
}
.history-chip em {
  font-size: 11px;
  font-style: normal;
  color: var(--text-muted);
}
.history-round__empty {
  font-size: 12px;
  color: var(--text-muted);
}

.overlay-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (max-width: 560px) {
  .speaker {
    padding: 14px;
  }
  .stage {
    min-height: 150px;
  }
  .stage__num {
    font-size: 62px;
  }
  .draw-btn {
    padding: 18px;
    font-size: 18px;
  }
}
</style>
