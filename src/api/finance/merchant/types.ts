/**
 * 三方支付/代付商户（需求文档 2_财务/03）类型定义。
 */
export interface FinanceMerchantVO {
  merchantId: number;
  merchantCode: string;
  merchantName: string;
  /** 1三方支付(收单) 2三方代付(出款) */
  merchantType: number;
  providerCode?: string;
  platform?: string;
  currency?: string;
  apiUrl?: string;
  apiKey?: string;
  /** 密钥掩码（后端只返回掩码） */
  apiSecretMask?: string;
  notifyUrl?: string;
  extParams?: string;
  feeRate?: number;
  amountMin?: number;
  amountMax?: number;
  dailyLimit?: number;
  priorityNo?: number;
  /** 跑路风险:1高 2中 3低 */
  riskLevel?: number;
  status?: number;
  remark?: string;
  operatorId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceMerchantForm {
  merchantId?: number;
  merchantCode?: string;
  merchantName?: string;
  merchantType?: number;
  providerCode?: string;
  platform?: string;
  currency?: string;
  apiUrl?: string;
  apiKey?: string;
  apiSecret?: string;
  notifyUrl?: string;
  extParams?: string;
  feeRate?: number;
  amountMin?: number;
  amountMax?: number;
  dailyLimit?: number;
  priorityNo?: number;
  riskLevel?: number;
  status?: number;
  remark?: string;
}

export interface FinanceMerchantQuery {
  keyword?: string;
  merchantType?: number;
  providerCode?: string;
  riskLevel?: number;
  status?: number;
  pageNum?: number;
  pageSize?: number;
}
