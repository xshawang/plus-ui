import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { MemberBalanceAdjustForm, MemberBalanceAdjustResult, MemberUserForm, MemberUserQuery, MemberUserVO } from './types';

/**
 * 分页查询用户列表
 *
 * 后端实现在 go88-service-infra：GET /member/user/list
 * 权限标识：member:user:list
 */
export const listMemberUser = (query?: MemberUserQuery): AxiosPromise<PageResult<MemberUserVO>> => {
  return request({
    url: '/infra/member/users/list',
    method: 'get',
    params: query
  });
};

/**
 * 用户详情（所有属性，供编辑回填）
 * 权限标识：member:user:list
 */
export const getMemberUser = (uid: string | number): AxiosPromise<MemberUserVO> => {
  return request({
    url: '/infra/member/users/' + uid,
    method: 'get'
  });
};

/**
 * 修改用户信息
 * 权限标识：member:user:edit
 */
export const updateMemberUser = (data: MemberUserForm) => {
  return request({
    url: '/infra/member/users',
    method: 'put',
    data: data
  });
};

/**
 * 后台调整用户可用余额（敏感操作：需后台账户密码 + member:user:edit 权限）
 * 后端：go88-service-infra PUT /infra/member/users/balance
 */
export const updateMemberBalance = (data: MemberBalanceAdjustForm): AxiosPromise<MemberBalanceAdjustResult> => {
  return request({
    url: '/infra/member/users/balance',
    method: 'put',
    data: data
  });
};
