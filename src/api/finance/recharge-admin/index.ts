import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

/**
 * 财务侧充值订单与回调异常接口（需求文档 2_财务/04、05）。
 *
 * 后端：go88-service-infra /infra/finance/recharge/**；权限：
 * finance:recharge-all:list|edit（充值订单）、finance:callback-error:list|edit（回调异常）。
 */
export interface RechargeAdminQuery {
  uid?: number;
  account?: string;
  orderNo?: string;
  /** 0待支付 1处理中 2成功 3失败 4已取消；不传=全部状态 */
  status?: number;
  channel?: string;
  bankCode?: string;
  thirdPartyOrderNo?: string;
  handleStatus?: number;
  signOk?: number;
  pageNum?: number;
  pageSize?: number;
  params?: Record<string, unknown>;
}

export interface RechargeOrderVO {
  id: number;
  orderNo: string;
  uid: number;
  account?: string;
  nickName?: string;
  vipLevel?: number;
  amount: number;
  status: number;
  channel?: string;
  bankCode?: string;
  thirdPartyOrderNo?: string;
  cardProvider?: string;
  callbackAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CallbackErrorVO {
  id: number;
  orderNo?: string;
  uid?: number;
  account?: string;
  providerCode?: string;
  requestId?: string;
  signOk?: number;
  callbackStatus?: number;
  retryCount?: number;
  handleStatus?: number;
  handleRemark?: string;
  handleOperatorId?: string;
  handledAt?: string;
  receivedAt?: string;
  processedAt?: string;
  payloadPreview?: string;
}

export interface RechargeOrderForm {
  uid?: number;
  account?: string;
  amount?: number;
  channel?: string;
  bankCode?: string;
  thirdPartyOrderNo?: string;
  turnoverMultiple?: number;
  creditNow?: boolean;
  remark?: string;
  requestId?: string;
}

/** 全渠道全状态充值订单分页。 */
export const listRechargeOrders = (query?: RechargeAdminQuery): AxiosPromise<PageResult<RechargeOrderVO>> =>
  request({ url: '/infra/finance/recharge/orders', method: 'get', params: query });

/** 创建在线充值订单 / 创建补单（creditNow=true 直接入账）。 */
export const createRechargeOrder = (data: RechargeOrderForm): AxiosPromise<Record<string, unknown>> =>
  request({ url: '/infra/finance/recharge/order', method: 'post', data });

/** 回调异常订单分页。 */
export const listCallbackErrors = (query?: RechargeAdminQuery): AxiosPromise<PageResult<CallbackErrorVO>> =>
  request({ url: '/infra/finance/recharge/callbacks', method: 'get', params: query });

/** 回调异常处理：1=强制补单（真实入账） 2=忽略。 */
export const handleCallbackError = (id: number, handleStatus: number, remark?: string): AxiosPromise<Record<string, unknown>> =>
  request({
    url: `/infra/finance/recharge/callback/${id}/handle`,
    method: 'post',
    params: { handleStatus, remark }
  });
