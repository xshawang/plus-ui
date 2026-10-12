/**
 * 充值大类与通道路由（需求文档 2_财务/02）类型定义。
 */
export interface FinanceChannelGroupVO {
  groupId: number;
  groupCode: string;
  groupName: string;
  groupIcon?: string;
  /** 1在线充值 2转账充值 3客服代充 4数字货币 */
  groupType?: number;
  linkGroupCode?: string;
  sortNo?: number;
  status?: number;
  remark?: string;
  operatorId?: string;
  createdAt?: string;
  updatedAt?: string;
  routes?: FinanceChannelRouteVO[];
}

export interface FinanceChannelRouteVO {
  routeId: number;
  groupId: number;
  routeCode: string;
  channelName: string;
  subSort?: number;
  merchantId?: number;
  merchantName?: string;
  currency?: string;
  currencyRate?: string;
  amountMin?: number;
  amountMax?: number;
  recommendAmounts?: string;
  feeRate?: number;
  successRate?: number;
  channelRemark?: string;
  status?: number;
  mergeFlag?: number;
  frontEnable?: number;
  blacklistEnable?: number;
  operatorId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceChannelGroupForm {
  groupId?: number;
  groupCode?: string;
  groupName?: string;
  groupIcon?: string;
  groupType?: number;
  linkGroupCode?: string;
  sortNo?: number;
  status?: number;
  remark?: string;
}

export interface FinanceChannelRouteForm {
  routeId?: number;
  groupId?: number;
  routeCode?: string;
  channelName?: string;
  subSort?: number;
  merchantId?: number;
  currency?: string;
  currencyRate?: string;
  amountMin?: number;
  amountMax?: number;
  recommendAmounts?: string;
  feeRate?: number;
  successRate?: number;
  channelRemark?: string;
  status?: number;
  mergeFlag?: number;
  frontEnable?: number;
  blacklistEnable?: number;
}

export interface FinanceChannelQuery {
  groupKeyword?: string;
  routeKeyword?: string;
  groupId?: number;
  merchantId?: number;
  groupType?: number;
  status?: number;
  frontEnable?: number;
}
