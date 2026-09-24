/**
 * 充值统计与第三方统计（需求文档 2_财务/08）类型定义。
 *
 * 口径：payment_order.type = 1 AND status = 2（成功充值）；金额单位：分。
 */
export interface FinanceStatQuery {
  beginTime?: string;
  endTime?: string;
  limit?: number;
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
