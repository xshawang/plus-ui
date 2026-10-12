import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import { blobValidate } from '@/utils/ruoyi';
import { saveBlob } from '@/utils/save';
import modal from '@/plugins/modal';
import type {
  RiskBlacklistAddForm,
  RiskBlacklistOptions,
  RiskBlacklistRemoveForm,
  RiskBlacklistTab,
  RiskBlacklistTabQuery,
  RiskImportResultVO,
  RiskMemberBlacklistVO,
  RiskTargetBlacklistVO,
  RiskWithdrawBlacklistVO
} from './types';

/**
 * 风控黑名单接口（菜单 995001）。
 *
 * 后端实现在 go88-service-infra：`org.dromara.go88.risk.controller.RiskBlacklistController`。
 * 权限标识：risk:blacklist:list / add / remove / import / export。
 */

/** 页面三类下拉（限制类型 / 提现大类 / 提现类型名称），取自 sys_dict_data */
export const getRiskBlacklistOptions = (): AxiosPromise<RiskBlacklistOptions> => {
  return request({ url: '/infra/risk/blacklist/options', method: 'get' });
};

/** 会员黑名单（封号 + 禁止提现） */
export const listMemberBlacklist = (query?: RiskBlacklistTabQuery): AxiosPromise<PageResult<RiskMemberBlacklistVO>> => {
  return request({ url: '/infra/risk/blacklist/member/list', method: 'get', params: query });
};

/** 充值黑名单（禁止充值） */
export const listRechargeBlacklist = (
  query?: RiskBlacklistTabQuery
): AxiosPromise<PageResult<RiskMemberBlacklistVO>> => {
  return request({ url: '/infra/risk/blacklist/recharge/list', method: 'get', params: query });
};

/**
 * IP / 手机 / 设备黑名单。
 *
 * 注意：tab 只允许 ip / phone / device（提现账号页签是 /withdraw/list，行结构不同）；
 * 类型上收窄是为了避免调用方把 withdraw-account 传进来拼出 404 路径。
 */
export const listTargetBlacklist = (
  tab: 'ip' | 'phone' | 'device',
  query?: RiskBlacklistTabQuery
): AxiosPromise<PageResult<RiskTargetBlacklistVO>> => {
  return request({ url: `/infra/risk/blacklist/${tab}/list`, method: 'get', params: query });
};

/** 提现账号黑名单 */
export const listWithdrawBlacklist = (
  query?: RiskBlacklistTabQuery
): AxiosPromise<PageResult<RiskWithdrawBlacklistVO>> => {
  return request({ url: '/infra/risk/blacklist/withdraw/list', method: 'get', params: query });
};

/** 新增 / 批量新增（一个入口，tab 决定落哪张表）；返回本次受理条数 */
export const addRiskBlacklist = (data: RiskBlacklistAddForm): AxiosPromise<number> => {
  return request({ url: '/infra/risk/blacklist/add', method: 'post', data });
};

/** 移出名单（行内单条与底部批量共用）；返回实际移出条数 */
export const removeRiskBlacklist = (data: RiskBlacklistRemoveForm): AxiosPromise<number> => {
  return request({ url: '/infra/risk/blacklist/remove', method: 'post', data });
};

/** 批量导入（CSV，同文件 MD5 判重）；只支持 ip / phone / device / withdraw-account */
export const importRiskBlacklist = (tab: RiskBlacklistTab, file: File): AxiosPromise<RiskImportResultVO> => {
  const formData = new FormData();
  formData.append('tab', tab);
  formData.append('file', file);
  return request({
    url: '/infra/risk/blacklist/import',
    method: 'post',
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false },
    data: formData
  });
};

/** 导入台账回执（含失败条数与失败明细文本） */
export const getRiskImportLog = (logId: string | number): AxiosPromise<RiskImportResultVO> => {
  return request({ url: `/infra/risk/blacklist/import/${logId}`, method: 'get' });
};

/**
 * 下载导入失败明细（CSV：行号 + 原因）。
 *
 * 为什么不用 <a href>：该接口需要 Authorization 头，普通链接带不上，
 * 所以走 axios 取 blob 再本地触发下载。
 */
export const downloadRiskImportFailDetail = async (logId: string | number): Promise<void> => {
  const res: any = await request({
    url: `/infra/risk/blacklist/import/${logId}/fail-detail`,
    method: 'get',
    responseType: 'blob'
  });
  if (!blobValidate(res)) {
    const text = await res.text();
    throw new Error(JSON.parse(text)?.msg || '下载失败');
  }
  await saveBlob(new Blob([res]), `黑名单导入失败明细_${logId}.csv`);
};

/**
 * 导出当前页签报表（CSV）。
 *
 * 为什么不复用 utils/request 的 download()：那个方法是 POST + form 表单编码，
 * 而风控导出接口是 GET（@GetMapping）。这里用 GET + responseType=blob 直接取流，
 * 并用 blobValidate 判断返回的是文件还是「未登录/无权限」的 JSON 错误体。
 */
export const exportRiskBlacklist = async (
  tab: RiskBlacklistTab,
  query: Partial<RiskBlacklistTabQuery>,
  tabLabel: string
): Promise<void> => {
  const res: any = await request({
    url: '/infra/risk/blacklist/export',
    method: 'get',
    params: { ...query, tab },
    responseType: 'blob'
  });
  if (!blobValidate(res)) {
    const text = await res.text();
    throw new Error(JSON.parse(text)?.msg || '导出失败');
  }
  const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
  await saveBlob(new Blob([res]), `黑名单_${tabLabel}_${stamp}.csv`);
  modal.msgSuccess('导出成功');
};
