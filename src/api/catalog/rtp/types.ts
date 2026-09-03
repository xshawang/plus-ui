export interface RtpGameRow {
  gameCode: string;
  gid: number;
  name: string;
  /** 是否启用本游戏 RTP 控制（false = 走游戏原始逻辑） */
  enabled: boolean;
  /** 赔付表整体缩放（0.10~3.00），控制返奖金额 */
  rtpScale?: number;
  /** 中奖局保留概率（0.0~1.0），调低 = 中奖率下降 */
  winKeepRate?: number;
  /** 未中奖局保留概率（0.0~1.0），调低 = 中奖率上升 */
  loseKeepRate?: number;
  /** 配置生效版本（slot 侧运行时元数据，只读） */
  version?: number;
  /** 最近一次变更时间戳（ms） */
  updatedAt?: number;
  /** 最近一次变更操作人 */
  updatedBy?: string;
}

export interface RtpGamesResult {
  /** slot 全局 RTP 控制是否启用 */
  enabled: boolean;
  /** 未单独配置的游戏默认赔付缩放 */
  defaultRtpScale: number;
  version?: number;
  updatedAt?: number;
  updatedBy?: string;
  dataId?: string;
  list: RtpGameRow[];
}

/** slot 侧单游戏配置（GET /slot/admin/rtp/config/{gameCode} 返回结构） */
export interface RtpGameConfig {
  enabled?: boolean;
  rtpScale?: number;
  winKeepRate?: number;
  loseKeepRate?: number;
  version?: number;
  updatedAt?: number;
  updatedBy?: string;
}

export interface RtpConfigResult {
  enabled: boolean;
  defaultRtpScale: number;
  games: Record<string, RtpGameConfig>;
  version?: number;
  updatedAt?: number;
  updatedBy?: string;
  dataId?: string;
}

/** 保存到 go88-service-game-slot 的单款游戏配置 */
export interface RtpSaveItem {
  gameCode: string;
  enabled: boolean;
  rtpScale?: number;
  winKeepRate?: number;
  loseKeepRate?: number;
}

export interface RtpSaveBody {
  /** 操作人（slot 审计留痕，缺省 admin） */
  operator?: string;
  games: RtpSaveItem[];
}
