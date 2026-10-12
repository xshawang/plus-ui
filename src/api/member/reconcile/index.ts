import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { MemberReconcileErrorVO, ReconcileQuery, ReconcileSummaryVO } from './types';

/**
 * 会员资金链路对账差异接口（差异由 go88-job 定时写入 wallet_reconcile_error）。
 * 权限：member:reconcile:list / member:reconcile:edit
 */
export const listReconcileError = (query?: ReconcileQuery): AxiosPromise<MemberReconcileErrorVO[]> => {
  const params = { ...query } as Record<string, unknown>;
  if (query?.dateRange?.length === 2) {
    params.dateStart = query.dateRange[0];
    params.dateEnd = query.dateRange[1];
  }
  delete params.dateRange;
  return request({ url: '/infra/member/reconcile/list', method: 'get', params });
};

export const getReconcileSummary = (): AxiosPromise<ReconcileSummaryVO> => {
  return request({ url: '/infra/member/reconcile/summary', method: 'get' });
};

/** 标记已修复/忽略（需填写处理说明） */
export const handleReconcileError = (data: { id: number; status: number; note: string }): AxiosPromise<number> => {
  return request({ url: '/infra/member/reconcile/handle', method: 'post', data });
};
