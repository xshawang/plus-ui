import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type { RegionAccessForm, RegionAccessQuery, RegionAccessVO } from './types';

export const listRegionAccess = (query?: RegionAccessQuery): AxiosPromise<PageResult<RegionAccessVO>> => {
  return request({ url: '/infra/sys/region-access/list', method: 'get', params: query });
};

export const getRegionAccessOptions = (): AxiosPromise<{
  sites: { value: string; label: string }[];
  accessTypes: { label: string; value: string }[];
  /** 国家/地区字典（value=ISO-3166 alpha-2，label=中文名） */
  countries: { label: string; value: string }[];
}> => {
  return request({ url: '/infra/sys/region-access/options', method: 'get' });
};

export const addRegionAccess = (data: RegionAccessForm): AxiosPromise => {
  return request({ url: '/infra/sys/region-access', method: 'post', data });
};

export const updateRegionAccess = (data: RegionAccessForm): AxiosPromise => {
  return request({ url: '/infra/sys/region-access', method: 'put', data });
};

export const delRegionAccess = (ids: string[]): AxiosPromise => {
  return request({ url: '/infra/sys/region-access', method: 'delete', data: { ids } });
};
