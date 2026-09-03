/**
 * 用户(玩家)管理类型
 *
 * 字段对齐 go88_cloud_plus_2.6.2 中 player_account 与 user_wallet_balance 定义：
 * - uid/登录名/头像/注册IP/注册时间来自 player_account
 * - 默认 VND 账户余额由后台按 user_wallet_balance(currency=VND) 聚合返回
 */
export interface MemberUserVO {
  /** 用户UID（雪花ID，超出安全整数范围时后端应以字符串返回） */
  uid?: string | number;
  /** 登录名 */
  loginName?: string;
  /** 昵称 */
  nickName?: string;
  /** Game UID: {agentId}_{9位短号} */
  gameUid?: string;
  /** 头像地址 */
  avatarUrl?: string;
  /** 手机号 */
  phone?: string;
  /** 手机是否验证 0否 1是 */
  phoneVerified?: number;
  /** 账号状态：1正常 2锁定 3注销 */
  status?: number;
  /** VIP等级 */
  vipLevel?: number;
  /** 俱乐部等级 */
  clubLevel?: number;
  /** 风控等级 */
  riskLevel?: number;
  /** 注册IP */
  registerIp?: string;
  /** 注册设备 */
  registerDevice?: string;
  /** 注册渠道 */
  registerChannel?: number;
  /** 允许多端登录 0否 1是 */
  allowMultiDevice?: number;
  /** 禁止Web端登录 0否 1是 */
  blockWebLogin?: number;
  /** TOTP是否已启用 0否 1是 */
  totpEnabled?: number;
  /** 首次充值时间 */
  firstDepositAt?: string;
  /** 最后登录时间 */
  lastLoginAt?: string;
  /** 最后登录IP */
  lastLoginIp?: string;
  /** 注册时间 */
  registerAt?: string;
  createdAt?: string;
  updatedAt?: string;
  /** 默认 VND 账户币种（默认 VND） */
  currency?: string;
  /** 可用余额 */
  availableBalance?: number;
  /** 冻结余额 */
  frozenBalance?: number;
  /** 红利余额 */
  bonusBalance?: number;
  /** 累计充值金额 */
  totalRechargeAmount?: number;
  /** 累计提现金额 */
  totalWithdrawAmount?: number;
}

/**
 * 用户编辑表单
 *
 * loginName/uid 为主键与唯一标识，编辑弹窗中只读；
 * password/payPassword 为空表示不修改，非空表示重置登录密码/资金密码。
 */
export interface MemberUserForm {
  uid?: string | number;
  loginName?: string;
  nickName?: string;
  gameUid?: string;
  avatarUrl?: string;
  phone?: string;
  phoneVerified?: number;
  status?: number;
  vipLevel?: number;
  clubLevel?: number;
  riskLevel?: number;
  registerIp?: string;
  registerDevice?: string;
  registerChannel?: number;
  allowMultiDevice?: number;
  blockWebLogin?: number;
  totpEnabled?: number;
  /** 重置登录密码（留空不修改） */
  password?: string;
  /** 重置资金密码（留空不修改） */
  payPassword?: string;
}

export interface MemberUserQuery extends PageQuery {
  /** 用户UID */
  uid?: string | number;
  /** 登录名 */
  loginName?: string;
  /** 昵称 */
  nickName?: string;
  /** 手机号 */
  phone?: string;
  /** 账号状态 */
  status?: number;
  /** 注册渠道 */
  registerChannel?: number;
  /** 余额币种（默认 VND） */
  currency?: string;
  params?: any;
}

/** 后台调整用户余额请求（金额单位：分，前端按 VND 整数输入后 ×100 提交） */
export interface MemberBalanceAdjustForm {
  uid?: string | number;
  currency?: string;
  /** 目标可用余额（分） */
  balance: number;
  remark?: string;
  /** 后台账户密码（二次校验） */
  password?: string;
}

export interface MemberBalanceAdjustResult {
  uid?: string | number;
  currency?: string;
  availableBalance?: number;
  beforeBalance?: number;
}
