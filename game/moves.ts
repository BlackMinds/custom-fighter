import type { MoveDef } from './types';

// ===== 基础攻击（所有人自带，不占技能槽） =====

export const BASIC_PUNCH: MoveDef = {
  id: 'basic_punch', name: '直拳', desc: '快速的基础拳击', category: '普通',
  damage: 5, startup: 4, active: 3, recovery: 9,
  hitbox: { x: 16, y: -82, w: 30, h: 22 },
  knockback: { x: 3, y: 0 }, hitstun: 14,
  meterCost: 0, meterGain: 5,
  poses: { startup: 'punchWind', active: 'punch', recovery: 'punchWind' },
  color: '#ffffff',
};

export const BASIC_KICK: MoveDef = {
  id: 'basic_kick', name: '前踢', desc: '范围稍远的基础踢击', category: '普通',
  damage: 7, startup: 7, active: 4, recovery: 13,
  hitbox: { x: 18, y: -56, w: 36, h: 26 },
  knockback: { x: 4, y: 0 }, hitstun: 16,
  meterCost: 0, meterGain: 6,
  poses: { startup: 'kickWind', active: 'kick', recovery: 'kickWind' },
  color: '#ffffff',
};

// ===== 可装配招式库（自由选 4 个装入技能槽） =====

