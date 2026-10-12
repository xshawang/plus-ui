/**
 * 任务中心（需求文档 17：新人福利设置 + 剩余活跃度）类型定义。
 *
 * 注意：奖励金额单位统一为「分」，与资金链路一致。
 */
export interface QuestConfigQuery {
  pageNum?: number;
  pageSize?: number;
  code?: string;
  title?: string;
  status?: number;
  questType?: number;
}

export interface QuestConfigVO {
  id: number;
  code: string;
  conditionLabel?: string;
  title?: string;
  content?: string;
  questType?: number;
  targetType?: string;
  targetValue?: number;
  rewardAmount?: number;
  rewardType?: number;
  rewardTypeLabel?: string;
  rewardRatio?: number;
  extraPoint?: number;
  sortOrder?: number;
  status?: number;
  bubbleFlag?: number;
  audienceType?: number;
  audienceTypeLabel?: string;
  audienceParams?: string;
  currency?: string;
  validStart?: string;
  validEnd?: string;
  claimExpireDays?: number;
  rewardTiming?: number;
  ruleDesc?: string;
  turnoverMultiple?: number;
  operatorId?: string;
  operatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuestConfigForm {
  id?: number;
  code: string;
  title: string;
  content?: string;
  questType?: number;
  targetType?: string;
  targetValue?: number;
  rewardAmount: number;
  rewardType?: number;
  rewardRatio?: number;
  extraPoint?: number;
  sortOrder?: number;
  status?: number;
  bubbleFlag?: number;
  audienceType?: number;
  audienceParams?: string;
  currency?: string;
  validStart?: string;
  validEnd?: string;
  claimExpireDays?: number;
  rewardTiming?: number;
  ruleDesc?: string;
  turnoverMultiple?: number;
}

export interface QuestRecordQuery {
  pageNum?: number;
  pageSize?: number;
  uid?: number | string;
  loginName?: string;
  questCode?: string;
  status?: number;
}

export interface QuestRecordVO {
  id: number;
  uid: number;
  loginName?: string;
  questId?: number;
  questCode?: string;
  questTitle?: string;
  progress?: number;
  targetValue?: number;
  status?: number;
  statusLabel?: string;
  periodDate?: string;
  rewardedAt?: string;
  updatedAt?: string;
}

export interface QuestRewardRecordVO {
  recordId: number;
  uid: number;
  loginName?: string;
  questId?: number;
  questCode?: string;
  questTitle?: string;
  periodKey?: string;
  bizNo?: string;
  rewardAmount?: number;
  extraPoint?: number;
  status?: number;
  failReason?: string;
  retryCount?: number;
  operatorId?: string;
  createdAt?: string;
  finishedAt?: string;
}

export interface QuestRewardGrantForm {
  uid: number | string;
  questId: number | string;
  periodKey?: string;
  remark?: string;
}

export interface QuestRewardGrantResult {
  uid?: number;
  questId?: number;
  questCode?: string;
  periodKey?: string;
  rewardAmount?: number;
  extraPoint?: number;
  bizNo?: string;
  granted?: number;
  skipped?: number;
  failed?: number;
}

export interface QuestSettingVO {
  settingKey: string;
  settingValue?: string;
  remark?: string;
  operatorId?: string;
  updatedAt?: string;
}
