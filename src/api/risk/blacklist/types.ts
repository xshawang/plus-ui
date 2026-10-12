/**
 * 风控黑名单（菜单 995001）类型定义。
 *
 * 背景：页面是「一个表壳切六个数据源」（设计稿 风控-8），六个页签实际落在三张表上，
 * 行结构只有三类（会员维度 / 目标维度 / 提现维度），所以这里按三类建模，
 * 而不是给六个页签各建一份近似类型。
 * 字段与 go88-service-infra 的 org.dromara.go88.risk.domain 一一对应。
 */

import type { RiskDictOption } from '@/api/risk/types';

/** 页签标识（与后端 RiskBlacklistQueryService.TAB_* 常量一致） */
export type RiskBlacklistTab = 'member' | 'recharge' | 'ip' | 'phone' | 'device' | 'withdraw-account';

export type { RiskDictOption };

/** 黑名单页面三类下拉（一次取回，减少前端请求数） */
export interface RiskBlacklistOptions {
  /** 限制类型（注册 / 登录） */
  limitScenes?: RiskDictOption[];
  /** 提现大类 */
  withdrawCategories?: RiskDictOption[];
  /** 提现类型名称 */
  withdrawTypes?: RiskDictOption[];
}

/** 会员维度查询字段选择器（后端 accountField） */
export type RiskMemberField = 'LOGIN_NAME' | 'UID' | 'PHONE' | 'REAL_NAME';

/** 六页签统一查询参数（对应 RiskBlacklistTabQuery） */
export interface RiskBlacklistTabQuery extends PageQuery {
  /** 查询字段选择器：LOGIN_NAME/UID/PHONE/REAL_NAME */
  accountField?: RiskMemberField | string;
  /** 查询字段对应的值 */
  accountValue?: string;
  /** 账号状态：1正常 2锁定 3注销（会员 / 充值页签） */
  accountStatus?: number;
  /** 是否只看生效中：1生效中 0已解除；默认 1 */
  active?: number;
  /** 目标值关键字（IP / 手机 / 设备 / 提现账号模糊匹配） */
  keyword?: string;
  /** 限制类型位图：1注册 2登录 */
  limitScene?: number;
  /** 币种（提现账号页签） */
  currency?: string;
  /** 提现大类（提现账号页签） */
  withdrawCategory?: string;
  /** 类型名称（提现账号页签） */
  typeName?: string;
  /** 时间区间（RuoYi 约定 params.beginTime / params.endTime） */
  params?: Record<string, any>;
}

/** 会员黑名单 / 充值黑名单行（对应 RiskMemberBlacklistVO） */
export interface RiskMemberBlacklistVO {
  /** player_ban.id：移出名单的对象（雪花 ID，必须按字符串透传） */
  id?: string | number;
  uid?: string | number;
  loginName?: string;
  /** 实名（player_kyc.real_name） */
  realName?: string;
  /** 展示币种，形如 VND1000:1 */
  currency?: string;
  /** 累计成功充值笔数 */
  rechargeCount?: number;
  /** 累计成功充值金额（分） */
  rechargeAmount?: number;
  /** 充提差（分）= 充值 − 提现 */
  balanceDiff?: number;
  /** 累计成功提现笔数 */
  withdrawCount?: number;
  /** 累计成功提现金额（分） */
  withdrawAmount?: number;
  /** 钱包可用余额（分） */
  totalBalance?: number;
  /** 利息宝 / 保险箱余额（分） */
  extraBalance?: number;
  /** 账号状态：1正常 2锁定 3注销 */
  accountStatus?: number;
  /** 封禁类型：1封号 2封设备 3禁止提现 4禁止充值 5禁止游戏 */
  banType?: number;
  /** 状态文案：黑名单 / 禁止提现 / 禁止充值 / 禁止游戏 */
  statusText?: string;
  registerIp?: string;
  registerDevice?: string;
  /** 备注（player_ban.reason） */
  reason?: string;
  operatorId?: string;
  /** 进入名单时间 */
  operatedAt?: string;
  /** 是否生效中：1是 0已解除/到期 */
  active?: number;
  /** 到期时间，空 = 永久 */
  expireAt?: string;
}

/** IP / 手机 / 设备黑名单行（对应 RiskTargetBlacklistVO） */
export interface RiskTargetBlacklistVO {
  /** risk_blacklist.id：移出名单的对象 */
  id?: string | number;
  /** 1uid 2device 3ip 4phone 5email 6pan */
  targetType?: number;
  /** 目标值（IP 明文 / 手机·设备打码） */
  targetValueMask?: string;
  /** 限制类型位图：1注册 2登录 */
  limitScene?: number;
  /** 限制类型文案 */
  limitSceneText?: string;
  /** 关联账号数（服务端统计） */
  relatedAccountCount?: number;
  reason?: string;
  operatorId?: string;
  createdAt?: string;
  /** 到期时间，空 = 永久 */
  expireAt?: string;
}

/** 提现账号黑名单行（对应 RiskWithdrawBlacklistVO） */
export interface RiskWithdrawBlacklistVO {
  /** withdraw_blacklist.id：移出名单的对象 */
  id?: string | number;
  currency?: string;
  /** 提现大类：banks/ewallet/crypto/card */
  withdrawCategory?: string;
  /** 提现大类中文（字典外的兜底展示） */
  withdrawCategoryText?: string;
  /** 类型名称：vietcombank / momo / usdt_trc20 … */
  typeName?: string;
  /** 提现账号 / 地址（打码） */
  targetValueMask?: string;
  reason?: string;
  operatorId?: string;
  createdAt?: string;
  /** 到期时间，空 = 永久 */
  expireAt?: string;
}

/** 新增 / 批量新增入参（对应 RiskBlacklistAddDTO） */
export interface RiskBlacklistAddForm {
  /** 页签：member/recharge/ip/phone/device/withdraw-account */
  tab: RiskBlacklistTab;
  /** 单个新增方式：1单个 2批量 */
  addMode?: number;
  /** 会员账号或会员ID（会员 / 充值页签） */
  memberAccount?: string;
  /** 封禁类型：1黑名单 3禁止提现 5禁止游戏（会员页签；充值页签固定 4） */
  banType?: number;
  /** 封禁天数：0 或空 = 永久（会员页签） */
  banDays?: number;
  /** 目标值列表：IP/手机/设备/提现账号；批量模式一行一个 */
  values?: string[];
  /** 限制类型位图：1注册 2登录（IP / 设备页签必填） */
  limitScene?: number;
  /** 币种（提现账号页签） */
  currency?: string;
  /** 提现大类（提现账号页签） */
  withdrawCategory?: string;
  /** 类型名称（提现账号页签） */
  typeName?: string;
  /** 备注（后端上限 50 字） */
  reason?: string;
  /** 失效时间，空 = 永久 */
  expireAt?: string;
}

/** 移出名单入参（对应 RiskBlacklistRemoveDTO） */
export interface RiskBlacklistRemoveForm {
  tab: RiskBlacklistTab;
  /** 待移出记录主键集合（批量） */
  ids?: Array<string | number>;
  /** 单条移出时的主键（与 ids 二选一） */
  id?: string | number;
  reason?: string;
}

/** 批量导入回执（对应 RiskImportResultVO） */
export interface RiskImportResultVO {
  /** 导入台账 ID（雪花 ID，必须按字符串透传） */
  logId?: string | number;
  fileName?: string;
  /** true = 命中同文件重复上传，本次未重复入库 */
  duplicated?: boolean;
  totalCount?: number;
  successCount?: number;
  failCount?: number;
  /** 失败明细：行号|原因（换行分隔） */
  failDetail?: string;
}
