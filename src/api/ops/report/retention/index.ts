import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { RetentionOptions, RetentionPage, RetentionQuery, RetentionRow } from './types';

/** 留存统计分页（含平均值行；比率为 0~1 小数） */
export const listRetention = (query?: RetentionQuery): AxiosPromise<RetentionPage> => {
  return request({ url: '/infra/ops/report/retention/list', method: 'get', params: query });
};

/** 平均值行 */
export const getRetentionAverage = (query?: RetentionQuery): AxiosPromise<RetentionRow> => {
  return request({ url: '/infra/ops/report/retention/average', method: 'get', params: query });
};

/** 下拉选项（算法 / 设备类型 / 设备端） */
export const getRetentionOptions = (): AxiosPromise<RetentionOptions> => {
  return request({ url: '/infra/ops/report/retention/options', method: 'get' });
};

/** 导出留存统计（含平均值行） */
export const exportRetention = (data: RetentionQuery): AxiosPromise<Record<string, any>> => {
  return request({ url: '/infra/ops/report/retention/export', method: 'post', data });
};
