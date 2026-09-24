import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';

/**
 * WG 彩票管理接口（彩种参数 / 玩法配置 / 历史修改记录 / 操盘管理 / 自动降赔设置）。
 *
 * 背景：五页签共用一个「彩种 + 币种 + 档位/期号」维度，页面切换频繁，
 * 因此按域聚合在一个文件，统一 /infra/game/lottery 前缀，避免前端跨模块拼接口。
 */

/** 页头（彩种/档位/期数下拉） */
export const lotteryHeader = (currency?: string): AxiosPromise<any> =>
  request({ url: '/infra/game/lottery/header', method: 'get', params: { currency } });

/** 玩法配置：号码项（传 issueNo 时会带出当期操盘覆盖与修改标记） */
export const lotteryPlayItems = (query?: any): AxiosPromise<any[]> =>
  request({ url: '/infra/game/lottery/play/items', method: 'get', params: query });

/** 玩法页签计数（操盘管理括号数字） */
export const lotteryOperationCounts = (query?: any): AxiosPromise<any[]> =>
  request({ url: '/infra/game/lottery/play/operation-counts', method: 'get', params: query });

/** 玩法配置保存（整页提交，服务端差量落库 + 审计） */
export const saveLotteryPlay = (data: any): AxiosPromise<number> =>
  request({ url: '/infra/game/lottery/play/save', method: 'put', data, headers: { repeatSubmit: false } });

export const saveLotteryPlaySort = (rows: any[]): AxiosPromise<void> =>
  request({ url: '/infra/game/lottery/play/sort', method: 'put', data: rows, headers: { repeatSubmit: false } });

/** 操盘管理 */
export const lotteryOperateHeader = (query?: any): AxiosPromise<any> =>
  request({ url: '/infra/game/lottery/operate/header', method: 'get', params: query });

export const lotteryOperateRecords = (query?: any): AxiosPromise<any[]> =>
  request({ url: '/infra/game/lottery/operate/records', method: 'get', params: query });

export const lotteryOperate = (data: any): AxiosPromise<number> =>
  request({ url: '/infra/game/lottery/operate', method: 'put', data, headers: { repeatSubmit: false } });

export const saveColorLevel = (data: any): AxiosPromise<void> =>
  request({ url: '/infra/game/lottery/color-level', method: 'put', data });

/** 自动降赔设置 */
export const autoReduceHeader = (query?: any): AxiosPromise<any> =>
  request({ url: '/infra/game/lottery/auto-reduce/header', method: 'get', params: query });

export const autoReduceList = (query?: any): AxiosPromise<any[]> =>
  request({ url: '/infra/game/lottery/auto-reduce/list', method: 'get', params: query });

export const saveAutoReduce = (data: any): AxiosPromise<void> =>
  request({ url: '/infra/game/lottery/auto-reduce', method: 'put', data });

export const autoReduceLogs = (query?: any): AxiosPromise<PageResult<any>> =>
  request({ url: '/infra/game/lottery/auto-reduce/logs', method: 'get', params: query });

/** 历史修改记录 */
export const lotteryHistoryList = (query?: any): AxiosPromise<PageResult<any>> =>
  request({ url: '/infra/game/lottery/history/list', method: 'get', params: query });

export const lotteryHistoryOptions = (): AxiosPromise<any> =>
  request({ url: '/infra/game/lottery/history/options', method: 'get' });

export const lotteryHistoryExport = (query?: any): AxiosPromise<any[]> =>
  request({ url: '/infra/game/lottery/history/export', method: 'get', params: query });
