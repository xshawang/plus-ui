/**
 * 实时返水（需求文档 05）类型定义。
 */
export interface PromoRebateQuery {
  pageNum?: number;
  pageSize?: number;
  configId?: number;
  configName?: string;
  currency?: string;
  gameCategory?: string;
  status?: number;
  account?: string;
  timeStart?: string;
  timeEnd?: string;
}

export interface PromoRebateConfigVO {
  configId: number;
  configName: string;
  currency: string;
  gameCategory?: string;
  /** 1=有效投注 2=输额 3=净赢 */
  rebateType?: number;
  rebateRate?: number;
  minBetAmount?: number;
  maxRebateAmount?: number;
  /** 1=实时 2=按分钟 3=按小时 4=按日 */
  settlePeriod?: number;
  minVipLevel?: number;
  startAt?: string;
  endAt?: string;
  enabled?: number;
  ruleDesc?: string;
  operatorId?: string;
  updatedAt?: string;
  recordCount?: number;
  totalRebate?: number;
  totalBet?: number;
}

export interface PromoRebateConfigForm {
  configId?: number;
  configName: string;
  currency: string;
  gameCategory: string;
  rebateType?: number;
  rebateRate: number;
  minBetAmount?: number;
  maxRebateAmount?: number;
  settlePeriod?: number;
  minVipLevel?: number;
  startAt?: string;
  endAt?: string;
  enabled?: number;
  ruleDesc?: string;
}
