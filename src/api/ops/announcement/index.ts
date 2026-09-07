import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type { AnnouncementForm, AnnouncementQuery, AnnouncementStateForm, AnnouncementVO } from './types';

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
