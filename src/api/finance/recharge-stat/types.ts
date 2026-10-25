/**
 * 充值统计与第三方统计（需求文档 2_财务/08）类型定义。
 *
 * 口径：payment_order.type = 1 AND status = 2（成功充值）；金额单位：分。
 */
export interface FinanceStatQuery {
  beginTime?: string;
  endTime?: string;
  merchantId?: number;
  groupId?: number;
  routeId?: number;
  currency?: string;
  limit?: number;
}

export interface FinanceRechargeReportSummary {
  totalCount: number;
  successCount: number;
  failedCount: number;
  cancelledCount: number;
  pendingCount: number;
  successRate: number;
  successVndAmount: number;
  successCreditAmount: number;
  feeAmount: number;
  bonusAmount: number;
  memberCount: number;
  avgVndAmount: number;
  avgLatencySeconds?: number;
  maxLatencySeconds?: number;
}

export interface FinanceRechargeReportRow extends FinanceRechargeReportSummary {
  statDate: string;
  merchantId: number;
  merchantName: string;
  channelCode: string;
  channelName: string;
  routeCode: string;
  routeName: string;
  currency: string;
}

export interface FinanceRechargeReportGroupOption {
  groupId: number;
  groupCode: string;
  groupName: string;
}

export interface FinanceRechargeReportRouteOption {
  routeId: number;
  groupId: number;
  routeCode: string;
  channelName: string;
  merchantId: number;
}

export interface FinanceRechargeReportMerchantOption {
  merchantId: number;
  merchantCode: string;
  merchantName: string;
}

export interface FinanceRechargeReport {
  beginTime: string;
  endTime: string;
  summary: FinanceRechargeReportSummary;
  rows: FinanceRechargeReportRow[];
  groups: FinanceRechargeReportGroupOption[];
  routes: FinanceRechargeReportRouteOption[];
  merchants: FinanceRechargeReportMerchantOption[];
}

export interface FinanceStatSummary {
  successCount?: number;
  successAmount?: number;
  memberCount?: number;
  avgAmount?: number;
}

export interface FinanceStatDaily {
  statDate: string;
  successCount: number;
  successAmount: number;
}

export interface FinanceStatChannel {
  channel: string;
  successCount: number;
  successAmount: number;
}

export interface FinanceStatRoute {
  routeCode: string;
  totalCount: number;
  successCount: number;
  successAmount: number;
  successRate: number;
  merchantName?: string;
  feeRate?: number;
}

export interface FinanceStatMerchantRank {
  merchantCode: string;
  merchantName: string;
  /** 1三方支付(收单) 2三方代付(出款) */
  merchantType: number;
  /** 跑路风险:1高 2中 3低 */
  riskLevel: number;
  successCount: number;
  successAmount: number;
}

export interface FinanceStatSummaryVO {
  beginTime: string;
  endTime: string;
  summary: FinanceStatSummary;
  daily: FinanceStatDaily[];
  channel: FinanceStatChannel[];
}
