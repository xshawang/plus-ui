import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

/**
 * 会员召回（短信 / 邮箱）与外部注册 API 配置接口。
 *
 * 后端：go88-service-infra
 *  - org.dromara.go88.member.controller.MemberRecallController（/infra/member/{sms,email}-recall）
 *  - org.dromara.go88.member.controller.ExternalRegisterConfigController（/infra/member/external-register）
 * 权限：member:sms:* / member:email:* / member:register:*
 */

export interface RecallRuleForm {
  ruleId?: number | string;
  currency?: string;
  targetType: number;
  targetParams?: string;
  dailySendCount: number;
  sendTime1?: string;
  sendTime2?: string;
  sendTime3?: string;
  channelIds1?: string;
  channelIds2?: string;
  channelIds3?: string;
  smtpIds1?: string;
  smtpIds2?: string;
  smtpIds3?: string;
  title1?: string;
  content1?: string;
  title2?: string;
  content2?: string;
  title3?: string;
  content3?: string;
  autoRecall?: number;
  status?: number;
}

export interface RecallRuleVO extends RecallRuleForm {
  ruleId: number | string;
  operatorId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecallTaskVO {
  taskId: number | string;
  ruleId: number | string;
  planTime: string;
  targetCount: number;
  sentCount: number;
  successCount: number;
  failCount: number;
  status: number;
}

export interface RecallSendRecordVO {
  id: number | string;
  taskId: number | string;
  uid: number | string;
  phoneMask?: string;
  emailMask?: string;
  title?: string;
  content?: string;
  sendStatus: number;
  failReason?: string;
  sentAt?: string;
  createdAt?: string;
}

export interface SmtpOptionVO {
  smtpId: number | string;
  host?: string;
  account?: string;
  sortOrder?: number;
  status?: number;
}

export interface ExternalRegisterConfigVO {
  configId?: number | string;
  enabled: number;
  apiKey?: string;
  apiSecretMask?: string;
  ipWhitelist?: string;
  operatorId?: string;
  updatedAt?: string;
}

const recallUrl = (channel: 'sms' | 'email', path: string) => `/infra/member/${channel}-recall/${path}`;

/** 规则列表 */
export const listRecallRules = (channel: 'sms' | 'email', params?: Record<string, unknown>): AxiosPromise<RecallRuleVO[]> =>
  request({ url: recallUrl(channel, 'rule/list'), method: 'get', params });

/** 新增规则 */
export const addRecallRule = (channel: 'sms' | 'email', data: RecallRuleForm): AxiosPromise<number> =>
  request({ url: recallUrl(channel, 'rule'), method: 'post', data });

/** 修改规则 */
export const updateRecallRule = (channel: 'sms' | 'email', data: RecallRuleForm): AxiosPromise<number> =>
  request({ url: recallUrl(channel, 'rule'), method: 'put', data });

/** 删除规则（服务端为停用保留台账） */
export const delRecallRule = (channel: 'sms' | 'email', ruleId: number | string) =>
  request({ url: recallUrl(channel, `rule/${ruleId}`), method: 'delete' });

/** 召回任务列表 */
export const listRecallTasks = (channel: 'sms' | 'email', params?: Record<string, unknown>): AxiosPromise<RecallTaskVO[]> =>
  request({ url: recallUrl(channel, 'task/list'), method: 'get', params });

/** 发送明细（sendStatus：0 待发送 / 1 成功 / 2 失败） */
export const listRecallRecords = (channel: 'sms' | 'email', params?: Record<string, unknown>): AxiosPromise<RecallSendRecordVO[]> =>
  request({ url: recallUrl(channel, 'record/list'), method: 'get', params });

/** 邮件发送人（官方）下拉 */
export const listSmtpOptions = (): AxiosPromise<SmtpOptionVO[]> =>
  request({ url: '/infra/member/email-recall/smtp/options', method: 'get' });

/** 外部注册 API 配置 */
export const getExternalRegisterConfig = (): AxiosPromise<ExternalRegisterConfigVO> =>
  request({ url: '/infra/member/external-register/config', method: 'get' });

export const saveExternalRegisterConfig = (data: Partial<ExternalRegisterConfigVO> & { apiSecret?: string }) =>
  request({ url: '/infra/member/external-register/config', method: 'put', data });

/** 重置 APISECRET：新密钥仅本次返回 */
export const rotateExternalRegisterSecret = (): AxiosPromise<{ apiSecret: string }> =>
  request({ url: '/infra/member/external-register/secret/rotate', method: 'post' });
