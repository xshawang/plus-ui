/**
 * 厅主公告（运营后台 → 运营管理 → 厅主公告）接口类型。
 * 契约来源：F:/G318Abt/MD_DOC/4_运营/03-厅主公告.md（截图 运营-厅主公告01.png）。
 */
export interface NoticeQuery extends PageQuery {
  /** 页签：current=当前公告 history=历史公告 all=全部公告 */
  tab?: string;
  noticeTitle?: string;
  noticeCategory?: string;
  languageCode?: string;
  status?: number;
  /** 读取状态：1未读 2已读（截图筛选区「读取状态」） */
  readStatus?: number;
  /** 时间粒度：day/week/month（截图筛选区「日/周/月」按钮） */
  timeScope?: string;
  beginTime?: string;
  endTime?: string;
}

export interface NoticeVO {
  noticeId: number;
  noticeTitle: string;
  noticeType: string;
  noticeContent?: string;
  languageCode: string;
  noticeCategory: string;
  /** 接收对象（截图列表列；取自字典 sys_notice_receiver_scope） */
  receiverScope?: string;
  status: number;
  attachmentUrl?: string;
  attachmentName?: string;
  sentAt?: string;
  readCount: number;
  totalCount: number;
  skinId?: number;
  createdAt: string;
}

export interface NoticeForm {
  noticeId?: number;
  noticeTitle?: string;
  noticeType?: string;
  noticeContent?: string;
  languageCode?: string;
  noticeCategory?: string;
  /** 接收对象（新增/编辑弹窗；缺省「全部厅主」） */
  receiverScope?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  sentAt?: string;
  skinId?: number;
}

export interface NoticeSkinVO {
  skinId?: number;
  skinName: string;
  backgroundUrl?: string;
  fontSize?: number;
  themeColor?: string;
  layoutJson?: string;
  status?: number;
}
