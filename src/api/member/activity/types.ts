/**
 * 会员活跃度（需求文档 17，积分型非资金）类型定义。
 */
export interface ActivityPointQuery {
  pageNum?: number;
  pageSize?: number;
  uid?: number | string;
  loginName?: string;
  currency?: string;
}

export interface ActivityPointVO {
  uid: number;
  loginName?: string;
  currency?: string;
  totalEarned?: number;
  totalSpent?: number;
  totalExpired?: number;
  remainPoint?: number;
  expireAt?: string;
  updatedAt?: string;
}

export interface ActivityChangeForm {
  uid: number | string;
  requestId: string;
  /** 1后台增加 2后台扣减 3任务奖励 4消耗 5过期 */
  changeType: number;
  point: number;
  remark?: string;
}

export interface ActivityPointLogVO {
  id: number;
  requestId?: string;
  uid: number;
  currency?: string;
  changeType?: number;
  changePoint?: number;
  beforePoint?: number;
  afterPoint?: number;
  remark?: string;
  operatorId?: string;
  createdAt?: string;
}
