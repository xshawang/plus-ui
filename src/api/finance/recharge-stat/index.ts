import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  FinanceStatChannel,
  FinanceStatMerchantRank,
  FinanceStatQuery,
  FinanceStatRoute,
  FinanceStatSummaryVO
} from './types';

/**
 * 充值统计与第三方统计接口（需求文档 2_财务/08）。
 *
 * 后端：go88-service-infra /infra/finance/recharge-stat/**；权限：finance:recharge-stat:list
 * 口径：payment_order.type=1 AND status=2；时间参数 yyyy-MM-dd HH:mm:ss，缺省最近 7 天。
 */
export const getRechargeStatSummary = (query?: FinanceStatQuery): AxiosPromise<FinanceStatSummaryVO> =>
  request({ url: '/infra/finance/recharge-stat/summary', method: 'get', params: query });

export const listRechargeStatChannel = (query?: FinanceStatQuery): AxiosPromise<FinanceStatChannel[]> =>
  request({ url: '/infra/finance/recharge-stat/channel', method: 'get', params: query });

export const listRechargeStatRoute = (query?: FinanceStatQuery): AxiosPromise<FinanceStatRoute[]> =>
  request({ url: '/infra/finance/recharge-stat/route', method: 'get', params: query });

export const listRechargeStatMerchantRanking = (query?: FinanceStatQuery): AxiosPromise<FinanceStatMerchantRank[]> =>
  request({ url: '/infra/finance/recharge-stat/merchant-ranking', method: 'get', params: query });
