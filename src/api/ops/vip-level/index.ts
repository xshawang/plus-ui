import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type { VipLevelForm, VipLevelQuery, VipLevelStateForm, VipLevelVO } from './types';

export const listVipLevel = (query?: VipLevelQuery): AxiosPromise<PageResult<VipLevelVO>> => {
  return request({ url: '/infra/ops/vip-level/list', method: 'get', params: query });
};

export const getVipLevel = (id: number | string): AxiosPromise<VipLevelVO> => {
  return request({ url: '/infra/ops/vip-level/' + id, method: 'get' });
};

export const addVipLevel = (data: VipLevelForm): AxiosPromise => {
  return request({ url: '/infra/ops/vip-level', method: 'post', data });
};

export const updateVipLevel = (data: VipLevelForm): AxiosPromise => {
  return request({ url: '/infra/ops/vip-level', method: 'put', data });
};

export const delVipLevel = (id: number | string): AxiosPromise => {
  return request({ url: '/infra/ops/vip-level/' + id, method: 'delete' });
};

export const updateVipLevelStatus = (data: VipLevelStateForm): AxiosPromise => {
  return request({ url: '/infra/ops/vip-level/status', method: 'put', data });
};
