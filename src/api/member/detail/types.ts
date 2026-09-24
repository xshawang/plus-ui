/**
 * 会员详情（需求文档 02）类型定义。
 */
export interface MemberDetailOverviewVO {
  uid: number;
  loginName?: string;
  nickName?: string;
  currency?: string;
  status?: number;
  accountType?: string;
  registerType?: string;
  verifyType?: string;
  vipLevel?: number;
  levelId?: number;
  levelName?: string;
  tagNames?: string;
  realName?: string;
  bonusDepositRatio?: number;
  vipUpgradeNeedPay?: number;
  vipUpgradeNeedRounds?: number;
  availableBalance?: number;
  frozenBalance?: number;
  bonusBalance?: number;
  totalRechargeAmount?: number;
  totalRechargeCount?: number;
  totalWithdrawAmount?: number;
  totalWithdrawCount?: number;
  balanceDiff?: number;
  firstDepositAmount?: number;
  registerIp?: string;
  registerDevice?: string;
  registerAt?: string;
  lastLoginIp?: string;
  lastLoginAt?: string;
  lastLoginClientType?: string;
  lastLoginOs?: string;
}

export interface MemberContactVO {
  uid: number;
  phoneMask?: string;
  phoneVerified?: number;
  realName?: string;
  kycLevel?: number;
  kycStatus?: number;
  kycVerifiedAt?: string;
}

export interface MemberProfileVO {
  uid: number;
  nickname?: string;
  avatarUrl?: string;
  gender?: number;
  birthday?: string;
  countryCode?: string;
  languageCode?: string;
  moralLevel?: number;
  inviteUid?: number;
  inviteCode?: string;
  parentAgentUid?: number;
  topAgentUid?: number;
  updatedAt?: string;
}

export interface MemberWithdrawAccountVO {
  accountId: number;
  uid: number;
  accountType?: number;
  bankCode?: string;
  bankName?: string;
  accountName?: string;
  accountNoMask?: string;
  ifscCode?: string;
  mobile?: string;
  isPrimary?: number;
  status?: number;
  verifiedAt?: string;
  lastUsedAt?: string;
  createdAt?: string;
}

export interface MemberTransactionQuery {
  pageNum?: number;
  pageSize?: number;
  currency?: string;
  bizType?: number;
}

export interface MemberTransactionVO {
  id: number;
  ledgerNo?: string;
  uid: number;
  bizType?: number;
  currency?: string;
  changeAmount?: number;
  beforeBalance?: number;
  afterBalance?: number;
  remark?: string;
  createdAt?: string;
}

export interface MemberMessageVO {
  mailId: number;
  uid: number;
  mailType?: number;
  title?: string;
  content?: string;
  isRead?: number;
  readAt?: string;
  rewardClaimed?: number;
  createdAt?: string;
}

export interface MemberRemarkVO {
  id: number;
  uid: number;
  oldRemark?: string;
  newRemark?: string;
  operatorId?: string;
  createdAt?: string;
}

export interface MemberBetStatVO {
  statDate: string;
  gameCode?: string;
  betCount?: number;
  betAmount?: number;
  validBetAmount?: number;
  payoutAmount?: number;
  netWinLoss?: number;
  killRate?: number;
}
