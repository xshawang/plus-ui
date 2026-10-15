/**
 * 钱包流水类型
 *
 * 字段对齐 go88_cloud_plus_2.6.2 中 user_wallet_ledger 定义（服务侧 WalletLedgerDO）。
 * 金额单位与后端一致（当前按 VND 原值展示，如后端按“分”存储请同步格式化逻辑）。
 */
export interface WalletLedgerVO {
  /** 流水ID */
  ledgerId?: string | number;
  /** 流水号（幂等键） */
  ledgerNo?: string;
  /** 钱包账户ID */
  accountId?: string | number;
  /** 用户UID */
  uid?: string | number;
  /** 业务类型：1充值 2提现 3下注 4结算 5活动 6手动调账 7保险箱转入 8保险箱转出 */
  bizType?: number;
  /** 业务单号 */
  bizNo?: string;
  /** 变动类型：1加款 2扣款 */
  changeType?: number;
  /** 币种 */
  currency?: string;
  /** 变动前可用余额 */
  beforeAvailable?: number;
  /** 变动金额（可正可负） */
  changeAmount?: number;
  /** 变动后可用余额 */
  afterAvailable?: number;
  /** 变动前红利余额 */
  beforeBonus?: number;
  /** 变动后红利余额 */
  afterBonus?: number;
  /** 变动前冻结余额 */
  beforeFrozen?: number;
  /** 变动后冻结余额 */
  afterFrozen?: number;
  /** 请求ID */
  requestId?: string;
  /** 是否在钱包展示 0否 1是 */
  showInWallet?: number;
  /** 转账类型：1总额变化 2账户互转 */
  transferType?: number;
  /** 转出方UID（0=平台） */
  fromUid?: string | number;
  /** 转入方UID（0=平台） */
  toUid?: string | number;
  /** 转账源字段名 */
  sourceField?: string;
  /** 游戏编码 */
  gameCode?: string;
  /** 游戏类型 */
  gameType?: number;
  /** 创建时间 */
  createdAt?: string;
  /** ext_json.commandType：BET=投注扣款 BONUS=中奖加款 MANUAL_CREDIT/MANUAL_DEBIT=人工调账 */
  commandType?: string;
  /** ext_json.gameId：游戏编码 */
  gameId?: string;
  /** ext_json.bizName：流水业务说明（投注扣款/中奖加款/手动调账-加款等） */
  bizName?: string;
  /** 原始扩展信息 */
  extJson?: string;
  /** 后端联表冗余：登录名（用户名称） */
  loginName?: string;
  /** 后端联表冗余：昵称 */
  nickName?: string;
}

export interface WalletLedgerQuery extends PageQuery {
  /** 用户UID */
  uid?: string | number;
  /** 流水号 */
  ledgerNo?: string;
  /** 业务单号 */
  bizNo?: string;
  /** 业务类型 */
  bizType?: number;
  /** 变动类型 */
  changeType?: number;
  /** 币种 */
  currency?: string;
  /** 游戏代码（game_catalog） */
  gameCode?: string;
  params?: any;
}

/** 游戏下拉选项 */
export interface GameCodeOption {
  /** 游戏代码 */
  gameCode?: string;
  /** 游戏中文名 */
  gameName?: string;
}

/**
 * 单个游戏的流水统计（流水列表上方统计表的一行）。
 *
 * 口径：投注 = 该游戏流水的扣款合计；派奖 = 该游戏流水的入账合计（均为正值）。
 */
export interface WalletLedgerGameStatVO {
  /** 游戏代码（user_wallet_ledger.game_code） */
  gameCode?: string;
  /** 游戏中文名（game_catalog；字典缺失时为空串） */
  gameName?: string;
  /** 投注金额（该游戏扣款合计） */
  betAmount?: number;
  /** 派奖金额（该游戏入账合计） */
  payoutAmount?: number;
}

/**
 * 流水列表「按查询条件分组统计」结果。
 *
 * 口径（后端 {@code GET /infra/member/ledger/summary}，不分页，覆盖当前全部查询条件）：
 * ① 游戏行：投注 = 扣款合计、派奖 = 入账合计；
 * ② 无游戏标记的流水（game_code 为空）：其他收入 = 加款合计、其他支出 = 扣款合计；
 * ③ 总收入 = 全部加款 = 派奖合计 + 其他收入；总支出 = 全部扣款 = 投注合计 + 其他支出。
 */
export interface WalletLedgerSummaryVO {
  /** 各游戏统计（仅有游戏标记的流水，按投注+派奖倒序） */
  games?: WalletLedgerGameStatVO[];
  /** 投注合计 */
  betTotal?: number;
  /** 派奖合计 */
  payoutTotal?: number;
  /** 其他收入（无游戏标记的加款合计） */
  otherIncome?: number;
  /** 其他支出（无游戏标记的扣款合计） */
  otherExpense?: number;
  /** 总收入（全部加款合计） */
  totalIncome?: number;
  /** 总支出（全部扣款合计） */
  totalExpense?: number;
}
