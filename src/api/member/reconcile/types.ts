/**
 * 会员资金链路对账差异（08 文档 + go88-job 对账任务）类型定义。
 */
export interface ReconcileQuery {
  pageNum?: number;
  pageSize?: number;
  uid?: number | string;
  loginName?: string;
  status?: number;
  keyword?: string;
  dateStart?: string;
  dateEnd?: string;
  dateRange?: string[];
}

export interface MemberReconcileErrorVO {
  id: number;
  uid: number;
  loginName?: string;
  accountType?: string;
  checkType?: string;
  ledgerBalance?: number;
  diffAmount?: number;
  status?: number;
  remark?: string;
  createdAt?: string;
  handledAt?: string;
}

export interface ReconcileSummaryVO {
  pending?: number;
  daily?: { statDate?: string; totalCount?: number; pendingCount?: number; absDiffAmount?: number }[];
}
