/**
 * 含奖池/加码游戏「综合 RTP」监控类型定义。
 *
 * 口径来源：《含奖池加码游戏综合RTP口径报告》V1.0
 * （go88-service-game-lobby/docs/rtp/含奖池加码游戏综合RTP口径报告.md）
 * 后端：go88-service-infra `/infra/report/rtp/**`
 */

/** 理论口径配置（基础 / 奖池 / 加码）。 */
export interface RtpTheoryConfig {
  gameId: string;
  gameName: string;
  /** 基础理论 RTP（小数，如 0.9722） */
  baseTheoreticalRtp: number | null;
  /** 奖池理论 RTP（稳态≈注资率） */
  jackpotTheoreticalRtp: number | null;
  /** 加码理论 RTP（加码/加奖/Bonus） */
  bonusTheoreticalRtp: number | null;
  baseNote?: string;
  bonusNote?: string;
}

/** 综合 RTP 日报一行。 */
export interface RtpDailyRow {
  statDate: string;
  gameId: string;
  gameName: string;
  validBet: number | null;
  baseTheoreticalRtp: number | null;
  jackpotTheoreticalRtp: number | null;
  bonusTheoreticalRtp: number | null;
  totalTheoreticalRtp: number | null;
  basePayout: number | null;
  jackpotPayout: number | null;
  bonusPayout: number | null;
  totalPayout: number | null;
  actualRtp: number | null;
  /** 偏差（百分点 = (实际 − 理论) × 100） */
  rtpDiff: number | null;
  jackpotOpenBalance: number | null;
  jackpotInflow: number | null;
  jackpotCloseBalance: number | null;
  betCount: number | null;
  payoutCount: number | null;
  jackpotHitCount: number | null;
  /** 理论等级 GREEN / ORANGE / RED */
  theoryAlertLevel: string;
  /** 实际偏差等级 NORMAL / WATCH / ABNORMAL */
  actualAlertLevel: string;
  /** 综合等级 */
  alertLevel: string;
  /** OK / PARTIAL / NO_DATA / NO_THEORY */
  dataStatus: string;
  baseNote?: string;
  bonusNote?: string;
}

/** 奖池资金日报一行。 */
export interface RtpJackpotDailyRow {
  statDate: string;
  gameId: string;
  jackpotId: string;
  openingBalance: number | null;
  playerContribution: number | null;
  platformContribution: number | null;
  adjustmentAmount: number | null;
  payoutAmount: number | null;
  closingBalance: number | null;
  reconDiff: number | null;
  dataStatus: string;
}

/** 区间汇总（管理层视图，注额加权）。 */
export interface RtpSummary {
  startDate: string;
  endDate: string;
  games: RtpDailyRow[];
  overall: {
    gameCount: number;
    greenCount: number;
    orangeCount: number;
    redCount: number;
    validBet: number | null;
    basePayout: number | null;
    jackpotPayout: number | null;
    bonusPayout: number | null;
    totalPayout: number | null;
    baseRtp: number | null;
    jackpotRtp: number | null;
    bonusRtp: number | null;
    totalTheoreticalRtp: number | null;
    actualRtp: number | null;
    rtpDiffPp: number | null;
  };
}
