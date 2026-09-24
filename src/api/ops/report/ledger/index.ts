import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { LedgerOptions, LedgerPage, LedgerQuery, LedgerRow, QueryDaysConfig } from './types';

/** 账变记录分页（响应含小计/总计） */
export const listLedger = (query?: LedgerQuery): AxiosPromise<LedgerPage> => {
  return request({ url: '/infra/ops/report/ledger/list', method: 'get', params: query });
};

/** 单笔账变明细（行展开/详情） */
export const getLedgerDetail = (ledgerNo: string): AxiosPromise<LedgerRow> => {
  return request({ url: '/infra/ops/report/ledger/details', method: 'get', params: { ledgerNo } });
};

/** 下拉选项（账变大类 / 变动钱包 / 币种 / 可查询天数） */
export const getLedgerOptions = (): AxiosPromise<LedgerOptions> => {
  return request({ url: '/infra/ops/report/ledger/options', method: 'get' });
};

/** 导出报表（创建导出任务，可在「报表 → 导出下载」查看与下载） */
export const exportLedger = (data: LedgerQuery): AxiosPromise<Record<string, any>> => {
  return request({ url: '/infra/ops/report/ledger/export', method: 'post', data });
};

/** 读取「前端数据展示天数」 */
export const getQueryDays = (): AxiosPromise<QueryDaysConfig> => {
  return request({ url: '/infra/ops/report/setting/query-days', method: 'get' });
};

/** 保存「前端数据展示天数」（仅允许 ops.report.query.days.* 键） */
export const saveQueryDays = (data: Record<string, number>): AxiosPromise<QueryDaysConfig> => {
  return request({ url: '/infra/ops/report/setting/query-days', method: 'put', data });
};
