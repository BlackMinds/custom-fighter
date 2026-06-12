import type { InputFrame, FighterStateName, Loadout, MoveDef, RectBox } from './types';
import { emptyInput } from './input';
import { BASIC_PUNCH, BASIC_KICK } from './moves';
import { COMMANDS } from './commands';

export const WALK_SPEED = 3.2;
export const JUMP_VY = 11.5;
export const GRAVITY = 0.6;
export const STAGE_LEFT = 50;
export const STAGE_RIGHT = 910;
export const KNOCKDOWN_TIME = 55;
export const GETUP_TIME = 18;

export type AttackPhase = 'startup' | 'active' | 'recovery';

export interface AttackContext {
  move: MoveDef;
  phase: AttackPhase;
  frame: number;            // 当前阶段内帧数
  hitsDone: number;
  lastHitActiveFrame: number;
  projectileFired: boolean;
  selfMeterGranted: boolean;
}

// 世界坐标判定框：x 为左边缘，y 为上边缘（以地面为 0，向上为负），w/h 为尺寸
export function rectOverlap(a: RectBox, b: RectBox): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

export class Fighter {
  x: number;
  y = 0;            // 离地高度，>=0
  vx = 0;
  vy = 0;
  facing: 1 | -1;
  hp = 100;
  maxHp = 100;
  meter = 0;
  maxMeter = 100;
  state: FighterStateName = 'idle';
  stateTimer = 0;
  attack: AttackContext | null = null;
  input: InputFrame = emptyInput();
  loadout: Loadout;
  index: number;

  constructor(index: number, x: number, facing: 1 | -1, loadout: Loadout) {
    this.index = index;
    this.x = x;
    this.facing = facing;
    this.loadout = loadout;
  }

  get grounded(): boolean { return this.y <= 0.01; }
  get alive(): boolean { return this.hp > 0; }

  holdingAway(): boolean {
    return this.facing === 1 ? this.input.left : this.input.right;
  }

  isInvulnerable(): boolean {
    if (this.state === 'knockdown' || this.state === 'getup' || this.state === 'ko') return true;
    if (this.attack && this.attack.move.invulnStartup && this.attack.phase === 'startup') return true;
    return false;
  }

  canBlock(): boolean {
    return (
      this.grounded &&
      (this.state === 'idle' || this.state === 'walk' || this.state === 'crouch' || this.state === 'blockstun') &&
      this.holdingAway()
    );
  }

  hurtbox(): RectBox {
    if (this.state === 'knockdown' || this.state === 'ko' || this.state === 'getup') {
      return { x: this.x - 30, y: -22 - this.y, w: 60, h: 22 };
    }
    const h = this.state === 'crouch' ? 66 : 90;
    return { x: this.x - 15, y: -h - this.y, w: 30, h };
  }

  // 当前攻击判定框（世界坐标），无则 null
  activeHitbox(): RectBox | null {
    if (!this.attack || this.attack.phase !== 'active') return null;
    const hb = this.attack.move.hitbox;
    if (!hb) return null;
    const left = this.facing === 1 ? this.x + hb.x : this.x - hb.x - hb.w;
    return { x: left, y: hb.y - this.y, w: hb.w, h: hb.h };
  }

  startMove(move: MoveDef): boolean {
    if (this.meter < move.meterCost) return false;
    this.meter -= move.meterCost;
    this.state = 'attack';
    this.vx = 0;
    this.attack = {
      move, phase: 'startup', frame: 0,
      hitsDone: 0, lastHitActiveFrame: -999,
      projectileFired: false, selfMeterGranted: false,
    };
    return true;
  }

  // 指令招式匹配：方向（相对面向）+ 拳/踢；方向要求多的优先（下前+拳 优先于 下+拳 / 前+拳）
  private matchCommandMove(input: InputFrame): MoveDef | null {
    const cmds = this.loadout.commandMoves;
    if (!cmds || cmds.length === 0) return null;
    const forward = this.facing === 1 ? input.right : input.left;
    const back = this.facing === 1 ? input.left : input.right;
    let best: MoveDef | null = null;
    let bestScore = -1;
    for (let i = 0; i < COMMANDS.length && i < cmds.length; i++) {
      const c = COMMANDS[i];
      const move = cmds[i];
      if (!move) continue;
      const pressed = c.button === 'punch' ? input.punch : input.kick;
      if (!pressed) continue;
      if (c.down && !input.down) continue;
      if (c.forward && !forward) continue;
      if (c.back && !back) continue;
      if (this.meter < move.meterCost) continue;
      const score = (c.down ? 1 : 0) + (c.forward ? 1 : 0) + (c.back ? 1 : 0);
      if (score > bestScore) { bestScore = score; best = move; }
    }
    return best;
  }

