/**
 * 留存统计（报表 → 留存统计）接口类型。
 * 契约来源：F:/G318Abt/MD_DOC/5_报表/03-留存统计.md
 */
export type RetentionRow = Record<string, any>;

export interface RetentionQuery {
  /** recharge_common / recharge_precise / device_recharge_common / device_recharge_precise / bet_common / bet_precise */
  algo?: string;
  deviceType?: string;
  deviceClient?: string;
  currency?: string;
  /** all 全部会员 / new 新注册会员 */
  memberScope?: string;
  startDate?: string;
  endDate?: string;
  pageNum?: number;
  pageSize?: number;
}

export interface RetentionPage {
  rows: RetentionRow[];
  total: number;
  /** 底部「平均值」行 */
  average: RetentionRow;
}

export interface RetentionOption {
  label: string;
  value: string;
}

export interface RetentionOptions {
  algos: RetentionOption[];
  deviceTypes: RetentionOption[];
  deviceClients: RetentionOption[];
}
