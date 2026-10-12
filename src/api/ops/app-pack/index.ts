import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type {
  AppPackageForm,
  AppPackageQuery,
  AppPackageVO,
  AppPackResourceForm,
  AppVersionForm,
  AppVersionQuery,
  AppVersionVO,
  WhitelistForm,
  WhitelistQuery,
  WhitelistVO
} from './types';

export const listAppVersion = (query?: AppVersionQuery): AxiosPromise<PageResult<AppVersionVO>> => {
  return request({ url: '/infra/ops/app-pack/list', method: 'get', params: query });
};

export const getAppVersion = (id: number | string): AxiosPromise<AppVersionVO> => {
  return request({ url: '/infra/ops/app-pack/' + id, method: 'get' });
};

export const addAppVersion = (data: AppVersionForm): AxiosPromise => {
  return request({ url: '/infra/ops/app-pack', method: 'post', data });
};

export const updateAppVersion = (data: AppVersionForm): AxiosPromise => {
  return request({ url: '/infra/ops/app-pack', method: 'put', data });
};

export const delAppVersion = (ids: string | number | (string | number)[]): AxiosPromise => {
  return request({ url: '/infra/ops/app-pack/' + ids, method: 'delete' });
};

export const publishAppVersion = (id: number | string): AxiosPromise => {
  return request({ url: '/infra/ops/app-pack/publish/' + id, method: 'put' });
};

export const offlineAppVersion = (id: number | string): AxiosPromise => {
  return request({ url: '/infra/ops/app-pack/offline/' + id, method: 'put' });
};

export const listWhitelist = (query?: WhitelistQuery): AxiosPromise<PageResult<WhitelistVO>> => {
  return request({ url: '/infra/ops/app-pack/whitelist/list', method: 'get', params: query });
};

export const addWhitelist = (data: WhitelistForm): AxiosPromise => {
  return request({ url: '/infra/ops/app-pack/whitelist', method: 'post', data });
};

export const delWhitelist = (ids: string | number | (string | number)[]): AxiosPromise => {
  return request({ url: '/infra/ops/app-pack/whitelist/' + ids, method: 'delete' });
};

// ---------------- 打包APP / 原生马甲包（图片口径，2026-10-12） ----------------

/** APP×系统 列表（行内带资源行；appType: 1=打包APP 2=原生马甲包） */
export const listAppPackage = (query?: AppPackageQuery): AxiosPromise<PageResult<AppPackageVO>> => {
  return request({ url: '/infra/ops/app-pack/package/list', method: 'get', params: query });
};

export const getAppPackage = (id: number | string): AxiosPromise<AppPackageVO> => {
  return request({ url: '/infra/ops/app-pack/package/' + id, method: 'get' });
};

export const addAppPackage = (data: AppPackageForm): AxiosPromise => {
  return request({ url: '/infra/ops/app-pack/package', method: 'post', data });
};

export const updateAppPackage = (data: AppPackageForm): AxiosPromise => {
  return request({ url: '/infra/ops/app-pack/package', method: 'put', data });
};

export const delAppPackage = (ids: string | number | (string | number)[]): AxiosPromise => {
  return request({ url: '/infra/ops/app-pack/package/' + ids, method: 'delete' });
};

export const updateAppPackageStatus = (data: { id: number; value: number }): AxiosPromise => {
  return request({ url: '/infra/ops/app-pack/package/status', method: 'put', data });
};

/** 生成包受理（图片「生成IOS包 / 生成Android包」）：按公共配置为 APP 建立/刷新资源行（状态=打包中） */
export const buildAppPackage = (params: { appType?: number; platform?: number; appId?: number }): AxiosPromise<Record<string, any>> => {
  return request({ url: '/infra/ops/app-pack/package/build', method: 'post', params });
};

export const addAppResource = (data: AppPackResourceForm): AxiosPromise => {
  return request({ url: '/infra/ops/app-pack/package/resource', method: 'post', data });
};

/** 替换（回填）资源行：包地址/大小/版本/指纹/密钥 → 状态置「打包成功」 */
export const replaceAppResource = (data: AppPackResourceForm): AxiosPromise => {
  return request({ url: '/infra/ops/app-pack/package/resource', method: 'put', data });
};

export const updateAppResourceStatus = (data: { id: number; value: number }): AxiosPromise => {
  return request({ url: '/infra/ops/app-pack/package/resource/status', method: 'put', data });
};

export const delAppResource = (ids: string | number | (string | number)[]): AxiosPromise => {
  return request({ url: '/infra/ops/app-pack/package/resource/' + ids, method: 'delete' });
};

/** 公共配置（图片「公共配置」弹窗：8 个开关 / 资源类型） */
export const getAppPackPublicConfig = (): AxiosPromise<Array<Record<string, any>>> => {
  return request({ url: '/infra/ops/app-pack/public-config', method: 'get' });
};

export const saveAppPackPublicConfig = (config: Record<string, string>): AxiosPromise => {
  return request({ url: '/infra/ops/app-pack/public-config', method: 'put', data: { config } });
};
