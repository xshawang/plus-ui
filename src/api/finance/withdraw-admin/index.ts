import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

/**
 * 财务侧提现管理接口（需求文档 2_财务/09、10、11）。
 *
 * 后端：go88-service-infra /infra/finance/withdraw/**；权限：finance:withdrawadmin:list|edit
 */
export interface WithdrawAdminQuery {
  uid?: number;
  account?: string;
  orderNo?: string;
  status?: number;
  withdrawChannelCode?: string;
  withdrawTabCode?: string;
  providerCode?: string;
  payMerchantCode?: string;
  largeAmount?: number;
  lockedByMe?: number;
  unlockedOnly?: number;
  pageNum?: number;
  pageSize?: number;
  params?: Record<string, unknown>;
}

export interface WithdrawAdminVO {
  orderId: number;
  orderNo: string;
  requestId?: string;
  recordSource?: 'INTERNAL' | 'P2P_EXTERNAL';
  uid: number;
  account?: string;
  nickName?: string;
  vipLevel?: number;
  amount: number;
  currency?: string;
  withdrawTabCode?: string;
  channelNameSnapshot?: string;
  settlementCurrency?: string;
  rateFrom?: number;
  rateTo?: number;
  exchangeRate?: number;
  convertedAmount?: number;
  convertedFeeAmount?: number;
  feeValue?: number;
  feeCurrency?: string;
  finalAmount?: number;
  feeAmount?: number;
  taxAmount?: number;
  arriveAmount?: number;
  withdrawChannelCode?: string;
  providerCode?: string;
  providerOrderNo?: string;
  beneficiaryMask?: string;
  beneficiaryName?: string;
  status: number;
  auditStatus?: number;
  riskFlag?: number;
  largeAmount?: number;
  failCode?: string;
  failMsg?: string;
  frontRemark?: string;
  backRemark?: string;
  lockOperatorId?: string;
  lockAt?: string;
  auditOperatorId?: string;
  payOperatorId?: string;
  payMerchantCode?: string;
  payRetryCount?: number;
  routeId?: number;
  withdrawChannelId?: number;
  merchantId?: number;
  merchantName?: string;
  clientIp?: string;
  deviceFingerprint?: string;
  clientOs?: string;
  clientBrowser?: string;
  clientDevice?: string;
  clientUserAgent?: string;
  notifyStatus?: string;
  lastNotifyAt?: string;
  applyAt?: string;
  finishAt?: string;
  updatedAt?: string;
}

export interface WithdrawActionForm {
  orderId?: number;
  orderNo?: string;
  remark?: string;
  frontRemark?: string;
  payMerchantCode?: string;
}

export const listWithdrawAdmin = (query?: WithdrawAdminQuery): AxiosPromise<PageResult<WithdrawAdminVO>> =>
  request({ url: '/infra/finance/withdraw/list', method: 'get', params: query });

/** 风控审核通过（0→1）。 */
export const auditWithdraw = (data: WithdrawActionForm): AxiosPromise<Record<string, unknown>> =>
  request({ url: '/infra/finance/withdraw/audit', method: 'post', data });

/** 驳回（0/1→3，资金退回可用余额）。 */
export const rejectWithdraw = (data: WithdrawActionForm): AxiosPromise<Record<string, unknown>> =>
  request({ url: '/infra/finance/withdraw/reject', method: 'post', data });

/** 财务出款（1→2）。 */
export const payWithdraw = (data: WithdrawActionForm): AxiosPromise<Record<string, unknown>> =>
  request({ url: '/infra/finance/withdraw/pay', method: 'post', data });

/** 免审出款（0→2）。 */
export const noAuditPayWithdraw = (data: WithdrawActionForm): AxiosPromise<Record<string, unknown>> =>
  request({ url: '/infra/finance/withdraw/no-audit-pay', method: 'post', data });

/** 重新代付（重试次数 +1）。 */
export const rePayWithdraw = (data: WithdrawActionForm): AxiosPromise<Record<string, unknown>> =>
  request({ url: '/infra/finance/withdraw/re-pay', method: 'post', data });

/** 提现转充值（0/1→4，净额不变）。 */
export const transferWithdrawToRecharge = (data: WithdrawActionForm): AxiosPromise<Record<string, unknown>> =>
  request({ url: '/infra/finance/withdraw/transfer-to-recharge', method: 'post', data });

/** 备注维护。 */
export const updateWithdrawRemark = (data: WithdrawActionForm): AxiosPromise<Record<string, unknown>> =>
  request({ url: '/infra/finance/withdraw/remark', method: 'put', data });

/** 认领锁定/解锁。 */
export const lockWithdraw = (orderId: number, lock: number): AxiosPromise<Record<string, unknown>> =>
  request({ url: `/infra/finance/withdraw/${orderId}/lock/${lock}`, method: 'put' });

/** 查看完整收款账户；服务端使用独立权限并写操作审计。 */
export const revealWithdrawBeneficiary = (orderId: number): AxiosPromise<{
  orderId: number;
  orderNo: string;
  beneficiaryName?: string;
  beneficiary: string;
  beneficiaryMask?: string;
}> => request({ url: `/infra/finance/withdraw-channel/beneficiary/${orderId}`, method: 'get' });
