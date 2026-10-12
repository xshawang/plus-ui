import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { MemberLogQuery, MemberLogVO } from './types';

/**
 * 会员日志接口（只读）。
 *
 * 后端：go88-service-infra（MemberLogController）
 * 权限：member:log:list
 * 注意：后端强制时间窗（默认 7 天，最大 31 天），超限会返回业务错误。
 */
export const listMemberLog = (query?: MemberLogQuery): AxiosPromise<MemberLogVO[]> => {
  return request({
    url: '/infra/member/log/list',
    method: 'get',
    params: query
  });
};
