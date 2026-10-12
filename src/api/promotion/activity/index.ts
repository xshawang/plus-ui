import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PromoActivityForm, PromoActivityQuery, PromoActivityVO, PromoCategoryForm, PromoCategoryVO } from './types';

/**
 * 活动中心接口（需求文档 01）。
 *
 * 后端：go88-service-infra（org.dromara.go88.promotion.controller.PromoActivityController / PromoCategoryController）
 * 权限：promotion:activity:list / promotion:activity:edit / promotion:category:edit
 */
export const listPromoActivity = (query?: PromoActivityQuery): AxiosPromise<PromoActivityVO[]> => {
  return request({ url: '/infra/promotion/activity/list', method: 'get', params: query });
};

export const getPromoActivity = (instanceId: number): AxiosPromise<PromoActivityVO> => {
  return request({ url: '/infra/promotion/activity/' + instanceId, method: 'get' });
};

/** 活动表单下拉数据（分类/类型/层级/VIP/终端/条件/派发方式） */
export const getPromoActivityOptions = (): AxiosPromise<Record<string, unknown>> => {
  return request({ url: '/infra/promotion/activity/options', method: 'get' });
};

export const savePromoActivity = (data: PromoActivityForm): AxiosPromise<number> => {
  return request({ url: '/infra/promotion/activity/save', method: 'post', data });
};

export const closePromoActivity = (instanceId: number): AxiosPromise<void> => {
  return request({ url: `/infra/promotion/activity/${instanceId}/close`, method: 'post' });
};

export const copyPromoActivity = (instanceId: number): AxiosPromise<number> => {
  return request({ url: `/infra/promotion/activity/${instanceId}/copy`, method: 'post' });
};

/** 批量置顶排序：入参顺序即最终展示顺序 */
export const sortPromoActivity = (instanceIds: number[]): AxiosPromise<void> => {
  return request({ url: '/infra/promotion/activity/sort', method: 'put', data: instanceIds });
};

export const deletePromoActivity = (instanceId: number): AxiosPromise<void> => {
  return request({ url: '/infra/promotion/activity/' + instanceId, method: 'delete' });
};

/** 活动分类列表（含展示活动数量） */
export const listPromoCategory = (): AxiosPromise<PromoCategoryVO[]> => {
  return request({ url: '/infra/promotion/category/list', method: 'get' });
};

export const addPromoCategory = (data: PromoCategoryForm): AxiosPromise<number> => {
  return request({ url: '/infra/promotion/category', method: 'post', data });
};

export const updatePromoCategory = (data: PromoCategoryForm): AxiosPromise<void> => {
  return request({ url: '/infra/promotion/category', method: 'put', data });
};

export const togglePromoCategory = (categoryId: number, enabled: number): AxiosPromise<void> => {
  return request({ url: `/infra/promotion/category/${categoryId}/status`, method: 'put', params: { enabled } });
};

export const deletePromoCategory = (categoryId: number): AxiosPromise<void> => {
  return request({ url: '/infra/promotion/category/' + categoryId, method: 'delete' });
};
