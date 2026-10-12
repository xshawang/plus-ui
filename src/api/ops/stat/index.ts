import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type { StatExportForm, StatExportTask, StatQuery, StatRow } from './types';

/** 日运营报表（含底部总计行） */
export const getDailyOperate = (query?: StatQuery): AxiosPromise<PageResult<StatRow>> => {
  return request({ url: '/infra/ops/stat/daily-operate', method: 'get', params: query });
};

/** 会员总报表（区间汇总） */
export const getMemberTotal = (query?: StatQuery): AxiosPromise<StatRow> => {
  return request({ url: '/infra/ops/stat/member-total', method: 'get', params: query });
};

/** 单个会员报表 */
export const getMemberSingle = (query?: StatQuery): AxiosPromise<PageResult<StatRow>> => {
  return request({ url: '/infra/ops/stat/member-single', method: 'get', params: query });
};

/** 未登入会员分析（状态 × 未登录天数分桶交叉表） */
export const getNotLoginAnalysis = (): AxiosPromise<StatRow[]> => {
  return request({ url: '/infra/ops/stat/member/not-login', method: 'get' });
};

/** 未充值会员分析（状态 × 注册天数分桶交叉表） */
export const getNotRechargeAnalysis = (): AxiosPromise<StatRow[]> => {
  return request({ url: '/infra/ops/stat/member/not-recharge', method: 'get' });
};

/** 日活跃趋势 */
export const getActiveDaily = (query?: StatQuery): AxiosPromise<StatRow[]> => {
  return request({ url: '/infra/ops/stat/active/day', method: 'get', params: query });
};

/** 周活跃趋势 */
export const getActiveWeekly = (query?: StatQuery): AxiosPromise<StatRow[]> => {
  return request({ url: '/infra/ops/stat/active/week', method: 'get', params: query });
};

/** 投注趋势 */
export const getBetChart = (query?: StatQuery): AxiosPromise<StatRow[]> => {
  return request({ url: '/infra/ops/stat/bet', method: 'get', params: query });
};

/** 报表导出（创建任务 → 生成 → 返回可下载地址） */
export const exportStat = (data: StatExportForm): AxiosPromise<StatRow> => {
  return request({ url: '/infra/ops/stat/export', method: 'post', data });
};

/** 导出任务列表 */
export const listStatExportTasks = (query?: { bizType?: string; pageNum?: number; pageSize?: number }): AxiosPromise<PageResult<StatExportTask>> => {
  return request({ url: '/infra/ops/stat/export/list', method: 'get', params: query });
};

/** 会员总报表 / 单个会员报表：逐会员行 + 总计行（footer） */
export const getMemberReportPage = (query?: StatQuery): AxiosPromise<StatRow> => {
  return request({ url: '/infra/ops/stat/member-report/page', method: 'get', params: query });
};

/** 分类多选选项（电子/捕鱼/棋牌/真人/体育/区块链/彩票/斗鸡） */
export const getStatCategories = (): AxiosPromise<StatRow[]> => {
  return request({ url: '/infra/ops/stat/categories', method: 'get' });
};

/** 活跃图表（granularity=day/week；老会员留存·流失 + 新会员留存·充值·注册） */
export const getActiveChart = (query?: StatQuery & { granularity?: string }): AxiosPromise<StatRow[]> => {
  return request({ url: '/infra/ops/stat/active/chart', method: 'get', params: query });
};

/** 投注图表增强：有效投注 + 投注比（服务端计算） */
export const getBetChartEnhanced = (query?: StatQuery): AxiosPromise<StatRow[]> => {
  return request({ url: '/infra/ops/stat/bet/chart', method: 'get', params: query });
};

/** 未登入 / 未充值分析：按分桶导出会员明细（进入「报表 → 导出下载」） */
export const exportMemberBucket = (type: string, bucket: string): AxiosPromise<StatRow> => {
  return request({ url: '/infra/ops/stat/member/bucket/export', method: 'post', params: { type, bucket } });
};
