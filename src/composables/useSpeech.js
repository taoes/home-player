// 浏览器语音播报（SpeechSynthesis）封装，优先使用中文语音
export const speechSupported =
  typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

let voices = []

function refreshVoices() {
  if (!speechSupported) return
  voices = window.speechSynthesis.getVoices() || []
}

if (speechSupported) {
  refreshVoices()
  // 部分浏览器语音列表异步加载
  window.speechSynthesis.onvoiceschanged = refreshVoices
}

function pickChineseVoice() {
  if (!voices.length) refreshVoices()
  return (
    voices.find((v) => /zh[-_]CN/i.test(v.lang)) ||
    voices.find((v) => /zh[-_]/i.test(v.lang)) ||
    voices.find((v) => /^zh/i.test(v.lang)) ||
    voices[0]
  )
}

export function speak(text, { rate = 0.85, pitch = 1, onStart, onEnd } = {}) {
  if (!speechSupported || !text) return false
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'zh-CN'
  u.rate = rate
  u.pitch = pitch
  const v = pickChineseVoice()
  if (v) u.voice = v
  if (typeof onStart === 'function') u.onstart = onStart
  if (typeof onEnd === 'function') {
    u.onend = onEnd
    u.onerror = onEnd
  }
  window.speechSynthesis.speak(u)
  return true
}

export function cancelSpeech() {
  if (speechSupported) window.speechSynthesis.cancel()
}
