/**
 * 账号权限（系统 → 账号权限：账号管理 / 权限管理）接口类型。
 * 契约来源：F:/G318Abt/MD_DOC/11_系统/05-账号权限需求.md（截图 系统-账号权限-NO.png）。
 */
export interface AdminAccountQuery extends PageQuery {
  userName?: string;
  nickName?: string;
  createSource?: string;
  deptId?: string | number;
  /** 账号状态：0正常 1冻结 */
  status?: string;
  /** 在线状态：1在线 0离线 */
  onlineStatus?: number;
  lastLoginMethod?: string;
  beginTime?: string;
  endTime?: string;
}

export interface AdminAccountVO {
  userId: string;
  userName: string;
  nickName: string;
  createSource: string;
  stationScope: string;
  stationLabel: string;
  deptId: string;
  deptName: string;
  status: string;
  online: boolean;
  remark?: string;
  lastLoginMethod: string;
  loginIp?: string;
  loginDate?: string;
  operatorName?: string;
  operateTime?: string;
  createTime?: string;
}

export interface AdminAccountOptions {
  sites: { siteId: string; siteName: string; siteType: number; siteStatus: number }[];
  createSources: { label: string; value: string }[];
  loginMethods: { label: string; value: string }[];
}

export interface PermissionRow {
  roleId: string;
  roleName: string;
  roleKey: string;
  roleSort: number;
  dataScope: string;
  status: string;
  createTime?: string;
  menuCount: number;
}
