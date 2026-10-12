import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  MemberBetStatVO,
  MemberContactVO,
  MemberDetailOverviewVO,
  MemberMessageVO,
  MemberProfileVO,
  MemberRemarkVO,
  MemberTransactionQuery,
  MemberTransactionVO,
  MemberWithdrawAccountVO
} from './types';

/**
 * 会员详情接口（02 文档）。
 * 权限：member:detail:list（备注修改用 member:user:edit）
 *
 * 说明：登录设备 / 会员日志 / 投注明细三个页签复用各自模块接口（前端按 uid 过滤）。
 */
export const getMemberDetailOverview = (uid: number | string): AxiosPromise<MemberDetailOverviewVO> => {
  return request({ url: `/infra/member/detail/${uid}/overview`, method: 'get' });
};

export const getMemberDetailContact = (uid: number | string): AxiosPromise<MemberContactVO> => {
  return request({ url: `/infra/member/detail/${uid}/contact`, method: 'get' });
};

export const getMemberDetailProfile = (uid: number | string): AxiosPromise<MemberProfileVO> => {
  return request({ url: `/infra/member/detail/${uid}/profile`, method: 'get' });
};

export const listMemberWithdrawAccount = (uid: number | string): AxiosPromise<MemberWithdrawAccountVO[]> => {
  return request({ url: `/infra/member/detail/${uid}/withdraw-account/list`, method: 'get' });
};

export const listMemberTransaction = (uid: number | string, query?: MemberTransactionQuery): AxiosPromise<MemberTransactionVO[]> => {
  return request({ url: `/infra/member/detail/${uid}/transaction/list`, method: 'get', params: query });
};

export const listMemberMessage = (uid: number | string, query?: { pageNum?: number; pageSize?: number }): AxiosPromise<MemberMessageVO[]> => {
  return request({ url: `/infra/member/detail/${uid}/message/list`, method: 'get', params: query });
};

export const listMemberRemarkHistory = (uid: number | string, query?: { pageNum?: number; pageSize?: number }): AxiosPromise<MemberRemarkVO[]> => {
  return request({ url: `/infra/member/detail/${uid}/remark/history`, method: 'get', params: query });
};

/** 修改备注（写履历） */
export const updateMemberRemark = (data: { uid: number | string; remark: string }): AxiosPromise<number> => {
  return request({ url: '/infra/member/detail/remark', method: 'post', data });
};

/** 投注统计（按日 × 游戏） */
export const listMemberBetStat = (uid: number | string, startDate?: string, endDate?: string): AxiosPromise<MemberBetStatVO[]> => {
  return request({ url: `/infra/member/detail/${uid}/bet/stat`, method: 'get', params: { startDate, endDate } });
};
