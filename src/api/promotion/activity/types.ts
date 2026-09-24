/**
 * 活动中心（需求文档 01）类型定义。
 */
export interface PromoActivityQuery {
  pageNum?: number;
  pageSize?: number;
  /** active=活动列表 closed=已关闭活动 */
  scope?: string;
  categoryId?: number;
  activityType?: string;
  activityId?: number;
  status?: number;
  memberLevel?: string;
  vipLevel?: string;
  keyword?: string;
  timeStart?: string;
  timeEnd?: string;
}

export interface PromoActivityVO {
  instanceId: number;
  instanceName: string;
  subject?: string;
  categoryId?: number;
  categoryName?: string;
  currency?: string;
  activityTypeCode?: string;
  conditionCode?: string;
  joinLevels?: string;
  joinVipLevels?: string;
  auditMultiple?: number;
  applyTerminals?: string;
  floatImage?: string;
  dispatchMode?: string;
  startAt?: string;
  endAt?: string;
  displayStartAt?: string;
  displayEndAt?: string;
  status?: number;
  closeType?: number;
  sortOrder?: number;
  frontStyle?: string;
  operatorId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PromoActivityForm {
  instanceId?: number;
  templateId?: number;
  instanceName: string;
  subject?: string;
  categoryId?: number;
  activityTypeCode?: string;
  currency?: string;
  conditionCode?: string;
  joinLevels?: string;
  joinVipLevels?: string;
  auditMultiple?: number;
  applyTerminals?: string;
  floatImage?: string;
  dispatchMode?: string;
  startAt?: string;
  endAt?: string;
  displayStartAt?: string;
  displayEndAt?: string;
  status?: number;
  sortOrder?: number;
  frontStyle?: string;
}

export interface PromoCategoryVO {
  categoryId: number;
  categoryType: number;
  categoryName: string;
  iconUnselected?: string;
  iconSelected?: string;
  enabled: number;
  sortOrder?: number;
  operatorId?: string;
  updatedAt?: string;
  activityCount?: number;
}

export interface PromoCategoryForm {
  categoryId?: number;
  categoryName: string;
  iconUnselected?: string;
  iconSelected?: string;
  enabled?: number;
  sortOrder?: number;
}
