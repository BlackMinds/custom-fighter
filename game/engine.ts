import type { InputFrame, Loadout, MoveDef, RectBox } from './types';
import { Fighter, rectOverlap, STAGE_LEFT, STAGE_RIGHT } from './fighter';
import { emptyInput } from './input';

export type BattlePhase = 'intro' | 'fight' | 'roundEnd' | 'matchEnd';

export interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number;
  color: string; size: number;
}

export interface Projectile {
  x: number; y: number; vx: number;
  w: number; h: number;
  life: number;
  owner: number;
  move: MoveDef;
}

const ROUND_FRAMES = 60 * 60; // 60 秒
const INTRO_FRAMES = 80;
const ROUND_END_FRAMES = 120;
const WINS_NEEDED = 2;

export class Engine {
  fighters: [Fighter, Fighter];
  projectiles: Projectile[] = [];
  particles: Particle[] = [];
  shake = 0;
  freeze = 0;
  phase: BattlePhase = 'intro';
  phaseTimer = INTRO_FRAMES;
  banner = '';
  bannerTimer = 0;
  round = 1;
  roundWins: [number, number] = [0, 0];
  timeLeft = ROUND_FRAMES;
  winner = -1;
  frameCount = 0;

  constructor(public loadouts: [Loadout, Loadout]) {
    this.fighters = [
      new Fighter(0, 300, 1, loadouts[0]),
      new Fighter(1, 660, -1, loadouts[1]),
    ];
    this.showBanner(`ROUND ${this.round}`, 70);
  }

  showBanner(text: string, frames: number): void {
    this.banner = text;
    this.bannerTimer = frames;
  }

  get timeLeftSeconds(): number {
    return Math.ceil(this.timeLeft / 60);
  }

  private resetRound(): void {
    const [a, b] = this.fighters;
    a.x = 300; b.x = 660;
    a.y = b.y = 0;
    a.vx = a.vy = b.vx = b.vy = 0;
    a.facing = 1; b.facing = -1;
    a.hp = a.maxHp; b.hp = b.maxHp;
    a.state = 'idle'; b.state = 'idle';
    a.attack = null; b.attack = null;
    this.projectiles = [];
    this.timeLeft = ROUND_FRAMES;
    this.phase = 'intro';
    this.phaseTimer = INTRO_FRAMES;
    this.showBanner(`ROUND ${this.round}`, 70);
  }

