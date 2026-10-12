/**
 * 派奖监控（菜单 995002）类型定义。
 *
 * 背景：页面由「台账 + 页签计数 + 监测参数弹窗」三块组成，
 * 台账行是 risk_reward_monitor 与 player_account / channel_config 的只读聚合，
 * 金额一律按「分」返回（与钱包口径一致），由页面统一转 VND 展示。
 * 字段与 go88-service-infra 的 org.dromara.go88.risk.domain 一一对应。
 */

import type { RiskDictOption } from '@/api/risk/types';

/** 台账状态：1待处理 2已处理 3已忽略；null / undefined = 全部 */
export type RiskRewardStatus = 1 | 2 | 3;

/** 监测类型：1高倍爆奖 2高倍爆奖中奖金额 3大额中奖 4会员获利比 */
export type RiskRewardMonitorType = 1 | 2 | 3 | 4;

/** 台账查询参数（对应 RiskRewardMonitorQuery） */
export interface RiskRewardMonitorQuery extends PageQuery {
  /** 状态：1待处理 2已处理 3已忽略；空=全部 */
  status?: RiskRewardStatus;
  /** 监测类型：1..4；空=全部类型 */
  monitorType?: RiskRewardMonitorType;
  /** 统计口径：DAY / MONTH（只影响默认时间区间与展示粒度） */
  period?: 'DAY' | 'MONTH';
  /** 查询字段选择器：LOGIN_NAME / UID */
  accountField?: string;
  /** 查询字段对应的值 */
  accountValue?: string;
  /** 币种 */
  currency?: string;
  /** 时间区间（RuoYi 约定 params.beginTime / params.endTime） */
  params?: Record<string, any>;
}

/** 台账行（对应 RiskRewardMonitorVO） */
export interface RiskRewardMonitorVO {
  /** risk_reward_monitor 主键（雪花 ID，必须按字符串透传） */
  monitorId?: string | number;
  currency?: string;
  uid?: string | number;
  loginName?: string;
  /** 会员账号状态：1正常 2锁定 3注销 */
  memberStatus?: number;
  memberStatusText?: string;
  loginIp?: string;
  /** 注册来源（渠道名或「官网」） */
  registerSource?: string;
  monitorType?: number;
  monitorTypeText?: string;
  /** 命中时的实际参数（倍 / % / 分，单位见 actualUnit） */
  actualValue?: number | string;
  /** 实际参数单位：倍 / % / VND */
  actualUnit?: string;
  /** 实际参数展示串（服务端拼好，避免各端格式化不一致） */
  actualText?: string;
  /** 有效投注（分） */
  betAmount?: number;
  /** 派奖金额（分） */
  payoutAmount?: number;
  orderNo?: string;
  triggerAt?: string;
  /** 1待处理 2已处理 3已忽略 */
  status?: number;
  statusText?: string;
  remark?: string;
  operatorId?: string;
  operatedAt?: string;
}

/** 处理 / 忽略入参（对应 RiskRewardHandleDTO） */
export interface RiskRewardHandleForm {
  /** 批量处理的记录集合 */
  ids?: Array<string | number>;
  /** 单条处理时的主键（与 ids 二选一） */
  id?: string | number;
  /** 处理结果：2已处理（风险成立） 3已忽略（误报） */
  resultStatus?: number;
  /** 处理备注 */
  remark?: string;
}

/** 监测参数（对应 RiskRewardConfigVO） */
export interface RiskRewardConfigVO {
  configId?: string | number;
  currency?: string;
  currencyLabel?: string;
  /** 高倍爆奖（倍） */
  highMultiple?: number | string;
  /** 高倍爆奖中奖金额（分） */
  highMultipleWinAmount?: number;
  /** 大额中奖（分） */
  largeWinAmount?: number;
  /** 会员获利比（%） */
  profitRatio?: number | string;
  /** 获利比触发有效投注值（分） */
  profitRatioValidBet?: number;
  operatorId?: string;
  updatedAt?: string;
}

/** 监测参数保存入参（对应 RiskRewardConfigDTO） */
export interface RiskRewardConfigForm {
  currency?: string;
  currencyLabel?: string;
  highMultiple?: number | string;
  highMultipleWinAmount?: number;
  largeWinAmount?: number;
  profitRatio?: number | string;
  profitRatioValidBet?: number;
}

/** 风控提醒设置（对应 RiskAlertConfigDTO，全局维度而非按币种） */
export interface RiskAlertConfigForm {
  /** 风控提示开关 */
  enabled?: boolean;
  /** 提醒间隔时间（秒） */
  intervalSeconds?: number;
}

/** 币种下拉项（GET /infra/risk/reward/config/currencies） */
export interface RiskCurrencyOption {
  value: string;
  label: string;
}

/** 派奖监控页面下拉（监测类型 / 处理状态），取自 sys_dict_data */
export interface RiskRewardOptions {
  monitorTypes?: RiskDictOption[];
  statuses?: RiskDictOption[];
}

/** 页签计数（待处理红点）：pending/handled/ignored/all */
export interface RiskRewardTabCounts {
  pending?: number;
  handled?: number;
  ignored?: number;
  all?: number;
}
