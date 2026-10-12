import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type { AccessOptions, AccessQuery, BrowserAuthVO, BrowserVpnVO, IpWhitelistVO } from './types';

/** 页面头部信息（后台域名主/备 + VPN 信任级别字典 + 站点下拉） */
export const getAccessOptions = (): AxiosPromise<AccessOptions> => {
  return request({ url: '/infra/sys/access/options', method: 'get' });
};

export const listIpWhitelist = (query?: AccessQuery): AxiosPromise<PageResult<IpWhitelistVO>> => {
  return request({ url: '/infra/sys/access/ip/list', method: 'get', params: query });
};

export const addIpWhitelist = (data: Partial<IpWhitelistVO>): AxiosPromise => {
  return request({ url: '/infra/sys/access/ip', method: 'post', data });
};

export const updateIpWhitelist = (data: Partial<IpWhitelistVO>): AxiosPromise => {
  return request({ url: '/infra/sys/access/ip', method: 'put', data });
};

export const delIpWhitelist = (ids: string[]): AxiosPromise => {
  return request({ url: '/infra/sys/access/ip', method: 'delete', data: { ids } });
};

export const listBrowserAuth = (query?: AccessQuery): AxiosPromise<PageResult<BrowserAuthVO>> => {
  return request({ url: '/infra/sys/access/auth/list', method: 'get', params: query });
};

export const addBrowserAuth = (data: Partial<BrowserAuthVO>): AxiosPromise => {
  return request({ url: '/infra/sys/access/auth', method: 'post', data });
};

export const updateBrowserAuth = (data: Partial<BrowserAuthVO>): AxiosPromise => {
  return request({ url: '/infra/sys/access/auth', method: 'put', data });
};

export const delBrowserAuth = (ids: string[]): AxiosPromise => {
  return request({ url: '/infra/sys/access/auth', method: 'delete', data: { ids } });
};

export const listBrowserVpn = (query?: AccessQuery): AxiosPromise<PageResult<BrowserVpnVO>> => {
  return request({ url: '/infra/sys/access/vpn/list', method: 'get', params: query });
};

export const addBrowserVpn = (data: Partial<BrowserVpnVO>): AxiosPromise => {
  return request({ url: '/infra/sys/access/vpn', method: 'post', data });
};

export const updateBrowserVpn = (data: Partial<BrowserVpnVO>): AxiosPromise => {
  return request({ url: '/infra/sys/access/vpn', method: 'put', data });
};

export const delBrowserVpn = (ids: string[]): AxiosPromise => {
  return request({ url: '/infra/sys/access/vpn', method: 'delete', data: { ids } });
};
