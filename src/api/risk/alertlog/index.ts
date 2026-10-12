import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type { RiskAlertLogQuery, RiskAlertLogVO } from './types';

/**
 * 风控提醒留痕接口（风控管理 → 提醒留痕）。
 *
 * 权限：risk:alertlog:list（菜单 995003；MemberAuthInterceptor 对
 * /infra/risk/reward/alert-log/** 的映射）。
 */

/** 留痕分页（按 会员UID / 监测类型 / 结局 / 时间区间 过滤） */
export const listRiskAlertLog = (query?: RiskAlertLogQuery): AxiosPromise<PageResult<RiskAlertLogVO>> => {
  return request({ url: '/infra/risk/reward/alert-log/list', method: 'get', params: query });
};
