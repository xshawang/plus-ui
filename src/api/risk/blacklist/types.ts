/**
 * 风控黑名单（风控 → 黑名单，六页签）接口类型。
 * 契约来源：F:/G318Abt/MD_DOC/8_风控/01-黑名单管理（六页签）.md
 */

/** 页签编码：与后端 RiskBlacklistQueryService 的 TAB_* 常量一一对应 */
export type RiskBlacklistTab = 'member' | 'recharge' | 'ip' | 'phone' | 'device' | 'withdraw-account';

export interface RiskBlacklistQuery extends PageQuery {
  /** 查询字段选择器：LOGIN_NAME/UID/PHONE/REAL_NAME */
  accountField?: string;
  accountValue?: string;
  uid?: number | string;
  loginName?: string;
  /** 账号状态：1正常 2锁定 3注销 */
  accountStatus?: number;
  /** 1只看生效中 0已解除 */
  active?: number;
  /** 目标值关键字（IP/手机/设备/提现账号） */
  keyword?: string;
  /** 限制类型位图：1注册 2登录 */
  limitScene?: number;
  currency?: string;
  withdrawCategory?: string;
  typeName?: string;
  params?: Record<string, unknown>;
}

/** 会员黑名单 / 充值黑名单行 */
export interface RiskMemberBlacklistVO {
  /** 雪花ID，后端按字符串下发（超出 JS 安全整数范围，前端禁止用 Number 转换） */
  id: number | string;
  uid: number;
  loginName?: string;
  realName?: string;
  currency?: string;
  rechargeCount?: number;
  rechargeAmount?: number;
  balanceDiff?: number;
  withdrawCount?: number;
  withdrawAmount?: number;
  totalBalance?: number;
  extraBalance?: number;
  accountStatus?: number;
  /** 1封号 2封设备 3禁止提现 4禁止充值 5禁止游戏 */
  banType?: number;
  statusText?: string;
  registerIp?: string;
  registerDevice?: string;
  reason?: string;
  operatorId?: string;
  operatedAt?: string;
  expireAt?: string;
  active?: number;
}

/** IP / 手机 / 设备黑名单行 */
export interface RiskTargetBlacklistVO {
  id: number | string;
  targetType?: number;
  targetValueMask?: string;
  limitScene?: number;
  limitSceneText?: string;
  relatedAccountCount?: number;
  reason?: string;
  operatorId?: string;
  createdAt?: string;
  expireAt?: string;
}

/** 提现账号黑名单行 */
export interface RiskWithdrawBlacklistVO {
  id: number | string;
  currency?: string;
  withdrawCategory?: string;
  withdrawCategoryText?: string;
  typeName?: string;
  targetValueMask?: string;
  reason?: string;
  operatorId?: string;
  createdAt?: string;
  expireAt?: string;
}

/** 新增 / 批量新增入参（六页签共用，字段按 tab 生效） */
export interface RiskBlacklistAddForm {
  tab: RiskBlacklistTab;
  /** 1单个 2批量 */
  addMode?: number;
  memberAccount?: string;
  banType?: number;
  banDays?: number;
  values?: string[];
  limitScene?: number;
  currency?: string;
  withdrawCategory?: string;
  typeName?: string;
  reason?: string;
  expireAt?: string;
}

export interface RiskBlacklistRemoveForm {
  tab: RiskBlacklistTab;
  /** 单条主键（字符串透传，避免精度丢失） */
  id?: number | string;
  /** 批量主键（字符串透传） */
  ids?: Array<number | string>;
  reason?: string;
}

export interface RiskImportResultVO {
  logId?: number | string;
  fileName?: string;
  duplicated?: boolean;
  totalCount?: number;
  successCount?: number;
  failCount?: number;
  failDetail?: string;
}

/** 字典选项 */
export interface RiskDictOption {
  label: string;
  value: string;
  listClass?: string;
  remark?: string;
}
