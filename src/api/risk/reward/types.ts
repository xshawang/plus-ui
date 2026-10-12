/**
 * 派奖监控与监测参数接口类型。
 * 契约来源：F:/G318Abt/MD_DOC/8_风控/02-派奖监控与监测参数.md
 */

export interface RiskRewardQuery extends PageQuery {
  /** 1待处理 2已处理 3已忽略；空=全部 */
  status?: number;
  /** 1高倍爆奖 2高倍爆奖中奖金额 3大额中奖 4会员获利比 */
  monitorType?: number;
  /** DAY/MONTH */
  period?: string;
  accountField?: string;
  accountValue?: string;
  currency?: string;
  params?: Record<string, unknown>;
}

export interface RiskRewardMonitorVO {
  /** 雪花ID，后端按字符串下发（超出 JS 安全整数范围，前端禁止用 Number 转换） */
  monitorId: number | string;
  currency?: string;
  uid?: number;
  loginName?: string;
  memberStatus?: number;
  memberStatusText?: string;
  loginIp?: string;
  registerSource?: string;
  monitorType?: number;
  monitorTypeText?: string;
  actualValue?: number;
  actualUnit?: string;
  actualText?: string;
  betAmount?: number;
  payoutAmount?: number;
  orderNo?: string;
  triggerAt?: string;
  status?: number;
  statusText?: string;
  remark?: string;
  operatorId?: string;
  operatedAt?: string;
}

/** 监测参数（派奖监测设置页签，按币种） */
export interface RiskRewardConfigVO {
  configId?: number;
  currency: string;
  currencyLabel?: string;
  highMultiple?: number;
  highMultipleWinAmount?: number;
  largeWinAmount?: number;
  profitRatio?: number;
  profitRatioValidBet?: number;
  operatorId?: string;
  updatedAt?: string;
}

/** 风控提醒设置（风控提醒设置页签，全局） */
export interface RiskAlertConfigVO {
  enabled: boolean;
  intervalSeconds: number;
}

export interface RiskRewardHandleForm {
  id?: number | string;
  ids?: Array<number | string>;
  /** 2已处理 3已忽略 */
  resultStatus: number;
  remark?: string;
}

export interface RiskCurrencyOption {
  label: string;
  value: string;
}
