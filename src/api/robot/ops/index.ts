import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

/** 机器人运营控制台聚合读模型。 */
export const robotOpsOverview = (params?: any): AxiosPromise<any> =>
  request({ url: '/infra/robot/ops/overview', method: 'get', params });

export const robotOpsGames = (params?: any): AxiosPromise<any> =>
  request({ url: '/infra/robot/ops/games', method: 'get', params });

export const robotOpsTables = (params?: any): AxiosPromise<any> =>
  request({ url: '/infra/robot/ops/tables', method: 'get', params });

export const robotOpsBudgets = (params?: any): AxiosPromise<any> =>
  request({ url: '/infra/robot/ops/budgets', method: 'get', params });

export const robotOpsAnalytics = (params?: any): AxiosPromise<any> =>
  request({ url: '/infra/robot/ops/analytics', method: 'get', params });

export const robotOpsStrategies = (params?: any): AxiosPromise<any> =>
  request({ url: '/infra/robot/ops/strategies', method: 'get', params });

export const robotStrategyGovernance = (gameCode: string): AxiosPromise<any> =>
  request({ url: '/infra/robot/ops/strategy-governance', method: 'get', params: { gameCode } });

export const robotStrategyRequests = (params?: any): AxiosPromise<any> =>
  request({ url: '/infra/robot/ops/strategy-requests', method: 'get', params });

export const submitRobotStrategyChange = (data: any): AxiosPromise<any> =>
  request({ url: '/infra/robot/ops/strategy-requests', method: 'post', data });

export const approveRobotStrategyChange = (requestNo: string): AxiosPromise<any> =>
  request({ url: `/infra/robot/ops/strategy-requests/${requestNo}/approve`, method: 'post' });

export const rejectRobotStrategyChange = (requestNo: string, reason: string): AxiosPromise<any> =>
  request({
    url: `/infra/robot/ops/strategy-requests/${requestNo}/reject`,
    method: 'post',
    data: { reason }
  });

export const cancelRobotStrategyChange = (requestNo: string): AxiosPromise<any> =>
  request({ url: `/infra/robot/ops/strategy-requests/${requestNo}/cancel`, method: 'post' });

export const emergencyRollbackRobotStrategy = (gameCode: string): AxiosPromise<any> =>
  request({
    url: '/infra/robot/ops/strategy-emergency-rollback',
    method: 'post',
    params: { gameCode }
  });
