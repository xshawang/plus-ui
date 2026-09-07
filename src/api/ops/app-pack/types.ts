export interface AppVersionQuery extends PageQuery {
  appPlatform?: number;
  status?: number;
  keyword?: string;
}

export interface AppVersionVO {
  versionId: number;
  appPlatform: number;
  versionCode: string;
  versionName: string;
  forceUpdate: number;
  updateUrl: string;
  updateDesc?: string;
  fileName: string;
  fileSize: number;
  fileMd5: string;
  downloadSiteId: number;
  publishAt?: string;
  updateStrategyJson?: string;
  status: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AppVersionForm {
  versionId?: number;
  appPlatform?: number;
  versionCode?: string;
  versionName?: string;
  forceUpdate?: number;
  updateUrl?: string;
  updateDesc?: string;
  fileName?: string;
  fileSize?: number;
  fileMd5?: string;
  downloadSiteId?: number;
  updateStrategyJson?: string;
}

export interface WhitelistQuery extends PageQuery {
  uid?: number;
  versionCode?: string;
}

export interface WhitelistVO {
  id: number;
  uid: number;
  versionCode: string;
  reason: string;
  createdAt: string;
}

export interface WhitelistForm {
  uid?: number;
  versionCode?: string;
  reason?: string;
}
