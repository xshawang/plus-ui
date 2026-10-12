import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  ConfigItemVO,
  VipDisburseForm,
  VipLevelConfigVO,
  VipRewardConfigForm,
  VipRewardConfigVO,
  VipRewardRecordQuery,
  VipRewardRecordVO
} from './types';

/**
 * VIP 等级接口（06 文档）。权限：member:vip:list / member:vip:edit
 */
export const listVipLevel = (): AxiosPromise<VipLevelConfigVO[]> => {
  return request({ url: '/infra/member/vip-level/list', method: 'get' });
};

export const saveVipLevel = (data: VipLevelConfigVO) => {
  return request({ url: '/infra/member/vip-level', method: 'post', data });
};

/**
 * VIP 奖励接口（06 文档，真实资金发放）。
 * 权限：member:vip-reward:list / member:vip-reward:edit
 */
export const listVipRewardConfig = (vipLevel?: number): AxiosPromise<VipRewardConfigVO[]> => {
  return request({ url: '/infra/member/vip-reward/config/list', method: 'get', params: { vipLevel } });
};

export const saveVipRewardConfig = (data: VipRewardConfigForm): AxiosPromise<number> => {
  return request({ url: '/infra/member/vip-reward/config', method: 'put', data });
};

export const listVipRewardSetting = (): AxiosPromise<ConfigItemVO[]> => {
  return request({ url: '/infra/member/vip-reward/setting/list', method: 'get' });
};

export const saveVipRewardSetting = (items: Array<{ configKey: string; configValue: string }>): AxiosPromise<number> => {
  return request({ url: '/infra/member/vip-reward/setting', method: 'put', data: { items } });
};

/** 触发发放（幂等：同周期同奖励不会重复发放） */
export const disburseVipReward = (data: VipDisburseForm): AxiosPromise<Record<string, number | string>> => {
  return request({ url: '/infra/member/vip-reward/disburse', method: 'post', data });
};

export const listVipRewardRecord = (query?: VipRewardRecordQuery): AxiosPromise<VipRewardRecordVO[]> => {
  return request({ url: '/infra/member/vip-reward/record/list', method: 'get', params: query });
};

export const retryVipRewardRecord = (recordId: number): AxiosPromise<number> => {
  return request({ url: `/infra/member/vip-reward/record/${recordId}/retry`, method: 'put' });
};
