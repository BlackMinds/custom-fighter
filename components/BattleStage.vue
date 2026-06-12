<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import type { GameMode, Loadout } from '~/game/types';
import { Engine } from '~/game/engine';
import { Renderer, VIEW_W, VIEW_H } from '~/game/render';
import { KeyboardManager } from '~/game/input';
import { AIController } from '~/game/ai';

const props = defineProps<{
  mode: GameMode;
  p1: Loadout;
  p2: Loadout;
}>();

const emit = defineEmits<{ exit: [] }>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const matchOver = ref(false);
const winnerName = ref('');

let engine: Engine;
let renderer: Renderer;
let kb: KeyboardManager;
let ai: AIController;
let rafId = 0;
let lastTime = 0;
let accumulator = 0;
const STEP = 1000 / 60;

function startMatch() {
  engine = new Engine([props.p1, props.p2]);
  matchOver.value = false;
  winnerName.value = '';
}

function loop(now: number) {
  rafId = requestAnimationFrame(loop);
  if (lastTime === 0) lastTime = now;
  accumulator += now - lastTime;
  lastTime = now;
  // 防止后台切回时追帧爆炸
  if (accumulator > 200) accumulator = 200;

  while (accumulator >= STEP) {
    const p1Input = kb.frame(0);
    const p2Input = props.mode === 'pve' ? ai.decide(engine, 1) : kb.frame(1);
    engine.step([p1Input, p2Input]);
    kb.endFrame();
    accumulator -= STEP;
  }

  if (engine.phase === 'matchEnd' && !matchOver.value) {
    matchOver.value = true;
    winnerName.value = engine.winner >= 0 ? engine.loadouts[engine.winner].name : '';
  }

  const ctx = canvasRef.value?.getContext('2d');
  if (ctx) renderer.render(ctx, engine);
}

onMounted(() => {
  renderer = new Renderer();
  kb = new KeyboardManager();
  kb.attach();
  ai = new AIController();
  startMatch();
  rafId = requestAnimationFrame(loop);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
  kb?.dispose();
});

function rematch() {
  startMatch();
}
</script>

<template>
  <div class="stage">
    <canvas ref="canvasRef" :width="VIEW_W" :height="VIEW_H" />
    <div v-if="matchOver" class="overlay">
      <div class="result">
        <h2>🏆 {{ winnerName }} 获胜！</h2>
        <div class="btns">
          <button @click="rematch">再来一局</button>
          <button @click="emit('exit')">返回菜单</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stage { position: relative; width: 960px; height: 540px; }
canvas {
  display: block;
  border-radius: 8px;
  box-shadow: 0 0 40px rgba(80, 120, 255, 0.25);
  background: #000;
}
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(8, 6, 20, 0.7);
  border-radius: 8px;
}
.result {
  text-align: center;
  background: #1a1530;
  border: 1px solid #5b3aa0;
  border-radius: 10px;
  padding: 36px 60px;
}
.result h2 { font-size: 28px; margin-bottom: 24px; color: #ffd166; }
.btns { display: flex; gap: 16px; justify-content: center; }
.btns button {
  padding: 12px 28px;
  font-size: 16px;
  background: linear-gradient(90deg, #3a2d6e, #5b3aa0);
  color: #fff;
  border: 1px solid #7b5fd0;
  border-radius: 6px;
  cursor: pointer;
}
.btns button:hover { box-shadow: 0 0 14px rgba(150, 100, 255, 0.5); }
</style>
