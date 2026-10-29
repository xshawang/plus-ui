/** 运营后台数据看板接口类型（与 go88-service-infra /infra/report/dashboard 契约对应） */

/** KPI 单项 */
export interface KpiItem {
  key:
    | 'newMembers'
    | 'betAmount'
    | 'activeUsers'
    | 'totalMembers'
    | 'pnl'
    | 'depositWithdrawDiff'
    | 'rechargeAmount'
    | 'withdrawApplyAmount'
    | 'withdrawPendingAmount'
    | 'validBet'
    | 'ggr'
    | 'ngr'
    | string;
  label: string;
  value: number | null;
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
  metrics?: Record<string, number>;
  yesterdayMetrics?: Record<string, number>;
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
  withdrawApplyAmount?: number;
  withdrawApplyUsers?: number;
  withdrawApplyCount?: number;
  withdrawPendingAmount?: number;
  withdrawPendingUsers?: number;
  withdrawPendingCount?: number;
  withdrawPendingOldestAt?: string | null;
  withdrawPendingOldestMinutes?: number | null;
  withdrawPaidAmount?: number;
  withdrawPaidUsers?: number;
  withdrawPaidCount?: number;
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

export type OverviewPeriod = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'last7' | 'last30' | 'custom';

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

export interface DashboardMeta {
  site: string;
  currency: string;
  rawCurrency?: string;
  amountScale?: number;
  timezone: string;
  globalTimezone?: string;
  timezoneAligned?: boolean;
  snapshotAt?: string;
}

export interface DashboardHealthSource {
  key: string;
  table: string;
  description?: string;
  lastAt?: string | null;
  lagSeconds?: number | null;
  thresholdSeconds?: number;
  status: 'OK' | 'BROKEN';
  message?: string;
}

export interface DashboardHealth {
  snapshotAt: string;
  site: string;
  timezone: string;
  currency: string;
  healthy: boolean;
  broken: string[];
  sources: DashboardHealthSource[];
}

export interface DashboardAlert {
  key: string;
  label: string;
  level: 'warning' | 'danger';
  count: number;
  amount?: number | null;
}

export interface DashboardSnapshotResult {
  meta: DashboardMeta;
  kpi: KpiResult;
  realtime: RealtimeResult;
  risk: import('./risk-types').RiskTodayResult;
  health: DashboardHealth;
  alerts: DashboardAlert[];
}
