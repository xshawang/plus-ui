/**
 * 代理账号（所有代理 / 顶层代理）接口类型。
 * 契约来源：F:/G318Abt/MD_DOC/10_代理/01-所有代理（代理账号管理与更多操作）需求.md
 */

/** 代理列表查询条件（两个页签共用） */
export interface AgentAccountQuery extends PageQuery {
  /** all=所有代理 top=顶层代理 */
  tab?: string;
  /** day/week/month（前端联动默认区间，服务端不参与过滤） */
  timeScope?: string;
  /** 成为代理时间起止（yyyy-MM-dd HH:mm:ss） */
  beginTime?: string;
  endTime?: string;
  /** 精准账号：支持批量（换行/逗号/空格分隔），服务端精确匹配 */
  accountKeyword?: string;
  /** 累计佣金区间（分） */
  commissionMin?: number;
  commissionMax?: number;
  /** 下级层数区间（顶层代理页签） */
  subLayerMin?: number;
  subLayerMax?: number;
  withdrawMethod?: number;
  agentWay?: number;
  /** 代理等级（后端按 layer_id 过滤，展示为 LV* 标签） */
  layerId?: number;
  registerSource?: string;
  currency?: string;
  status?: number;
}

/** 代理账号行 */
export interface AgentAccountVO {
  /** 雪花ID，后端按字符串下发（禁止 Number 转换） */
  agentId: number | string;
  uid?: number | string;
  currency?: string;
  loginName?: string;
  agentWay?: number;
  agentWayText?: string;
  agentType?: number;
  parentAgentId?: number | string;
  parentLoginName?: string;
  topAgentId?: number | string;
  topLoginName?: string;
  layerDepth?: number;
  modeId?: number | string;
  modeName?: string;
  layerId?: number | string;
  layerName?: string;
  labelId?: number | string;
  labelName?: string;
  /** 账号上方层级标签（截图 LV1） */
  layerTag?: string;
  directLayerId?: number | string;
  directLabelId?: number | string;
  withdrawMethod?: number;
  withdrawMethodText?: string;
  registerSource?: string;
  directCount?: number;
  otherCount?: number;
  subLayerCount?: number;
  agentTotal?: number;
  subTotal?: number;
  /** 金额单位：分 */
  totalCommission?: number;
  withdrawnAmount?: number;
  pendingAmount?: number;
  becameAgentAt?: string;
  promoLink?: string;
  visitCount?: number;
  /** 0关 1开 */
  bindNewSub?: number;
  brandId?: number | string;
  brandName?: string;
  status?: number;
}

/** 总计行（按币种） */
export interface AgentSummaryVO {
  currency?: string;
  agentCount?: number;
  directCount?: number;
  otherCount?: number;
  agentTotal?: number;
  subTotal?: number;
  totalCommission?: number;
  withdrawnAmount?: number;
  pendingAmount?: number;
}

/** 下拉选项（配置表与字典统一结构） */
export interface AgentOption {
  label: string;
  value: number | string;
  isDefault?: number;
  layerLevel?: number;
  brandCode?: string;
  currency?: string;
  listClass?: string;
  remark?: string;
}

/** 页面一次性下拉与配置 */
export interface AgentOptionsVO {
  currencies: AgentOption[];
  withdrawMethods: AgentOption[];
  agentWays: AgentOption[];
  registerSources: AgentOption[];
  applyStatuses: AgentOption[];
  modes: AgentOption[];
  layers: AgentOption[];
  labels: AgentOption[];
  brands: AgentOption[];
  pageSize?: number;
  exportRowLimit?: number;
}

/** 新增代理提交对象（新增弹窗 11 个字段） */
export interface AgentAddForm {
  hasParent: boolean;
  parentAgentId?: number | string;
  currency: string;
  loginName: string;
  loginPassword: string;
  payPassword?: string;
  modeId?: number;
  layerId?: number;
  labelId?: number;
  directLayerId?: number;
  directLabelId?: number;
  withdrawMethod?: number;
  brandId?: number;
}

/** 更多操作 / 修改代理模式 / 绑定开关 提交对象 */
export interface AgentChangeForm {
  agentId: number | string;
  parentAgentId?: number | string;
  withdrawMethod?: number;
  layerId?: number;
  labelId?: number;
  modeId?: number;
  bindNewSub?: number;
}

/** 批量操作提交对象 */
export interface AgentBatchForm {
  action: string;
  ids: Array<number | string>;
  withdrawMethod?: number;
  layerId?: number;
  labelId?: number;
  status?: number;
}

/** 修改代理模式弹窗回显 */
export interface AgentModeFormVO {
  brandLabel?: string;
  currency?: string;
  topAgentId?: number | string;
  topLoginName?: string;
  agentTotal?: number;
  currentModeId?: number | string;
  currentModeName?: string;
  modeOptions: AgentOption[];
  ruleText?: string;
}

/** 导入结果 */
export interface AgentImportResultVO {
  total: number;
  success: number;
  fail: number;
  failDetail?: string;
  message?: string;
}

/** 代理详情（含最近变更轨迹） */
export interface AgentDetailVO {
  account: AgentAccountVO;
  logs: Array<Record<string, any>>;
  children: number;
}
