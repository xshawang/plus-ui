import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { AgentHomePeriod, AgentHomeSnapshot } from './types';

/** 代理经营首页快照；代理身份由后端会话决定，前端不传 agentId。 */
export const getAgentHomeDashboard = (period: AgentHomePeriod): AxiosPromise<AgentHomeSnapshot> => {
  return request({
    url: '/infra/agent/dashboard/home',
    method: 'get',
    params: { period }
  });
};
