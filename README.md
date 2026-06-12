# 自由格斗 · Custom Fighter

一款"**招式不绑定角色**"的网页 2D 格斗游戏：开打前从公共招式库自由挑选 4 个招式组成自己的战斗风格，再进场对决。

## 特性

- 🥋 **13 个可装配招式**：打击 / 突进 / 飞行道具 / 投技 / 辅助 / 必杀 六大类
- 🤜🤛 **本地双人对战**：同一键盘（WASD+JKUIOP vs 方向键+数字）
- 🤖 **人机对战**：按距离分层决策的 AI
- ⚡ **完整格斗系统**：前摇/判定/后摇帧数据、防御削血、能量必杀、击倒起身无敌、飞行道具对消
- 🎨 **零素材依赖**：程序绘制火柴人骨骼动画 + 粒子打击特效

## 技术栈

Nuxt 3 · Vue 3 · TypeScript · Canvas 2D（60fps 固定逻辑帧，逻辑渲染分离，为在线对战帧同步预留）

## 快速开始

```bash
npm install
npm run dev      # 开发：http://localhost:3000
npm run build    # 生产构建
node .output/server/index.mjs   # 部署运行
```

## 项目结构

```
game/         纯 TS 战斗引擎（招式库 moves.ts 是调参主战场）
components/   Vue 3 界面（选招 LoadoutSelect / 战斗 BattleStage）
pages/        屏幕流转（菜单 → 选招 → 战斗）
docs/         策划文档
```

详细设计见 [docs/策划文档.md](docs/策划文档.md)。
