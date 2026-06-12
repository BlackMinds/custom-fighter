import type { Engine } from './engine';
import type { Fighter } from './fighter';
import type { PoseName } from './types';
import { POSES, lerpPose, clonePose, type Pose } from './poses';
import { COMMANDS } from './commands';

export const VIEW_W = 960;
export const VIEW_H = 540;
const FLOOR_Y = 460;

// 固定种子伪随机，生成稳定的背景剪影
function seededBuildings(): { x: number; w: number; h: number }[] {
  let s = 42;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const list: { x: number; w: number; h: number }[] = [];
  let x = -20;
  while (x < VIEW_W + 40) {
    const w = 50 + rnd() * 90;
    const h = 80 + rnd() * 200;
    list.push({ x, w, h });
    x += w + 8;
  }
  return list;
}
const BUILDINGS = seededBuildings();

function shade(hex: string, f: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
}

function targetPoseName(f: Fighter): PoseName {
  switch (f.state) {
    case 'walk': return 'walk';
    case 'jump': return 'jump';
    case 'crouch': return 'crouch';
    case 'blockstun': return 'block';
    case 'hitstun': return 'hit';
    case 'knockdown':
    case 'ko': return 'knockdown';
    case 'getup': return 'crouch';
    case 'attack': {
      const atk = f.attack!;
      return atk.move.poses[atk.phase];
    }
    default:
      return f.canBlock() ? 'block' : 'idle';
  }
}

export class Renderer {
  private poses: [Pose, Pose] = [clonePose(POSES.idle), clonePose(POSES.idle)];
  private walkT: [number, number] = [0, 0];
  private auraT = 0;

  render(ctx: CanvasRenderingContext2D, engine: Engine): void {
    this.auraT += 0.12;
    ctx.save();
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);

    // 画面震动
    if (engine.shake > 0.3) {
      ctx.translate(
        (Math.random() - 0.5) * engine.shake * 2,
        (Math.random() - 0.5) * engine.shake * 1.2,
      );
    }

    this.drawBackground(ctx);
    this.drawProjectiles(ctx, engine);
    this.drawFighter(ctx, engine, 0);
    this.drawFighter(ctx, engine, 1);
    this.drawParticles(ctx, engine);
    this.drawHUD(ctx, engine);
    this.drawBanner(ctx, engine);

