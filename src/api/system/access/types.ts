/**
 * 访问控制（系统 → 访问控制：IP白名单 / 浏览器授权码 / 浏览器VPN信任域名）接口类型。
 * 契约来源：F:/G318Abt/MD_DOC/11_系统/02-IP白名单与浏览器授权需求.md（截图 系统-IP白名单.png）。
 */
export interface AccessQuery extends PageQuery {
  /** 关键字：IP / 授权码 / 域名 / 浏览器 / 绑定账号 */
  keyword?: string;
  /** 状态：0停用 1启用（授权码与信任域名） */
  status?: number;
  beginTime?: string;
  endTime?: string;
}

/** IP 白名单（页签一） */
export interface IpWhitelistVO {
  id: string;
  ipAddr: string;
  region: string;
  permBackend: number;
  permLobby: number;
  permGame: number;
  permDownload: number;
  permClient: number;
  remark?: string;
  operatorId?: string;
  createdAt?: string;
}

/** 浏览器授权码（页签二） */
export interface BrowserAuthVO {
  id: string;
  authCode: string;
  browserName: string;
  authDomain: string;
  bindAccount?: string;
  expireAt?: string;
  status: number;
  remark?: string;
  operatorId?: string;
  createdAt?: string;
}

/** 浏览器 VPN 信任域名（页签三） */
export interface BrowserVpnVO {
  id: string;
  domain: string;
  browserName: string;
  vpnRegion: string;
  trustLevel: number;
  status: number;
  remark?: string;
  operatorId?: string;
  createdAt?: string;
}

export interface AccessOptions {
  sites: { siteId: string; siteName: string }[];
  trustLevels: { label: string; value: string }[];
  domainHint: { siteName?: string; backendDomain?: string; backupDomain?: string };
}
