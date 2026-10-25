import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  AnnouncementForm,
  AnnouncementQuery,
  AnnouncementStateForm,
  AnnouncementVO,
  LobbyBroadcastConfig
} from './types';

export const listAnnouncement = (query?: AnnouncementQuery): AxiosPromise<PageResult<AnnouncementVO>> => {
  return request({ url: '/infra/ops/announcement/list', method: 'get', params: query });
};

export const getAnnouncement = (id: number | string): AxiosPromise<AnnouncementVO> => {
  return request({ url: '/infra/ops/announcement/' + id, method: 'get' });
};

export const addAnnouncement = (data: AnnouncementForm): AxiosPromise => {
  return request({ url: '/infra/ops/announcement', method: 'post', data });
};

export const updateAnnouncement = (data: AnnouncementForm): AxiosPromise => {
  return request({ url: '/infra/ops/announcement', method: 'put', data });
};

export const delAnnouncement = (ids: string | number | (string | number)[]): AxiosPromise => {
  return request({ url: '/infra/ops/announcement/' + ids, method: 'delete' });
};

export const updateAnnouncementStatus = (data: AnnouncementStateForm): AxiosPromise => {
  return request({ url: '/infra/ops/announcement/status', method: 'put', data });
};

export const updateAnnouncementTop = (data: AnnouncementStateForm): AxiosPromise => {
  return request({ url: '/infra/ops/announcement/top', method: 'put', data });
};

export const publishAnnouncement = (id: number | string): AxiosPromise => {
  return request({ url: '/infra/ops/announcement/publish/' + id, method: 'put' });
};

/** 读取客户端 broadCastConfig 顶部广播 */
export const getLobbyBroadcast = (): AxiosPromise<LobbyBroadcastConfig> => {
  return request({ url: '/infra/ops/announcement/broadcast', method: 'get' });
};

/** 保存顶部广播，并同步 go88_client_config 与 8go88.bin */
export const saveLobbyBroadcast = (data: LobbyBroadcastConfig): AxiosPromise => {
  return request({
    url: '/infra/ops/announcement/broadcast',
    method: 'put',
    data,
    // 客户端广播支持 <color=#rrggbb>...</c> 自定义富文本；转成 JSON Unicode 转义后再发送，
    // 避免全局 XSS 过滤器把标签当作 HTML 清理，同时服务端仍会校验只允许该标签语法。
    transformRequest: [requestData => JSON.stringify(requestData).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')]
  });
};
