import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type { AdminAccountOptions, AdminAccountQuery, AdminAccountVO, PermissionRow } from './types';

/** 页面下拉（站点 / 创建来源 / 登录方式） */
export const getAdminAccountOptions = (): AxiosPromise<AdminAccountOptions> => {
  return request({ url: '/system/admin-account/options', method: 'get' });
};

/** 左侧部门树 */
export const getAdminAccountDeptTree = (params?: Record<string, any>): AxiosPromise<any[]> => {
  return request({ url: '/system/admin-account/dept-tree', method: 'get', params });
};

/** 账号列表 */
export const listAdminAccount = (query?: AdminAccountQuery): AxiosPromise<PageResult<AdminAccountVO>> => {
  return request({ url: '/system/admin-account/list', method: 'get', params: query });
};

/** 账号详情（含角色与日志摘要） */
export const getAdminAccountDetail = (userId: string | number): AxiosPromise<Record<string, any>> => {
  return request({ url: '/system/admin-account/detail/' + userId, method: 'get' });
};

/** 账号日志（登录日志 + 操作日志） */
export const getAdminAccountLogs = (userId: string | number): AxiosPromise<Record<string, any>> => {
  return request({ url: '/system/admin-account/logs/' + userId, method: 'get' });
};

/** 冻结 / 解冻账号 */
export const changeAdminAccountStatus = (data: { userId: string; status: string }): AxiosPromise => {
  return request({ url: '/system/admin-account/status', method: 'put', data });
};

/** 维护站点权限与创建来源 */
export const updateAdminAccountScope = (data: {
  userId: string;
  stationScope?: string;
  createSource?: string;
}): AxiosPromise => {
  return request({ url: '/system/admin-account/scope', method: 'put', data });
};

/** 权限管理页签（角色 + 已授权菜单数） */
export const listAdminPermission = (): AxiosPromise<PermissionRow[]> => {
  return request({ url: '/system/admin-account/permission', method: 'get' });
};

/** 「登录WG群发系统」跳转地址 */
export const getWgUrl = (): AxiosPromise<{ url: string }> => {
  return request({ url: '/system/admin-account/wg-url', method: 'get' });
};
