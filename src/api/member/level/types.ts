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
  /** 关联标签ID（0=不关联） */
  tagId?: number;
  /** 关联标签名称（列表展示） */
  tagName?: string;
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
  /** 关联标签ID；0=取消关联（2026-10-13 按截图新增） */
  tagId?: number;
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
  /** 币种（2026-10-13 按截图新增） */
  currency?: string;
  /** 上级代理账号 */
  parentAgentName?: string;
  levelName?: string;
  registerAt?: string;
  rechargeAmount?: number;
  rechargeCount?: number;
  maxDepositAmount?: number;
  withdrawAmount?: number;
  withdrawCount?: number;
  vipLevel?: number;
  availableBalance?: number;
  /** 利息宝余额（分）；本项目口径 = 钱包 extra_balance（保险箱） */
  interestBalance?: number;
  bonusBalance?: number;
  /** 总有效投注（分），取 user_game_daily_summary.bet_amount 累计 */
  validBetAmount?: number;
  /** 最近一次层级变更操作人 */
  operatorId?: string;
  /** 最近一次层级变更时间 */
  updatedAt?: string;
  /** 层级锁定：0=否 1=是 */
  isLocked?: number;
}

export interface MemberLevelAssignForm {
  uid?: number;
  uids?: number[];
  levelId: number;
  isLocked?: number;
  changeReason?: string;
}
