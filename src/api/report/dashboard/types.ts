/** 运营后台数据看板接口类型（与 go88-service-infra /infra/report/dashboard 契约对应） */

/** KPI 单项 */
export interface KpiItem {
  key: 'newMembers' | 'betAmount' | 'activeUsers' | 'totalMembers' | 'pnl' | 'depositWithdrawDiff';
  label: string;
  value: number;
  kind: 'count' | 'money' | 'signed';
  tooltip?: string;
  yesterdaySamePeriod?: number | null;
  changeRate?: number | null;
  hasComparison?: boolean;
}

export interface KpiResult {
  snapshotAt: string;
  date: string;
  currency: string;
  items: KpiItem[];
}

/** 在线分钟点 */
export interface OnlinePoint {
  t: string;
  v: number;
}

export interface RealtimeFinance {
  rechargeAmount: number;
  rechargeUsers: number;
  rechargeCount: number;
  withdrawAmount: number;
  withdrawUsers: number;
  withdrawCount: number;
  diff: number;
  yesterday?: Partial<RealtimeFinance>;
}

export interface RealtimeResult {
  snapshotAt: string;
  date: string;
  currency: string;
  online: {
    supported: boolean;
    message?: string | null;
    currentConnections: number;
    currentUsers: number;
    todayPeak: number;
    peakAt?: string | null;
    trend: OnlinePoint[];
    updatedAt?: string | null;
    todayActive: number;
    todayNew: number;
  };
  finance: RealtimeFinance;
}

export type RankingType = 'recharge' | 'abandonRecharge' | 'withdraw' | 'bet' | 'profit';

export interface RankingItem {
  rank: number;
  uid: string;
  name: string;
  amount: number;
  count: number;
  lastAt?: string | null;
}

export interface RankingResult {
  snapshotAt: string;
  date: string;
  type: RankingType;
  currency: string;
  items: RankingItem[];
}

export interface TrendPoint {
  date: string;
  value?: number | null;
  amount?: number;
  users?: number;
  count?: number;
  newMembers?: number;
  betAmount?: number;
  validBet?: number;
  betUsers?: number;
  pnl?: number;
}

export interface TrendResult {
  snapshotAt: string;
  startDate: string;
  endDate: string;
  days: number;
  currency: string;
  series: {
    register: TrendPoint[];
    online: TrendPoint[];
    recharge: TrendPoint[];
  };
}

export type OverviewPeriod =
  | 'today'
  | 'yesterday'
  | 'thisWeek'
  | 'thisMonth'
  | 'last7'
  | 'last30'
  | 'custom';

export interface OverviewResult {
  snapshotAt: string;
  period: string;
  startDate: string;
  endDate: string;
  currency: string;
  summary: {
    newMembers: number;
    rechargeAmount: number;
    rechargeUsers: number;
    rechargeCount: number;
    withdrawAmount: number;
    withdrawUsers: number;
    withdrawCount: number;
    betAmount: number;
    validBet: number;
    betUsers: number;
    pnl: number;
  };
  trends: {
    user: TrendPoint[];
    recharge: TrendPoint[];
    withdraw: TrendPoint[];
    game: TrendPoint[];
  };
}
