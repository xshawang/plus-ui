/**
 * 导出下载（报表 → 导出下载）接口类型。
 * 契约来源：F:/G318Abt/MD_DOC/5_报表/04-导出下载.md
 */
export type ExportTaskRow = Record<string, any>;

export interface ExportTaskQuery {
  /** 一级菜单名，如「报表」「运营管理」 */
  module?: string;
  moduleContent?: string;
  /** 0待生成 1生成中 2已完成 3已失败 9已删除 */
  status?: number;
  keyword?: string;
  startTime?: string;
  endTime?: string;
  pageNum?: number;
  pageSize?: number;
}

export interface ExportTaskOption {
  label: string;
  value: string;
}

export interface ExportTaskOptions {
  modules: ExportTaskOption[];
  statuses: ExportTaskOption[];
}
