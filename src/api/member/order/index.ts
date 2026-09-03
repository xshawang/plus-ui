import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { MemberOrderQuery, MemberOrderVO } from './types';

/**
 * 分页查询充值列表
 *
 * 后端实现在 go88-service-infra：GET /member/recharge/list
 * 权限标识：member:recharge:list
 */
export const listMemberRecharge = (query?: MemberOrderQuery): AxiosPromise<PageResult<MemberOrderVO>> => {
  return request({
    url: '/infra/member/recharge/list',
    method: 'get',
    params: query
  });
};
