export interface AnnouncementQuery extends PageQuery {
  announceType?: number;
  status?: number;
  title?: string;
  topFlag?: number;
}

export interface AnnouncementVO {
  announcementId: number;
  announceType: number;
  title: string;
  content: string;
  languageCode: string;
  topFlag: number;
  topAt?: string;
  status: number;
  startAt?: string;
  endAt?: string;
  sortOrder: number;
  publisherId?: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AnnouncementForm {
  announcementId?: number;
  announceType?: number;
  title?: string;
  content?: string;
  languageCode?: string;
  startAt?: string;
  endAt?: string;
  sortOrder?: number;
}

export interface AnnouncementStateForm {
  id: number;
  value: number;
}
