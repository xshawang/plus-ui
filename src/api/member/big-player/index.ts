import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { BigPlayerConfigForm, BigPlayerConfigVO, BigPlayerReportQuery, BigPlayerReportVO } from './types';

/**
 * 大R提醒与报表接口（09 文档）。
 * 权限：member:big-player:list / member:big-player:edit
 */
export const listBigPlayerConfig = (currency?: string): AxiosPromise<BigPlayerConfigVO[]> => {
  return request({
    url: '/infra/member/big-player/config',
    method: 'get',
    params: { currency }
  });
};

export const saveBigPlayerConfig = (data: BigPlayerConfigForm): AxiosPromise<number> => {
  return request({
    url: '/infra/member/big-player/config',
    method: 'put',
    data
  });
};

export const listBigPlayerReport = (query?: BigPlayerReportQuery): AxiosPromise<BigPlayerReportVO[]> => {
  return request({
    url: '/infra/member/big-player/report',
    method: 'get',
    params: query
  });
};
