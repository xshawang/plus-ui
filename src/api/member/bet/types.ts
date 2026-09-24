/**
 * 会员投注细目（需求文档 03）类型定义。
 */
export interface MemberBetQuery {
  pageNum?: number;
  pageSize?: number;
  uid?: number | string;
  loginName?: string;
  gameCode?: string;
  startDate?: string;
  endDate?: string;
}

export interface MemberBetSummaryVO {
  uid: number;
  loginName?: string;
  levelName?: string;
  gameCode?: string;
  gameName?: string;
  betCount?: number;
  betAmount?: number;
  validBetAmount?: number;
  payoutAmount?: number;
  netWinLoss?: number;
  killRate?: number;
}

export interface MemberBetDailyVO {
  statDate: string;
  betCount?: number;
  betAmount?: number;
  payoutAmount?: number;
  netWinLoss?: number;
  killRate?: number;
}
