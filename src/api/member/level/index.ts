import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  MemberLevelAssignForm,
  MemberLevelForm,
  MemberLevelMemberQuery,
  MemberLevelMemberVO,
  MemberLevelQuery,
  MemberLevelVO
} from './types';

/**
 * 会员层级设置接口。
 *
 * 后端：go88-service-infra（org.dromara.go88.member.controller.MemberLevelController）
 * 权限：member:level:list / member:level:edit（层级归属调整用 member:user:edit）
 */
export const listMemberLevel = (query?: MemberLevelQuery): AxiosPromise<MemberLevelVO[]> => {
  return request({
    url: '/infra/member/level/list',
    method: 'get',
    params: query
  });
};

/** 启用层级下拉（会员列表/打标等场景复用） */
export const listMemberLevelOptions = (): AxiosPromise<MemberLevelVO[]> => {
  return request({
    url: '/infra/member/level/options',
    method: 'get'
  });
};

export const addMemberLevel = (data: MemberLevelForm) => {
  return request({
    url: '/infra/member/level',
    method: 'post',
    data
  });
};

export const updateMemberLevel = (data: MemberLevelForm) => {
  return request({
    url: '/infra/member/level',
    method: 'put',
    data
  });
};

export const delMemberLevel = (levelId: number) => {
  return request({
    url: '/infra/member/level/' + levelId,
    method: 'delete'
  });
};

/** 层级详情：层级下会员明细 */
export const listLevelMembers = (levelId: number, query?: MemberLevelMemberQuery): AxiosPromise<MemberLevelMemberVO[]> => {
  return request({
    url: '/infra/member/level/' + levelId + '/members',
    method: 'get',
    params: query
  });
};

/** 调整会员层级（单个/批量共用），返回成功条数 */
export const assignMemberLevel = (data: MemberLevelAssignForm): AxiosPromise<number> => {
  return request({
    url: '/infra/member/level/assign',
    method: 'put',
    data
  });
};
