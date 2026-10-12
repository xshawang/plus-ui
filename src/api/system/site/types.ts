/**
 * 站点管理（系统 → 站点管理，8 个页签）接口类型。
 * 契约来源：F:/G318Abt/MD_DOC/11_系统/06-站点管理需求.md（截图 系统-站点管理5-NO.png）。
 * 说明：siteId 为业务ID（截图 2562），一律按 string 透传，禁止 Number() 转换。
 */
export interface SiteQuery extends PageQuery {
  /** 页签：info/open/bill/balance/quota/coin/credit/fee */
  tab?: string;
  siteId?: string;
  keyword?: string;
  /** 站点状态：1正常 2停用（info 页签） */
  status?: number;
  /** 子状态：账单结算状态 / 充币状态 */
  subStatus?: number;
  billMonth?: string;
  beginTime?: string;
  endTime?: string;
}

export interface SiteVO {
  siteId: string;
  parentSiteId: string;
  siteType: number;
  siteName: string;
  siteCode?: string;
  groupName: string;
  companyName: string;
  holder: string;
  businessOwner: string;
  recommendType: number;
  recommender?: string;
  currency: string;
  timezone: string;
  backendDomain: string;
  backupDomain: string;
  siteBalance: number;
  thirdDiscount: number;
  siteStatus: number;
  mainOpenFee: number;
  subOpenFee: number;
  subDeposit: number;
  mainMaintainFee: number;
  subMaintainFee: number;
  siteMode: string;
  clientSkin: string;
  mergeStatus?: string;
  lineMaintainFee: number;
  withdrawReviewMode: number;
  createdAt?: string;
  updatedAt?: string;
  operatorId?: string;
}

export interface SiteForm {
  siteId?: string;
  parentSiteId?: string;
  siteType?: number;
  siteName?: string;
  groupName?: string;
  companyName?: string;
  holder?: string;
  businessOwner?: string;
  recommendType?: number;
  recommender?: string;
  currency?: string;
  timezone?: string;
  backendDomain?: string;
  backupDomain?: string;
  siteStatus?: number;
  siteMode?: string;
  clientSkin?: string;
  mainMaintainFee?: number;
  lineMaintainFee?: number;
}

export interface SiteOptions {
  sites: { value: string; label: string; siteType: number; currency: string }[];
  currencies: { value: string; label: string; ratio: string }[];
  siteTypes: { label: string; value: string }[];
  siteStatuses: { label: string; value: string }[];
  siteModes: { label: string; value: string }[];
  recommendTypes: { label: string; value: string }[];
  billTypes: { label: string; value: string }[];
  settleStatuses: { label: string; value: string }[];
  quotaTypes: { label: string; value: string }[];
  coinStatuses: { label: string; value: string }[];
  feeUnits: { label: string; value: string }[];
}
