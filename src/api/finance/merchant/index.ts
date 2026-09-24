import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { FinanceMerchantForm, FinanceMerchantQuery, FinanceMerchantVO } from './types';

/**
 * 三方支付/代付商户管理接口（需求文档 2_财务/03、08）。
 *
 * 后端：go88-service-infra /infra/finance/merchant/**；权限：finance:merchant:list | finance:merchant:edit
 */
export const listMerchant = (query?: FinanceMerchantQuery): AxiosPromise<PageResult<FinanceMerchantVO>> =>
  request({ url: '/infra/finance/merchant/list', method: 'get', params: query });

export const merchantOptions = (merchantType?: number): AxiosPromise<FinanceMerchantVO[]> =>
  request({ url: '/infra/finance/merchant/options', method: 'get', params: { merchantType } });

export const saveMerchant = (data: FinanceMerchantForm): AxiosPromise<number> =>
  request({ url: '/infra/finance/merchant', method: 'post', data });

export const changeMerchantStatus = (merchantId: number, status: number): AxiosPromise<number> =>
  request({ url: `/infra/finance/merchant/${merchantId}/status/${status}`, method: 'put' });

export const deleteMerchant = (merchantId: number): AxiosPromise<number> =>
  request({ url: `/infra/finance/merchant/${merchantId}`, method: 'delete' });
