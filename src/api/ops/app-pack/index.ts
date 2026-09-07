import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type { AppVersionForm, AppVersionQuery, AppVersionVO, WhitelistForm, WhitelistQuery, WhitelistVO } from './types';

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
