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

/**
 * —— 以下为「打包APP / 原生马甲包」图片口径（2026-10-12）——
 * 一行 = APP×系统，行内多行「应用地址」；版本号/状态为资源行级。
 */

/** 资源行（应用地址一行：极速APP / 原生APP轻量 / 原生APP64位轻量 / 原生APP完整） */
export interface AppPackResourceVO {
  resourceId: number;
  appId: number;
  resourceType: number;
  /** 资源类型中文名（后端下发，如「原生APP(轻量资源)」） */
  resourceTypeName?: string;
  platform: number;
  appName?: string;
  packageName?: string;
  resourceUrl?: string;
  /** 文件大小（字节） */
  fileSize?: number;
  versionCode?: string;
  packStatus?: number;
  /** 打包状态中文名（打包成功/打包中/打包失败） */
  packStatusName?: string;
  packedAt?: string;
  packedBy?: string;
  googleLoginFingerprint?: string;
  facebookLoginSecret?: string;
  sortOrder?: number;
  status?: number;
}

/** APP×系统 行（含资源行列表） */
export interface AppPackageVO {
  appId: number;
  /** 1=打包APP 2=原生马甲包 */
  appType: number;
  platform: number;
  platformName?: string;
  appName: string;
  packageName: string;
  appIconUrl?: string;
  status: number;
  sortOrder?: number;
  resources?: AppPackResourceVO[];
  resourceCount?: number;
  packedAt?: string;
  packedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppPackageQuery extends PageQuery {
  appType?: number;
  platform?: number;
  status?: number;
  keyword?: string;
}

export interface AppPackageForm {
  appId?: number;
  appType?: number;
  platform?: number;
  appName?: string;
  packageName?: string;
  appIconUrl?: string;
  sortOrder?: number;
}

export interface AppPackResourceForm {
  resourceId?: number;
  appId?: number;
  resourceType?: number;
  platform?: number;
  resourceUrl?: string;
  fileSize?: number;
  versionCode?: string;
  googleLoginFingerprint?: string;
  facebookLoginSecret?: string;
  sortOrder?: number;
}
