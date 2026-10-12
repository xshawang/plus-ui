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
