import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

export interface PaymentProviderVO {
  providerId: number;
  providerCode: string;
  providerName: string;
  adapterCode: string;
  supportDeposit: number;
  supportPayout: number;
  supportReverse: number;
  defaultSignMode: string;
  callbackAckType: string;
  status: number;
  remark?: string;
}

export interface ProviderAccountVO {
  merchantId: number | string;
  merchantCode: string;
  merchantName: string;
  merchantType: number;
  providerId?: number | string;
  providerCode?: string;
  platform?: string;
  currency?: string;
  apiUrl?: string;
  depositApiUrl?: string;
  payoutApiUrl?: string;
  apiKey?: string;
  apiSecret?: string;
  privateKey?: string;
  publicKey?: string;
  encryptedConfig?: string;
  notifyUrl?: string;
  depositNotifyUrl?: string;
  payoutNotifyUrl?: string;
  reverseQueryUrl?: string;
  orderUrl?: string;
  queryUrl?: string;
  callbackIp?: string;
  requestTimeoutMs?: number;
  secretVersion?: number;
  lastTestStatus?: string;
  lastTestMessage?: string;
  lastTestAt?: string;
  feeRate?: number;
  amountMin?: number;
  amountMax?: number;
  dailyLimit?: number;
  priorityNo?: number;
  riskLevel?: number;
  status?: number;
  supportFunc?: string;
  remark?: string;
  secretsVisible?: boolean;
  operatorId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProviderChannelVO {
  providerChannelId: number;
  providerId: number;
  merchantId?: number;
  operation: string;
  providerChannelCode: string;
  providerPayType?: string;
  bankCode?: string;
  currency?: string;
  amountUnit?: string;
  amountScale?: number;
  amountMin?: number;
  amountMax?: number;
  extraSchemaJson?: string;
  enabled: number;
  remark?: string;
}

export interface RouteCandidateVO {
  candidateId: number;
  scene: string;
  businessRefId: number;
  platform: string;
  currency: string;
  providerChannelId: number;
  providerChannelCode?: string;
  providerChannelName?: string;
  providerPayType?: string;
  providerId?: number;
  providerCode?: string;
  providerName?: string;
  merchantId?: number;
  merchantCode?: string;
  merchantName?: string;
  bankCode?: string;
  bankName?: string;
  channelName?: string;
  amountMin?: number;
  amountMax?: number;
  weightBp: number;
  priorityNo: number;
  enabled: number;
  autoDisabledUntil?: string;
  remark?: string;
}

export interface ProviderChannelBindingVO {
  businessRefId: number | string;
  clientCode: string;
  clientName: string;
  methodType: string;
  businessStatus: number;
  providerChannelId?: number | string;
  providerChannelCode: string;
  channelName: string;
  bankCode?: string;
  bankName?: string;
  amountMin: number;
  amountMax: number;
  enabled: number;
}

export interface PayoutBankOptionVO {
  providerId: number;
  providerCode: string;
  providerName: string;
  adapterCode?: string;
  merchantId: number | string;
  merchantCode: string;
  merchantName: string;
  withdrawChannelId?: number;
  providerChannelId?: number;
  providerChannelCode: string;
  providerPayType?: string;
  bankCode: string;
  bankName: string;
  amountUnit?: string;
  amountScale?: number;
  amountMin?: number;
  amountMax?: number;
  enabled?: number;
  configured?: boolean;
  catalogSource?: string;
}

export interface PayoutBankSaveItem {
  withdrawChannelId?: number;
  providerChannelId?: number;
  providerChannelCode: string;
  providerPayType?: string;
  bankCode: string;
  bankName: string;
  amountMin?: number;
  amountMax?: number;
  enabled: number;
}

export interface RouteBusinessOptionVO {
  businessRefId: number;
  routeCode: string;
  routeName: string;
  platform: string;
  currency: string;
  methodType?: string;
  clientCode?: string;
  clientSubCode?: string;
  groupName?: string;
  status?: number;
  frontEnable?: number;
}

export interface IpAllowlistVO {
  allowlistId: number;
  providerId: number;
  merchantId?: number;
  scene: string;
  ipOrCidr: string;
  description?: string;
  enabled: number;
}

export interface PaymentRankingVO {
  providerId: number;
  providerCode: string;
  providerName: string;
  providerStatus: number;
  operation: string;
  settledCount: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  rawSuccessRate: number;
  submissionSuccessRate: number;
  pendingRate: number;
  smoothedSuccessRate: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  latencyScore: number;
  compositeScore: number;
  rankStatus: string;
  rank?: number;
}

export const listPaymentProviders = (): AxiosPromise<PaymentProviderVO[]> =>
  request({ url: '/infra/finance/payment-provider/providers', method: 'get' });

export const changePaymentProviderStatus = (providerId: number, status: number): AxiosPromise<number> =>
  request({
    url: `/infra/finance/payment-provider/providers/${providerId}/status/${status}`,
    method: 'put'
  });

export const listProviderAccounts = (providerId?: number): AxiosPromise<ProviderAccountVO[]> =>
  request({
    url: '/infra/finance/payment-provider/accounts',
    method: 'get',
    params: { providerId, reveal: true }
  });

export const saveProviderAccount = (data: Partial<ProviderAccountVO>): AxiosPromise<number> =>
  request({ url: '/infra/finance/payment-provider/accounts', method: 'post', data });

export const testProviderAccount = (merchantId: number | string): AxiosPromise<Record<string, unknown>> =>
  request({
    url: `/infra/finance/payment-provider/accounts/${merchantId}/test`,
    method: 'post'
  });

export const listProviderChannels = (params?: {
  providerId?: number;
  merchantId?: number;
  operation?: string;
}): AxiosPromise<ProviderChannelVO[]> =>
  request({ url: '/infra/finance/payment-provider/channels', method: 'get', params });

export const listPayoutBankOptions = (params: {
  providerId?: number | string;
  merchantId?: number | string;
  currency?: string;
}): AxiosPromise<PayoutBankOptionVO[]> =>
  request({
    url: '/infra/finance/payment-provider/payout-bank-options',
    method: 'get',
    params
  });

export const savePayoutBanks = (data: {
  merchantId: number | string;
  businessRefId?: number;
  platform?: string;
  currency?: string;
  items: PayoutBankSaveItem[];
}): AxiosPromise<number> =>
  request({
    url: '/infra/finance/payment-provider/payout-banks',
    method: 'post',
    data
  });

export const saveProviderChannel = (data: Partial<ProviderChannelVO>): AxiosPromise<number> =>
  request({ url: '/infra/finance/payment-provider/channels', method: 'post', data });

export const listProviderChannelOptions = (params: {
  providerId?: number | string;
  merchantId?: number | string;
  operation: 'DEPOSIT' | 'PAYOUT';
}): AxiosPromise<ProviderChannelBindingVO[]> =>
  request({ url: '/infra/finance/payment-provider/channel-options', method: 'get', params });

export const saveProviderChannelBindings = (data: {
  merchantId: number | string;
  operation: 'DEPOSIT' | 'PAYOUT';
  items: Partial<ProviderChannelBindingVO>[];
}): AxiosPromise<number> =>
  request({ url: '/infra/finance/payment-provider/channel-bindings', method: 'post', data });

export const changeProviderChannelStatus = (
  providerChannelId: number,
  status: number
): AxiosPromise<number> =>
  request({
    url: `/infra/finance/payment-provider/channels/${providerChannelId}/status/${status}`,
    method: 'put'
  });

export const listRouteOptions = (
  scene: string
): AxiosPromise<RouteBusinessOptionVO[]> =>
  request({
    url: '/infra/finance/payment-provider/route-options',
    method: 'get',
    params: { scene }
  });

export const listRouteCandidates = (params?: {
  scene?: string;
  businessRefId?: number;
}): AxiosPromise<RouteCandidateVO[]> =>
  request({ url: '/infra/finance/payment-provider/route-candidates', method: 'get', params });

export const saveRouteCandidate = (data: Partial<RouteCandidateVO>): AxiosPromise<number> =>
  request({ url: '/infra/finance/payment-provider/route-candidates', method: 'post', data });

export const deleteRouteCandidate = (candidateId: number): AxiosPromise<number> =>
  request({
    url: `/infra/finance/payment-provider/route-candidates/${candidateId}`,
    method: 'delete'
  });

export const listPaymentIpAllowlists = (providerId?: number): AxiosPromise<IpAllowlistVO[]> =>
  request({
    url: '/infra/finance/payment-provider/ip-allowlists',
    method: 'get',
    params: { providerId }
  });

export const savePaymentIpAllowlist = (data: Partial<IpAllowlistVO>): AxiosPromise<number> =>
  request({ url: '/infra/finance/payment-provider/ip-allowlists', method: 'post', data });

export const savePaymentIpAllowlists = (data: Partial<IpAllowlistVO>[]): AxiosPromise<number[]> =>
  request({ url: '/infra/finance/payment-provider/ip-allowlists/batch', method: 'post', data });

export const deletePaymentIpAllowlist = (allowlistId: number): AxiosPromise<number> =>
  request({
    url: `/infra/finance/payment-provider/ip-allowlists/${allowlistId}`,
    method: 'delete'
  });

export const listPaymentRanking = (operation: string, window: string): AxiosPromise<PaymentRankingVO[]> =>
  request({
    url: '/infra/finance/payment-provider/ranking',
    method: 'get',
    params: { operation, window }
  });

export interface WithdrawAuditPolicyVO {
  uid: number;
  auditMode: string;
  firstManualCompletedAt?: string;
  effectiveAt?: string;
  reason?: string;
}

export const getWithdrawAuditPolicy = (uid: number): AxiosPromise<WithdrawAuditPolicyVO> =>
  request({
    url: '/infra/finance/payment-provider/withdraw-policy',
    method: 'get',
    params: { uid }
  });

export const saveWithdrawAuditPolicy = (data: {
  uid: number;
  auditMode: string;
  reason: string;
}): AxiosPromise<WithdrawAuditPolicyVO> =>
  request({
    url: '/infra/finance/payment-provider/withdraw-policy',
    method: 'post',
    data
  });
