/** 风控中心（FIX-17）：网关接入层风控记录与解封。 */
export interface RiskRecordQuery extends PageQuery {
  /** 维度：ip / device / uid / global；空=全部 */
  dimension?: string;
  /** 风险键（IP/设备指纹/uid）模糊匹配 */
  key?: string;
  /** 状态：ACTIVE / RELEASED / ALARM / DRY_RUN / DISPATCHED，默认 ACTIVE */
  status?: string;
}

export interface RiskRecordVO {
  id: number;
  riskDimension: string;
  riskKey: string;
  ruleType: string;
  level: number;
  status: string;
  reason: string;
  eventCount: number;
  banStart?: string;
  banUntil?: string;
  operator?: string;
  releaseTime?: string;
  /** 触发网关实例（FIX-05 起才有值，集群排障用） */
  gatewayId?: string;
  createdAt: string;
}

export interface RiskReleaseForm {
  dimension: string;
  key: string;
}

/**
 * 下注频率**采集健康度**（GET /infra/risk/bet-peaks/meta，FIX-10 C 项）。
 *
 * 用途：`/bet-peaks` 返回空时区分三种情况 —— ①采集未生效（lastAnchorAt 为空）
 * ②采集正常但没有高频下注 ③有数据。用于排障与阈值标定前的自检。
 */
export interface RiskBetPeaksMeta {
  /** 采集来源，如 wallet-anchor(BET) */
  source?: string;
  /** 新口径峰值键名（钱包流水锚点） */
  walletPeakKey?: string;
  /** 最后一条 BET 锚点时间（epoch millis）；null = 未消费到锚点 */
  lastAnchorAt?: number | null;
  /** 累计已处理锚点条数 */
  anchorsHandled?: number | null;
  /** 网关 allowBet 钩子计数（旧口径对照）；null = 钩子从未触发 */
  gatewayHookCount?: number | null;
  /** 钱包锚点口径的峰值用户数 */
  walletPeakUsers?: number;
  /** 网关钩子口径的峰值用户数 */
  gatewayPeakUsers?: number;
  /** 列表为空时的原因说明；有数据时为 null */
  emptyReason?: string | null;
}
