import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type { AdvertForm, AdvertQuery, AdvertStateForm, AdvertVO } from './types';

export const listAdvert = (query?: AdvertQuery): AxiosPromise<PageResult<AdvertVO>> => {
  return request({ url: '/infra/ops/advert/list', method: 'get', params: query });
};

export const getAdvert = (id: number | string): AxiosPromise<AdvertVO> => {
  return request({ url: '/infra/ops/advert/' + id, method: 'get' });
};

export const addAdvert = (data: AdvertForm): AxiosPromise => {
  return request({ url: '/infra/ops/advert', method: 'post', data });
};

export const updateAdvert = (data: AdvertForm): AxiosPromise => {
  return request({ url: '/infra/ops/advert', method: 'put', data });
};

export const delAdvert = (ids: string | number | (string | number)[]): AxiosPromise => {
  return request({ url: '/infra/ops/advert/' + ids, method: 'delete' });
};

export const updateAdvertStatus = (data: AdvertStateForm): AxiosPromise => {
  return request({ url: '/infra/ops/advert/status', method: 'put', data });
};

export const updateAdvertSort = (data: AdvertStateForm): AxiosPromise => {
  return request({ url: '/infra/ops/advert/sort', method: 'put', data });
};
