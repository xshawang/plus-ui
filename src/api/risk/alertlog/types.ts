/**
 * 风控「提醒留痕」接口类型（risk_alert_log）。
 * 表与写入口见 go88-service-infra：RiskAlertNotifier（写）、RiskAlertLogService（读）。
 */

export interface RiskAlertLogQuery {
  pageNum?: number;
  pageSize?: number;
  /** 会员UID（精确匹配） */
  uid?: number | string;
  /** 监测类型：1高倍爆奖 2高倍爆奖中奖金额 3大额中奖 4会员获利比 */
  monitorType?: number;
  /** 结局：SENT/SKIPPED_OFF/SKIPPED_LIMIT/FAILED */
  result?: string;
  /** 时间区间（RuoYi 约定 params.beginTime/endTime） */
  params?: Record<string, unknown>;
}

export interface RiskAlertLogVO {
  /** 雪花ID，后端按字符串下发（超出 JS 安全整数范围，前端禁止 Number 转换） */
  id: number | string;
  /** 台账ID（可回查派奖监控列表） */
  monitorId: number | string;
  uid?: number | string;
  loginName?: string;
  currency?: string;
  monitorType?: number;
  monitorTypeText?: string;
  /** 派奖金额（分） */
  payoutAmount?: number;
  orderNo?: string;
  /** 结局码 */
  result?: string;
  /** 结局文案（后端已翻译：已推送 / 未推送（开关关闭）/ 未推送（限频跳过）/ 推送失败） */
  resultText?: string;
  /** 接收人ID列表（最多 20 个，逗号分隔；空=群发） */
  receivers?: string;
  receiverCount?: number;
  remark?: string;
  createdAt?: string;
}