export const MOVE_LIBRARY: MoveDef[] = [
  {
    id: 'rush_fist', name: '疾风连拳', desc: '高速三连击，压制力强但单发伤害低', category: '打击',
    damage: 4, startup: 5, active: 18, recovery: 10,
    hitbox: { x: 16, y: -84, w: 32, h: 26 },
    knockback: { x: 2, y: 0 }, hitstun: 12,
    meterCost: 0, meterGain: 4, multiHit: 3, rehitInterval: 6,
    poses: { startup: 'punchWind', active: 'punch', recovery: 'punchWind' },
    color: '#9bf6ff',
  },
  {
    id: 'mountain_smash', name: '崩山重锤', desc: '蓄力双锤砸击，出招慢但伤害极高并击倒', category: '打击',
    damage: 16, startup: 18, active: 5, recovery: 20,
    hitbox: { x: 14, y: -70, w: 38, h: 50 },
    knockback: { x: 7, y: 3 }, hitstun: 24, knockdown: true,
    meterCost: 0, meterGain: 12,
    poses: { startup: 'smashWind', active: 'smash', recovery: 'smash' },
    color: '#ffb347',
  },
  {
    id: 'spin_kick', name: '旋风腿', desc: '旋转高踢两段命中，边打边小幅前进', category: '打击',
    damage: 6, startup: 9, active: 14, recovery: 14,
    hitbox: { x: 14, y: -72, w: 40, h: 34 },
    knockback: { x: 4, y: 0 }, hitstun: 15,
    meterCost: 0, meterGain: 5, multiHit: 2, rehitInterval: 7, moveForward: 1.5,
    poses: { startup: 'kickWind', active: 'spinKick', recovery: 'kickWind' },
    color: '#a0ffa0',
  },
  {
    id: 'sweep_leg', name: '扫堂腿', desc: '低位扫腿快速击倒对手', category: '打击',
    damage: 8, startup: 8, active: 5, recovery: 16,
    hitbox: { x: 16, y: -18, w: 38, h: 18 },
    knockback: { x: 4, y: 2 }, hitstun: 18, knockdown: true,
    meterCost: 0, meterGain: 6,
    poses: { startup: 'crouch', active: 'sweep', recovery: 'crouch' },
    color: '#d0b0ff',
  },
  {
    id: 'wave_shot', name: '波动弹', desc: '发射一枚气弹远程攻击', category: '飞行道具',
    damage: 10, startup: 12, active: 2, recovery: 18,
    knockback: { x: 4, y: 0 }, hitstun: 16,
    meterCost: 0, meterGain: 8,
    projectile: { speed: 7, w: 30, h: 22, lifetime: 120 },
    poses: { startup: 'smashWind', active: 'throwPose', recovery: 'throwPose' },
    color: '#6fc3ff',
  },
  {
    id: 'dragon_rise', name: '升龙击', desc: '出招瞬间无敌的上勾拳，反制空中和近身压制', category: '打击',
    damage: 14, startup: 6, active: 6, recovery: 24,
    hitbox: { x: 8, y: -104, w: 28, h: 56 },
    knockback: { x: 3, y: 9 }, hitstun: 26, knockdown: true, invulnStartup: true,
    meterCost: 0, meterGain: 10,
    poses: { startup: 'crouch', active: 'uppercut', recovery: 'uppercut' },
    color: '#ffd166',
  },
  {
    id: 'phantom_dash', name: '幻影突袭', desc: '高速突进肘击，快速拉近距离', category: '突进',
    damage: 10, startup: 8, active: 10, recovery: 16,
    hitbox: { x: 10, y: -72, w: 30, h: 36 },
    knockback: { x: 6, y: 0 }, hitstun: 18,
    meterCost: 0, meterGain: 8, moveForward: 10,
    poses: { startup: 'walk', active: 'dashStrike', recovery: 'dashStrike' },
    color: '#c77dff',
  },
  {
    id: 'meteor_kick', name: '流星飞踢', desc: '飞身踢击，突进距离远，被防后摇大', category: '突进',
    damage: 12, startup: 10, active: 12, recovery: 22,
    hitbox: { x: 12, y: -64, w: 34, h: 30 },
    knockback: { x: 7, y: 2 }, hitstun: 20, knockdown: true,
    meterCost: 0, meterGain: 9, moveForward: 11,
    poses: { startup: 'jump', active: 'kick', recovery: 'kickWind' },
    color: '#ff9770',
  },
  {
    id: 'ghost_grab', name: '鬼手擒拿', desc: '近身投技，无视防御直接摔投', category: '投技',
    damage: 13, startup: 7, active: 4, recovery: 20,
    hitbox: { x: 10, y: -80, w: 26, h: 40 },
    knockback: { x: 8, y: 5 }, hitstun: 26, knockdown: true, unblockable: true,
    meterCost: 0, meterGain: 10,
    poses: { startup: 'grabPose', active: 'grabPose', recovery: 'throwPose' },
    color: '#ff6b9d',
  },
  {
    id: 'qigong_cannon', name: '气功炮', desc: '巨大的慢速能量炮，消耗30能量，伤害可观', category: '飞行道具',
    damage: 18, startup: 20, active: 2, recovery: 24,
    knockback: { x: 6, y: 3 }, hitstun: 22, knockdown: true,
    meterCost: 30, meterGain: 0,
    projectile: { speed: 4, w: 52, h: 40, lifetime: 180 },
    poses: { startup: 'charge', active: 'superPose', recovery: 'throwPose' },
    color: '#48bfe3',
  },
  {
    id: 'thunder_combo', name: '雷光连斩', desc: '消耗20能量的四段高速连击', category: '必杀',
    damage: 4, startup: 6, active: 24, recovery: 14,
    hitbox: { x: 14, y: -84, w: 36, h: 40 },
    knockback: { x: 2, y: 0 }, hitstun: 12,
    meterCost: 20, meterGain: 2, multiHit: 4, rehitInterval: 6, moveForward: 1,
    poses: { startup: 'punchWind', active: 'punch', recovery: 'punchWind' },
    color: '#ffe94e',
  },
  {
    id: 'awaken_blast', name: '觉醒·灭世爆', desc: '满能量(100)必杀：全身爆发巨大冲击波', category: '必杀',
    damage: 32, startup: 16, active: 8, recovery: 30,
    hitbox: { x: -10, y: -110, w: 90, h: 110 },
    knockback: { x: 10, y: 8 }, hitstun: 30, knockdown: true, invulnStartup: true,
    meterCost: 100, meterGain: 0,
    poses: { startup: 'charge', active: 'superPose', recovery: 'charge' },
    color: '#ff4d6d',
  },
  {
    id: 'qi_gather', name: '聚气术', desc: '原地聚气恢复25点能量，期间破绽很大', category: '辅助',
    damage: 0, startup: 10, active: 30, recovery: 14,
    knockback: { x: 0, y: 0 }, hitstun: 0,
    meterCost: 0, meterGain: 0, selfMeterGain: 25,
    poses: { startup: 'charge', active: 'charge', recovery: 'idle' },
    color: '#80ffdb',
  },
];

export function getMoveById(id: string): MoveDef | undefined {
  if (id === BASIC_PUNCH.id) return BASIC_PUNCH;
  if (id === BASIC_KICK.id) return BASIC_KICK;
  return MOVE_LIBRARY.find((m) => m.id === id);
}
