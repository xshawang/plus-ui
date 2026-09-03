/**
 * 提现订单类型
 *
 * 状态口径对齐 go88_cloud_plus_2.6.2 文档《支付提现通道预留设计》(withdraw_order)：
 * 0=APPLIED(待审核) 1=WALLET_FROZEN(已审核/待打款) 2=PAID(提现成功)
 * 3=REJECTED(已驳回) 4=CANCELED(已取消)
 */
export interface WithdrawOrderVO {
  /** 订单ID */
  id?: string | number;
  /** 平台订单号 */
  orderNo?: string;
  /** 用户UID */
  uid?: string | number;
  /** 提现金额 */
  amount?: number;
  /** 订单状态：0待审核 1已审核/待打款 2提现成功 3已驳回 4已取消 */
  status?: number;
  /** 支付渠道：banks/ewallet/crypto/card */
  channel?: string;
  /** 银行/通道编码 */
  bankCode?: string;
  /** 第三方订单号 */
  thirdPartyOrderNo?: string;
  /** 钱包流水ID（提现冻结/退回时写入 user_wallet_ledger） */
  walletLedgerNo?: string;
  /** 回调时间 */
  callbackAt?: string;
  /** 完成时间 */
  finishedAt?: string;
  /** 创建时间 */
  createdAt?: string;
  updatedAt?: string;
  /** 后端联表冗余：登录名 */
  loginName?: string;
  /** 后端联表冗余：昵称 */
  nickName?: string;
}

export interface WithdrawOrderQuery extends PageQuery {
  /** 用户UID */
  uid?: string | number;
  /** 平台订单号 */
  orderNo?: string;
  /** 订单状态 */
  status?: number;
  /** 支付渠道 */
  channel?: string;
  /** 银行/通道编码 */
  bankCode?: string;
  params?: any;
}

/** 提现状态操作请求体 */
export interface WithdrawActionForm {
  /** 订单ID */
  id: string | number;
  /** 平台订单号（后端幂等/对账用） */
  orderNo?: string;
  /** 操作备注 */
  remark?: string;
}
