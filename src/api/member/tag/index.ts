import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { MemberTagBindForm, MemberTagForm, MemberTagQuery, MemberTagVO } from './types';

/**
 * 会员标签接口。
 *
 * 后端：go88-service-infra（org.dromara.go88.member.controller.MemberTagController）
 * 权限：member:tag:list / member:tag:edit
 */
export const listMemberTag = (query?: MemberTagQuery): AxiosPromise<MemberTagVO[]> => {
  return request({
    url: '/infra/member/tag/list',
    method: 'get',
    params: query
  });
};

export const listMemberTagOptions = (): AxiosPromise<MemberTagVO[]> => {
  return request({
    url: '/infra/member/tag/options',
    method: 'get'
  });
};

export const addMemberTag = (data: MemberTagForm) => {
  return request({
    url: '/infra/member/tag',
    method: 'post',
    data
  });
};

export const updateMemberTag = (data: MemberTagForm) => {
  return request({
    url: '/infra/member/tag',
    method: 'put',
    data
  });
};

export const delMemberTag = (tagId: number) => {
  return request({
    url: '/infra/member/tag/' + tagId,
    method: 'delete'
  });
};

/** 查询指定会员已绑定标签ID */
export const listMemberTagsOfUser = (uids: number[]): AxiosPromise<number[]> => {
  return request({
    url: '/infra/member/tag/member-tags',
    method: 'get',
    params: { uids: uids.join(',') }
  });
};

/** 批量打标（重复打标自动跳过） */
export const bindMemberTag = (data: MemberTagBindForm): AxiosPromise<number> => {
  return request({
    url: '/infra/member/tag/bind',
    method: 'post',
    data
  });
};

/** 批量摘标 */
export const unbindMemberTag = (data: MemberTagBindForm): AxiosPromise<number> => {
  return request({
    url: '/infra/member/tag/unbind',
    method: 'post',
    data
  });
};
