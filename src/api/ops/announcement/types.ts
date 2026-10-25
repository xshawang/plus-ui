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

/** 大厅顶部广播单条记录，与 8go88.bin 的 broadCastConfig 保持一致 */
export interface LobbyBroadcastItem {
  text: string;
  time: number;
}

/** 顶部广播播放设置：isSequence=true 顺序播放，false 随机播放 */
export interface LobbyBroadcastPlaybackConfig {
  isSequence: boolean;
}

/** 客户端主配置 broadCastConfig 的完整结构 */
export interface LobbyBroadcastConfig {
  config: LobbyBroadcastPlaybackConfig;
  listBroadCast: LobbyBroadcastItem[];
}
