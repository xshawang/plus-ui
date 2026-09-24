import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PromoTaskForm, PromoTaskQuery, PromoTaskVO } from './types';

/**
 * 任务中心接口（需求文档 02）。
 *
 * 后端：go88-service-infra（org.dromara.go88.promotion.controller.PromoTaskController）
 * 权限：promotion:task:list / promotion:task:edit
 */
export const listPromoTask = (query?: PromoTaskQuery): AxiosPromise<PromoTaskVO[]> => {
  return request({ url: '/infra/promotion/task/list', method: 'get', params: query });
};

export const getPromoTask = (id: number): AxiosPromise<PromoTaskVO> => {
  return request({ url: '/infra/promotion/task/' + id, method: 'get' });
};

export const savePromoTask = (data: PromoTaskForm): AxiosPromise<number> => {
  return request({ url: '/infra/promotion/task/save', method: 'post', data });
};

export const togglePromoTask = (id: number, status: number): AxiosPromise<void> => {
  return request({ url: `/infra/promotion/task/${id}/status`, method: 'post', params: { status } });
};

export const deletePromoTask = (id: number): AxiosPromise<void> => {
  return request({ url: '/infra/promotion/task/' + id, method: 'delete' });
};

/** 任务完成记录 */
export const listPromoTaskRecord = (query?: PromoTaskQuery): AxiosPromise<Array<Record<string, unknown>>> => {
  return request({ url: '/infra/promotion/task/record/list', method: 'get', params: query });
};

/** 活跃度记录 */
export const listPromoActivityPointLog = (query?: PromoTaskQuery): AxiosPromise<Array<Record<string, unknown>>> => {
  return request({ url: '/infra/promotion/task/point/log', method: 'get', params: query });
};

/** 剩余活跃度 */
export const listPromoActivityPointSummary = (query?: PromoTaskQuery): AxiosPromise<Array<Record<string, unknown>>> => {
  return request({ url: '/infra/promotion/task/point/summary', method: 'get', params: query });
};
