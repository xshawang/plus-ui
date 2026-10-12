import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type { NoticeForm, NoticeQuery, NoticeSkinVO, NoticeVO } from './types';

/** 公告分页（tab=current/history/all） */
export const listNotice = (query?: NoticeQuery): AxiosPromise<PageResult<NoticeVO>> => {
  return request({ url: '/infra/ops/notice/list', method: 'get', params: query });
};

/** 当前公告未读数（列表顶部红点） */
export const getNoticeUnreadCount = (): AxiosPromise<{ count: number }> => {
  return request({ url: '/infra/ops/notice/unread-count', method: 'get' });
};

export const getNotice = (id: number | string): AxiosPromise<NoticeVO> => {
  return request({ url: '/infra/ops/notice/' + id, method: 'get' });
};

export const addNotice = (data: NoticeForm): AxiosPromise => {
  return request({ url: '/infra/ops/notice', method: 'post', data });
};

export const updateNotice = (data: NoticeForm): AxiosPromise => {
  return request({ url: '/infra/ops/notice', method: 'put', data });
};

export const delNotice = (ids: string | number | (string | number)[]): AxiosPromise => {
  return request({ url: '/infra/ops/notice/' + ids, method: 'delete' });
};

export const updateNoticeStatus = (data: { id: number; value: number }): AxiosPromise => {
  return request({ url: '/infra/ops/notice/status', method: 'put', data });
};

export const markNoticeRead = (id: number | string): AxiosPromise => {
  return request({ url: '/infra/ops/notice/read/' + id, method: 'put' });
};

export const getNoticeSkin = (skinId?: number): AxiosPromise<NoticeSkinVO> => {
  return request({ url: '/infra/ops/notice/skin', method: 'get', params: skinId ? { skinId } : {} });
};

export const saveNoticeSkin = (data: NoticeSkinVO): AxiosPromise<number> => {
  return request({ url: '/infra/ops/notice/skin', method: 'put', data });
};
