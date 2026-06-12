import type { PoseName } from './types';

// 骨骼姿势：所有坐标以脚底中心为原点，面向右，y 向上为负
// 关节: head 头心 / neck 颈 / hip 髋 / elbowF,handF 前臂 / elbowB,handB 后臂 / kneeF,footF 前腿 / kneeB,footB 后腿
export interface Pose {
  head: [number, number];
  neck: [number, number];
  hip: [number, number];
  elbowF: [number, number];
  handF: [number, number];
  elbowB: [number, number];
  handB: [number, number];
  kneeF: [number, number];
  footF: [number, number];
  kneeB: [number, number];
  footB: [number, number];
}

export const POSES: Record<PoseName, Pose> = {
  idle: {
    head: [2, -88], neck: [0, -76], hip: [0, -46],
    elbowF: [12, -64], handF: [18, -76], elbowB: [8, -60], handB: [14, -70],
    kneeF: [8, -24], footF: [12, 0], kneeB: [-6, -24], footB: [-10, 0],
  },
  walk: {
    head: [3, -87], neck: [1, -75], hip: [0, -45],
    elbowF: [13, -63], handF: [19, -74], elbowB: [7, -59], handB: [13, -68],
    kneeF: [12, -24], footF: [20, 0], kneeB: [-10, -24], footB: [-18, 0],
  },
  jump: {
    head: [2, -90], neck: [0, -78], hip: [0, -50],
    elbowF: [14, -70], handF: [20, -82], elbowB: [6, -62], handB: [10, -72],
    kneeF: [10, -30], footF: [8, -14], kneeB: [-8, -28], footB: [-10, -12],
  },
  crouch: {
    head: [4, -64], neck: [2, -54], hip: [0, -28],
    elbowF: [14, -46], handF: [18, -56], elbowB: [8, -42], handB: [12, -50],
    kneeF: [14, -16], footF: [16, 0], kneeB: [-12, -16], footB: [-14, 0],
  },
  block: {
    head: [-2, -86], neck: [-2, -75], hip: [-2, -45],
    elbowF: [10, -60], handF: [12, -80], elbowB: [8, -56], handB: [10, -68],
    kneeF: [6, -24], footF: [10, 0], kneeB: [-8, -24], footB: [-12, 0],
  },
  hit: {
    head: [-10, -84], neck: [-6, -73], hip: [-2, -44],
    elbowF: [-2, -66], handF: [-8, -74], elbowB: [4, -58], handB: [0, -64],
    kneeF: [6, -22], footF: [14, 0], kneeB: [-8, -22], footB: [-12, 0],
  },
  knockdown: {
    head: [-38, -10], neck: [-28, -9], hip: [-4, -8],
    elbowF: [-18, -14], handF: [-10, -16], elbowB: [-22, -4], handB: [-14, -2],
    kneeF: [12, -10], footF: [26, -2], kneeB: [8, -4], footB: [22, 0],
  },
  punchWind: {
    head: [0, -87], neck: [-1, -75], hip: [-1, -45],
    elbowF: [4, -62], handF: [2, -70], elbowB: [8, -60], handB: [12, -68],
    kneeF: [7, -24], footF: [11, 0], kneeB: [-7, -24], footB: [-11, 0],
  },
  punch: {
    head: [7, -86], neck: [5, -74], hip: [4, -45],
    elbowF: [22, -72], handF: [38, -72], elbowB: [-2, -58], handB: [2, -66],
    kneeF: [12, -24], footF: [18, 0], kneeB: [-6, -24], footB: [-12, 0],
  },
  kickWind: {
    head: [-2, -87], neck: [-2, -75], hip: [-1, -46],
    elbowF: [10, -62], handF: [16, -72], elbowB: [6, -58], handB: [10, -66],
    kneeF: [12, -34], footF: [8, -22], kneeB: [-6, -24], footB: [-10, 0],
  },
  kick: {
    head: [-6, -84], neck: [-3, -73], hip: [0, -47],
    elbowF: [8, -60], handF: [12, -70], elbowB: [-4, -58], handB: [-8, -64],
    kneeF: [22, -38], footF: [40, -42], kneeB: [-6, -24], footB: [-12, 0],
  },
  uppercut: {
    head: [4, -92], neck: [3, -80], hip: [2, -50],
    elbowF: [14, -82], handF: [16, -102], elbowB: [0, -60], handB: [-6, -52],
    kneeF: [12, -28], footF: [10, -8], kneeB: [-8, -26], footB: [-14, 0],
  },
  smashWind: {
    head: [-2, -90], neck: [-2, -78], hip: [-1, -47],
    elbowF: [8, -88], handF: [4, -100], elbowB: [4, -86], handB: [0, -98],
    kneeF: [8, -24], footF: [12, 0], kneeB: [-6, -24], footB: [-10, 0],
  },
  smash: {
    head: [8, -80], neck: [6, -70], hip: [3, -44],
    elbowF: [20, -62], handF: [30, -50], elbowB: [16, -60], handB: [26, -48],
    kneeF: [12, -24], footF: [18, 0], kneeB: [-6, -22], footB: [-12, 0],
  },
  throwPose: {
    head: [6, -85], neck: [4, -74], hip: [2, -45],
    elbowF: [18, -68], handF: [32, -66], elbowB: [16, -62], handB: [30, -58],
    kneeF: [10, -24], footF: [16, 0], kneeB: [-8, -24], footB: [-12, 0],
  },
  sweep: {
    head: [0, -56], neck: [0, -48], hip: [-2, -24],
    elbowF: [10, -38], handF: [16, -30], elbowB: [-8, -34], handB: [-14, -26],
    kneeF: [18, -12], footF: [38, -2], kneeB: [-10, -12], footB: [-12, 0],
  },
  grabPose: {
    head: [8, -84], neck: [6, -73], hip: [4, -44],
    elbowF: [20, -70], handF: [32, -74], elbowB: [18, -62], handB: [30, -60],
    kneeF: [12, -24], footF: [20, 0], kneeB: [-6, -22], footB: [-10, 0],
  },
  dashStrike: {
    head: [14, -78], neck: [10, -68], hip: [6, -42],
    elbowF: [26, -64], handF: [24, -56], elbowB: [-6, -56], handB: [-14, -50],
    kneeF: [18, -22], footF: [28, 0], kneeB: [-10, -20], footB: [-20, 0],
  },
  spinKick: {
    head: [-4, -86], neck: [-2, -74], hip: [0, -48],
    elbowF: [6, -62], handF: [0, -70], elbowB: [-8, -60], handB: [-14, -66],
    kneeF: [20, -50], footF: [38, -58], kneeB: [-8, -26], footB: [-12, 0],
  },
  charge: {
    head: [0, -82], neck: [0, -71], hip: [0, -42],
    elbowF: [12, -52], handF: [10, -40], elbowB: [-12, -52], handB: [-10, -40],
    kneeF: [10, -22], footF: [14, 0], kneeB: [-10, -22], footB: [-14, 0],
  },
  superPose: {
    head: [4, -90], neck: [2, -78], hip: [1, -48],
    elbowF: [20, -72], handF: [36, -76], elbowB: [16, -64], handB: [32, -62],
    kneeF: [12, -26], footF: [20, 0], kneeB: [-8, -24], footB: [-14, 0],
  },
};

export function lerpPose(from: Pose, to: Pose, t: number): Pose {
  const l = (a: [number, number], b: [number, number]): [number, number] => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
  ];
  return {
    head: l(from.head, to.head), neck: l(from.neck, to.neck), hip: l(from.hip, to.hip),
    elbowF: l(from.elbowF, to.elbowF), handF: l(from.handF, to.handF),
    elbowB: l(from.elbowB, to.elbowB), handB: l(from.handB, to.handB),
    kneeF: l(from.kneeF, to.kneeF), footF: l(from.footF, to.footF),
    kneeB: l(from.kneeB, to.kneeB), footB: l(from.footB, to.footB),
  };
}

export function clonePose(p: Pose): Pose {
  return JSON.parse(JSON.stringify(p));
}
