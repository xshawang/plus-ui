import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type {
  RiskDictOption,
  RiskBlacklistAddForm,
  RiskBlacklistQuery,
  RiskBlacklistRemoveForm,
  RiskBlacklistTab,
  RiskImportResultVO,
  RiskMemberBlacklistVO,
  RiskTargetBlacklistVO,
  RiskWithdrawBlacklistVO
} from './types';
import type { RiskCurrencyOption } from '@/api/risk/reward/types';

/** 页面下拉字典（限制类型 / 提现大类 / 提现类型名称，来自后端 sys_dict_data） */
export const getBlacklistOptions = (): AxiosPromise<{
  limitScenes: RiskDictOption[];
  withdrawCategories: RiskDictOption[];
  withdrawTypes: RiskDictOption[];
}> => {
  return request({ url: '/infra/risk/blacklist/options', method: 'get' });
};

/**
 * 风控黑名单接口（风控 → 黑名单）。
 * 权限：risk:blacklist:list / add / remove / import / export
 */

/** 会员黑名单（封号 + 禁止提现） */
export const listMemberBlacklist = (query?: RiskBlacklistQuery): AxiosPromise<PageResult<RiskMemberBlacklistVO>> => {
  return request({ url: '/infra/risk/blacklist/member/list', method: 'get', params: query });
};

/** 充值黑名单（禁止充值） */
export const listRechargeBlacklist = (query?: RiskBlacklistQuery): AxiosPromise<PageResult<RiskMemberBlacklistVO>> => {
  return request({ url: '/infra/risk/blacklist/recharge/list', method: 'get', params: query });
};

/** IP 黑名单 */
export const listIpBlacklist = (query?: RiskBlacklistQuery): AxiosPromise<PageResult<RiskTargetBlacklistVO>> => {
  return request({ url: '/infra/risk/blacklist/ip/list', method: 'get', params: query });
};

/** 手机黑名单 */
export const listPhoneBlacklist = (query?: RiskBlacklistQuery): AxiosPromise<PageResult<RiskTargetBlacklistVO>> => {
  return request({ url: '/infra/risk/blacklist/phone/list', method: 'get', params: query });
};

/** 设备黑名单 */
export const listDeviceBlacklist = (query?: RiskBlacklistQuery): AxiosPromise<PageResult<RiskTargetBlacklistVO>> => {
  return request({ url: '/infra/risk/blacklist/device/list', method: 'get', params: query });
};

/** 提现账号黑名单 */
export const listWithdrawBlacklist = (query?: RiskBlacklistQuery): AxiosPromise<PageResult<RiskWithdrawBlacklistVO>> => {
  return request({ url: '/infra/risk/blacklist/withdraw/list', method: 'get', params: query });
};

/** 新增 / 批量新增 */
export const addRiskBlacklist = (data: RiskBlacklistAddForm): AxiosPromise<number> => {
  return request({ url: '/infra/risk/blacklist/add', method: 'post', data });
};

/** 移出黑名单（单条与批量共用） */
export const removeRiskBlacklist = (data: RiskBlacklistRemoveForm): AxiosPromise<number> => {
  return request({ url: '/infra/risk/blacklist/remove', method: 'post', data });
};

/** 批量导入（CSV） */
export const importRiskBlacklist = (tab: RiskBlacklistTab, file: File): AxiosPromise<RiskImportResultVO> => {
  const form = new FormData();
  form.append('tab', tab);
  form.append('file', file);
  return request({
    url: '/infra/risk/blacklist/import',
    method: 'post',
    data: form,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

/** 导出报表（走浏览器下载） */
export const exportRiskBlacklist = (tab: RiskBlacklistTab, query?: RiskBlacklistQuery) => {
  return request({
    url: '/infra/risk/blacklist/export',
    method: 'get',
    params: { ...query, tab },
    responseType: 'blob'
  });
};
