import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  PromoLotteryConfigForm,
  PromoLotteryConfigVO,
  PromoLotteryPrizeForm,
  PromoLotteryPrizeVO,
  PromoLotteryQuery,
  PromoPhysicalOrderVO,
  PromoPhysicalShipForm
} from './types';

/**
 * 抽奖活动接口（需求文档 03 盲盒抽奖 / 04 幸运转盘）。
 *
 * 后端：go88-service-infra（org.dromara.go88.promotion.controller.PromoLotteryController）
 * 权限：promotion:lottery:list / promotion:lottery:edit
 */
export const listPromoLotteryConfig = (query?: PromoLotteryQuery): AxiosPromise<PromoLotteryConfigVO[]> => {
  return request({ url: '/infra/promotion/lottery/config/list', method: 'get', params: query });
};

export const savePromoLotteryConfig = (data: PromoLotteryConfigForm): AxiosPromise<number> => {
  return request({ url: '/infra/promotion/lottery/config/save', method: 'post', data });
};

export const togglePromoLotteryConfig = (configId: number, enabled: number): AxiosPromise<void> => {
  return request({ url: `/infra/promotion/lottery/config/${configId}/status`, method: 'post', params: { enabled } });
};

/** 奖池列表 */
export const listPromoLotteryPrize = (configId: number): AxiosPromise<PromoLotteryPrizeVO[]> => {
  return request({ url: '/infra/promotion/lottery/prize/list', method: 'get', params: { configId } });
};

export const savePromoLotteryPrize = (data: PromoLotteryPrizeForm): AxiosPromise<number> => {
  return request({ url: '/infra/promotion/lottery/prize/save', method: 'post', data });
};

export const deletePromoLotteryPrize = (prizeId: number): AxiosPromise<void> => {
  return request({ url: '/infra/promotion/lottery/prize/' + prizeId, method: 'delete' });
};

/** 抽奖记录（中奖记录用 isWin=1） */
export const listPromoLotteryRecord = (query?: PromoLotteryQuery): AxiosPromise<Array<Record<string, unknown>>> => {
  return request({ url: '/infra/promotion/lottery/record/list', method: 'get', params: query });
};

/** 幸运值记录 */
export const listPromoLuckyLog = (query?: PromoLotteryQuery): AxiosPromise<Array<Record<string, unknown>>> => {
  return request({ url: '/infra/promotion/lottery/lucky/log', method: 'get', params: query });
};

/** 剩余幸运值 */
export const listPromoLuckyBalance = (query?: PromoLotteryQuery): AxiosPromise<Array<Record<string, unknown>>> => {
  return request({ url: '/infra/promotion/lottery/lucky/balance', method: 'get', params: query });
};

/** 实物订单 */
export const listPromoPhysicalOrder = (query?: PromoLotteryQuery): AxiosPromise<PromoPhysicalOrderVO[]> => {
  return request({ url: '/infra/promotion/lottery/order/list', method: 'get', params: query });
};

export const shipPromoPhysicalOrder = (data: PromoPhysicalShipForm): AxiosPromise<void> => {
  return request({ url: '/infra/promotion/lottery/order/ship', method: 'post', data });
};

/** 抽奖统计（活动维度） */
export const getPromoLotteryStatistic = (query?: PromoLotteryQuery): AxiosPromise<Array<Record<string, unknown>>> => {
  return request({ url: '/infra/promotion/lottery/statistic', method: 'get', params: query });
};
