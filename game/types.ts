// 核心类型定义：招式、姿势、判定框、玩家输入

export type PoseName =
  | 'idle' | 'walk' | 'jump' | 'crouch' | 'block' | 'hit' | 'knockdown'
  | 'punchWind' | 'punch' | 'kickWind' | 'kick' | 'uppercut' | 'smashWind' | 'smash'
  | 'throwPose' | 'sweep' | 'grabPose' | 'dashStrike' | 'spinKick' | 'charge' | 'superPose';

export type MoveCategory = '普通' | '打击' | '突进' | '飞行道具' | '投技' | '辅助' | '必杀';

export interface RectBox { x: number; y: number; w: number; h: number }

export interface ProjectileDef {
  speed: number;
  w: number;
  h: number;
  lifetime: number; // 帧
}

export interface MoveDef {
  id: string;
  name: string;
  desc: string;
  category: MoveCategory;
  damage: number;        // 单次命中伤害
  startup: number;       // 前摇帧
  active: number;        // 判定帧
  recovery: number;      // 后摇帧
  hitbox?: RectBox;      // 相对角色原点（脚底中心），面向右
  knockback: { x: number; y: number };
  hitstun: number;
  meterCost: number;     // 消耗能量
  meterGain: number;     // 命中后获得能量
  multiHit?: number;     // 判定期间重复命中次数
  rehitInterval?: number;// 多段命中间隔帧
  moveForward?: number;  // 判定期间每帧前移像素（突进类）
  projectile?: ProjectileDef;
  unblockable?: boolean; // 投技无视防御
  invulnStartup?: boolean; // 前摇无敌（升龙类）
  knockdown?: boolean;   // 命中击倒
  selfMeterGain?: number;// 使用即获得能量（聚气类）
  poses: { startup: PoseName; active: PoseName; recovery: PoseName };
  color: string;         // 特效颜色
}

export interface InputFrame {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  punch: boolean;   // 边沿触发
  kick: boolean;
  skills: [boolean, boolean, boolean, boolean];
}

export type FighterStateName =
  | 'idle' | 'walk' | 'jump' | 'crouch'
  | 'attack' | 'hitstun' | 'blockstun' | 'knockdown' | 'getup' | 'ko' | 'victory';

export interface Loadout {
  name: string;
  color: string;
  moves: MoveDef[]; // 4 个技能槽
}

export type GameMode = 'pvp' | 'pve';
