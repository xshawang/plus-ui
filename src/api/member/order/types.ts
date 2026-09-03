/**
 * 充值/提现订单类型
 *
 * 字段对齐 go88_cloud_plus_2.6.2 中 payment_order(PaymentOrderDO) 定义：
 * type 1=充值 2=提现。若后端改为 pay_order/user_withdraw_order 分表，仅需替换本 VO
 * 与后端联表返回字段，页面无需大改。
 */
export interface MemberOrderVO {
  /** 订单ID */
  id?: string | number;
  /** 平台订单号 */
  orderNo?: string;
  /** 用户UID */
  uid?: string | number;
  /** 订单类型：1充值 2提现 */
  type?: number;
  /** 金额 */
  amount?: number;
  /** 状态：0待支付 1处理中 2成功 3失败 4已取消 */
  status?: number;
  /** 支付渠道：banks/ewallet/crypto/card */
  channel?: string;
  /** 银行/通道编码 */
  bankCode?: string;
  /** 第三方订单号 */
  thirdPartyOrderNo?: string;
  /** 回调时间 */
  callbackAt?: string;
  /** 卡品牌 */
  cardProvider?: string;
  /** 创建时间 */
  createdAt?: string;
  updatedAt?: string;
  /** 后端联表冗余：登录名 */
  loginName?: string;
  /** 后端联表冗余：昵称 */
  nickName?: string;
}

export interface MemberOrderQuery extends PageQuery {
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
