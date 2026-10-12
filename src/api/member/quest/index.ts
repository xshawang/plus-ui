import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  QuestConfigForm,
  QuestConfigQuery,
  QuestConfigVO,
  QuestRecordQuery,
  QuestRecordVO,
  QuestRewardGrantForm,
  QuestRewardGrantResult,
  QuestRewardRecordVO,
  QuestSettingVO
} from './types';

/**
 * 任务中心接口（17 文档：新人福利设置 + 任务奖励发放 + 完成明细）。
 * 权限：member:quest:list / member:quest:edit
 */
export const listQuestConfig = (query?: QuestConfigQuery): AxiosPromise<QuestConfigVO[]> => {
  return request({ url: '/infra/member/quest/config/list', method: 'get', params: query });
};

export const getQuestConfig = (id: number | string): AxiosPromise<QuestConfigVO> => {
  return request({ url: `/infra/member/quest/config/${id}`, method: 'get' });
};

/** 新增/修改新人福利任务配置 */
export const saveQuestConfig = (data: QuestConfigForm): AxiosPromise<number> => {
  return request({ url: '/infra/member/quest/config/save', method: 'post', data });
};

/** 行内开关：是否开启 */
export const toggleQuestStatus = (id: number | string, status: number): AxiosPromise<number> => {
  return request({ url: '/infra/member/quest/config/status', method: 'post', params: { id, status } });
};

/** 行内开关：提示气泡 */
export const toggleQuestBubble = (id: number | string, bubbleFlag: number): AxiosPromise<number> => {
  return request({ url: '/infra/member/quest/config/bubble', method: 'post', params: { id, bubbleFlag } });
};

/** 会员任务完成明细 */
export const listQuestRecord = (query?: QuestRecordQuery): AxiosPromise<QuestRecordVO[]> => {
  return request({ url: '/infra/member/quest/record/list', method: 'get', params: query });
};

/** 任务奖励发放记录 */
export const listQuestReward = (query?: QuestRecordQuery): AxiosPromise<QuestRewardRecordVO[]> => {
  return request({ url: '/infra/member/quest/reward/list', method: 'get', params: query });
};

/** 任务奖励发放（真实资金，幂等） */
export const grantQuestReward = (data: QuestRewardGrantForm): AxiosPromise<QuestRewardGrantResult> => {
  return request({ url: '/infra/member/quest/reward/grant', method: 'post', data });
};

/** 异常发放记录重试 */
export const retryQuestReward = (recordId: number | string): AxiosPromise<number> => {
  return request({ url: '/infra/member/quest/reward/retry', method: 'post', params: { recordId } });
};

export const listQuestSetting = (): AxiosPromise<QuestSettingVO[]> => {
  return request({ url: '/infra/member/quest/setting/list', method: 'get' });
};

export const saveQuestSetting = (items: { configKey: string; configValue: string }[]): AxiosPromise<number> => {
  return request({ url: '/infra/member/quest/setting/save', method: 'post', data: { items } });
};
