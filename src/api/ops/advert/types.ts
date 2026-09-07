export interface AdvertQuery extends PageQuery {
  adType?: number;
  positionCode?: string;
  status?: number;
  title?: string;
}

export interface AdvertVO {
  adId: number;
  adType: number;
  positionCode: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  sortOrder: number;
  status: number;
  startAt?: string;
  endAt?: string;
  popupFrequency: number;
  popupDelayMs: number;
  targetScope: number;
  scopeParamsJson?: string;
  platformJson?: string;
  languageCode?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AdvertForm {
  adId?: number;
  adType?: number;
  positionCode?: string;
  title?: string;
  imageUrl?: string;
  linkUrl?: string;
  sortOrder?: number;
  startAt?: string;
  endAt?: string;
  popupFrequency?: number;
  popupDelayMs?: number;
  targetScope?: number;
  scopeParamsJson?: string;
  platformJson?: string;
  languageCode?: string;
}

export interface AdvertStateForm {
  id: number;
  value: number;
}
