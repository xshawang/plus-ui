export interface NoticeVO extends BaseEntity {
  noticeId: number;
  noticeTitle: string;
  noticeType: string;
  noticeContent: string;
  status: string;
  remark: string;
  createByName: string;
  /** 投放范围：ADMIN 仅管理端 / PLAYER 仅玩家端 / ALL 两者 */
  targetScope?: string;
  /** 语言过滤：空=全部语言 */
  noticeLang?: string;
  /** 生效开始（NULL=立即生效） */
  effectiveStart?: string | null;
  /** 生效结束（NULL=长期有效） */
  effectiveEnd?: string | null;
}

export interface NoticeQuery extends PageQuery {
  noticeTitle: string;
  createByName: string;
  status: string;
  noticeType: string;
  targetScope?: string;
}

export interface NoticeForm {
  noticeId: number | string | undefined;
  noticeTitle: string;
  noticeType: string;
  noticeContent: string;
  status: string;
  remark: string;
  createByName: string;
  targetScope?: string;
  noticeLang?: string;
  effectiveStart?: string | null;
  effectiveEnd?: string | null;
}

/** 通告送达/已读回执（来源：玩家端真实拉取通告时落库） */
export interface NoticeDeliveryResult {
  summary?: {
    delivered?: number;
    readCount?: number;
    firstDeliveredAt?: string | null;
    lastDeliveredAt?: string | null;
  } | null;
  details?: Array<{
    uid: string;
    nickName?: string;
    deviceType?: string;
    lang?: string;
    deliveredAt?: string | null;
    readAt?: string | null;
  }>;
}
