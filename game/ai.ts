import type { InputFrame, MoveDef } from './types';
import { emptyInput } from './input';
import { COMMANDS } from './commands';
import type { Engine } from './engine';

// 简单 AI：按距离与对手状态做周期性决策
export class AIController {
  private cooldown = 0;
  private moveDir = 0;        // -1 后退 1 前进 0 不动
  private moveTimer = 0;
  private blockTimer = 0;

  decide(engine: Engine, selfIdx: 0 | 1): InputFrame {
    const input = emptyInput();
    const self = engine.fighters[selfIdx];
    const opp = engine.fighters[1 - selfIdx];
    if (engine.phase !== 'fight') return input;

    const dist = Math.abs(opp.x - self.x);
    const toOpp = opp.x > self.x ? 1 : -1;
    const oppThreat = !!opp.attack && opp.attack.phase !== 'recovery';

    const walkToward = () => {
      if (toOpp === 1) input.right = true; else input.left = true;
    };
    const walkAway = () => {
      if (toOpp === 1) input.left = true; else input.right = true;
    };

    // 持续防御中
    if (this.blockTimer > 0) {
      this.blockTimer--;
      walkAway();
      return input;
    }

    // 持续移动中
    if (this.moveTimer > 0) {
      this.moveTimer--;
      if (this.moveDir === 1) walkToward();
      else if (this.moveDir === -1) walkAway();
    }

    if (this.cooldown > 0) {
      this.cooldown--;
      return input;
    }

    const skills = self.loadout.moves;
    const findSkill = (pred: (id: string) => boolean): number =>
      skills.findIndex((m) => pred(m.id) && self.meter >= m.meterCost);

    const r = Math.random();
    const press = (idx: number) => { input.skills[idx] = true; };

    // 对手出招时优先防御/反击
    if (oppThreat && dist < 150 && r < 0.45) {
      const dragon = findSkill((id) => id === 'dragon_rise');
      if (dragon >= 0 && r < 0.15) press(dragon);
      else this.blockTimer = 24 + Math.floor(Math.random() * 16);
      this.cooldown = 10;
      return input;
    }

    // 满能量必杀
    const superIdx = findSkill((id) => id === 'awaken_blast');
    if (superIdx >= 0 && dist < 110 && r < 0.5) {
      press(superIdx);
      this.cooldown = 30;
      return input;
    }

    if (dist > 260) {
      // 远距离：飞行道具或接近
      const proj = findSkill((id) => id === 'wave_shot' || id === 'qigong_cannon');
      const charge = findSkill((id) => id === 'qi_gather');
      if (proj >= 0 && r < 0.4) { press(proj); this.cooldown = 26; }
      else if (charge >= 0 && r < 0.55 && self.meter < 70) { press(charge); this.cooldown = 40; }
      else { this.moveDir = 1; this.moveTimer = 20 + Math.floor(Math.random() * 20); this.cooldown = 8; }
    } else if (dist > 120) {
      // 中距离：突进或接近或跳
      const dash = findSkill((id) => id === 'phantom_dash' || id === 'meteor_kick');
      if (dash >= 0 && r < 0.35) { press(dash); this.cooldown = 24; }
      else if (r < 0.85) { this.moveDir = 1; this.moveTimer = 14 + Math.floor(Math.random() * 14); this.cooldown = 6; }
      else { input.up = true; walkToward(); this.cooldown = 20; }
    } else {
      // 近距离：混合攻击
      if (r < 0.2) { input.punch = true; this.cooldown = 12; }
      else if (r < 0.38) { input.kick = true; this.cooldown = 14; }
      else if (r < 0.75) {
        // 随机使用技能槽或指令招式
        const usableCmds = (self.loadout.commandMoves ?? [])
          .map((m, i) => ({ m, i }))
          .filter((e): e is { m: MoveDef; i: number } => !!e.m && self.meter >= e.m.meterCost);
        const usable = skills
          .map((m, i) => ({ m, i }))
          .filter(({ m }) => self.meter >= m.meterCost && m.id !== 'qi_gather');
        if (usableCmds.length > 0 && Math.random() < 0.45) {
          // 按方向+按键组合触发指令招式
          const pick = usableCmds[Math.floor(Math.random() * usableCmds.length)];
          const c = COMMANDS[pick.i];
          if (c.down) input.down = true;
          if (c.forward) { if (toOpp === 1) input.right = true; else input.left = true; }
          if (c.back) { if (toOpp === 1) input.left = true; else input.right = true; }
          if (c.button === 'punch') input.punch = true; else input.kick = true;
        } else if (usable.length > 0) {
          const pick = usable[Math.floor(Math.random() * usable.length)];
          press(pick.i);
        } else {
          input.punch = true;
        }
        this.cooldown = 18;
      } else if (r < 0.88) {
        this.blockTimer = 18 + Math.floor(Math.random() * 12);
        this.cooldown = 6;
      } else {
        // 后撤拉开
        this.moveDir = -1; this.moveTimer = 16; this.cooldown = 8;
      }
    }
    return input;
  }
}
