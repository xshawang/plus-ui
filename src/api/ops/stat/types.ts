/**
 * 运营统计（运营后台 → 运营管理 → 运营统计）接口类型。
 * 契约来源：F:/G318Abt/MD_DOC/4_运营/07-运营统计.md（截图 运营统计01.png / 运营统计-未登录会员分析.png）。
 * 说明：报表行是「服务端算好的指标集合」，字段随页签不同，因此统一用宽松记录类型承载。
 */
export type StatRow = Record<string, any>;

export interface StatQuery {
  startDate?: string;
  endDate?: string;
  uid?: number;
  /** 精准搜索字段：account / uid / agent */
  searchType?: string;
  /** 精准搜索值 */
  keyword?: string;
  /** 分类多选（电子/捕鱼/棋牌/真人/体育/区块链/彩票/斗鸡） */
  categories?: string[];
  pageNum?: number;
  pageSize?: number;
}

export interface StatExportForm {
  bizType: string;
  startDate?: string;
  endDate?: string;
  uid?: number;
}

export interface StatExportTask {
  taskId: number;
  taskNo: string;
  bizType: string;
  status: number;
  fileUrl?: string;
  fileSize?: number;
  rowCount?: number;
  failReason?: string;
  createdAt?: string;
  finishedAt?: string;
}
