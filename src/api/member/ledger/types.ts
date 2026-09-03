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
