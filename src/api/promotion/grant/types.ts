/**
 * 优惠领取与审核（需求文档 07）类型定义。
 */
export interface PromoGrantQuery {
  pageNum?: number;
  pageSize?: number;
  /** audit/apply/big/unmatched/pendingApply/pendingClaim/claimed/rejected/expired/all */
  tab?: string;
  orderNo?: string;
  account?: string;
  accountType?: string;
  activityId?: number;
  activityName?: string;
  rewardType?: number;
  source?: string;
  currency?: string;
  creator?: string;
  timeStart?: string;
  timeEnd?: string;
}

export interface PromoGrantVO {
  orderId: number;
  orderNo: string;
  batchNo?: string;
  activityId?: number;
  activityName?: string;
  activityType?: string;
  uid?: number;
  account?: string;
  memberLevel?: string;
  vipLevel?: number;
  currency?: string;
  accountType?: string;
  registerSource?: string;
  totalRecharge?: number;
  source?: string;
  sourceType?: number;
  rewardType?: number;
  rewardAmount?: number;
  rewardDesc?: string;
  auditMultiple?: number;
  claimableAt?: string;
  expireAt?: string;
  dispatchMode?: string;
  status?: number;
  rejectReason?: string;
  unmatchedReason?: string;
  frontRemark?: string;
  backRemark?: string;
  claimTerminal?: string;
  deviceType?: string;
  deviceNo?: string;
  fingerprint?: string;
  claimIp?: string;
  bigAmount?: number;
  creator?: string;
  createdAt?: string;
  operatorId?: string;
  operatedAt?: string;
  /** 入账失败原因（状态=7 派发失败） */
  failReason?: string;
  /** 入账重试次数 */
  retryCount?: number;
  /** 真实到账时间（钱包/幸运值入账完成时刻） */
  grantedAt?: string;
  /** 履约方式（PHYSICAL 实物 / CDKEY 兑换码） */
  fulfillMode?: string;
  /** 履约凭证（快递单号或兑换码） */
  fulfillNo?: string;
  /** 履约完成时间 */
  fulfillAt?: string;
}

export interface PromoGrantFulfillForm {
  fulfillMode: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  expressCompany?: string;
  expressNo?: string;
  cdkey?: string;
  remark?: string;
}

/** 发放对账（L12） */
export interface PromoGrantReconcileQuery {
  pageNum?: number;
  pageSize?: number;
  runDate?: string;
  diffType?: string;
  status?: number;
  orderNo?: string;
  account?: string;
}

export interface PromoGrantReconcileVO {
  id: number;
  runDate?: string;
  diffType: string;
  orderId?: number;
  orderNo: string;
  uid?: number;
  account?: string;
  activityId?: number;
  activityName?: string;
  rewardType?: number;
  rewardAmount?: number;
  ledgerAmount?: number;
  turnoverTarget?: number;
  detail?: string;
  status?: number;
  handler?: string;
  handledAt?: string;
  remark?: string;
  createdAt?: string;
}

export interface PromoGrantAuditForm {
  orderIds: number[];
  action: string;
  reason?: string;
  backRemark?: string;
}

export interface PromoGrantDispatchForm {
  activityId?: number;
  accounts: string[];
  rewardType: number;
  rewardAmount: number;
  auditMultiple?: number;
  claimableAt?: string;
  expireAt?: string;
  dispatchMode?: string;
  rewardDesc?: string;
  frontRemark?: string;
  backRemark?: string;
  currency: string;
}

export interface PromoDispatchLimitVO {
  limitId: number;
  currency: string;
  singleMaxAmount?: number;
  activityTotalMaxAmount?: number;
  bigAmountThreshold?: number;
  bigAmountAuditEnabled?: number;
  operatorId?: string;
  updatedAt?: string;
}
