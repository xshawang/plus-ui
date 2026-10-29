import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

export type TransactionSourceType =
  | 'ONLINE_DEPOSIT'
  | 'WITHDRAW'
  | 'TRANSFER_DEPOSIT'
  | 'CS_DEPOSIT'
  | 'EXCHANGE_OTC';

export type TransactionDirection = 'IN' | 'OUT';

export interface FinanceTransactionQuery {
  sourceType?: TransactionSourceType | '';
  sourceTypes?: TransactionSourceType[];
  direction?: TransactionDirection | '';
  status?: string;
  /** 多状态查询：提现“待处理”默认包含 AUDITING + PROCESSING。 */
  statuses?: string[];
  sourceStatus?: string;
  uid?: string | number;
  account?: string;
  /** 用户名或昵称模糊查询。 */
  keyword?: string;
  orderNo?: string;
  channel?: string;
  /** 提现大类：BANK/CARD/CRYPTO/P2P/COIN12。 */
  withdrawTabCode?: string;
  methodType?: string;
  merchantId?: number;
  routeId?: number;
  currency?: string;
  notifyStatus?: string;
  pageNum?: number;
  pageSize?: number;
  params?: Record<string, unknown>;
}

export interface FinanceTransactionVO {
  sourceType: TransactionSourceType;
  sourceId: string;
  orderNo: string;
  uid?: string;
  account?: string;
  nickName?: string;
  vipLevel?: number;
  memberLevelName?: string;
  memberTagNames?: string;
  memberTagColor?: string;
  sameIpAccountCount?: number;
  sameDeviceAccountCount?: number;
  direction: TransactionDirection;
  amount?: number;
  vndAmount?: number;
  conversionRate?: number;
  feeAmount?: number;
  bonusAmount?: number;
  arriveAmount?: number;
  currency?: string;
  settlementCurrency?: string;
  channel?: string;
  withdrawTabCode?: string;
  methodType?: string;
  routeId?: number | string;
  merchantId?: number | string;
  merchantName?: string;
  providerCode?: string;
  providerOrderNo?: string;
  status?: string;
  sourceStatus?: string;
  requestId?: string;
  requestAt?: string;
  createdAt?: string;
  finishedAt?: string;
  updatedAt?: string;
  notifyStatus?: string;
  callbackStatus?: string;
  lastNotifyAt?: string;
  retryCount?: number;
  beneficiaryMask?: string;
  beneficiaryName?: string;
  /** 有权限时返回完整收款账号/链上地址。 */
  beneficiaryNo?: string;
  beneficiaryAddress?: string;
  /** 收款侧类型：BANK/CARD/EWALLET/CRYPTO/QUICK_PAY/P2P/GIFT_CARD。 */
  targetType?: string;
  /** 平台银行名或虚拟币/卡平台名。 */
  targetPlatform?: string;
  /** 银行/卡编码，或虚拟币“币种/网络”。 */
  targetCode?: string;
  /** 平台收款账号或会员提现账号。 */
  targetAccountNo?: string;
  /** 平台收款户名或会员提现户名。 */
  targetAccountName?: string;
  /** 虚拟币收款地址。 */
  targetAddress?: string;
  cumulativeWithdrawAmount?: number;
  cumulativeWithdrawCount?: number;
  lastWithdrawAt?: string;
  payerMask?: string;
  clientIp?: string;
  clientOs?: string;
  clientOsVersion?: string;
  clientBrowser?: string;
  clientBrowserVersion?: string;
  appVersion?: string;
  deviceFingerprint?: string;
  voucherUrl?: string;
  remark?: string;
  failCode?: string;
  failMsg?: string;
  invoiceNo?: string;
  externalOrderNo?: string;
  counterpartyName?: string;
  transactionType?: string;
  assetAmount?: number;
  fiatAmount?: number;
  availableActions?: string[];
}

