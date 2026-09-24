/**
 * VIP 等级与 VIP 奖励（需求文档 06）类型定义。
 *
 * 金额口径：等级配置的累计充值/提现额度为 VND；奖励矩阵的门槛与金额为「分」。
 */
export interface VipLevelConfigVO {
  vipLevel: number;
  levelName?: string;
  currency?: string;
  badgeIcon?: string;
  minPayTotal?: number;
  minRounds?: number;
  dailyGift?: number;
  feeDiscountRate?: number;
  withdrawDailyLimit?: number;
  withdrawDailyTimes?: number;
  dailyFreeFeeTimes?: number;
  status?: number;
  operatorId?: string;
  updatedAt?: string;
  memberCount?: number;
}

export interface VipRewardConfigVO {
  configId: number;
  vipLevel: number;
  /** 1晋级奖金 2日工资 3周工资 4月工资 5生日礼金 */
  rewardType: number;
  needDeposit?: number;
  needBet?: number;
  amount?: number;
  capAmount?: number;
  status?: number;
}

export interface VipRewardConfigForm {
  vipLevel: number;
  items: Array<{
    rewardType: number;
    needDeposit?: number;
    needBet?: number;
    amount?: number;
    capAmount?: number;
    status?: number;
  }>;
}

export interface VipRewardRecordQuery {
  pageNum?: number;
  pageSize?: number;
  uid?: number | string;
  loginName?: string;
  vipLevel?: number;
  rewardType?: number;
  status?: number;
}

export interface VipRewardRecordVO {
  recordId: number;
  uid: number;
  loginName?: string;
  vipLevel?: number;
  rewardType?: number;
  periodKey?: string;
  amount?: number;
  /** 1待发放 2已发放 3已取消 4异常 */
  status?: number;
  bizNo?: string;
  failReason?: string;
  retryCount?: number;
  operatorId?: string;
  createdAt?: string;
  finishedAt?: string;
}

export interface VipDisburseForm {
  rewardType: number;
  startDate?: string;
  endDate?: string;
  periodKey?: string;
  uid?: number | string;
}

export interface ConfigItemVO {
  configKey: string;
  configValue: string;
  configDesc?: string;
  operatorId?: string;
  updatedAt?: string;
}