    ctx.restore();
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const sky = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
    sky.addColorStop(0, '#0c0c1e');
    sky.addColorStop(0.6, '#1b1340');
    sky.addColorStop(1, '#3a1d5e');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIEW_W, FLOOR_Y);

    // 月亮
    ctx.fillStyle = '#f5e9c8';
    ctx.beginPath();
    ctx.arc(790, 90, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(245,233,200,0.15)';
    ctx.beginPath();
    ctx.arc(790, 90, 48, 0, Math.PI * 2);
    ctx.fill();

    // 远景楼群剪影
    ctx.fillStyle = '#11102a';
    for (const b of BUILDINGS) {
      ctx.fillRect(b.x, FLOOR_Y - b.h, b.w, b.h);
    }
    // 楼上零星灯光
    ctx.fillStyle = 'rgba(255,220,140,0.35)';
    for (let i = 0; i < BUILDINGS.length; i++) {
      const b = BUILDINGS[i];
      for (let k = 0; k < 4; k++) {
        const lx = b.x + ((i * 37 + k * 53) % Math.max(8, b.w - 10)) + 4;
        const ly = FLOOR_Y - b.h + ((i * 71 + k * 97) % Math.max(10, b.h - 16)) + 6;
        ctx.fillRect(lx, ly, 4, 5);
      }
    }

    // 地面
    const ground = ctx.createLinearGradient(0, FLOOR_Y, 0, VIEW_H);
    ground.addColorStop(0, '#2b2440');
    ground.addColorStop(1, '#141021');
    ctx.fillStyle = ground;
    ctx.fillRect(0, FLOOR_Y, VIEW_W, VIEW_H - FLOOR_Y);
    ctx.strokeStyle = 'rgba(160,140,255,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR_Y);
    ctx.lineTo(VIEW_W, FLOOR_Y);
    ctx.stroke();
  }

  private drawFighter(ctx: CanvasRenderingContext2D, engine: Engine, idx: 0 | 1): void {
    const f = engine.fighters[idx];
    const color = f.loadout.color;
    const poseName = targetPoseName(f);
    const target = POSES[poseName];
    const speed = f.attack && f.attack.phase === 'active' ? 0.6 : 0.32;
    this.poses[idx] = lerpPose(this.poses[idx], target, speed);
    const pose = clonePose(this.poses[idx]);

    // 行走腿部摆动
    if (f.state === 'walk') {
      this.walkT[idx] += 0.28;
      const sw = Math.sin(this.walkT[idx]) * 9;
      pose.footF[0] += sw;
      pose.footB[0] -= sw;
      pose.kneeF[0] += sw * 0.5;
      pose.kneeB[0] -= sw * 0.5;
    }

    const gx = f.x;
    const gy = FLOOR_Y - f.y;

    // 影子
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(gx, FLOOR_Y + 6, 30, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(gx, gy);
    ctx.scale(f.facing, 1);

    // 满能量气场
    if (f.meter >= f.maxMeter) {
      const pulse = 1 + Math.sin(this.auraT * 2) * 0.12;
      ctx.strokeStyle = 'rgba(255,210,80,0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -46, 34 * pulse, 56 * pulse, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 受击白闪
    const flashing = f.state === 'hitstun' && f.stateTimer % 4 < 2;
    const mainColor = flashing ? '#ffffff' : color;
    const backColor = flashing ? '#cccccc' : shade(color, 0.55);

    // 出招发光
    if (f.attack && f.attack.phase === 'active') {
      ctx.shadowColor = f.attack.move.color;
      ctx.shadowBlur = 16;
    }

    const limb = (pts: [number, number][], c: string, w: number) => {
      ctx.strokeStyle = c;
      ctx.lineWidth = w;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    };

    // 后侧肢体（深色）
    limb([pose.neck, pose.elbowB, pose.handB], backColor, 5);
    limb([pose.hip, pose.kneeB, pose.footB], backColor, 5);
    // 躯干
    limb([pose.neck, pose.hip], mainColor, 7);
    // 前侧肢体
    limb([pose.neck, pose.elbowF, pose.handF], mainColor, 5);
    limb([pose.hip, pose.kneeF, pose.footF], mainColor, 5);

    // 头
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.arc(pose.head[0], pose.head[1], 10, 0, Math.PI * 2);
    ctx.fill();

    // 拳头
    ctx.beginPath();
    ctx.arc(pose.handF[0], pose.handF[1], 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = backColor;
    ctx.beginPath();
    ctx.arc(pose.handB[0], pose.handB[1], 4, 0, Math.PI * 2);
    ctx.fill();

    // 防御姿态护盾
    if (f.canBlock() && (f.state === 'blockstun' || f.state === 'idle' || f.state === 'walk' || f.state === 'crouch')) {
      if (f.state === 'blockstun' || f.holdingAway()) {
        ctx.strokeStyle = 'rgba(140,170,255,0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(18, -56, 26, -Math.PI / 2.4, Math.PI / 2.4);
        ctx.stroke();
      }
    }

    // 出招特效圆光
    if (f.attack && f.attack.phase === 'active' && f.attack.move.hitbox) {
      const hb = f.attack.move.hitbox;
      const cx = hb.x + hb.w / 2;
      const cy = hb.y + hb.h / 2;
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, hb.w / 2 + 6);
      grad.addColorStop(0, f.attack.move.color + 'cc');
      grad.addColorStop(1, f.attack.move.color + '00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, hb.w / 2 + 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawProjectiles(ctx: CanvasRenderingContext2D, engine: Engine): void {
    for (const p of engine.projectiles) {
      const cy = FLOOR_Y + p.y;
      const r = Math.max(p.w, p.h) / 2;
      const grad = ctx.createRadialGradient(p.x, cy, 2, p.x, cy, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, p.move.color);
      grad.addColorStop(1, p.move.color + '00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(p.x, cy, p.w / 2 + 6, p.h / 2 + 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // 拖尾
      const dir = p.vx >= 0 ? -1 : 1;
      ctx.fillStyle = p.move.color + '44';
      ctx.beginPath();
      ctx.ellipse(p.x + dir * (p.w / 2 + 10), cy, p.w / 3, p.h / 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D, engine: Engine): void {
    for (const p of engine.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, FLOOR_Y + p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawHUD(ctx: CanvasRenderingContext2D, engine: Engine): void {
    const [a, b] = engine.fighters;

    // 血条底
    const barW = 380;
    const drawHp = (f: Fighter, leftX: number, mirror: boolean) => {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(leftX - 3, 20 - 3, barW + 6, 22 + 6);
      ctx.fillStyle = '#5b1020';
      ctx.fillRect(leftX, 20, barW, 22);
      const w = (f.hp / f.maxHp) * barW;
      const grad = ctx.createLinearGradient(0, 20, 0, 42);
      grad.addColorStop(0, '#ffe97a');
      grad.addColorStop(0.5, '#ffc53d');
      grad.addColorStop(1, '#e8950c');
      ctx.fillStyle = grad;
      if (mirror) ctx.fillRect(leftX + barW - w, 20, w, 22);
      else ctx.fillRect(leftX, 20, w, 22);
    };
    drawHp(a, 40, false);
    drawHp(b, VIEW_W - 40 - barW, true);

    // 名字与回合胜利标记
    ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.fillText(a.loadout.name, 42, 48);
    ctx.textAlign = 'right';
    ctx.fillText(b.loadout.name, VIEW_W - 42, 48);

    const pip = (x: number, won: boolean) => {
      ctx.beginPath();
      ctx.arc(x, 56, 6, 0, Math.PI * 2);
      ctx.fillStyle = won ? '#ffd166' : 'rgba(255,255,255,0.25)';
      ctx.fill();
    };
    pip(150, engine.roundWins[0] >= 1);
    pip(170, engine.roundWins[0] >= 2);
    pip(VIEW_W - 150, engine.roundWins[1] >= 1);
    pip(VIEW_W - 170, engine.roundWins[1] >= 2);

    // 计时器
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(VIEW_W / 2, 36, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 24px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = engine.timeLeftSeconds <= 10 ? '#ff5d5d' : '#fff';
    ctx.fillText(String(engine.timeLeftSeconds), VIEW_W / 2, 37);

    // 能量条
    const meterW = 260;
    const drawMeter = (f: Fighter, leftX: number, mirror: boolean) => {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(leftX - 2, VIEW_H - 30 - 2, meterW + 4, 14 + 4);
      ctx.fillStyle = '#1a2440';
      ctx.fillRect(leftX, VIEW_H - 30, meterW, 14);
      const w = (f.meter / f.maxMeter) * meterW;
      const full = f.meter >= f.maxMeter;
      ctx.fillStyle = full ? '#ffd166' : '#3f8efc';
      if (full) {
        ctx.shadowColor = '#ffd166';
        ctx.shadowBlur = 10;
      }
      if (mirror) ctx.fillRect(leftX + meterW - w, VIEW_H - 30, w, 14);
      else ctx.fillRect(leftX, VIEW_H - 30, w, 14);
      ctx.shadowBlur = 0;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#cfe0ff';
      ctx.textAlign = mirror ? 'right' : 'left';
      ctx.fillText(full ? 'MAX' : String(Math.floor(f.meter)), mirror ? leftX + meterW : leftX, VIEW_H - 44);
    };
    drawMeter(a, 40, false);
    drawMeter(b, VIEW_W - 40 - meterW, true);

    // 技能槽提示
    const keys: [string[], string[]] = [
      ['U', 'I', 'O', 'P'],
      ['1', '2', '3', '4'],
    ];
    const drawSlots = (f: Fighter, idx: 0 | 1) => {
      const slotW = 84;
      const gap = 6;
      const total = slotW * 4 + gap * 3;
      const startX = idx === 0 ? 40 : VIEW_W - 40 - total;
      for (let i = 0; i < 4; i++) {
        const m = f.loadout.moves[i];
        if (!m) continue;
        const x = startX + i * (slotW + gap);
        const usable = f.meter >= m.meterCost;
        ctx.fillStyle = usable ? 'rgba(20,26,52,0.8)' : 'rgba(20,20,20,0.8)';
        ctx.fillRect(x, VIEW_H - 64 - 14, slotW, 26);
        ctx.strokeStyle = usable ? m.color : '#444';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, VIEW_H - 64 - 14, slotW, 26);
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = usable ? '#ffd166' : '#777';
        ctx.fillText(keys[idx][i], x + 5, VIEW_H - 64);
        ctx.fillStyle = usable ? '#dde4ff' : '#666';
        ctx.font = '11px "Microsoft YaHei", sans-serif';
        ctx.fillText(m.name, x + 18, VIEW_H - 64);
      }
    };
    drawSlots(a, 0);
    drawSlots(b, 1);

    // 指令招式提示（技能槽上方一排小槽）
    const drawCmdSlots = (f: Fighter, idx: 0 | 1) => {
      const cmds = f.loadout.commandMoves;
      if (!cmds || cmds.every((m) => !m)) return;
      const slotW = 80;
      const gap = 5;
      const total = slotW * COMMANDS.length + gap * (COMMANDS.length - 1);
      const startX = idx === 0 ? 40 : VIEW_W - 40 - total;
      const y = VIEW_H - 64 - 14 - 28;
      for (let i = 0; i < COMMANDS.length && i < cmds.length; i++) {
        const m = cmds[i];
        if (!m) continue;
        const x = startX + i * (slotW + gap);
        const usable = f.meter >= m.meterCost;
        ctx.fillStyle = usable ? 'rgba(20,26,52,0.7)' : 'rgba(20,20,20,0.7)';
        ctx.fillRect(x, y, slotW, 22);
        ctx.strokeStyle = usable ? m.color : '#444';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, slotW, 22);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 10px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = usable ? '#9be8ff' : '#777';
        ctx.fillText(COMMANDS[i].short, x + 4, y + 11);
        ctx.fillStyle = usable ? '#dde4ff' : '#666';
        ctx.font = '10px "Microsoft YaHei", sans-serif';
        ctx.fillText(m.name, x + 4 + COMMANDS[i].short.length * 10 + 4, y + 11);
      }
    };
    drawCmdSlots(a, 0);
    drawCmdSlots(b, 1);
  }

  private drawBanner(ctx: CanvasRenderingContext2D, engine: Engine): void {
    if (engine.bannerTimer <= 0 || !engine.banner) return;
    const t = engine.bannerTimer;
    const alpha = Math.min(1, t / 14);
    const pop = engine.banner === 'FIGHT!' ? 1 + Math.max(0, (t - 30) / 10) * 0.4 : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(VIEW_W / 2, VIEW_H / 2 - 40);
    ctx.scale(pop, pop);
    ctx.font = 'bold 64px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#1a0b2e';
    ctx.strokeText(engine.banner, 0, 0);
    const grad = ctx.createLinearGradient(0, -30, 0, 30);
    grad.addColorStop(0, '#fff3b0');
    grad.addColorStop(1, '#ff8c42');
    ctx.fillStyle = grad;
    ctx.fillText(engine.banner, 0, 0);
    ctx.restore();
  }
}
