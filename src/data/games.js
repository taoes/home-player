import GuessNumberGame from '../games/GuessNumberGame.vue'
import ColorTapGame from '../games/ColorTapGame.vue'
import ArithmeticGame from '../games/ArithmeticGame.vue'
import SimonSaysGame from '../games/SimonSaysGame.vue'
import MimicActionGame from '../games/MimicActionGame.vue'
import IdiomChainGame from '../games/IdiomChainGame.vue'
import DiceGame from '../games/DiceGame.vue'

// 家庭游戏清单：轻度、休闲、无广告无内购，适合全家一起玩
export const games = [
  {
    id: 'guess-number',
    name: '抢数字卡片',
    tagline: '听语音播报，抢出对应卡片',
    description:
      'APP 当发令员：设定数字范围开始本轮，每点一次就从剩余数字中随机抽一个并语音播报，本轮不重复。家人手持数字卡片，听到数字后快速抢出对应卡片，全部抽完看谁抢得多！',
    icon: '🎴',
    gradient: ['#38bdf8', '#2563eb'],
    category: '反应',
    tags: ['语音播报', '抢卡对战'],
    players: '2 人以上',
    age: '4+',
    component: GuessNumberGame,
  },
  {
    id: 'color-tap',
    name: '点颜色',
    tagline: '听颜色，手快有手慢无',
    description:
      '系统语音播报一个颜色，两位玩家分别在左右两侧抢点对应色块。可自由选择本局颜色，所有颜色高区分度、带文字，大人小孩都能玩。',
    icon: '🌈',
    gradient: ['#f472b6', '#9333ea'],
    category: '反应',
    tags: ['语音播报', '双人对战'],
    players: '2 人',
    age: '3+',
    component: ColorTapGame,
  },
  {
    id: 'arithmetic',
    name: '算术抢答',
    tagline: '听算式，抢出答案卡',
    description:
      'APP 语音播报算式（如「三加五等于几」），家人手持数字卡片抢出答案。公布答案后自行核对，可设加减乘除难度，全家比比谁算得快又准！',
    icon: '➕',
    gradient: ['#34d399', '#059669'],
    category: '益智',
    tags: ['语音播报', '心算'],
    players: '2 人以上',
    age: '5+',
    component: ArithmeticGame,
  },
  {
    id: 'simon-says',
    name: '主持人说',
    tagline: '听到三个字才能做动作',
    description:
      '经典派对反应游戏！主持人（APP）语音下达动作指令，只有前缀是「主持人说」时才能做动作，没听到这三个字却做了就扣一条命，共 3 条命，考验倾听与反应。',
    icon: '🎙️',
    gradient: ['#fbbf24', '#f97316'],
    category: '反应',
    tags: ['语音播报', '倾听'],
    players: '2 人以上',
    age: '4+',
    component: SimonSaysGame,
  },
  {
    id: 'mimic-action',
    name: '动作记忆接龙',
    tagline: '按顺序做完一串动作',
    description:
      'APP 语音播报一连串动作，每轮加一个新动作。家人需按完整顺序做完整个序列，序列越来越长，跟不上就结束！考验记忆力和身体协调，全家一起动起来。',
    icon: '🤸',
    gradient: ['#a78bfa', '#7c3aed'],
    category: '反应',
    tags: ['语音播报', '记忆', '肢体'],
    players: '2 人以上',
    age: '4+',
    component: MimicActionGame,
  },
  {
    id: 'idiom-chain',
    name: '诗词接龙',
    tagline: '听上半句，抢点下半句',
    description:
      'APP 语音播报上半句，显示 4 个文字选项，家人抢点正确的下半句！含古诗、成语、顺口溜三大题库，老少皆宜，寓教于乐。',
    icon: '📖',
    gradient: ['#f472b6', '#db2777'],
    category: '益智',
    tags: ['语音播报', '国学'],
    players: '2 人以上',
    age: '5+',
    component: IdiomChainGame,
  },
  {
    id: 'dice',
    name: '掷骰子',
    tagline: '桌游好帮手，可配置骰子',
    description:
      '可配置数量（1~6 颗）、颜色、形状和点数样式的骰子工具。投掷时有滚动音效并语音播报点数和总数，预设大富翁、单骰、五骰等模式，玩大富翁、飞行棋时随开随用。',
    icon: '🎲',
    gradient: ['#f87171', '#dc2626'],
    category: '工具',
    tags: ['音效', '桌游辅助'],
    players: '1 人以上',
    age: '3+',
    component: DiceGame,
  },
]

export const categories = ['全部', ...new Set(games.map((g) => g.category))]

export function getGame(id) {
  return games.find((g) => g.id === id)
}