export interface FinanceOrderRequestSnapshot {
  requestId?: string;
  sourceType?: string;
  orderNo?: string;
  uid?: number | string;
  platform?: string;
  channel?: string;
  methodType?: string;
  routeId?: number | string;
  merchantId?: number | string;
  amount?: number;
  currency?: string;
  payloadJson?: string;
  clientIp?: string;
  deviceFingerprint?: string;
  requestStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceOrderEvent {
  eventId: number;
  sourceType?: string;
  orderNo?: string;
  eventType?: string;
  fromStatus?: string;
  toStatus?: string;
  operatorId?: string;
  remark?: string;
  payloadJson?: string;
  createdAt?: string;
}

export interface FinanceTransactionNotification {
  notificationId: number;
  sourceType?: string;
  orderNo?: string;
  uid?: number | string;
  providerCode?: string;
  routeId?: number | string;
  merchantId?: number | string;
  direction?: string;
  eventType?: string;
  idempotencyKey?: string;
  signOk?: number;
  httpStatus?: number;
  resultCode?: string;
  resultMsg?: string;
  payloadJson?: string;
  responseJson?: string;
  retryCount?: number;
  nextRetryAt?: string;
  handleStatus?: string;
  handleRemark?: string;
  handledBy?: string;
  handledAt?: string;
  receivedAt?: string;
  processedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceTransactionDetail {
  transaction: FinanceTransactionVO;
  request?: FinanceOrderRequestSnapshot;
  events?: FinanceOrderEvent[];
  notifications?: FinanceTransactionNotification[];
}

export interface FinanceNotificationVO {
  notificationId: number;
  sourceType: string;
  orderNo: string;
  uid?: string;
  providerCode?: string;
  routeId?: number;
  merchantId?: number;
  direction: string;
  eventType?: string;
  idempotencyKey?: string;
  signOk?: number;
  httpStatus?: number;
  resultCode?: string;
  resultMsg?: string;
  payloadPreview?: string;
  responsePreview?: string;
  retryCount?: number;
  nextRetryAt?: string;
  handleStatus?: string;
  handleRemark?: string;
  handledBy?: string;
  handledAt?: string;
  receivedAt?: string;
  processedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceNotificationQuery {
  sourceType?: string;
  orderNo?: string;
  uid?: string | number;
  providerCode?: string;
  direction?: string;
  handleStatus?: string;
  signOk?: number;
  merchantId?: number;
  routeId?: number;
  pageNum?: number;
  pageSize?: number;
  params?: Record<string, unknown>;
}

export interface FinanceTransactionOptions {
  sourceTypes: string[];
  channels: string[];
  methodTypes: string[];
  currencies: string[];
  withdrawTabs: Array<{ value: string; label: string }>;
  withdrawMethodsByTab: Record<string, Array<{ value: string; label: string }>>;
  merchants: Array<{ merchantId: number; merchantName: string }>;
  statuses: string[];
}

export const listFinanceTransactions = (query?: FinanceTransactionQuery): AxiosPromise<PageResult<FinanceTransactionVO>> =>
  request({ url: '/infra/finance/transaction/list', method: 'get', params: query });

export const getFinanceTransactionDetail = (sourceType: string, orderNo: string): AxiosPromise<FinanceTransactionDetail> =>
  request({ url: '/infra/finance/transaction/detail', method: 'get', params: { sourceType, orderNo } });

export const getFinanceTransactionOptions = (): AxiosPromise<FinanceTransactionOptions> =>
  request({ url: '/infra/finance/transaction/options', method: 'get' });

export const getFinanceTransactionMetrics = (
  query?: FinanceTransactionQuery
): AxiosPromise<Array<Record<string, unknown>>> =>
  request({ url: '/infra/finance/transaction/metrics', method: 'get', params: query });

export const financeTransactionAction = (data: {
  sourceType: string;
  orderNo: string;
  action: string;
  remark?: string;
  params?: Record<string, unknown>;
}): AxiosPromise<Record<string, unknown>> =>
  request({ url: '/infra/finance/transaction/action', method: 'post', data });

export const listFinanceNotifications = (query?: FinanceNotificationQuery): AxiosPromise<PageResult<FinanceNotificationVO>> =>
  request({ url: '/infra/finance/notification/list', method: 'get', params: query });

export const retryFinanceNotification = (id: number, remark?: string): AxiosPromise<void> =>
  request({ url: `/infra/finance/notification/${id}/retry`, method: 'post', params: { remark } });

export const ignoreFinanceNotification = (id: number, remark?: string): AxiosPromise<void> =>
  request({ url: `/infra/finance/notification/${id}/ignore`, method: 'post', params: { remark } });

export const replayFinanceNotification = (id: number, remark?: string): AxiosPromise<void> =>
  request({ url: `/infra/finance/notification/${id}/replay`, method: 'post', params: { remark } });
