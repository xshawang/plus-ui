/**
 * 登录设备（需求文档 07）类型定义。
 */
export interface MemberDeviceQuery {
  pageNum?: number;
  pageSize?: number;
  uid?: number | string;
  loginName?: string;
  deviceKeyword?: string;
  isTrustDevice?: number;
  clientType?: string;
  /**
   * 是否把「注册设备指纹」命中的记录一并返回：1=是，不传=否。
   *
   * 会员详情-「登录设备」页签按「使用过（uid）或 注册设备指纹」取数，
   * 登录设备管理页不传该参数，保持原「仅按 uid」语义。
   */
  includeRegisterDevice?: number;
}

export interface MemberDeviceVO {
  id: number;
  uid: number;
  loginName?: string;
  deviceId?: string;
  deviceFingerprint?: string;
  deviceType?: number;
  deviceBrand?: string;
  deviceModel?: string;
  clientType?: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  appVersion?: string;
  lastLoginIp?: string;
  ipRegion?: string;
  lastLoginAt?: string;
  useCount?: number;
  isTrustDevice?: number;
  trustReason?: string;
}

export interface MemberDeviceActionForm {
  id?: number;
  ids?: number[];
  /** TRUST / UNTRUST / BLACKLIST */
  action: string;
  reason?: string;
}
