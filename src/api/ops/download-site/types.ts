export interface DownloadSiteQuery extends PageQuery {
  regionCode?: string;
  status?: number;
  siteName?: string;
}

export interface DownloadSiteVO {
  siteId: number;
  siteName: string;
  baseUrl: string;
  regionCode: string;
  weight: number;
  status: number;
  remark: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DownloadSiteForm {
  siteId?: number;
  siteName?: string;
  baseUrl?: string;
  regionCode?: string;
  weight?: number;
  remark?: string;
}

export interface DownloadSiteStateForm {
  id: number;
  value: number;
}

export interface DownloadLinkQuery extends PageQuery {
  siteId?: number;
  platform?: number;
  status?: number;
  appVersion?: string;
}

export interface DownloadLinkVO {
  linkId: number;
  siteId: number;
  siteName?: string;
  platform: number;
  fileName: string;
  fileUrl: string;
  fileMd5: string;
  fileSize: number;
  appVersion: string;
  sortOrder: number;
  status: number;
  createdAt: string;
}

export interface DownloadLinkForm {
  linkId?: number;
  siteId?: number;
  platform?: number;
  fileName?: string;
  fileUrl?: string;
  fileMd5?: string;
  fileSize?: number;
  appVersion?: string;
  sortOrder?: number;
}

export interface DownloadHealthQuery extends PageQuery {
  siteId?: number;
  checkResult?: number;
}

export interface DownloadHealthVO {
  logId: number;
  siteId: number;
  siteName: string;
  linkId: number;
  targetUrl: string;
  checkResult: number;
  httpCode: number;
  latencyMs: number;
  errorMsg: string;
  checkedAt: string;
}
