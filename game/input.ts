import type { InputFrame } from './types';

export function emptyInput(): InputFrame {
  return {
    left: false, right: false, up: false, down: false,
    punch: false, kick: false,
    skills: [false, false, false, false],
  };
}

// 键位映射：P1 = WASD + J/K + U/I/O/P；P2 = 方向键 + 小键盘(或 ,. + 数字1-4)
interface KeyMap {
  left: string[]; right: string[]; up: string[]; down: string[];
  punch: string[]; kick: string[];
  skills: string[][];
}

const P1_MAP: KeyMap = {
  left: ['KeyA'], right: ['KeyD'], up: ['KeyW'], down: ['KeyS'],
  punch: ['KeyJ'], kick: ['KeyK'],
  skills: [['KeyU'], ['KeyI'], ['KeyO'], ['KeyP']],
};

const P2_MAP: KeyMap = {
  left: ['ArrowLeft'], right: ['ArrowRight'], up: ['ArrowUp'], down: ['ArrowDown'],
  punch: ['Numpad1', 'Comma'], kick: ['Numpad2', 'Period'],
  skills: [
    ['Numpad4', 'Digit1'],
    ['Numpad5', 'Digit2'],
    ['Numpad6', 'Digit3'],
    ['Numpad8', 'Digit4'],
  ],
};

const MAPS = [P1_MAP, P2_MAP];

// 阻止页面滚动等默认行为的按键
const PREVENT_KEYS = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space',
]);

export class KeyboardManager {
  private held = new Set<string>();
  private pressedEdge = new Set<string>();
  private onDown = (e: KeyboardEvent) => {
    if (PREVENT_KEYS.has(e.code)) e.preventDefault();
    if (!this.held.has(e.code)) this.pressedEdge.add(e.code);
    this.held.add(e.code);
  };
  private onUp = (e: KeyboardEvent) => {
    this.held.delete(e.code);
  };
  private onBlur = () => {
    this.held.clear();
    this.pressedEdge.clear();
  };

  attach() {
    window.addEventListener('keydown', this.onDown);
    window.addEventListener('keyup', this.onUp);
    window.addEventListener('blur', this.onBlur);
  }

  dispose() {
    window.removeEventListener('keydown', this.onDown);
    window.removeEventListener('keyup', this.onUp);
    window.removeEventListener('blur', this.onBlur);
  }

  private anyHeld(codes: string[]): boolean {
    return codes.some((c) => this.held.has(c));
  }
  private anyEdge(codes: string[]): boolean {
    return codes.some((c) => this.pressedEdge.has(c));
  }

  // 取某玩家本帧输入（方向为持续按住，攻击为按下边沿）
  frame(player: 0 | 1): InputFrame {
    const m = MAPS[player];
    return {
      left: this.anyHeld(m.left),
      right: this.anyHeld(m.right),
      up: this.anyHeld(m.up),
      down: this.anyHeld(m.down),
      punch: this.anyEdge(m.punch),
      kick: this.anyEdge(m.kick),
      skills: [
        this.anyEdge(m.skills[0]),
        this.anyEdge(m.skills[1]),
        this.anyEdge(m.skills[2]),
        this.anyEdge(m.skills[3]),
      ],
    };
  }

  // 每逻辑帧结束后调用，清空边沿触发
  endFrame() {
    this.pressedEdge.clear();
  }
}
