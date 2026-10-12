import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type {
  AgentAccountQuery,
  AgentAccountVO,
  AgentAddForm,
  AgentBatchForm,
  AgentChangeForm,
  AgentDetailVO,
  AgentImportResultVO,
  AgentModeFormVO,
  AgentOption,
  AgentOptionsVO,
  AgentSummaryVO
} from './types';

/**
 * 代理账号接口（代理 → 代理中心 → 所有代理 / 顶层代理）。
 * 权限：agent:center:list / agent:account:add / edit / batch / import / export
 */

/** 页面下拉与配置（币种/提现方式/代理方式/注册来源/模式/层级/标签/品牌） */
export const getAgentOptions = (): AxiosPromise<AgentOptionsVO> => {
  return request({ url: '/infra/agent/account/options', method: 'get' });
};

/** 所有代理分页 */
export const listAgentAccounts = (query?: AgentAccountQuery): AxiosPromise<PageResult<AgentAccountVO>> => {
  return request({ url: '/infra/agent/account/list', method: 'get', params: { ...query, tab: 'all' } });
};

/** 顶层代理分页 */
export const listTopAgentAccounts = (query?: AgentAccountQuery): AxiosPromise<PageResult<AgentAccountVO>> => {
  return request({ url: '/infra/agent/account/top-list', method: 'get', params: { ...query, tab: 'top' } });
};

/** 总计行（截图底部「点击以计算总数」） */
export const getAgentSummary = (tab: string, currency?: string): AxiosPromise<AgentSummaryVO[]> => {
  return request({ url: '/infra/agent/account/summary', method: 'get', params: { tab, currency } });
};

/** 代理详情（含变更轨迹） */
export const getAgentDetail = (agentId: number | string): AxiosPromise<AgentDetailVO> => {
  return request({ url: `/infra/agent/account/detail/${agentId}`, method: 'get' });
};

/** 修改代理模式弹窗回显 */
export const getAgentModeForm = (agentId: number | string): AxiosPromise<AgentModeFormVO> => {
  return request({ url: `/infra/agent/account/mode/form/${agentId}`, method: 'get' });
};

/** 上级代理下拉 */
export const listParentOptions = (currency?: string, keyword?: string): AxiosPromise<AgentOption[]> => {
  return request({ url: '/infra/agent/account/parent-options', method: 'get', params: { currency, keyword } });
};

/** 品牌下拉（按币种联动） */
export const listBrandOptions = (currency?: string): AxiosPromise<AgentOption[]> => {
  return request({ url: '/infra/agent/account/brand-options', method: 'get', params: { currency } });
};

/** 新增代理 */
export const addAgentAccount = (data: AgentAddForm): AxiosPromise<string> => {
  return request({ url: '/infra/agent/account/add', method: 'post', data });
};

/** 更多操作：修改上级 */
export const changeAgentParent = (data: AgentChangeForm): AxiosPromise<number> => {
  return request({ url: '/infra/agent/account/parent', method: 'post', data });
};

/** 更多操作：修改提现方式 */
export const changeAgentWithdrawMethod = (data: AgentChangeForm): AxiosPromise<number> => {
  return request({ url: '/infra/agent/account/withdraw-method', method: 'post', data });
};

/** 更多操作：修改直属层级 */
export const changeAgentLayer = (data: AgentChangeForm): AxiosPromise<number> => {
  return request({ url: '/infra/agent/account/layer', method: 'post', data });
};

/** 更多操作：修改直属标签 */
export const changeAgentLabel = (data: AgentChangeForm): AxiosPromise<number> => {
  return request({ url: '/infra/agent/account/label', method: 'post', data });
};

/** 修改代理模式 */
export const changeAgentMode = (data: AgentChangeForm): AxiosPromise<number> => {
  return request({ url: '/infra/agent/account/mode', method: 'post', data });
};

/** 新下级绑定开关 */
export const switchAgentBind = (data: AgentChangeForm): AxiosPromise<number> => {
  return request({ url: '/infra/agent/account/bind-switch', method: 'post', data });
};

/** 批量操作（withdrawMethod/layer/label/status/remove） */
export const batchAgentAccount = (data: AgentBatchForm): AxiosPromise<number> => {
  return request({ url: '/infra/agent/account/batch', method: 'post', data });
};

/** 导入代理（CSV） */
export const importAgentAccounts = (file: File): AxiosPromise<AgentImportResultVO> => {
  const form = new FormData();
  form.append('file', file);
  return request({
    url: '/infra/agent/account/import',
    method: 'post',
    data: form,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

/** 导出代理列表（走浏览器下载） */
export const exportAgentAccounts = (tab: string, query?: AgentAccountQuery) => {
  return request({
    url: '/infra/agent/account/export',
    method: 'get',
    params: { ...query, tab },
    responseType: 'blob'
  });
};
