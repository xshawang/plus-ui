/**
 * 会员标签（需求文档 05）类型定义。
 */
export interface MemberTagQuery {
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
  status?: number;
  gameRestrictType?: number;
}

export interface MemberTagVO {
  tagId: number;
  tagName: string;
  tagCode: string;
  tagColor?: string;
  /** 0=不限制 1=白名单 2=黑名单 */
  gameRestrictType?: number;
  sortOrder?: number;
  description?: string;
  status?: number;
  operatorId?: string;
  createdAt?: string;
  updatedAt?: string;
  memberCount?: number;
}

export interface MemberTagForm {
  tagId?: number;
  tagName: string;
  tagCode: string;
  tagColor?: string;
  gameRestrictType?: number;
  sortOrder?: number;
  description?: string;
  status?: number;
}

export interface MemberTagBindForm {
  uids: number[];
  tagIds: number[];
}
