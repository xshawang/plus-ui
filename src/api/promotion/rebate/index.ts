import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PromoRebateConfigForm, PromoRebateConfigVO, PromoRebateQuery } from './types';

/**
 * 实时返水接口（需求文档 05）。
 *
 * 后端：go88-service-infra（org.dromara.go88.promotion.controller.PromoRebateController）
 * 权限：promotion:rebate:list / promotion:rebate:edit
 */
export const listPromoRebateConfig = (query?: PromoRebateQuery): AxiosPromise<PromoRebateConfigVO[]> => {
  return request({ url: '/infra/promotion/rebate/config/list', method: 'get', params: query });
};

export const savePromoRebateConfig = (data: PromoRebateConfigForm): AxiosPromise<number> => {
  return request({ url: '/infra/promotion/rebate/config/save', method: 'post', data });
};

export const togglePromoRebateConfig = (configId: number, enabled: number): AxiosPromise<void> => {
  return request({ url: `/infra/promotion/rebate/config/${configId}/status`, method: 'post', params: { enabled } });
};

/** 返水活动详情（汇总 + 游戏分类明细） */
export const getPromoRebateDetail = (configId: number): AxiosPromise<Record<string, unknown>> => {
  return request({ url: '/infra/promotion/rebate/config/' + configId, method: 'get' });
};

/** 返水明细 */
export const listPromoRebateRecord = (query?: PromoRebateQuery): AxiosPromise<Array<Record<string, unknown>>> => {
  return request({ url: '/infra/promotion/rebate/record/list', method: 'get', params: query });
};
