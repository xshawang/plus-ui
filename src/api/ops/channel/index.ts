import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type { ChannelForm, ChannelQuery, ChannelStateForm, ChannelStatQuery, ChannelStatVO, ChannelVO } from './types';

export const listChannel = (query?: ChannelQuery): AxiosPromise<PageResult<ChannelVO>> => {
  return request({ url: '/infra/ops/channel/list', method: 'get', params: query });
};

export const getChannel = (id: number | string): AxiosPromise<ChannelVO> => {
  return request({ url: '/infra/ops/channel/' + id, method: 'get' });
};

export const addChannel = (data: ChannelForm): AxiosPromise => {
  return request({ url: '/infra/ops/channel', method: 'post', data });
};

export const updateChannel = (data: ChannelForm): AxiosPromise => {
  return request({ url: '/infra/ops/channel', method: 'put', data });
};

export const delChannel = (ids: string | number | (string | number)[]): AxiosPromise => {
  return request({ url: '/infra/ops/channel/' + ids, method: 'delete' });
};

export const updateChannelStatus = (data: ChannelStateForm): AxiosPromise => {
  return request({ url: '/infra/ops/channel/status', method: 'put', data });
};

export const getChannelStats = (query?: ChannelStatQuery): AxiosPromise<ChannelStatVO[]> => {
  return request({ url: '/infra/ops/channel/stats', method: 'get', params: query });
};
