// 中文数字读数（移植自 random-number-speaker，已验证的读法逻辑）
const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九']
const unitsBig = ['', '万', '亿']

// 把 0~9999 的一段转成中文
function sectionText(n) {
  if (n === 0) return '零'
  const q = Math.floor(n / 1000) % 10 // 千位
  const b = Math.floor(n / 100) % 10 // 百位
  const s = Math.floor(n / 10) % 10 // 十位
  const g = n % 10 // 个位

  let out = ''
  let needZero = false
  if (q) out += digits[q] + '千'
  if (q && !b && (s || g)) needZero = true
  if (b) {
    if (needZero) {
      out += '零'
      needZero = false
    }
    out += digits[b] + '百'
  }
  if (s) {
    if (needZero) {
      out += '零'
      needZero = false
    }
    out += digits[s] + '十'
  } else if (g && (q || b)) {
    needZero = true
  }
  if (g) {
    if (needZero) {
      out += '零'
      needZero = false
    }
    out += digits[g]
  }
  return out
}

function chineseInt(num) {
  if (num === 0) return '零'
  const sign = num < 0 ? '负' : ''
  let n = Math.abs(num)
  if (n >= 1e12) {
    return sign + String(n).split('').map((c) => digits[+c]).join('')
  }

  const groups = []
  while (n > 0) {
    groups.push(n % 10000)
    n = Math.floor(n / 10000)
  }
  const topVal = groups[groups.length - 1]

  let out = ''
  let first = true
  let pendingZero = false
  for (let g = groups.length - 1; g >= 0; g--) {
    const val = groups[g]
    if (val === 0) {
      pendingZero = true
      continue
    }
    const seg = sectionText(val) + unitsBig[g]
    if (first) {
      out += seg
      first = false
    } else {
      if (pendingZero || val < 1000) out += '零'
      out += seg
    }
    pendingZero = false
  }

  // 最高段为 10~19 时去掉开头的「一」：17 → 十七
  if (topVal >= 10 && topVal <= 19) {
    out = out.replace(/^一十/, '十')
  }
  return sign + out
}

// 数字转中文读法（支持负数与最多三位小数）
export function numToChinese(num) {
  const sign = num < 0 ? '负' : ''
  const abs = Math.abs(num)
  const intPart = Math.floor(abs)
  const fixed = abs.toFixed(3)
  const fs = fixed.split('.')[1] || ''
  const fracClean = fs.replace(/0+$/, '')
  let out = chineseInt(intPart)
  if (fracClean) {
    out += '点' + fracClean.split('').map((c) => digits[+c]).join('')
  }
  return sign + out
}
