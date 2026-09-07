import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type { AvatarForm, AvatarQuery, AvatarStateForm, AvatarVO } from './types';

export const listAvatar = (query?: AvatarQuery): AxiosPromise<PageResult<AvatarVO>> => {
  return request({ url: '/infra/ops/avatar/list', method: 'get', params: query });
};

export const getAvatar = (id: number | string): AxiosPromise<AvatarVO> => {
  return request({ url: '/infra/ops/avatar/' + id, method: 'get' });
};

export const addAvatar = (data: AvatarForm): AxiosPromise => {
  return request({ url: '/infra/ops/avatar', method: 'post', data });
};

export const updateAvatar = (data: AvatarForm): AxiosPromise => {
  return request({ url: '/infra/ops/avatar', method: 'put', data });
};

export const delAvatar = (ids: string | number | (string | number)[]): AxiosPromise => {
  return request({ url: '/infra/ops/avatar/' + ids, method: 'delete' });
};

export const updateAvatarStatus = (data: AvatarStateForm): AxiosPromise => {
  return request({ url: '/infra/ops/avatar/status', method: 'put', data });
};

export const updateAvatarDefault = (data: AvatarStateForm): AxiosPromise => {
  return request({ url: '/infra/ops/avatar/default', method: 'put', data });
};
