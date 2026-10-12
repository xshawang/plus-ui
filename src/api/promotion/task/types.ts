/**
 * 任务中心（需求文档 02）类型定义。
 */
export interface PromoTaskQuery {
  pageNum?: number;
  pageSize?: number;
  /** newbie 新人福利 / daily 每日 / weekly 每周 / mystery 三日神秘 */
  taskKind?: string;
  keyword?: string;
  status?: number;
  currency?: string;
  account?: string;
  changeType?: number;
  timeStart?: string;
  timeEnd?: string;
}

export interface PromoTaskVO {
  id: number;
  code?: string;
  title: string;
  content?: string;
  taskKind?: string;
  targetType?: string;
  targetValue?: number;
  rewardAmount?: number;
  rewardType?: number;
  extraPoint?: number;
  currency?: string;
  currencyScope?: string;
  validStart?: string;
  validEnd?: string;
  claimExpireDays?: number;
  rewardTiming?: number;
  turnoverMultiple?: number;
  tierJson?: string;
  rechargeChannels?: string;
  extraRewardType?: string;
  extraRewardValue?: number;
  extraRewardDays?: number;
  doubleRewardFlag?: number;
  claimTerminal?: string;
  deviceLimit?: number;
  fingerprintLimit?: number;
  ipLimit?: number;
  claimTimeType?: string;
  delayRuleJson?: string;
  betConditionJson?: string;
  audienceParams?: string;
  status?: number;
  bubbleFlag?: number;
  sortOrder?: number;
  ruleDesc?: string;
  operatorId?: string;
  operatedAt?: string;
}

export interface PromoTaskForm {
  id?: number;
  code?: string;
  title: string;
  content?: string;
  taskKind: string;
  targetType?: string;
  targetValue?: number;
  rewardAmount?: number;
  rewardType?: number;
  extraPoint?: number;
  currency?: string;
  currencyScope?: string;
  validStart?: string;
  validEnd?: string;
  claimExpireDays?: number;
  rewardTiming?: number;
  turnoverMultiple?: number;
  tierJson?: string;
  rechargeChannels?: string;
  extraRewardType?: string;
  extraRewardValue?: number;
  extraRewardDays?: number;
  doubleRewardFlag?: number;
  claimTerminal?: string;
  deviceLimit?: number;
  fingerprintLimit?: number;
  ipLimit?: number;
  claimTimeType?: string;
  delayRuleJson?: string;
  betConditionJson?: string;
  audienceParams?: string;
  status?: number;
  bubbleFlag?: number;
  sortOrder?: number;
  ruleDesc?: string;
}
