/**
 * 账变记录（报表 → 账变记录）接口类型。
 * 契约来源：F:/G318Abt/MD_DOC/5_报表/01-账变记录.md
 */
export type LedgerRow = Record<string, any>;

export interface LedgerQuery {
  /** 会员UID */
  uid?: number | string;
  /** 会员账号（模糊） */
  account?: string;
  /** 最后操作人（模糊） */
  operator?: string;
  /** 业务单号（模糊） */
  bizNo?: string;
  /** 变动类型：1 发放入账 / 2 回收扣款 */
  changeType?: number;
  /** 变动钱包：available/frozen/bonus */
  wallet?: string;
  /** 账变大类：recharge/withdraw/transfer/reward/activity/rebate/manual/commission/safe/bet */
  category?: string;
  currency?: string;
  /** 交易时间起（yyyy-MM-dd HH:mm:ss） */
  startTime?: string;
  /** 交易时间止 */
  endTime?: string;
  pageNum?: number;
  pageSize?: number;
}

export interface LedgerPage {
  rows: LedgerRow[];
  total: number;
  pageNum: number;
  pageSize: number;
  /** 当前页变动金额小计（服务端算） */
  subtotal: number;
  /** 当前筛选条件下变动金额总计（服务端算） */
  totalAmount: number;
  /** 当前筛选条件下发放入账合计 */
  creditAmount: number;
  /** 当前筛选条件下回收扣款合计（正数） */
  debitAmount: number;
}

export interface LedgerOption {
  label: string;
  value: string;
  listClass?: string;
  remark?: string;
}

export interface LedgerOptions {
  categories: LedgerOption[];
  wallets: LedgerOption[];
  currencies: string[];
  /** 账户明细可查询天数 */
  queryDays: number;
}

/** 「前端数据展示天数」弹窗结构 */
export interface QueryDaysConfig {
  values: Record<string, number>;
  options: number[];
  items: Array<{ key: string; label: string; value: number }>;
}
