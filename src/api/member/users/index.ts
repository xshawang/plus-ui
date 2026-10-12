import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  MemberBalanceAdjustForm,
  MemberBalanceAdjustResult,
  MemberBatchLevelForm,
  MemberBatchStatusForm,
  MemberBatchTagForm,
  MemberUserCreateForm,
  MemberUserForm,
  MemberUserQuery,
  MemberUserVO
} from './types';

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

/**
 * 后台新增会员（01 文档 §4）。
 * 权限：member:user:add；初始余额请在建号后用「加减款」调整（走钱包流水，保证可对账）。
 */
export const addMemberUser = (data: MemberUserCreateForm): AxiosPromise<number> => {
  return request({
    url: '/infra/member/users',
    method: 'post',
    data
  });
};

/** 批量调整会员层级（01 文档批量操作） */
export const batchMemberLevel = (data: MemberBatchLevelForm): AxiosPromise<number> => {
  return request({
    url: '/infra/member/users/batch/level',
    method: 'put',
    data
  });
};

/** 批量打标 / 摘标 */
export const batchMemberTag = (data: MemberBatchTagForm): AxiosPromise<number> => {
  return request({
    url: '/infra/member/users/batch/tag',
    method: 'put',
    data
  });
};

/** 批量冻结 / 解冻 / 注销 */
export const batchMemberStatus = (data: MemberBatchStatusForm): AxiosPromise<number> => {
  return request({
    url: '/infra/member/users/batch/status',
    method: 'put',
    data
  });
};
