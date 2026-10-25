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
  /** 是否主播号：0否 1是（与账号类型分开展示，避免把主播号误判为测试账号） */
  isStreamer?: number;
  registerType?: string;
  /**
   * 注册终端：web/h5/app。
   *
   * 按 player_account.register_device 匹配 player_device.device_fingerprint，
   * 取最早一条设备记录的 client_type；不是最近登录终端。
   */
  registerClientType?: string;
  verifyType?: string;
  vipLevel?: number;
  levelId?: number;
  levelName?: string;
  /** 会员标签（逗号拼接的名称，与 tagColor 同序） */
  tagNames?: string;
  /** 会员标签颜色（与 tagNames 同序的逗号拼接，前端按同一索引取色） */
  tagColor?: string;
  /**
   * 当前备注。
   *
   * 与「历史备注」页签同源：取 member_remark_log 最近一条 new_remark，
   * 页签保存后备注后刷新概览即可看到一致结果。
   */
  remark?: string;
  realName?: string;
  bonusDepositRatio?: number;
  vipUpgradeNeedPay?: number;
  vipUpgradeNeedRounds?: number;
  /** VIP 打码进度使用的累计局数（player_stats.total_rounds） */
  totalRounds?: number;
  /** 累计有效打码（分，player_stats.total_valid_bet_amount） */
  totalValidBetAmount?: number;
  /** 提现仍需完成的打码（分，player_stats.withdraw_required_turnover） */
  withdrawRequiredTurnover?: number;
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
  /** LEGACY_BANK / WITHDRAW_BENEFICIARY / CRYPTO_ADDRESS */
  sourceType?: string;
  /** 后台展示用账户分类。 */
  accountKind?: string;
  accountType?: number;
  bankCode?: string;
  bankName?: string;
  accountName?: string;
  /** 已解密的完整提现账号或链上地址。 */
  accountNo?: string;
  accountNoMask?: string;
  address?: string;
  coinName?: string;
  networkName?: string;
  addressLabel?: string;
  platform?: string;
  tabCode?: string;
  channelCode?: string;
  /** 历史账户只有哈希时无法还原完整账号。 */
  plaintextAvailable?: boolean;
  ifscCode?: string;
  mobile?: string;
  isPrimary?: number;
  status?: number;
  verifiedAt?: string;
  lastUsedAt?: string;
  createdAt?: string;
  updatedAt?: string;
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
