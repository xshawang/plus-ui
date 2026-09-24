import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { FinanceBankVO, FinanceExchangeRateForm, FinanceExchangeRateQuery, FinanceExchangeRateVO } from './types';

/**
 * 汇率与银行管理接口（需求文档 2_财务/14）。
 *
 * 后端：go88-service-infra /infra/finance/exchange-rate/** 与 /infra/finance/bank/**；
 * 权限：finance:exchange-rate:list | finance:exchange-rate:edit
 */
export const listExchangeRate = (query?: FinanceExchangeRateQuery): AxiosPromise<FinanceExchangeRateVO[]> =>
  request({ url: '/infra/finance/exchange-rate/list', method: 'get', params: query });

export const saveExchangeRate = (data: FinanceExchangeRateForm): AxiosPromise<number> =>
  request({ url: '/infra/finance/exchange-rate', method: 'post', data });

export const changeExchangeRateStatus = (rateId: number, status: number): AxiosPromise<number> =>
  request({ url: `/infra/finance/exchange-rate/${rateId}/status/${status}`, method: 'put' });

export const makeExchangeRateEffective = (rateId: number): AxiosPromise<number> =>
  request({ url: `/infra/finance/exchange-rate/${rateId}/effective`, method: 'put' });

export const listBank = (params?: {
  keyword?: string;
  bizType?: number;
  status?: number;
  channelType?: string;
}): AxiosPromise<FinanceBankVO[]> => request({ url: '/infra/finance/bank/list', method: 'get', params });

export const changeBankStatus = (id: number, status: number): AxiosPromise<number> =>
  request({ url: `/infra/finance/bank/${id}/status/${status}`, method: 'put' });

export const sortBank = (id: number, orderNavigate: number): AxiosPromise<number> =>
  request({ url: `/infra/finance/bank/${id}/sort/${orderNavigate}`, method: 'put' });
