<script setup lang="ts">
import { ref, computed } from 'vue';
import { MOVE_LIBRARY } from '~/game/moves';
import { COMMANDS } from '~/game/commands';
import type { Loadout, MoveDef } from '~/game/types';

const props = defineProps<{
  playerLabel: string;
  playerColor: string;
  keyLabels: string[];
  commandHints: string[];
}>();

const emit = defineEmits<{
  confirm: [loadout: Loadout];
}>();

const selected = ref<MoveDef[]>([]);
// 指令位：存招式 id，'' 表示不装配
const commandSel = ref<string[]>(COMMANDS.map(() => ''));

const isSelected = (m: MoveDef) => selected.value.some((s) => s.id === m.id);

// 任意槽位（技能槽+指令位）已占用的招式 id
const usedIds = computed(() => {
  const ids = new Set(selected.value.map((s) => s.id));
  for (const id of commandSel.value) if (id) ids.add(id);
  return ids;
});

const isUsedByCommand = (m: MoveDef) => commandSel.value.includes(m.id);

function toggle(m: MoveDef) {
  if (isSelected(m)) {
    selected.value = selected.value.filter((s) => s.id !== m.id);
  } else if (selected.value.length < 4 && !isUsedByCommand(m)) {
    selected.value = [...selected.value, m];
  }
}

// 指令位下拉选项：排除其他槽位已用的招式（保留本位当前值）
function optionsFor(slot: number): MoveDef[] {
  return MOVE_LIBRARY.filter(
    (m) => m.id === commandSel.value[slot] || !usedIds.value.has(m.id),
  );
}

function randomPick() {
  const pool = [...MOVE_LIBRARY];
  const take = () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
  selected.value = [take(), take(), take(), take()];
  commandSel.value = COMMANDS.map(() => take().id);
}

const ready = computed(() => selected.value.length === 4);

function confirm() {
  if (!ready.value) return;
  emit('confirm', {
    name: props.playerLabel,
    color: props.playerColor,
    moves: [...selected.value],
    commandMoves: commandSel.value.map(
      (id) => MOVE_LIBRARY.find((m) => m.id === id) ?? null,
    ),
  });
}
</script>

<template>
  <div class="loadout">
    <h2>
      <span class="pname" :style="{ color: playerColor }">{{ playerLabel }}</span>
      —— 选择 4 个招式装入技能槽
    </h2>

    <div class="slots">
      <div
        v-for="i in 4"
        :key="i"
        class="slot"
        :class="{ filled: !!selected[i - 1] }"
      >
        <div class="key">[{{ keyLabels[i - 1] }}]</div>
        <div>{{ selected[i - 1]?.name ?? '空' }}</div>
      </div>
    </div>

    <div class="cmd-title">
      指令招式（可选）—— 方向+拳/踢 触发，"前/后"相对面向，换边自动镜像
    </div>
    <div class="slots cmd-slots">
      <div
        v-for="(c, i) in COMMANDS"
        :key="c.id"
        class="slot cmd-slot"
        :class="{ filled: !!commandSel[i] }"
      >
        <div class="key">{{ c.label }} <span class="hint">{{ commandHints[i] }}</span></div>
        <select v-model="commandSel[i]">
          <option value="">— 不装 —</option>
          <option v-for="m in optionsFor(i)" :key="m.id" :value="m.id">
            {{ m.name }}
          </option>
        </select>
      </div>
    </div>

    <div class="move-grid">
      <div
        v-for="m in MOVE_LIBRARY"
        :key="m.id"
        class="move-card"
        :class="{ selected: isSelected(m), incmd: isUsedByCommand(m) }"
        @click="toggle(m)"
      >
        <div>
          <span class="mname" :style="{ color: m.color }">{{ m.name }}</span>
          <span class="mtag">{{ m.category }}</span>
          <span v-if="isUsedByCommand(m)" class="mtag cmd-used">指令位</span>
        </div>
        <div class="mdesc">{{ m.desc }}</div>
        <div class="mstats">
          伤害 {{ m.damage }}{{ m.multiHit ? '×' + m.multiHit : '' }}
          · 前摇 {{ m.startup }}帧
          <template v-if="m.meterCost"> · 耗气 {{ m.meterCost }}</template>
        </div>
      </div>
    </div>

    <div class="bar-row">
      <button class="big" style="width: 180px" @click="randomPick">🎲 随机配置</button>
      <button class="big" style="width: 240px" :disabled="!ready" @click="confirm">
        {{ ready ? '✔ 确认出战' : `还差 ${4 - selected.length} 个招式` }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.loadout { max-width: 880px; margin: 0 auto; }
h2 { font-size: 20px; margin: 4px 0 12px; }
.pname { font-weight: bold; }
.slots { display: flex; gap: 10px; margin: 12px 0; }
.slot {
  flex: 1;
  background: #141627;
  border: 2px dashed #3a3f66;
  border-radius: 6px;
  padding: 8px;
  min-height: 54px;
  text-align: center;
  font-size: 13px;
}
.slot.filled { border-style: solid; border-color: #ffd166; }
.slot .key { color: #ffd166; font-weight: bold; }
.cmd-title { font-size: 13px; color: #9aa0c0; margin: 14px 0 6px; }
.cmd-slots { margin-top: 0; }
.cmd-slot .hint { color: #6fc3df; font-weight: normal; font-size: 11px; }
.cmd-slot select {
  width: 100%;
  margin-top: 5px;
  background: #1c1f33;
  color: #dde4ff;
  border: 1px solid #3a3f66;
  border-radius: 4px;
  padding: 4px;
  font-size: 12px;
}
.cmd-slot select:focus { outline: none; border-color: #6f7dff; }
.move-card.incmd { border-color: #48bfe3; cursor: default; }
.mtag.cmd-used { color: #48bfe3; }
.move-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 10px 0; }
.move-card {
  background: #1c1f33;
  border: 2px solid #333a5c;
  border-radius: 6px;
  padding: 10px;
  cursor: pointer;
  transition: border-color 0.1s, background 0.1s;
  user-select: none;
}
.move-card:hover { border-color: #6f7dff; }
.move-card.selected { border-color: #ffd166; background: #2a2440; }
.mname { font-weight: bold; font-size: 15px; }
.mtag { font-size: 11px; color: #ffd166; margin-left: 6px; }
.mdesc { font-size: 12px; color: #9aa0c0; margin-top: 4px; line-height: 1.4; }
.mstats { font-size: 11px; color: #6fc3df; margin-top: 4px; }
.bar-row { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; }
button.big {
  padding: 12px;
  font-size: 16px;
  background: linear-gradient(90deg, #3a2d6e, #5b3aa0);
  color: #fff;
  border: 1px solid #7b5fd0;
  border-radius: 6px;
  cursor: pointer;
}
button.big:disabled { opacity: 0.4; cursor: not-allowed; }
button.big:not(:disabled):hover { box-shadow: 0 0 14px rgba(150, 100, 255, 0.5); }
</style>
