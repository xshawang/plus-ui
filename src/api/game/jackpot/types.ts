/**
 * 彩金池管理（奖池运营台）类型定义。
 *
 * 契约来源：go88-service-infra GameJackpotController（读侧直连库表快照；写侧走 Dubbo 回 slot）。
 * 表口径见 docs/1014/slot奖池改制_交付说明与上线手册_20261015.md。
 */

/** 奖池台账一行（slot_jackpot_pool：每 game_code + jackpot_type 一行） */
export interface JackpotPoolOverviewVO {
  id?: number;
  gameCode?: string;
  gameName?: string;
  jackpotType?: string;
  /** 初始值（VND，永不派出，运营可改并留审计） */
  initialAmount?: number;
  /** 本轮累积注入（= 下次派奖额来源，派后清零） */
  cycleAccumulated?: number;
  /** 当前池值 = 初始值 + 本轮累积 */
  currentAmount?: number;
  /** 本轮随机必爆点 */
  armedTarget?: number;
  /** 注资比例（0.0162 = 1.62%） */
  contributionRate?: number;
  /** 累计爆奖次数 */
  totalTriggeredCount?: number;
  /** 累计注资总额 */
  totalContributed?: number;
  lastTriggeredAt?: string;
  lastTriggeredBy?: string;
  lastTriggeredAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** 派奖流水一行（slot_jackpot_record） */
export interface JackpotRecordVO {
  id?: number;
  gameCode?: string;
  gameName?: string;
  jackpotType?: string;
  uid?: number;
  roundId?: string;
  freeSpinId?: string;
  /** 派奖金额 */
  jackpotAmount?: number;
  poolBefore?: number;
  poolAfter?: number;
  /** 派奖时初始值快照 */
  initialAmountSnapshot?: number;
  /** 派奖前的本轮累积 */
  contributionBefore?: number;
  balanceBefore?: number;
  balanceAfter?: number;
  requestId?: string;
  createdAt?: string;
}

/** 注入逐笔一行（slot_jackpot_contribution） */
export interface JackpotContributionVO {
  id?: number;
  gameCode?: string;
  gameName?: string;
  jackpotType?: string;
  jackpotLevel?: number;
  tier?: number;
  uid?: string;
  roundId?: string;
  requestId?: string;
  freeSpinId?: string;
  betAmount?: number;
  contributionRate?: number;
  amount?: number;
  afterAccumulated?: number;
  afterPool?: number;
  createdAt?: string;
}

/** 奖池参数变更审计一行（slot_jackpot_pool_audit） */
export interface JackpotPoolAuditVO {
  id?: number;
  gameCode?: string;
  gameName?: string;
  jackpotType?: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  operatorId?: string;
  operatorName?: string;
  source?: string;
  createdAt?: string;
}

/** 奖池台账/审计查询条件 */
export interface JackpotPoolQuery {
  pageNum?: number;
  pageSize?: number;
  gameCode?: string;
  jackpotType?: string;
}

/** 流水类查询条件（派奖流水 / 注入逐笔 / 参数变更） */
export interface JackpotFlowQuery extends JackpotPoolQuery {
  uid?: string;
  requestId?: string;
  beginTime?: string;
  endTime?: string;
}

/**
 * 某游戏各层奖池实时参数快照（slot 侧 Redis 权威值，Dubbo 返回）。
 *
 * 为什么单独取这份：门槛 K_low / 上限 K_high / 期望派奖倍数 M / 本档总注 / 注资份额
 * 都只存在于 slot 的代码配置与 Redis，DB 表里没有；改初始值前需要它来复核"会不会倒挂"。
 */
export interface JackpotPoolConfigRow {
  level?: number;
  levelKey?: string;
  jackpotType?: string;
  jackpotKey?: string;
  /**
   * 池的运营性质（slot 侧 `JackpotService#jackpotLevelNature` 计算，2026-10-15 新增）：
   * - `PROGRESSIVE` 进度池：有份额 ⇒ 注资 + 走闸门判定 + ticker 广播；
   * - `FIXED`       固定奖层：份额 0 且声明了固定奖金额 ⇒ 不注资、不触发、金额恒定；
   * - `RESERVED`    保留档位：所属档位在前端契约里无 betId ⇒ 永不注资、永不触发（属既有事实）；
   * - `DISPLAY`     展示池：份额 0 且无固定奖声明。
   * 为什么需要它：此前只有"份额是不是 0"一个信号，运营无法区分"固定奖/保留/漏配"。
   */
  nature?: string;
  tier?: number;
  tierTotalBet?: number;
  share?: number;
  initialAmount?: number;
  cycleAccumulated?: number;
  currentAmount?: number;
  armedTarget?: number;
  gateLowAmount?: number;
  gateHighAmount?: number;
  expectedMultiple?: number;
  [key: string]: any;
}
