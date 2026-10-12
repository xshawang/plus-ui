/**
 * 黑名单（需求文档 08）类型定义。
 */
export interface MemberBanQuery {
  pageNum?: number;
  pageSize?: number;
  uid?: number | string;
  loginName?: string;
  banType?: number;
  active?: number;
  params?: Record<string, unknown>;
}

export interface MemberBanVO {
  id: number;
  uid: number;
  loginName?: string;
  nickName?: string;
  vipLevel?: number;
  levelName?: string;
  /** 1=封号 2=封设备 3=禁止提现 4=禁止充值 5=禁止游戏 */
  banType?: number;
  reason?: string;
  operatorId?: string;
  banStartAt?: string;
  banEndAt?: string;
  unbanAt?: string;
  unbanReason?: string;
  createdAt?: string;
  active?: boolean;
  accountStatus?: number;
}

export interface MemberBanForm {
  uid: number | string;
  banType?: number;
  reason: string;
  banDays?: number;
  syncAccountStatus?: number;
}

export interface MemberUnbanForm {
  id: number;
  reason?: string;
  syncAccountStatus?: number;
}

export interface RiskBlacklistQuery {
  pageNum?: number;
  pageSize?: number;
  targetType?: number;
  keyword?: string;
}

export interface RiskBlacklistVO {
  id: number;
  targetType?: number;
  targetValueMask?: string;
  source?: number;
  reason?: string;
  blockScope?: number;
  expireAt?: string;
  operatorId?: string;
  createdAt?: string;
}
