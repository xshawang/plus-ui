import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

/**
 * 优惠明细与优惠统计接口（需求文档 08 优惠明细、01 §3.4 优惠统计）。
 *
 * 后端：go88-service-infra（org.dromara.go88.promotion.controller.PromoReportController）
 * 权限：promotion:report:list / promotion:report:export
 */
export interface PromoReportQuery {
  pageNum?: number;
  pageSize?: number;
  activityId?: number;
  activityName?: string;
  account?: string;
  source?: string;
  rewardType?: number;
  currency?: string;
  timeStart?: string;
  timeEnd?: string;
}

/** 优惠统计（按活动聚合 + 服务端总计行） */
export const getPromoStatistic = (query?: PromoReportQuery): AxiosPromise<Record<string, unknown>> => {
  return request({ url: '/infra/promotion/report/statistic', method: 'get', params: query });
};

/** 会员优惠明细 */
export const listPromoMemberDetail = (query?: PromoReportQuery): AxiosPromise<Array<Record<string, unknown>>> => {
  return request({ url: '/infra/promotion/report/member-detail/list', method: 'get', params: query });
};

/** 主播号优惠明细 */
export const listPromoStreamerDetail = (query?: PromoReportQuery): AxiosPromise<Array<Record<string, unknown>>> => {
  return request({ url: '/infra/promotion/report/streamer-detail/list', method: 'get', params: query });
};

/** 优惠明细合计 */
export const getPromoDetailSummary = (query?: PromoReportQuery): AxiosPromise<Record<string, unknown>> => {
  return request({ url: '/infra/promotion/report/detail/summary', method: 'get', params: query });
};

/** 优惠来源下拉取值 */
export const listPromoSourceOptions = (): AxiosPromise<string[]> => {
  return request({ url: '/infra/promotion/report/source/options', method: 'get' });
};
