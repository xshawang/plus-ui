import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { FinanceAuditTaskForm, FinanceAuditTaskQuery, FinanceAuditTaskVO } from './types';

/**
 * 流水稽核任务接口（需求文档 2_财务/13）。
 *
 * 后端：go88-service-infra /infra/finance/audit-task/**；
 * 权限：finance:audit-task:list | finance:audit-task:edit
 * 数据源：复用 user_turnover_task（达标计算由稽核域负责，后台只做查询/发起/解除）。
 */
export const listAuditTask = (query?: FinanceAuditTaskQuery): AxiosPromise<PageResult<FinanceAuditTaskVO>> =>
  request({ url: '/infra/finance/audit-task/list', method: 'get', params: query });

export const createAuditTask = (data: FinanceAuditTaskForm): AxiosPromise<number> =>
  request({ url: '/infra/finance/audit-task', method: 'post', data });

export const releaseAuditTask = (taskId: number): AxiosPromise<number> =>
  request({ url: `/infra/finance/audit-task/${taskId}/release`, method: 'put' });

export const getAuditTaskDetail = (taskId: number): AxiosPromise<FinanceAuditTaskVO> =>
  request({ url: `/infra/finance/audit-task/${taskId}`, method: 'get' });
