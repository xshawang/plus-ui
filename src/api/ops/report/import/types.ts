/**
 * 导入执行（报表 → 导入执行）接口类型。
 * 契约来源：F:/G318Abt/MD_DOC/5_报表/05-导入执行.md
 */
export type ImportTaskRow = Record<string, any>;

export interface ImportTaskQuery {
  /** 所属模块：member/finance/order/game/agent/system */
  module?: string;
  moduleContent?: string;
  /** 0待执行 1执行中 2执行成功 3执行失败 4部分成功 */
  status?: number;
  keyword?: string;
  startTime?: string;
  endTime?: string;
  pageNum?: number;
  pageSize?: number;
}

export interface ImportTaskOption {
  label: string;
  value: string;
}

export interface ImportTaskOptions {
  modules: ImportTaskOption[];
  statuses: ImportTaskOption[];
}

export interface ImportResult {
  taskId: number;
  taskNo: string;
  status: number;
  totalCount: number;
  successCount: number;
  failCount: number;
  resultSummary: string;
  failures: Array<{ row: number; column: string; message: string; value: string }>;
  failTotal: number;
}
