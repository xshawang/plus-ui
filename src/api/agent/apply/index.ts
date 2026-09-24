import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type { AgentApplyAuditForm, AgentApplyQuery, AgentApplyTabCounts, AgentApplyVO } from './types';

/**
 * 专业代理申请接口（代理 → 代理中心 → 待审核 / 被拒绝 / 已通过）。
 * 权限：agent:center:list / agent:apply:audit / agent:apply:export
 */

/** 待审核分页 */
export const listPendingApplies = (query?: AgentApplyQuery): AxiosPromise<PageResult<AgentApplyVO>> => {
  return request({ url: '/infra/agent/apply/list', method: 'get', params: query });
};

/** 已拒绝分页 */
export const listRejectedApplies = (query?: AgentApplyQuery): AxiosPromise<PageResult<AgentApplyVO>> => {
  return request({ url: '/infra/agent/apply/rejected/list', method: 'get', params: query });
};

/** 已通过分页 */
export const listApprovedApplies = (query?: AgentApplyQuery): AxiosPromise<PageResult<AgentApplyVO>> => {
  return request({ url: '/infra/agent/apply/approved/list', method: 'get', params: query });
};

/** 三页签计数（页签角标） */
export const getAgentApplyTabCounts = (): AxiosPromise<AgentApplyTabCounts> => {
  return request({ url: '/infra/agent/apply/tab-counts', method: 'get' });
};

/** 申请详情（审核弹窗回显） */
export const getAgentApplyDetail = (applyId: number | string): AxiosPromise<AgentApplyVO> => {
  return request({ url: `/infra/agent/apply/detail/${applyId}`, method: 'get' });
};

/** 审核（通过 / 拒绝） */
export const auditAgentApply = (data: AgentApplyAuditForm): AxiosPromise<number> => {
  return request({ url: '/infra/agent/apply/audit', method: 'post', data });
};

/** 批量审核 */
export const batchAuditAgentApply = (data: AgentApplyAuditForm): AxiosPromise<number> => {
  return request({ url: '/infra/agent/apply/batch-audit', method: 'post', data });
};

/** 导出申请（status：1待审核 2已通过 3已拒绝） */
export const exportAgentApplies = (status: number, query?: AgentApplyQuery) => {
  return request({
    url: '/infra/agent/apply/export',
    method: 'get',
    params: { ...query, status },
    responseType: 'blob'
  });
};
