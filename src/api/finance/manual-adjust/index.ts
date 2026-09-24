import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  FinanceManualAdjustForm,
  FinanceManualAdjustQuery,
  FinanceManualAdjustVO,
  FinanceMemberAssetVO
} from './types';

/**
 * 人工拉回修正接口（需求文档 2_财务/12）。
 *
 * 后端：go88-service-infra /infra/finance/manual-adjust/**；
 * 权限：finance:manual-adjust:list | finance:manual-adjust:edit
 * 资金口径：加/扣款经钱包 manualCredit/manualDebit 入账，requestId 为幂等键。
 */
export const getMemberAsset = (params: { uid?: number; account?: string }): AxiosPromise<FinanceMemberAssetVO> =>
  request({ url: '/infra/finance/manual-adjust/member', method: 'get', params });

export const submitManualAdjust = (data: FinanceManualAdjustForm): AxiosPromise<FinanceManualAdjustVO> =>
  request({ url: '/infra/finance/manual-adjust/submit', method: 'post', data });

export const approveManualAdjust = (adjustId: number): AxiosPromise<FinanceManualAdjustVO> =>
  request({ url: `/infra/finance/manual-adjust/${adjustId}/approve`, method: 'put' });

export const rejectManualAdjust = (adjustId: number, reason?: string): AxiosPromise<FinanceManualAdjustVO> =>
  request({ url: `/infra/finance/manual-adjust/${adjustId}/reject`, method: 'put', params: { reason } });

export const listManualAdjust = (
  query?: FinanceManualAdjustQuery
): AxiosPromise<PageResult<FinanceManualAdjustVO>> =>
  request({ url: '/infra/finance/manual-adjust/list', method: 'get', params: query });

export const getManualAdjustDetail = (adjustId: number): AxiosPromise<FinanceManualAdjustVO> =>
  request({ url: `/infra/finance/manual-adjust/${adjustId}`, method: 'get' });
