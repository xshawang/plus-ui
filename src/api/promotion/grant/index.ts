import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  PromoDispatchLimitVO,
  PromoGrantFulfillForm,
  PromoGrantAuditForm,
  PromoGrantDispatchForm,
  PromoGrantQuery,
  PromoGrantReconcileQuery,
  PromoGrantReconcileVO,
  PromoGrantVO
} from './types';

/**
 * 优惠领取与审核接口（需求文档 07）。
 *
 * 后端：go88-service-infra（org.dromara.go88.promotion.controller.PromoGrantController）
 * 权限：promotion:grant:list / promotion:grant:audit / promotion:grant:dispatch
 */
export const listPromoGrant = (query?: PromoGrantQuery): AxiosPromise<PromoGrantVO[]> => {
  return request({ url: '/infra/promotion/grant/list', method: 'get', params: query });
};

/** 当前筛选条件下的合计（页脚小计） */
export const getPromoGrantSummary = (query?: PromoGrantQuery): AxiosPromise<Record<string, unknown>> => {
  return request({ url: '/infra/promotion/grant/summary', method: 'get', params: query });
};

/** 派发一键审核：按优惠聚合视图 */
export const listPromoGrantAggregate = (query?: PromoGrantQuery): AxiosPromise<Array<Record<string, unknown>>> => {
  return request({ url: '/infra/promotion/grant/aggregate', method: 'get', params: query });
};

/** 审核（通过 / 拒绝 / 标记不符合条件，支持批量） */
export const auditPromoGrant = (data: PromoGrantAuditForm): AxiosPromise<Record<string, unknown>> => {
  return request({ url: '/infra/promotion/grant/audit', method: 'post', data });
};

/** 新增派发 */
export const dispatchPromoGrant = (data: PromoGrantDispatchForm): AxiosPromise<Record<string, unknown>> => {
  return request({ url: '/infra/promotion/grant/dispatch', method: 'post', data });
};

/** 标记已领取 */
export const claimPromoGrant = (orderId: number): AxiosPromise<void> => {
  return request({ url: `/infra/promotion/grant/${orderId}/claim`, method: 'post' });
};

/** 重试派发失败的入账（幂等：同一单号重复重试不会重复到账） */
export const retryPromoGrant = (orderId: number): AxiosPromise<Record<string, unknown>> => {
  return request({ url: `/infra/promotion/grant/${orderId}/retry`, method: 'post' });
};

/** 自动重试全部派发失败的发放单（L11：定时任务与手动触发共用，达上限不再重试） */
export const autoRetryPromoGrant = (): AxiosPromise<Record<string, unknown>> => {
  return request({ url: '/infra/promotion/grant/retry/auto', method: 'post' });
};

/** 实物/兑换码履约（L13：登记收货信息、发货或发码后置为已领取） */
export const fulfillPromoGrant = (orderId: number, data: PromoGrantFulfillForm): AxiosPromise<Record<string, unknown>> => {
  return request({ url: `/infra/promotion/grant/${orderId}/fulfill`, method: 'post', data });
};

/** 发放对账明细（L12） */
export const listPromoGrantReconcile = (query?: PromoGrantReconcileQuery): AxiosPromise<PromoGrantReconcileVO[]> => {
  return request({ url: '/infra/promotion/grant/reconcile/list', method: 'get', params: query });
};

/** 对账跑批日差异汇总 */
export const summaryPromoGrantReconcile = (runDate?: string): AxiosPromise<Array<Record<string, unknown>>> => {
  return request({ url: '/infra/promotion/grant/reconcile/summary', method: 'get', params: { runDate } });
};

/** 执行对账跑批（不传日期取 T-1） */
export const runPromoGrantReconcile = (runDate?: string): AxiosPromise<Record<string, unknown>> => {
  return request({ url: '/infra/promotion/grant/reconcile/run', method: 'post', params: { runDate } });
};

/** 人工处理对账差异（2 已处理 / 3 已忽略） */
export const handlePromoGrantReconcile = (id: number, status: number, remark?: string): AxiosPromise<void> => {
  return request({ url: `/infra/promotion/grant/reconcile/${id}/handle`, method: 'put', params: { status, remark } });
};

/** 一键修复「钱包已到账但发放单未置已领取」（不产生资金变动） */
export const repairPromoGrantReconcile = (id: number): AxiosPromise<Record<string, unknown>> => {
  return request({ url: `/infra/promotion/grant/reconcile/${id}/repair`, method: 'post' });
};

/** 修改后台备注 */
export const remarkPromoGrant = (orderId: number, backRemark: string): AxiosPromise<void> => {
  return request({ url: `/infra/promotion/grant/${orderId}/remark`, method: 'put', params: { backRemark } });
};

/** 手动触发过期扫描 */
export const expirePromoGrant = (): AxiosPromise<number> => {
  return request({ url: '/infra/promotion/grant/expire', method: 'post' });
};

export const listPromoDispatchLimit = (): AxiosPromise<PromoDispatchLimitVO[]> => {
  return request({ url: '/infra/promotion/grant/limit/list', method: 'get' });
};

export const savePromoDispatchLimit = (data: Partial<PromoDispatchLimitVO>): AxiosPromise<void> => {
  return request({ url: '/infra/promotion/grant/limit', method: 'put', data });
};
