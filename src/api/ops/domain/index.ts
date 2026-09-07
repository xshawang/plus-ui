import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type { DomainForm, DomainHealthQuery, DomainHealthVO, DomainQuery, DomainStateForm, DomainVO } from './types';

export const listDomain = (query?: DomainQuery): AxiosPromise<PageResult<DomainVO>> => {
  return request({ url: '/infra/ops/domain/list', method: 'get', params: query });
};

export const getDomain = (id: number | string): AxiosPromise<DomainVO> => {
  return request({ url: '/infra/ops/domain/' + id, method: 'get' });
};

export const addDomain = (data: DomainForm): AxiosPromise => {
  return request({ url: '/infra/ops/domain', method: 'post', data });
};

export const updateDomain = (data: DomainForm): AxiosPromise => {
  return request({ url: '/infra/ops/domain', method: 'put', data });
};

export const delDomain = (ids: string | number | (string | number)[]): AxiosPromise => {
  return request({ url: '/infra/ops/domain/' + ids, method: 'delete' });
};

export const updateDomainStatus = (data: DomainStateForm): AxiosPromise => {
  return request({ url: '/infra/ops/domain/status', method: 'put', data });
};

export const switchDomainPrimary = (data: DomainStateForm): AxiosPromise => {
  return request({ url: '/infra/ops/domain/switch', method: 'put', data });
};

export const checkDomain = (ids?: string): AxiosPromise<string[]> => {
  return request({ url: '/infra/ops/domain/check', method: 'post', params: ids ? { ids } : {} });
};

export const listDomainHealth = (query?: DomainHealthQuery): AxiosPromise<PageResult<DomainHealthVO>> => {
  return request({ url: '/infra/ops/domain/health/list', method: 'get', params: query });
};
