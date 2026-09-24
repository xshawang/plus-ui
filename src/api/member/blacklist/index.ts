import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  MemberBanForm,
  MemberBanQuery,
  MemberBanVO,
  MemberUnbanForm,
  RiskBlacklistQuery,
  RiskBlacklistVO
} from './types';

/**
 * 黑名单接口（08 文档）。
 * 权限：member:blacklist:list / member:blacklist:edit
 */
export const listMemberBan = (query?: MemberBanQuery): AxiosPromise<MemberBanVO[]> => {
  return request({
    url: '/infra/member/blacklist/list',
    method: 'get',
    params: query
  });
};

/** 风控黑名单（设备/IP/手机/邮箱/PAN，只读） */
export const listRiskBlacklist = (query?: RiskBlacklistQuery): AxiosPromise<RiskBlacklistVO[]> => {
  return request({
    url: '/infra/member/blacklist/risk/list',
    method: 'get',
    params: query
  });
};

/** 封禁会员（默认同步账号状态为锁定） */
export const banMember = (data: MemberBanForm): AxiosPromise<number> => {
  return request({
    url: '/infra/member/blacklist/ban',
    method: 'post',
    data
  });
};

/** 解除封禁 */
export const unbanMember = (data: MemberUnbanForm): AxiosPromise<number> => {
  return request({
    url: '/infra/member/blacklist/unban',
    method: 'put',
    data
  });
};
