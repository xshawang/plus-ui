/**
 * 人工拉回修正（需求文档 2_财务/12）类型定义。
 */
export interface FinanceMemberAssetVO {
  uid: number;
  account?: string;
  nickName?: string;
  realName?: string;
  vipLevel?: number;
  status?: number;
  /** 主钱包可用余额（分） */
  available?: number;
  /** 利息宝/保险箱余额（分） */
  extra?: number;
  bonus?: number;
  frozen?: number;
  /** 合计总余额 = available + extra（分） */
  total?: number;
}

export interface FinanceManualAdjustVO {
  adjustId: number;
  adjustNo: string;
  uid: number;
  account?: string;
  nickName?: string;
  vipLevel?: number;
  /** 1手动加款 2手动扣除 3扣除全部资产 4追缴扣除 5人工拉回 */
  adjustType: number;
  walletType?: string;
  walletName?: string;
  adjustAmount?: number;
  turnoverMultiple?: number;
  turnoverAmount?: number;
  chaseAmount?: number;
  chasedAmount?: number;
  unchasedAmount?: number;
  /** 0待审核 1已发放 2已拒绝 3已扣除 4已追缴 6失败 */
  status: number;
  ledgerNo?: string;
  requestId?: string;
  adjustReason?: string;
  frontRemark?: string;
  backRemark?: string;
  failReason?: string;
  operatorId?: string;
  auditOperatorId?: string;
  auditedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceManualAdjustForm {
  uid?: number;
  account?: string;
  adjustType: number;
  adjustAmount?: number;
  turnoverMultiple?: number;
  adjustReason?: string;
  frontRemark?: string;
  backRemark?: string;
  /** 幂等请求号：同一笔提交重试必须复用 */
  requestId?: string;
}

export interface FinanceManualAdjustQuery {
  uid?: number;
  account?: string;
  adjustType?: number;
  status?: number;
  walletType?: string;
  adjustNo?: string;
  pageNum?: number;
  pageSize?: number;
  params?: Record<string, unknown>;
}
