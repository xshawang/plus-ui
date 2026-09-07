import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  KpiResult,
  OverviewPeriod,
  OverviewResult,
  RankingResult,
  RankingType,
  RealtimeResult,
  TrendResult
} from './types';

/**
 * 核心经营指标（6 KPI）
 * 后端：go88-service-infra GET /infra/report/dashboard/kpi
 */
export const getDashboardKpi = (): AxiosPromise<KpiResult> => {
  return request({ url: '/infra/report/dashboard/kpi', method: 'get' });
};

/**
 * 今日实时运营
 * 后端：go88-service-infra GET /infra/report/dashboard/realtime
 */
export const getDashboardRealtime = (): AxiosPromise<RealtimeResult> => {
  return request({ url: '/infra/report/dashboard/realtime', method: 'get' });
};

/**
 * 今日排行榜 Top10
 * 后端：go88-service-infra GET /infra/report/dashboard/ranking?type=
 */
export const getDashboardRanking = (type: RankingType): AxiosPromise<RankingResult> => {
  return request({ url: '/infra/report/dashboard/ranking', method: 'get', params: { type } });
};

/**
 * 多日数据对比（7/30/90/自定义）
 * 后端：go88-service-infra GET /infra/report/dashboard/trend
 */
export const getDashboardTrend = (params: {
  days?: number;
  startDate?: string;
  endDate?: string;
}): AxiosPromise<TrendResult> => {
  return request({ url: '/infra/report/dashboard/trend', method: 'get', params });
};

/**
 * 运营总览（Summary + 2×2 趋势）
 * 后端：go88-service-infra GET /infra/report/dashboard/overview
 */
export const getDashboardOverview = (
  period: OverviewPeriod,
  startDate?: string,
  endDate?: string
): AxiosPromise<OverviewResult> => {
  return request({
    url: '/infra/report/dashboard/overview',
    method: 'get',
    params: period === 'custom' ? { period, startDate, endDate } : { period }
  });
};
