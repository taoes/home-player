# 家庭游乐场 · 家庭互动游戏 APP

> 全家一起玩的小游戏集合。无广告、无内购、打开即玩，适合老人和孩子一起参与。

🎮 **在线演示**：<https://taoes.github.io/home-player/#/>

## 项目目标

放下手机刷屏，一家人围坐一起，用一块屏幕当「发令员」，通过**语音播报 + 抢答/抢卡**的方式互动。所有游戏均为轻度、休闲、零门槛设计，主打：

- 🎤 **语音驱动**：APP 当主持人，开口播报数字、颜色、算式、动作指令
- 🃏 **物理卡片互动**：家人手持数字卡/动作卡抢答，屏幕只做发令与核对
- 👨‍👩‍👧‍👦 **全家参与**：2 人以上即可开局，3 岁以上都能玩
- 📱 **手机/桌面通用**：响应式界面，手机横竖屏都适配

## 技术栈

- **Vue 3**（`<script setup>` SFC）+ **Vite** 构建
- **Vue Router 4**（hash 路由，`/` 首页、`/game/:id` 游戏页）
- **Web Speech API**（浏览器原生中文语音合成，无需任何后端）
- 纯前端，零依赖后端，`npm run build` 后可直接静态部署

## 游戏列表

| 游戏 | 玩法 | 适合 |
|------|------|------|
| 🎴 **抢数字卡片** | 设定范围，每点一次随机抽一个数字并语音播报，本轮不重复，家人抢出对应卡 | 4+，2 人以上 |
| 🌈 **点颜色** | 语音播报颜色，两位玩家在左右两侧抢点对应色块，可自选本局颜色 | 3+，2 人 |
| ➕ **算术抢答** | 语音播报算式（如「三加五等于几」），抢出数字答案卡，可设加减乘除 | 5+，2 人以上 |
| 🎙️ **主持人说** | 经典派对游戏：只有「主持人说」前缀的动作才能做，做错扣命 | 4+，2 人以上 |
| 🤸 **动作记忆接龙** | 语音播报动作序列，每轮加一个，按顺序做完，越来越长 | 4+，2 人以上 |
| 📖 **诗词接龙** | 语音播报上半句，4 个选项抢点正确下半句，含古诗/成语/顺口溜题库 | 5+，2 人以上 |

## 项目结构

```
src/
├── main.js                 # 入口，挂载 router
├── App.vue                 # 根组件，带页面切换动画
├── style.css               # 全局样式（家庭温暖主题 + 通用组件类）
├── router/
│   └── index.js            # 路由配置
├── data/
│   └── games.js            # 游戏清单与元信息（名称/图标/分类/组件）
├── composables/
│   └── useSpeech.js        # 语音播报封装（支持 onStart/onEnd 回调）
├── utils/
│   └── chineseNumber.js    # 数字转中文读法（如 18 → 十八）
├── components/
│   └── GameCard.vue        # 首页游戏卡片
├── views/
│   ├── HomeView.vue        # 首页：搜索、分类筛选、游戏网格
│   └── GameView.vue        # 游戏容器：返回栏、信息卡、动态加载游戏
└── games/                  # 每款游戏一个独立 Vue 页面
    ├── GuessNumberGame.vue
    ├── ColorTapGame.vue
    ├── ArithmeticGame.vue
    ├── SimonSaysGame.vue
    ├── MimicActionGame.vue
    └── IdiomChainGame.vue
```

## 开始使用

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建产物
npm run preview
```

## 自行 Fork 部署

想把游乐场部署到自己的 GitHub Pages？按以下步骤操作：

1. **Fork 仓库**：点击本仓库右上角 `Fork` 按钮，复制到自己的 GitHub 账号下。

2. （可选）**重命名仓库**：在 Fork 后的仓库 `Settings → Repository name` 改成你喜欢的名字（如 `my-home-games`）。仓库名会决定 Pages 的访问路径。

3. **修改部署路径**：编辑 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)，把 `BASE_URL` 改成你的仓库名对应的子路径：

   ```yaml
   env:
     BASE_URL: /my-home-games/   # 格式：/<你的仓库名>/
   ```

   > 若使用自定义域名或部署到根路径，把 `BASE_URL` 设为 `/`。

4. **提交改动并推送**：

   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "ci: 调整为自己的 Pages 路径"
   git push
   ```

5. **配置 Pages 源**：在仓库 `Settings → Pages → Build and deployment → Source` 选 `Deploy from a branch`，分支选 `pages`、目录选 `/ (root)`，保存。

6. **打 tag 触发自动部署**：

   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

   推送 tag 后，GitHub Actions 会自动安装依赖、构建并把产物发布到 `pages` 分支。

7. **访问你的站点**：约 1 分钟后打开 `https://<你的用户名>.github.io/<你的仓库名>/`，即可看到专属的家庭游乐场。

> 💡 后续每次更新代码后，只要打一个新 tag（如 `v1.0.1`、`v1.1.0`）并推送，就会自动重新构建部署，无需手动操作。

## 扩展新游戏

1. 在 `src/games/` 下新建 `XxxGame.vue`，遵循 `setup → playing → finished` 三段式
2. 在 [src/data/games.js](src/data/games.js) 中新增一条配置（id、名称、组件等）
3. 首页和路由会自动识别，无需改动其他文件

复用 `useSpeech.js` 即可获得语音播报能力，复用 `chineseNumber.js` 可把数字读成中文。

## 设计理念

- **发令员模式**：屏幕不评判对错，只负责「说」和「公布答案」，把互动交还给人与人之间
- **低门槛**：规则一句话能讲清，3 岁孩子、80 岁老人都能上手
- **派对属性**：主持人说、动作接龙这类游戏天然容易「笑场」，适合家庭聚会破冰
