/** 风控态势读接口类型（对应 /infra/report/dashboard/risk/*） */

export interface RiskMetrics {
  loginFailCount: number;
  loginFailIp: number;
  loginFailDevice: number;
  banCount: number;
  unbanCount: number;
  riskControlCount: number;
  riskEventCount: number;
  withdrawRiskFlagCount: number;
  withdrawRiskFlagAmount: number;
  largeRechargeCount: number;
  largeRechargeAmount: number;
  largeWithdrawCount: number;
  largeWithdrawAmount: number;
  manualAdjustCount: number;
  manualAdjustAmount: number;
  highRiskUserCount: number;
}

export interface RiskTodayResult {
  date: string;
  snapshotAt: string;
  metrics: RiskMetrics;
}

export interface RiskTrendRow extends Partial<RiskMetrics> {
  date: string;
}

export interface RiskTrendResult {
  startDate: string;
  endDate: string;
  rows: RiskTrendRow[];
}
