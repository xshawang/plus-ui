import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

/**
 * 弹窗与协议配置接口（15 文档）。
 * 权限：member:popup:list / member:popup:edit
 */
export interface PopupConfigVO {
  configId?: number;
  /** 1 注册成功 / 2 智能引导充值 / 3 注册挽留 */
  popupType: number;
  configJson?: string;
  enabled?: number;
  operatorId?: string;
  updatedAt?: string;
}

export interface UserAgreementVO {
  agreementId?: number;
  languageCode: string;
  ageLimit?: number;
  contentHtml?: string;
  status?: number;
  version?: number;
  operatorId?: string;
  updatedAt?: string;
}

export const listPopupConfig = (): AxiosPromise<PopupConfigVO[]> => {
  return request({ url: '/infra/member/popup/config/list', method: 'get' });
};

export const savePopupConfig = (data: PopupConfigVO): AxiosPromise<number> => {
  return request({ url: '/infra/member/popup/config', method: 'put', data });
};

export const listUserAgreement = (): AxiosPromise<UserAgreementVO[]> => {
  return request({ url: '/infra/member/popup/agreement/list', method: 'get' });
};

export const saveUserAgreement = (data: UserAgreementVO): AxiosPromise<number> => {
  return request({ url: '/infra/member/popup/agreement', method: 'put', data });
};
