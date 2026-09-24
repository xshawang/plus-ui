/**
 * 主播号（需求文档 18）类型定义。
 *
 * 说明：主播号是虚拟账号（is_mock_data=1），余额为虚拟额度（VND，2 位小数），不参与真实资金对账。
 */
export interface StreamerQuery {
  pageNum?: number;
  pageSize?: number;
  dateField?: string;
  accountField?: string;
  accountValue?: string;
  currency?: string;
  vipLevel?: number;
  levelId?: number;
  accountStatus?: number;
  onlineStatus?: number;
  params?: Record<string, unknown>;
}

export interface StreamerVO {
  streamerId: number;
  username: string;
  currency?: string;
  /** 1=正常 2=冻结 0=停用 */
  accountStatus?: number;
  virtualBalance?: number;
  vipLevel?: number;
  levelId?: number;
  levelName?: string;
  onlineStatus?: number;
  withdrawPasswordSet?: boolean;
  withdrawAccountCount?: number;
  lastLoginTime?: string;
  lastLoginDevice?: string;
  lastLoginIp?: string;
  lastLoginRegion?: string;
  lastLogoutTime?: string;
  lastLogoutDevice?: string;
  lastLogoutIp?: string;
  lastLogoutRegion?: string;
  remark?: string;
  operatorName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StreamerCreateForm {
  username: string;
  password: string;
  currency?: string;
  initBalance?: number;
  vipLevel?: number;
  levelId?: number;
  remark?: string;
}

/** 人工变更：一次只允许一个维度（与后端约束一致） */
export interface StreamerChangeForm {
  streamerId: number;
  accountStatus?: number;
  virtualBalance?: number;
  addAmount?: number;
  subAmount?: number;
  vipLevel?: number;
  levelId?: number;
  loginPassword?: string;
  withdrawPassword?: string;
  remark?: string;
  reason?: string;
}

export interface StreamerTransactionQuery {
  pageNum?: number;
  pageSize?: number;
  streamerId: number;
  walletType?: string;
  categoryType?: string;
  transactionNo?: string;
  startDate?: string;
  endDate?: string;
}

export interface StreamerTransactionVO {
  id: number;
  transactionNo?: string;
  streamerId: number;
  username?: string;
  walletType?: string;
  categoryType?: string;
  subTypeDesc?: string;
  beforeBalance?: number;
  changeAmount?: number;
  afterBalance?: number;
  frontendRemark?: string;
  operatorName?: string;
  transactionTime?: string;
}

export interface StreamerRemarkLogVO {
  id: number;
  streamerId: number;
  bizType?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  operatorName?: string;
  createdAt?: string;
}
