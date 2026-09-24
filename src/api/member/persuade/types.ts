/**
 * 会员劝退（需求文档 08，真实资金）类型定义。
 *
 * 默认口径：可选扣款 + 全额退还剩余本金；幂等键由前端生成的 requestId 保证。
 */
export interface PersuadeOrderQuery {
  pageNum?: number;
  pageSize?: number;
  uid?: number | string;
  loginName?: string;
  /** 1待处理 2处理中 3已完成 4已取消 5异常 */
  status?: number;
  params?: Record<string, unknown>;
}

export interface PersuadeOrderVO {
  orderId: number;
  requestId?: string;
  uid: number;
  loginName?: string;
  currency?: string;
  status?: number;
  persuadeStatus?: number;
  availableBefore?: number;
  penaltyAmount?: number;
  refundAmount?: number;
  reason?: string;
  remark?: string;
  failReason?: string;
  retryCount?: number;
  operatorName?: string;
  createdAt?: string;
  finishedAt?: string;
}

export interface PersuadeSubmitForm {
  uid: number | string;
  /** 请求幂等号（建议前端生成，保证重复提交不重复入账） */
  requestId: string;
  penaltyAmount?: number;
  reason: string;
  remark?: string;
}

export interface PersuadeActionForm {
  orderId: number;
  reason?: string;
}
