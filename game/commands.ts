// 指令招式定义：方向 + 拳/踢 组合触发（前/后相对角色面向，换边自动镜像）

export type CommandButton = 'punch' | 'kick';

export interface CommandDef {
  id: string;
  label: string;    // 完整标签，用于选招界面
  short: string;    // 短标签，用于战斗 HUD
  down: boolean;    // 需要按住下
  forward: boolean; // 需要按住前（面向对手方向）
  back: boolean;    // 需要按住后
  button: CommandButton;
}

// 顺序即 Loadout.commandMoves 的槽位顺序
export const COMMANDS: CommandDef[] = [
  { id: 'd_punch', label: '下+拳', short: '下拳', down: true, forward: false, back: false, button: 'punch' },
  { id: 'f_punch', label: '前+拳', short: '前拳', down: false, forward: true, back: false, button: 'punch' },
  { id: 'df_punch', label: '下前+拳', short: '下前拳', down: true, forward: true, back: false, button: 'punch' },
  { id: 'b_punch', label: '后+拳', short: '后拳', down: false, forward: false, back: true, button: 'punch' },
  { id: 'b_kick', label: '后+踢', short: '后踢', down: false, forward: false, back: true, button: 'kick' },
];

export const COMMAND_COUNT = COMMANDS.length;
