import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

/**
 * VIP 领取限制 + 保级考核接口（06 文档 §3/§4，批次 7，路径复用 vip-reward 权限点）。
 */
export interface VipRewardLimitVO {
  limitId?: number;
  rewardType: number;
  rewardTypeLabel?: string;
  allowTerminals?: string;
  deviceLimit?: number;
  fingerprintLimit?: number;
  forbidLevels?: string;
  auditScopeMode?: number;
  auditGameScope?: string;
  ruleDesc?: string;
  operatorId?: string;
  updatedAt?: string;
}

export interface VipKeepLevelResult {
  enabled?: boolean;
  checked?: number;
  downgraded?: number;
  items?: { uid: number; beforeLevel: number; afterLevel: number; periodDeposit: number; periodBet: number; reason: string }[];
  message?: string;
  periodStart?: string;
  periodEnd?: string;
}

export const listVipRewardLimit = (): AxiosPromise<VipRewardLimitVO[]> => {
  return request({ url: '/infra/member/vip-reward/limit/list', method: 'get' });
};

export const saveVipRewardLimit = (data: VipRewardLimitVO): AxiosPromise<number> => {
  return request({ url: '/infra/member/vip-reward/limit/save', method: 'post', data });
};

/** 领取前校验（后台补发前自检） */
export const checkVipRewardLimit = (params: {
  uid: number | string;
  rewardType: number;
  terminal?: string;
  deviceNo?: string;
  fingerprint?: string;
}): AxiosPromise<Record<string, unknown>> => {
  return request({ url: '/infra/member/vip-reward/limit/check', method: 'post', params });
};

export const previewKeepLevel = (): AxiosPromise<VipKeepLevelResult> => {
  return request({ url: '/infra/member/vip-reward/keep-level/preview', method: 'get' });
};

export const runKeepLevel = (): AxiosPromise<VipKeepLevelResult> => {
  return request({ url: '/infra/member/vip-reward/keep-level/run', method: 'post' });
};
