import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type { CurrencyForm, CurrencyOptions, CurrencyQuery, CurrencyVO } from './types';

/** 币种分页（截图列表：顶置/名称/国家/代码/图标/千分位/符号/比例/类型/两个开关/操作人/操作时间） */
export const listCurrency = (query?: CurrencyQuery): AxiosPromise<PageResult<CurrencyVO>> => {
  return request({ url: '/infra/sys/currency/list', method: 'get', params: query });
};

/** 页面下拉（币种类型 + 默认分页条数） */
export const getCurrencyOptions = (): AxiosPromise<CurrencyOptions> => {
  return request({ url: '/infra/sys/currency/options', method: 'get' });
};

export const getCurrency = (currencyId: string | number): AxiosPromise<CurrencyVO> => {
  return request({ url: '/infra/sys/currency/' + currencyId, method: 'get' });
};

export const addCurrency = (data: CurrencyForm): AxiosPromise => {
  return request({ url: '/infra/sys/currency', method: 'post', data });
};

export const updateCurrency = (data: CurrencyForm): AxiosPromise => {
  return request({ url: '/infra/sys/currency', method: 'put', data });
};

/** 行内开关：field=master（币种总开关）/ lobby（大厅展示开关） */
export const switchCurrency = (data: { currencyId: string; field: string; value: number }): AxiosPromise => {
  return request({ url: '/infra/sys/currency/switch', method: 'put', data });
};

/** 行首「+顶置」 */
export const topCurrency = (data: { currencyId: string; value: number }): AxiosPromise => {
  return request({ url: '/infra/sys/currency/top', method: 'put', data });
};

export const delCurrency = (ids: string | number | (string | number)[]): AxiosPromise => {
  return request({ url: '/infra/sys/currency/' + ids, method: 'delete' });
};
