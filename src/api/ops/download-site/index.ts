import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type {
  DownloadHealthQuery,
  DownloadHealthVO,
  DownloadLinkForm,
  DownloadLinkQuery,
  DownloadLinkVO,
  DownloadSiteForm,
  DownloadSiteQuery,
  DownloadSiteStateForm,
  DownloadSiteVO
} from './types';

export const listDownloadSite = (query?: DownloadSiteQuery): AxiosPromise<PageResult<DownloadSiteVO>> => {
  return request({ url: '/infra/ops/download-site/list', method: 'get', params: query });
};

export const getDownloadSite = (id: number | string): AxiosPromise<DownloadSiteVO> => {
  return request({ url: '/infra/ops/download-site/' + id, method: 'get' });
};

export const addDownloadSite = (data: DownloadSiteForm): AxiosPromise => {
  return request({ url: '/infra/ops/download-site', method: 'post', data });
};

export const updateDownloadSite = (data: DownloadSiteForm): AxiosPromise => {
  return request({ url: '/infra/ops/download-site', method: 'put', data });
};

export const delDownloadSite = (ids: string | number | (string | number)[]): AxiosPromise => {
  return request({ url: '/infra/ops/download-site/' + ids, method: 'delete' });
};

export const updateDownloadSiteStatus = (data: DownloadSiteStateForm): AxiosPromise => {
  return request({ url: '/infra/ops/download-site/status', method: 'put', data });
};

export const checkDownloadSite = (ids?: string): AxiosPromise<string[]> => {
  return request({ url: '/infra/ops/download-site/check', method: 'post', params: ids ? { ids } : {} });
};

export const listDownloadLink = (query?: DownloadLinkQuery): AxiosPromise<PageResult<DownloadLinkVO>> => {
  return request({ url: '/infra/ops/download-site/link/list', method: 'get', params: query });
};

export const addDownloadLink = (data: DownloadLinkForm): AxiosPromise => {
  return request({ url: '/infra/ops/download-site/link', method: 'post', data });
};

export const updateDownloadLink = (data: DownloadLinkForm): AxiosPromise => {
  return request({ url: '/infra/ops/download-site/link', method: 'put', data });
};

export const delDownloadLink = (ids: string | number | (string | number)[]): AxiosPromise => {
  return request({ url: '/infra/ops/download-site/link/' + ids, method: 'delete' });
};

export const updateDownloadLinkStatus = (data: DownloadSiteStateForm): AxiosPromise => {
  return request({ url: '/infra/ops/download-site/link/status', method: 'put', data });
};

export const listDownloadHealth = (query?: DownloadHealthQuery): AxiosPromise<PageResult<DownloadHealthVO>> => {
  return request({ url: '/infra/ops/download-site/health/list', method: 'get', params: query });
};
