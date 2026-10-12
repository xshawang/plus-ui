/**
 * 会员层级设置（需求文档 04）类型定义。
 *
 * 说明：金额字段后端一律返回「分」，前端展示/录入时按 VND 换算（1 VND = 100 分）。
 */
export interface MemberLevelQuery {
  pageNum?: number;
  pageSize?: number;
  levelName?: string;
  levelType?: number;
  status?: number;
}

export interface MemberLevelVO {
  levelId: number;
  levelName: string;
  /** 1=自动层级 2=固定层级 */
  levelType: number;
  minDepositCount?: number;
  /** 最低累计充值金额（分） */
  minDepositAmount?: number;
  description?: string;
  status?: number;
  sortOrder?: number;
  operatorId?: string;
  createdAt?: string;
  updatedAt?: string;
  memberCount?: number;
  defaultLevel?: boolean;
}

export interface MemberLevelForm {
  levelId?: number;
  levelName: string;
  levelType: number;
  minDepositCount?: number;
  minDepositAmount?: number;
  description?: string;
  status?: number;
  sortOrder?: number;
}

export interface MemberLevelMemberQuery {
  pageNum?: number;
  pageSize?: number;
  loginName?: string;
  uid?: number | string;
}

export interface MemberLevelMemberVO {
  uid: number;
  loginName: string;
  levelName?: string;
  registerAt?: string;
  rechargeAmount?: number;
  rechargeCount?: number;
  maxDepositAmount?: number;
  withdrawAmount?: number;
  withdrawCount?: number;
  vipLevel?: number;
  availableBalance?: number;
  bonusBalance?: number;
}

export interface MemberLevelAssignForm {
  uid?: number;
  uids?: number[];
  levelId: number;
  isLocked?: number;
  changeReason?: string;
}
