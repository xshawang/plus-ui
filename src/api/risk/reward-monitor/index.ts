import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import { blobValidate } from '@/utils/ruoyi';
import { saveBlob } from '@/utils/save';
import modal from '@/plugins/modal';
import type {
  RiskAlertConfigForm,
  RiskCurrencyOption,
  RiskRewardConfigForm,
  RiskRewardConfigVO,
  RiskRewardHandleForm,
  RiskRewardMonitorQuery,
  RiskRewardMonitorVO,
  RiskRewardOptions,
  RiskRewardTabCounts
} from './types';

/**
 * 派奖监控接口（菜单 995002）。
 *
 * 后端实现在 go88-service-infra：`org.dromara.go88.risk.controller.RiskRewardMonitorController`。
 * 权限标识：risk:reward:list / handle / config / export。
 * 注意：台账只读，`/ingest` 是给上游写入监控事件用的，运营页面不调用它。
 */

/** 台账分页（status 为空 = 全部） */
export const listRewardMonitor = (query?: RiskRewardMonitorQuery): AxiosPromise<PageResult<RiskRewardMonitorVO>> => {
  return request({ url: '/infra/risk/reward/list', method: 'get', params: query });
};

/** 页签计数（待处理红点） */
export const getRewardTabCounts = (): AxiosPromise<RiskRewardTabCounts> => {
  return request({ url: '/infra/risk/reward/tab-counts', method: 'get' });
};

/** 页面下拉（监测类型 / 处理状态） */
export const getRewardMonitorOptions = (): AxiosPromise<RiskRewardOptions> => {
  return request({ url: '/infra/risk/reward/options', method: 'get' });
};

/** 处理 / 忽略（支持批量），返回受影响条数 */
export const handleRewardMonitor = (data: RiskRewardHandleForm): AxiosPromise<number> => {
  return request({ url: '/infra/risk/reward/handle', method: 'post', data });
};

/** 监测参数读取（按币种，currency 为空时后端取默认币种） */
export const getRewardConfig = (currency?: string): AxiosPromise<RiskRewardConfigVO> => {
  return request({ url: '/infra/risk/reward/config', method: 'get', params: { currency } });
};

/** 监测参数保存（直接对后续事件生效，读侧不缓存） */
export const saveRewardConfig = (data: RiskRewardConfigForm): AxiosPromise<RiskRewardConfigVO> => {
  return request({ url: '/infra/risk/reward/config', method: 'put', data });
};

/** 币种下拉（监测参数弹窗右上角选择器） */
export const listRewardCurrencies = (): AxiosPromise<RiskCurrencyOption[]> => {
  return request({ url: '/infra/risk/reward/config/currencies', method: 'get' });
};

/** 风控提醒设置读取 */
export const getRewardAlertConfig = (): AxiosPromise<RiskAlertConfigForm> => {
  return request({ url: '/infra/risk/reward/alert-config', method: 'get' });
};

/** 风控提醒设置保存 */
export const saveRewardAlertConfig = (data: RiskAlertConfigForm): AxiosPromise<RiskAlertConfigForm> => {
  return request({ url: '/infra/risk/reward/alert-config', method: 'put', data });
};

/**
 * 导出台账（CSV）。
 *
 * 与黑名单导出同理：后端是 @GetMapping，而 utils/request 的 download() 走 POST 表单，
 * 因此这里用 GET + responseType=blob，并用 blobValidate 区分「文件」与「错误 JSON」。
 */
export const exportRewardMonitor = async (query: RiskRewardMonitorQuery, statusLabel: string): Promise<void> => {
  const res: any = await request({
    url: '/infra/risk/reward/export',
    method: 'get',
    params: query,
    responseType: 'blob'
  });
  if (!blobValidate(res)) {
    const text = await res.text();
    throw new Error(JSON.parse(text)?.msg || '导出失败');
  }
  const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
  await saveBlob(new Blob([res]), `派奖监控_${statusLabel}_${stamp}.csv`);
  modal.msgSuccess('导出成功');
};