  private spawnHitParticles(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 5;
      this.particles.push({
        x, y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 2,
        life: 18 + Math.random() * 14,
        maxLife: 32,
        color,
        size: 2 + Math.random() * 4,
      });
    }
  }

  private updateParticles(): void {
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25;
      p.life--;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
    if (this.shake > 0) this.shake *= 0.85;
    if (this.shake < 0.3) this.shake = 0;
  }

  private roundWon(idx: number, bannerText: string): void {
    this.roundWins[idx]++;
    this.phase = 'roundEnd';
    this.phaseTimer = ROUND_END_FRAMES;
    this.showBanner(bannerText, ROUND_END_FRAMES);
  }

  private applyHit(attackerIdx: number, move: MoveDef, contactX: number, contactY: number): void {
    const attacker = this.fighters[attackerIdx];
    const defender = this.fighters[1 - attackerIdx];
    const dir: 1 | -1 = defender.x >= attacker.x ? 1 : -1;
    const blocked = !move.unblockable && defender.canBlock();

    defender.takeHit(move, dir, blocked);

    if (blocked) {
      attacker.meter = Math.min(attacker.maxMeter, attacker.meter + 2);
      this.freeze = 3;
      this.shake = 3;
      this.spawnHitParticles(contactX, contactY, '#8899ff', 5);
    } else {
      attacker.meter = Math.min(attacker.maxMeter, attacker.meter + move.meterGain);
      this.freeze = move.damage >= 14 ? 10 : 6;
      this.shake = Math.min(14, 5 + move.damage * 0.4);
      this.spawnHitParticles(contactX, contactY, move.color, Math.min(24, 6 + move.damage));
    }

    if (defender.hp <= 0 && this.phase === 'fight') {
      this.roundWon(attackerIdx, 'K.O.');
    }
  }

  private resolveStrike(attackerIdx: number): void {
    const attacker = this.fighters[attackerIdx];
    const defender = this.fighters[1 - attackerIdx];
    const atk = attacker.attack;
    if (!atk || atk.phase !== 'active') return;
    const hb = attacker.activeHitbox();
    if (!hb) return;

    const maxHits = atk.move.multiHit ?? 1;
    const interval = atk.move.rehitInterval ?? 9999;
    if (atk.hitsDone >= maxHits) return;
    if (atk.hitsDone > 0 && atk.frame - atk.lastHitActiveFrame < interval) return;

    if (defender.isInvulnerable()) return;
    if (!rectOverlap(hb, defender.hurtbox())) return;

    atk.hitsDone++;
    atk.lastHitActiveFrame = atk.frame;
    this.applyHit(attackerIdx, atk.move, defender.x, -64 - defender.y);
  }

  private spawnProjectiles(): void {
    for (const f of this.fighters) {
      const atk = f.attack;
      if (!atk || atk.phase !== 'active' || atk.projectileFired) continue;
      const pd = atk.move.projectile;
      if (!pd) continue;
      atk.projectileFired = true;
      this.projectiles.push({
        x: f.x + f.facing * 34,
        y: -68 - f.y,
        vx: f.facing * pd.speed,
        w: pd.w,
        h: pd.h,
        life: pd.lifetime,
        owner: f.index,
        move: atk.move,
      });
    }
  }

  private updateProjectiles(): void {
    for (const p of this.projectiles) {
      p.x += p.vx;
      p.life--;
    }

    // 飞行道具互相抵消
    for (let i = 0; i < this.projectiles.length; i++) {
      for (let j = i + 1; j < this.projectiles.length; j++) {
        const a = this.projectiles[i];
        const b = this.projectiles[j];
        if (a.owner === b.owner || a.life <= 0 || b.life <= 0) continue;
        const ra: RectBox = { x: a.x - a.w / 2, y: a.y - a.h / 2, w: a.w, h: a.h };
        const rb: RectBox = { x: b.x - b.w / 2, y: b.y - b.h / 2, w: b.w, h: b.h };
        if (rectOverlap(ra, rb)) {
          a.life = 0;
          b.life = 0;
          this.spawnHitParticles((a.x + b.x) / 2, (a.y + b.y) / 2, '#ffffff', 14);
        }
      }
    }

    // 命中角色
    for (const p of this.projectiles) {
      if (p.life <= 0) continue;
      const defender = this.fighters[1 - p.owner];
      if (defender.isInvulnerable()) continue;
      const rect: RectBox = { x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h };
      if (rectOverlap(rect, defender.hurtbox())) {
        p.life = 0;
        this.applyHit(p.owner, p.move, p.x, p.y);
      }
    }

    this.projectiles = this.projectiles.filter(
      (p) => p.life > 0 && p.x > -60 && p.x < 1020,
    );
  }

  private pushApart(): void {
    const [a, b] = this.fighters;
    const noPush = (f: Fighter) =>
      f.state === 'knockdown' || f.state === 'ko' || f.state === 'getup' || f.y > 40;
    if (noPush(a) || noPush(b)) return;
    const dx = b.x - a.x;
    const minGap = 34;
    if (Math.abs(dx) < minGap) {
      const push = (minGap - Math.abs(dx)) / 2;
      const sign = dx >= 0 ? 1 : -1;
      a.x -= sign * push;
      b.x += sign * push;
      a.x = Math.max(STAGE_LEFT, Math.min(STAGE_RIGHT, a.x));
      b.x = Math.max(STAGE_LEFT, Math.min(STAGE_RIGHT, b.x));
    }
  }

  step(inputs: [InputFrame, InputFrame]): void {
    this.frameCount++;
    this.updateParticles();
    if (this.bannerTimer > 0) this.bannerTimer--;

    if (this.freeze > 0) {
      this.freeze--;
      return;
    }

    if (this.phase === 'intro') {
      this.phaseTimer--;
      if (this.phaseTimer === 30) this.showBanner('FIGHT!', 40);
      if (this.phaseTimer <= 0) this.phase = 'fight';
      return;
    }

    if (this.phase === 'matchEnd') return;

    // 朝向更新（仅地面非攻击状态）
    const facingPairs: [Fighter, Fighter][] = [
      [this.fighters[0], this.fighters[1]],
      [this.fighters[1], this.fighters[0]],
    ];
    for (const [f, o] of facingPairs) {
      if (f.grounded && (f.state === 'idle' || f.state === 'walk' || f.state === 'crouch')) {
        f.facing = o.x >= f.x ? 1 : -1;
      }
    }

    if (this.phase === 'fight') {
      this.fighters[0].update(inputs[0]);
      this.fighters[1].update(inputs[1]);
      this.pushApart();
      this.resolveStrike(0);
      this.resolveStrike(1);
      this.spawnProjectiles();
      this.updateProjectiles();

      this.timeLeft--;
      if (this.timeLeft <= 0 && this.phase === 'fight') {
        const [a, b] = this.fighters;
        if (a.hp > b.hp) this.roundWon(0, 'TIME UP');
        else if (b.hp > a.hp) this.roundWon(1, 'TIME UP');
        else {
          // 平局重赛本回合
          this.showBanner('DRAW', 60);
          this.phase = 'roundEnd';
          this.phaseTimer = ROUND_END_FRAMES;
        }
      }
    } else if (this.phase === 'roundEnd') {
      // 让倒地/KO 动作继续演出
      this.fighters[0].update(emptyInput());
      this.fighters[1].update(emptyInput());
      this.updateProjectiles();
      this.phaseTimer--;
      if (this.phaseTimer <= 0) {
        const winIdx = this.roundWins[0] >= WINS_NEEDED ? 0 : this.roundWins[1] >= WINS_NEEDED ? 1 : null;
        if (winIdx !== null) {
          this.phase = 'matchEnd';
          this.winner = winIdx;
          this.showBanner(`${this.loadouts[winIdx].name} 获胜!`, 9999);
        } else {
          this.round++;
          this.resetRound();
        }
      }
    }
  }
}
