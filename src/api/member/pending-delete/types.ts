/**
 * 待删除会员（需求文档 08 §3）类型定义。
 *
 * 说明：金额单位统一为「分」；执行删除为逻辑删除 + 审计留痕，不做物理删除。
 */
export interface PendingDeleteQuery {
  pageNum?: number;
  pageSize?: number;
  uid?: number | string;
  loginName?: string;
  status?: number;
  source?: number;
  accountType?: string;
  planTimeStart?: string;
  planTimeEnd?: string;
  planTimeRange?: string[];
}

export interface PendingDeleteVO {
  uid: number;
  loginName?: string;
  nickName?: string;
  levelName?: string;
  accountStatus?: number;
  accountType?: string;
  realName?: string;
  inviteUid?: number;
  inviteName?: string;
  topAgentUid?: number;
  topAgentName?: string;
  parentAgentUid?: number;
  parentAgentName?: string;
  currency?: string;
  availableBalance?: number;
  bonusBalance?: number;
  totalBalance?: number;
  totalRechargeAmount?: number;
  totalRechargeCount?: number;
  totalWithdrawAmount?: number;
  totalWithdrawCount?: number;
  balanceDiff?: number;
  firstDepositAmount?: number;
  registerType?: string;
  verifyType?: string;
  registerAt?: string;
  registerChannel?: string;
  deletePlanTime?: string;
  source?: number;
  reason?: string;
  ruleSnapshot?: string;
  status?: number;
  operatorId?: string;
  createdAt?: string;
  fundCheckResult?: string;
}

export interface PendingDeleteEnqueueForm {
  uids: (number | string)[];
  planDays?: number;
  reason?: string;
}

export interface PendingDeleteAutoForm {
  inactiveDays?: number;
  requireNoDeposit?: boolean;
  accountType?: string;
  excludeVerified?: boolean;
  planDays?: number;
  limit?: number;
  reason?: string;
}

export interface PendingDeleteClearForm {
  confirmWord: string;
  reason: string;
  limit?: number;
}

export interface PendingDeleteResult {
  candidates?: number;
  enqueued?: number;
  executed?: number;
  blockedCount?: number;
  blocked?: { uid: string; reason: string }[];
  planTime?: string;
  scope?: string;
}

export interface DeleteLogVO {
  id: number;
  uid: number;
  loginName?: string;
  scope?: string;
  purgeMode?: string;
  reason?: string;
  snapshotJson?: string;
  operatorId?: string;
  createdAt?: string;
}
