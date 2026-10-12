import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { RtpDailyRow, RtpJackpotDailyRow, RtpSummary, RtpTheoryConfig } from './types';

/** 综合 RTP 日报（按日/区间查询，注额与派彩同源同过滤） */
export const getRtpDaily = (params: {
  startDate?: string;
  endDate?: string;
  gameId?: string;
}): AxiosPromise<RtpDailyRow[]> => {
  return request({
    url: '/infra/report/rtp/daily',
    method: 'get',
    params
  });
};

/** 区间汇总（管理层视图：先累加分子分母再算 RTP） */
export const getRtpSummary = (params: {
  startDate?: string;
  endDate?: string;
  gameId?: string;
}): AxiosPromise<RtpSummary> => {
  return request({
    url: '/infra/report/rtp/summary',
    method: 'get',
    params
  });
};

/** 奖池资金日报（期初/贡献/派发/期末 + 对账差额） */
export const getRtpJackpotDaily = (params: {
  startDate?: string;
  endDate?: string;
  gameId?: string;
}): AxiosPromise<RtpJackpotDailyRow[]> => {
  return request({
    url: '/infra/report/rtp/jackpot-daily',
    method: 'get',
    params
  });
};

/** 理论口径配置（基础/奖池/加码） */
export const getRtpTheory = (): AxiosPromise<RtpTheoryConfig[]> => {
  return request({
    url: '/infra/report/rtp/theory',
    method: 'get'
  });
};

/** 按日重算日报（幂等；缺省重算昨天） */
export const aggregateRtpDaily = (date?: string) => {
  return request({
    url: '/infra/report/rtp/aggregate',
    method: 'post',
    params: { date }
  });
};
