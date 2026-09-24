/**
 * 流水稽核任务（需求文档 2_财务/13）类型定义。
 */
export interface FinanceAuditTaskVO {
  taskId: number;
  uid: number;
  account?: string;
  nickName?: string;
  vipLevel?: number;
  /** 1充值 2首充奖励 3活动奖金 4VIP奖励 */
  sourceType: number;
  sourceNo?: string;
  sourceAmount?: number;
  rolloverMultiple?: number;
  targetAmount?: number;
  rolledAmount?: number;
  remainingAmount?: number;
  /** 0进行中 1已达标 2已过期 3已手动清除 */
  status: number;
  gameScope?: string;
  minBetAmount?: number;
  expireAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceAuditTaskForm {
  uid?: number;
  account?: string;
  sourceType: number;
  sourceNo?: string;
  sourceAmount?: number;
  rolloverMultiple?: number;
  expireDays?: number;
  gameScope?: string;
}

export interface FinanceAuditTaskQuery {
  uid?: number;
  account?: string;
  sourceType?: number;
  status?: number;
  sourceNo?: string;
  pageNum?: number;
  pageSize?: number;
  params?: Record<string, unknown>;
}
