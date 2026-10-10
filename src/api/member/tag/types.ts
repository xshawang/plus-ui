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
  /**
   * 会员UID。
   *
   * FIX(2026-10-10): 类型放宽为 string。原因：UID 是 19 位雪花ID（例如 2108388244222775296），
   * 超过 JS Number.MAX_SAFE_INTEGER(9007199254740991)，前端一旦用 Number() 转换就会丢精度
   * （实测 ...775296 变成 ...775300），后端按错误 uid 查不到会员 → 静默跳过 → 打标影响 0 条。
   * 因此 uid 全程以字符串传递，由 Jackson 在服务端解析为 Long。
   */
  uids: Array<number | string>;
  tagIds: number[];
}
