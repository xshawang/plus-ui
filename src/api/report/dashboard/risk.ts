import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { RiskTodayResult, RiskTrendResult } from './risk-types';

/** 今日风控态势 */
export const getDashboardRiskToday = (): AxiosPromise<RiskTodayResult> => {
  return request({ url: '/infra/report/dashboard/risk/today', method: 'get' });
};

/** 风控每日趋势（days 或 startDate/endDate） */
export const getDashboardRiskTrend = (params: {
  days?: number;
  startDate?: string;
  endDate?: string;
}): AxiosPromise<RiskTrendResult> => {
  return request({ url: '/infra/report/dashboard/risk/trend', method: 'get', params });
};
