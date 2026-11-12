import request from '@/utils/request';

/**
 * 代理重构 1106 后台接口：代理模式 / 返佣阶梯 / 代理设置 / 代理等级 / 佣金管理 / 变更记录 / 代理报表。
 * 金额字段一律为「分」，页面展示时除以 100；雪花 ID 与单号按字符串透传。
 */
type Params = Record<string, any>;

// ---------- 代理模式 ----------
export const listModes = (params?: Params) => request({ url: '/infra/agent/mode/list', method: 'get', params });
export const getMode = (modeId: string | number) => request({ url: `/infra/agent/mode/detail/${modeId}`, method: 'get' });
export const saveMode = (data: Params) => request({ url: '/infra/agent/mode/save', method: 'post', data });
export const changeModeStatus = (modeId: string | number, status: number) =>
  request({ url: `/infra/agent/mode/status/${modeId}/${status}`, method: 'post' });
export const getModeTiers = (modeId: string | number) => request({ url: `/infra/agent/mode/tiers/${modeId}`, method: 'get' });
export const saveModeTiers = (modeId: string | number, categoryCode: number, data: Params) =>
  request({ url: `/infra/agent/mode/tiers/${modeId}/${categoryCode}`, method: 'post', data });
export const copyModeTiers = (modeId: string | number, data: Params) =>
  request({ url: `/infra/agent/mode/tiers/${modeId}/copy`, method: 'post', data });
export const getFirstDepositTiers = (modeId: string | number) =>
  request({ url: `/infra/agent/mode/first-deposit/${modeId}`, method: 'get' });
export const saveFirstDepositTiers = (modeId: string | number, rows: Params[]) =>
  request({ url: `/infra/agent/mode/first-deposit/${modeId}`, method: 'post', data: { rows } });

// ---------- 代理设置 / 等级 ----------
export const getAgentConfig = (kind: 'public' | 'sub' | 'other') =>
  request({ url: `/infra/agent/setting/config/${kind}`, method: 'get' });
export const saveAgentConfig = (kind: 'public' | 'sub' | 'other', data: Params) =>
  request({ url: `/infra/agent/setting/config/${kind}`, method: 'post', data });
export const listDisplayConfig = () => request({ url: '/infra/agent/setting/display', method: 'get' });
export const saveDisplayConfig = (data: Params) => request({ url: '/infra/agent/setting/display', method: 'post', data });
export const topDisplayConfig = (moduleCode: string) =>
  request({ url: `/infra/agent/setting/display/top/${moduleCode}`, method: 'post' });
export const getCategories = () => request({ url: '/infra/agent/setting/category', method: 'get' });
export const saveCategory = (data: Params) => request({ url: '/infra/agent/setting/category', method: 'post', data });
export const saveCategoryMap = (data: Params) => request({ url: '/infra/agent/setting/category/map', method: 'post', data });
export const listLevels = () => request({ url: '/infra/agent/setting/level', method: 'get' });
export const saveLevel = (data: Params) => request({ url: '/infra/agent/setting/level', method: 'post', data });
export const addLevel = (data: Params) => request({ url: '/infra/agent/setting/level/add', method: 'post', data });
export const deleteLevel = (levelNo: number) => request({ url: `/infra/agent/setting/level/delete/${levelNo}`, method: 'post' });

// ---------- 佣金管理 ----------
export const listCommissions = (params: Params) => request({ url: '/infra/agent/commission/list', method: 'get', params });
export const getCommissionSummary = (params: Params) => request({ url: '/infra/agent/commission/summary', method: 'get', params });
export const getCommissionDetail = (orderNo: string) => request({ url: `/infra/agent/commission/detail/${orderNo}`, method: 'get' });
export const auditCommissions = (orderNos: string[], remark?: string) =>
  request({ url: '/infra/agent/commission/audit', method: 'post', data: { orderNos, remark } });
export const rejectCommissions = (orderNos: string[], remark: string) =>
  request({ url: '/infra/agent/commission/reject', method: 'post', data: { orderNos, remark } });
export const revokeCommissions = (orderNos: string[], remark: string) =>
  request({ url: '/infra/agent/commission/revoke', method: 'post', data: { orderNos, remark } });
export const adjustCommission = (orderNo: string, amount: number, remark: string) =>
  request({ url: '/infra/agent/commission/adjust', method: 'post', data: { orderNo, amount, remark } });

// ---------- 变更记录 ----------
export const listChangeLogs = (params: Params) => request({ url: '/infra/agent/change-log/list', method: 'get', params });
export const retryChangeLogs = (logIds: string[]) => request({ url: '/infra/agent/change-log/retry', method: 'post', data: { logIds } });

// ---------- 代理报表 ----------
export const getReportMeta = () => request({ url: '/infra/agent/report/meta', method: 'get' });
export const listReport = (code: string, params: Params) => request({ url: `/infra/agent/report/${code}`, method: 'get', params });
export const getReportSummary = (code: string, params: Params) =>
  request({ url: `/infra/agent/report/${code}/summary`, method: 'get', params });
export const exportReport = (code: string, params: Params) =>
  request({ url: `/infra/agent/report/${code}/export`, method: 'post', params, responseType: 'blob' });