  private tryStartMove(input: InputFrame): void {
    for (let i = 0; i < 4; i++) {
      if (input.skills[i] && this.loadout.moves[i]) {
        if (this.startMove(this.loadout.moves[i])) return;
      }
    }
    const cmdMove = this.matchCommandMove(input);
    if (cmdMove && this.startMove(cmdMove)) return;
    if (input.punch) { this.startMove(BASIC_PUNCH); return; }
    if (input.kick) { this.startMove(BASIC_KICK); return; }
  }

  private advanceAttack(): void {
    const atk = this.attack!;
    const m = atk.move;
    atk.frame++;

    if (atk.phase === 'startup' && atk.frame >= m.startup) {
      atk.phase = 'active';
      atk.frame = 0;
      if (m.selfMeterGain && !atk.selfMeterGranted) {
        this.meter = Math.min(this.maxMeter, this.meter + m.selfMeterGain);
        atk.selfMeterGranted = true;
      }
    } else if (atk.phase === 'active') {
      if (m.moveForward) {
        this.x += this.facing * m.moveForward;
      }
      if (atk.frame >= m.active) {
        atk.phase = 'recovery';
        atk.frame = 0;
      }
    } else if (atk.phase === 'recovery' && atk.frame >= m.recovery) {
      this.attack = null;
      this.state = 'idle';
    }
  }

  // 每逻辑帧更新（不含命中判定，由引擎负责）
  update(input: InputFrame): void {
    this.input = input;

    switch (this.state) {
      case 'hitstun':
      case 'blockstun':
        this.stateTimer--;
        this.x += this.vx;
        this.vx *= 0.85;
        if (this.stateTimer <= 0 && this.grounded) {
          this.state = 'idle';
          this.vx = 0;
        }
        break;

      case 'knockdown':
        this.x += this.vx;
        this.vx *= 0.82;
        if (this.grounded) {
          this.stateTimer--;
          if (this.stateTimer <= 0) {
            this.state = 'getup';
            this.stateTimer = GETUP_TIME;
          }
        }
        break;

      case 'getup':
        this.stateTimer--;
        if (this.stateTimer <= 0) this.state = 'idle';
        break;

      case 'ko':
        this.x += this.vx;
        this.vx *= 0.85;
        break;

      case 'attack':
        this.advanceAttack();
        break;

      case 'jump':
        this.x += this.vx;
        if (this.grounded && this.vy <= 0) {
          this.state = 'idle';
          this.vx = 0;
        }
        break;

      default: {
        // idle / walk / crouch：响应移动与出招
        if (this.grounded) {
          if (input.down) {
            this.state = 'crouch';
            this.vx = 0;
          } else if (input.up) {
            this.state = 'jump';
            this.vy = JUMP_VY;
            this.vx = (input.right ? WALK_SPEED : 0) - (input.left ? WALK_SPEED : 0);
          } else if (input.left || input.right) {
            this.state = 'walk';
            this.x += (input.right ? WALK_SPEED : 0) - (input.left ? WALK_SPEED : 0);
          } else {
            this.state = 'idle';
          }
          if (this.state !== 'jump') this.tryStartMove(input);
        }
        break;
      }
    }

    // 重力
    if (this.y > 0 || this.vy > 0) {
      this.y += this.vy;
      this.vy -= GRAVITY;
      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        if (this.state === 'jump') this.state = 'idle';
      }
    }

    // 场地边界
    this.x = Math.max(STAGE_LEFT, Math.min(STAGE_RIGHT, this.x));
  }

  // 受击处理，返回实际伤害
  takeHit(move: MoveDef, dir: 1 | -1, blocked: boolean): number {
    if (blocked) {
      const chip = move.damage > 0 ? Math.max(1, Math.round(move.damage * 0.15)) : 0;
      this.hp = Math.max(0, this.hp - chip);
      this.state = 'blockstun';
      this.stateTimer = Math.floor(move.hitstun * 0.7) + 4;
      this.vx = dir * move.knockback.x * 0.6;
      this.meter = Math.min(this.maxMeter, this.meter + 2);
      this.attack = null;
      return chip;
    }

    this.hp = Math.max(0, this.hp - move.damage);
    this.meter = Math.min(this.maxMeter, this.meter + 4);
    this.attack = null;
    this.vx = dir * move.knockback.x;

    if (this.hp <= 0) {
      this.state = 'ko';
      this.vy = Math.max(move.knockback.y, 5);
      this.y = Math.max(this.y, 0.1);
    } else if (move.knockdown) {
      this.state = 'knockdown';
      this.stateTimer = KNOCKDOWN_TIME;
      if (move.knockback.y > 0) {
        this.vy = move.knockback.y;
        this.y = Math.max(this.y, 0.1);
      }
    } else {
      this.state = 'hitstun';
      this.stateTimer = move.hitstun;
    }
    return move.damage;
  }
}
