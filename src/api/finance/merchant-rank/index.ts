import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

/**
 * 三方支付排名接口（需求文档 2_财务/08）。
 *
 * 后端：go88-service-infra /infra/finance/merchant-rank/**；权限：finance:merchant-rank:list
 * 页签：PAY=可用三方支付 / PAYOUT=可用三方代付 / RISK=跑路高风险三方。
 */
export type MerchantRankTab = 'PAY' | 'PAYOUT' | 'RISK';

export interface MerchantRankQuery {
  tab?: MerchantRankTab;
  currency?: string;
  supportFunc?: string;
  /** 检索维度：name/id/callbackIp/orderUrl/queryUrl/contact */
  dimension?: string;
  keyword?: string;
  /** 排序字段白名单，如 accessAt / feeRate / ydCount / successRate / avgSeconds */
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  pageNum?: number;
  pageSize?: number;
}

export interface MerchantRankVO {
  merchantId: number;
  merchantCode: string;
  merchantName: string;
  supportFunc?: string;
  merchantType?: number;
  currency?: string;
  feeRate?: number;
  accessAt?: string;
  depositDesc?: string;
  contactInfo?: string;
  disableReason?: string;
  riskLevel?: number;
  status?: number;
  callbackIp?: string;
  orderUrl?: string;
  queryUrl?: string;
  ydCount?: number;
  totalCount?: number;
  ydAmount?: number;
  successAmount?: number;
  successRate?: number;
  ydSuccessRate?: number;
  avgSeconds?: number;
  ydAvgSeconds?: number;
  updateAt?: string;
}

export interface MerchantRankOptions {
  currencies: string[];
  supportFuncs: string[];
  riskCount: number;
  riskByCurrency: Array<{ currency: string; cnt: number }>;
  dimensions: Array<{ label: string; value: string }>;
}

export const listMerchantRank = (query?: MerchantRankQuery): AxiosPromise<PageResult<MerchantRankVO>> =>
  request({ url: '/infra/finance/merchant-rank/list', method: 'get', params: query });

export const getMerchantRankOptions = (): AxiosPromise<MerchantRankOptions> =>
  request({ url: '/infra/finance/merchant-rank/options', method: 'get' });
