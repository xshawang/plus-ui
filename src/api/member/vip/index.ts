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
 * 权限：member:vipreward:list / member:vipreward:edit
 */
export const listVipRewardConfig = (vipLevel?: number): AxiosPromise<VipRewardConfigVO[]> => {
  return request({ url: '/infra/member/vip-reward/config/list', method: 'get', params: { vipLevel } });
};

export const saveVipRewardConfig = (data: VipRewardConfigForm): AxiosPromise<number> => {
  return request({ url: '/infra/member/vip-reward/config', method: 'put', data });
};

/**
 * 矩阵批量维护（图4 列表右上角：应用到所有币种 / 导入修正 / 批量修改）。
 * 权限沿用 member:vipreward:list / member:vipreward:edit。
 */
export const batchVipRewardConfig = (data: VipRewardBatchForm): AxiosPromise<number> => {
  return request({ url: '/infra/member/vip-reward/config/batch', method: 'put', data });
};

export const importVipRewardConfig = (rows: VipRewardImportRow[]): AxiosPromise<number> => {
  return request({ url: '/infra/member/vip-reward/config/import', method: 'post', data: { rows } });
};

export const previewVipRewardCurrency = (): AxiosPromise<Record<string, unknown>> => {
  return request({ url: '/infra/member/vip-reward/config/currency/preview', method: 'get' });
};

export const applyVipRewardCurrency = (sourceCurrency: string): AxiosPromise<Record<string, unknown>> => {
  return request({ url: '/infra/member/vip-reward/config/currency/apply', method: 'post', params: { sourceCurrency } });
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

/** 批量触发待发放记录 */
export const disburseVipRewardRecords = (recordIds: number[]): AxiosPromise<number> => {
  return request({ url: '/infra/member/vip-reward/record/disburse', method: 'post', data: recordIds });
};
