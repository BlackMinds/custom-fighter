<script setup lang="ts">
import { ref } from 'vue';
import type { GameMode, Loadout, MoveDef } from '~/game/types';
import { MOVE_LIBRARY } from '~/game/moves';

type Screen = 'menu' | 'loadout1' | 'loadout2' | 'battle';

const screen = ref<Screen>('menu');
const mode = ref<GameMode>('pvp');
const p1Loadout = ref<Loadout | null>(null);
const p2Loadout = ref<Loadout | null>(null);

const P1_COLOR = '#4cc9f0';
const P2_COLOR = '#f72585';

function pickMode(m: GameMode) {
  mode.value = m;
  p1Loadout.value = null;
  p2Loadout.value = null;
  screen.value = 'loadout1';
}

function randomLoadout(name: string, color: string): Loadout {
  const pool = [...MOVE_LIBRARY];
  const moves: MoveDef[] = [];
  for (let i = 0; i < 4; i++) {
    moves.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return { name, color, moves };
}

function onP1Confirm(loadout: Loadout) {
  p1Loadout.value = loadout;
  if (mode.value === 'pve') {
    p2Loadout.value = randomLoadout('电脑', P2_COLOR);
    screen.value = 'battle';
  } else {
    screen.value = 'loadout2';
  }
}

function onP2Confirm(loadout: Loadout) {
  p2Loadout.value = loadout;
  screen.value = 'battle';
}

function backToMenu() {
  screen.value = 'menu';
}
</script>

<template>
  <div class="page">
    <!-- 主菜单 -->
    <div v-if="screen === 'menu'" class="panel">
      <h1>自由格斗</h1>
      <p class="subtitle">CUSTOM FIGHTER —— 自选招式 · 自由开打</p>
      <div class="menu">
        <button class="big" @click="pickMode('pve')">⚔ 单人挑战（人机对战）</button>
        <button class="big" @click="pickMode('pvp')">🤜🤛 本地双人对战</button>
      </div>
      <div class="help">
        <div class="help-col">
          <h3 :style="{ color: P1_COLOR }">玩家 1</h3>
          <p>移动 <b>A / D</b> · 跳 <b>W</b> · 蹲 <b>S</b></p>
          <p>拳 <b>J</b> · 踢 <b>K</b> · 技能 <b>U I O P</b></p>
        </div>
        <div class="help-col">
          <h3 :style="{ color: P2_COLOR }">玩家 2</h3>
          <p>移动 <b>← →</b> · 跳 <b>↑</b> · 蹲 <b>↓</b></p>
          <p>拳 <b>, (小键盘1)</b> · 踢 <b>. (小键盘2)</b> · 技能 <b>1 2 3 4</b></p>
        </div>
        <div class="help-col">
          <h3 style="color: #ffd166">规则</h3>
          <p>按住后方向键防御 · 三局两胜</p>
          <p>攻击命中积攒能量，能量解锁必杀技</p>
        </div>
      </div>
    </div>

    <!-- P1 选招 -->
    <div v-else-if="screen === 'loadout1'" class="panel">
      <LoadoutSelect
        player-label="玩家 1"
        :player-color="P1_COLOR"
        :key-labels="['U', 'I', 'O', 'P']"
        @confirm="onP1Confirm"
      />
      <button class="back" @click="backToMenu">← 返回菜单</button>
    </div>

    <!-- P2 选招 -->
    <div v-else-if="screen === 'loadout2'" class="panel">
      <LoadoutSelect
        player-label="玩家 2"
        :player-color="P2_COLOR"
        :key-labels="['1', '2', '3', '4']"
        @confirm="onP2Confirm"
      />
      <button class="back" @click="backToMenu">← 返回菜单</button>
    </div>

    <!-- 战斗 -->
    <div v-else-if="screen === 'battle' && p1Loadout && p2Loadout" class="battle-wrap">
      <ClientOnly>
        <BattleStage
          :mode="mode"
          :p1="p1Loadout"
          :p2="p2Loadout"
          @exit="backToMenu"
        />
      </ClientOnly>
    </div>
  </div>
</template>

<style scoped>
.page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
}
.panel {
  width: 960px;
  max-height: 100vh;
  overflow-y: auto;
  padding: 24px;
  background: linear-gradient(160deg, #11131f 0%, #1a1030 100%);
  border-radius: 8px;
}
h1 {
  font-size: 40px;
  letter-spacing: 10px;
  text-align: center;
  margin: 28px 0 8px;
  background: linear-gradient(90deg, #4cc9f0, #c77dff, #f72585);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.subtitle { text-align: center; color: #8a8fb0; margin-bottom: 32px; letter-spacing: 3px; }
.menu { display: flex; flex-direction: column; gap: 16px; align-items: center; margin-bottom: 36px; }
button.big {
  width: 340px;
  padding: 14px;
  font-size: 18px;
  background: linear-gradient(90deg, #3a2d6e, #5b3aa0);
  color: #fff;
  border: 1px solid #7b5fd0;
  border-radius: 6px;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
}
button.big:hover { transform: scale(1.04); box-shadow: 0 0 16px rgba(150, 100, 255, 0.5); }
.help {
  display: flex;
  gap: 20px;
  justify-content: center;
  border-top: 1px solid #2a2d4a;
  padding-top: 20px;
}
.help-col { font-size: 13px; color: #9aa0c0; line-height: 1.9; }
.help-col h3 { font-size: 15px; margin-bottom: 6px; }
.help-col b { color: #dde4ff; }
.back {
  margin-top: 14px;
  padding: 8px 18px;
  background: transparent;
  color: #8a8fb0;
  border: 1px solid #3a3f66;
  border-radius: 6px;
  cursor: pointer;
}
.back:hover { color: #fff; border-color: #6f7dff; }
.battle-wrap { display: flex; align-items: center; justify-content: center; }
</style>
