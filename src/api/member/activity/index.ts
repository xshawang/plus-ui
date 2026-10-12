import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { ActivityChangeForm, ActivityPointLogVO, ActivityPointQuery, ActivityPointVO } from './types';

/**
 * 会员活跃度接口（17 文档，积分型非资金）。
 * 权限：member:quest:list / member:quest:edit
 */
export const listActivityPoint = (query?: ActivityPointQuery): AxiosPromise<ActivityPointVO[]> => {
  return request({ url: '/infra/member/activity/list', method: 'get', params: query });
};

/** 增减活跃度（幂等：同 requestId 只生效一次），返回变动后剩余 */
export const changeActivityPoint = (data: ActivityChangeForm): AxiosPromise<number> => {
  return request({ url: '/infra/member/activity/change', method: 'post', data });
};

export const listActivityLog = (uid: number | string, changeType?: number, query?: { pageNum?: number; pageSize?: number }): AxiosPromise<ActivityPointLogVO[]> => {
  return request({ url: `/infra/member/activity/log/${uid}`, method: 'get', params: { changeType, ...query } });
};
