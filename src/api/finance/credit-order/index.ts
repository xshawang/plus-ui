import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

/**
 * 转账充值单 / 客服代充单接口（需求文档 2_财务/06、07）。
 *
 * 两类单据共用同一套状态机与后端服务（orderType=TRANSFER/CS），仅路径与权限点不同：
 * finance:transfer-order:*、finance:cs-recharge:*
 */
export interface CreditOrderQuery {
  uid?: number;
  account?: string;
  orderNo?: string;
  /** 0待审核 1已入账 2已驳回 3已锁定 4失败 */
  status?: number;
  channelCode?: string;
  payerName?: string;
  unlockedOnly?: number;
  pageNum?: number;
  pageSize?: number;
  params?: Record<string, unknown>;
}

export interface CreditOrderForm {
  uid?: number;
  account?: string;
  amount?: number;
  bonusAmount?: number;
  turnoverMultiple?: number;
  channelCode?: string;
  payerName?: string;
  payerAccount?: string;
  payerBank?: string;
  transferNo?: string;
  transferTime?: string;
  voucherUrl?: string;
  transferRemark?: string;
  proofRemark?: string;
  sourceType?: number;
  creditNow?: boolean;
  frontRemark?: string;
  backRemark?: string;
  requestId?: string;
}

export interface CreditOrderVO {
  orderId: number;
  orderNo: string;
  orderType: string;
  uid: number;
  account?: string;
  nickName?: string;
  vipLevel?: number;
  amount: number;
  bonusAmount?: number;
  turnoverMultiple?: number;
  channelCode?: string;
  payerName?: string;
  payerAccount?: string;
  payerBank?: string;
  transferNo?: string;
  transferTime?: string;
  voucherUrl?: string;
  transferRemark?: string;
  proofRemark?: string;
  status: number;
  sourceType?: number;
  lockOperatorId?: string;
  auditOperatorId?: string;
  auditedAt?: string;
  frontRemark?: string;
  backRemark?: string;
  failReason?: string;
  operatorId?: string;
  createdAt?: string;
}

const listOf = (path: string, query?: CreditOrderQuery): AxiosPromise<PageResult<CreditOrderVO>> =>
  request({ url: `/infra/finance/${path}/list`, method: 'get', params: query });

const createOf = (path: string, data: CreditOrderForm): AxiosPromise<Record<string, unknown>> =>
  request({ url: `/infra/finance/${path}`, method: 'post', data });

const auditOf = (path: string, orderId: number, approve: boolean, remark?: string): AxiosPromise<Record<string, unknown>> =>
  request({ url: `/infra/finance/${path}/${orderId}/audit`, method: 'post', params: { approve, remark } });

const lockOf = (path: string, orderId: number, lock: number): AxiosPromise<Record<string, unknown>> =>
  request({ url: `/infra/finance/${path}/${orderId}/lock/${lock}`, method: 'put' });

const remarkOf = (path: string, orderId: number, frontRemark?: string, backRemark?: string): AxiosPromise<Record<string, unknown>> =>
  request({ url: `/infra/finance/${path}/${orderId}/remark`, method: 'put', params: { frontRemark, backRemark } });

/** 转账充值单（06） */
export const listTransferOrders = (query?: CreditOrderQuery) => listOf('transfer-order', query);
export const createTransferOrder = (data: CreditOrderForm) => createOf('transfer-order', data);
export const auditTransferOrder = (orderId: number, approve: boolean, remark?: string) =>
  auditOf('transfer-order', orderId, approve, remark);
export const lockTransferOrder = (orderId: number, lock: number) => lockOf('transfer-order', orderId, lock);
export const remarkTransferOrder = (orderId: number, frontRemark?: string, backRemark?: string) =>
  remarkOf('transfer-order', orderId, frontRemark, backRemark);

/** 客服代充单（07） */
export const listCsOrders = (query?: CreditOrderQuery) => listOf('cs-recharge', query);
export const createCsOrder = (data: CreditOrderForm) => createOf('cs-recharge', data);
export const auditCsOrder = (orderId: number, approve: boolean, remark?: string) =>
  auditOf('cs-recharge', orderId, approve, remark);
export const lockCsOrder = (orderId: number, lock: number) => lockOf('cs-recharge', orderId, lock);
export const remarkCsOrder = (orderId: number, frontRemark?: string, backRemark?: string) =>
  remarkOf('cs-recharge', orderId, frontRemark, backRemark);
