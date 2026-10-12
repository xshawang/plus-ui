import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type { RiskDictOption } from '@/api/risk/blacklist/types';
import type {
  RiskAlertConfigVO,
  RiskCurrencyOption,
  RiskRewardConfigVO,
  RiskRewardHandleForm,
  RiskRewardMonitorVO,
  RiskRewardQuery
} from './types';

/**
 * 派奖监控接口（风控 → 派奖监控）。
 * 权限：risk:reward:list / handle / config / export
 */

/** 台账分页 */
export const listRewardMonitor = (query?: RiskRewardQuery): AxiosPromise<PageResult<RiskRewardMonitorVO>> => {
  return request({ url: '/infra/risk/reward/list', method: 'get', params: query });
};

/**
 * 页签计数（待处理红点 / 已处理 / 已忽略 / 全部）。
 *
 * 必须带上与列表同一套筛选参数（日/月时间区间、会员账号、监测类型、币种），否则红点恒为全表数，
 * 运营切到"今天"看到的却是历史累计待办量。status 由调用方剔除（四个页签要同时算）。
 */
export const getRewardTabCounts = (query?: RiskRewardQuery): AxiosPromise<Record<string, number>> => {
  return request({ url: '/infra/risk/reward/tab-counts', method: 'get', params: query });
};

/** 页面下拉字典 */
export const getRewardOptions = (): AxiosPromise<{ monitorTypes: RiskDictOption[]; statuses: RiskDictOption[] }> => {
  return request({ url: '/infra/risk/reward/options', method: 'get' });
};

/** 处理 / 忽略（支持批量） */
export const handleRewardMonitor = (data: RiskRewardHandleForm): AxiosPromise<number> => {
  return request({ url: '/infra/risk/reward/handle', method: 'post', data });
};

/** 监测参数读取（按币种） */
export const getRewardConfig = (currency?: string): AxiosPromise<RiskRewardConfigVO> => {
  return request({ url: '/infra/risk/reward/config', method: 'get', params: { currency } });
};

/** 监测参数保存 */
export const saveRewardConfig = (data: RiskRewardConfigVO): AxiosPromise<RiskRewardConfigVO> => {
  return request({ url: '/infra/risk/reward/config', method: 'put', data });
};

/** 币种下拉 */
export const listRewardCurrencies = (): AxiosPromise<RiskCurrencyOption[]> => {
  return request({ url: '/infra/risk/reward/config/currencies', method: 'get' });
};

/** 风控提醒设置读取 */
export const getAlertConfig = (): AxiosPromise<RiskAlertConfigVO> => {
  return request({ url: '/infra/risk/reward/alert-config', method: 'get' });
};

/** 风控提醒设置保存 */
export const saveAlertConfig = (data: RiskAlertConfigVO): AxiosPromise<RiskAlertConfigVO> => {
  return request({ url: '/infra/risk/reward/alert-config', method: 'put', data });
};

/** 导出报表（走浏览器下载） */
export const exportRewardMonitor = (query?: RiskRewardQuery) => {
  return request({ url: '/infra/risk/reward/export', method: 'get', params: query, responseType: 'blob' });
};
