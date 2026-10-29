export interface RobotGameOption {
  code: string;
  name: string;
  type: 'P2P' | 'DEALER';
}

export const ROBOT_GAME_OPTIONS: RobotGameOption[] = [
  { code: 'vgcg_1', name: '数牌斗地主 / DemLa', type: 'P2P' },
  { code: 'vgcg_11', name: '南方进升 / TLMN', type: 'P2P' },
  { code: 'vgcg_2', name: 'Sâm Lốc', type: 'P2P' },
  { code: 'vgcg_4', name: 'Mậu Binh', type: 'P2P' },
  { code: 'vgcg_5', name: 'Liêng', type: 'P2P' },
  { code: 'vgcg_6', name: '德州扑克 / Holdem', type: 'P2P' },
  { code: 'vgcg_7', name: 'Xì Tố', type: 'P2P' },
  { code: 'vgcg_8', name: 'Phỏm', type: 'P2P' },
  { code: '510034', name: 'Catte', type: 'P2P' },
  { code: 'ktc_7994', name: 'Xì Dách', type: 'DEALER' },
  { code: 'ktrng_3997', name: 'Baccarat', type: 'DEALER' },
  { code: 'vgmn_88', name: 'Hắc Hồng', type: 'DEALER' }
];

export function gameOptionLabel(option: RobotGameOption): string {
  return `${option.name} (${option.code})`;
}
