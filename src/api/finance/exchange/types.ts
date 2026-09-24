/**
 * 汇率与银行管理（需求文档 2_财务/14）类型定义。
 */
export interface FinanceExchangeRateVO {
  rateId: number;
  currencyCode: string;
  currencyName?: string;
  baseCurrency?: string;
  rechargeRate?: number;
  withdrawRate?: number;
  rateDiff?: number;
  displayRate?: string;
  autoSync?: number;
  syncSource?: string;
  effective?: number;
  status?: number;
  sortNo?: number;
  remark?: string;
  operatorId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceExchangeRateForm {
  rateId?: number;
  currencyCode?: string;
  currencyName?: string;
  baseCurrency?: string;
  rechargeRate?: number;
  withdrawRate?: number;
  rateDiff?: number;
  displayRate?: string;
  autoSync?: number;
  syncSource?: string;
  effective?: number;
  status?: number;
  sortNo?: number;
  remark?: string;
}

export interface FinanceExchangeRateQuery {
  keyword?: string;
  baseCurrency?: string;
  status?: number;
  effective?: number;
}

export interface FinanceBankVO {
  id: number;
  bankCode: string;
  bankName: string;
  channelType?: string;
  platform?: string;
  smartpayCode?: string;
  /** 1充值银行 2提现银行 3支付通道 */
  bizType?: number;
  status?: number;
  fee?: number;
  bonusAmount?: number;
  minAmount?: number;
  maxAmount?: number;
  orderNavigate?: number;
  receiveNumber?: string;
  timeLimit?: number;
  statementTime?: string;
  createdAt?: string;
  updatedAt?: string;
}
