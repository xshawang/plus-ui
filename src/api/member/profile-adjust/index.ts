import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

/**
 * 会员资料调整接口（批次 7）：联系方式明文查看 + VIP 行内改档。
 * 权限：member:detail:plain（明文，高敏）/ member:user:edit（改档）
 */
export interface MemberPlainContactVO {
  uid: number;
  loginName?: string;
  phone?: string;
  phoneVerified?: number;
  realName?: string;
  kycLevel?: string;
  cardNote?: string;
  accounts?: {
    bankName?: string;
    accountName?: string;
    accountNoMask?: string;
    accountNoHash?: string;
    mobile?: string;
    isPrimary?: number;
  }[];
}

/** 明文查看会员联系方式（会写操作日志） */
export const getPlainContact = (uid: number | string): AxiosPromise<MemberPlainContactVO> => {
  return request({ url: `/infra/member/detail/${uid}/contact/plain`, method: 'get' });
};

/** 行内改档：调整 VIP 等级（需原因，写 user_vip_log） */
export const adjustMemberVip = (data: { uid: number | string; vipLevel: number; reason: string }): AxiosPromise<number> => {
  return request({ url: '/infra/member/detail/vip', method: 'post', data });
};
