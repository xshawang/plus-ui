import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { ConfigBatchForm, ConfigItemVO } from './types';

/**
 * 防刷风控配置接口（10 文档 §1）。
 * 权限：member:anti-fraud:list / member:anti-fraud:edit
 */
export const listAntiFraudConfig = (): AxiosPromise<ConfigItemVO[]> => {
  return request({
    url: '/infra/member/anti-fraud/config/list',
    method: 'get'
  });
};

export const saveAntiFraudConfig = (data: ConfigBatchForm): AxiosPromise<number> => {
  return request({
    url: '/infra/member/anti-fraud/config',
    method: 'put',
    data
  });
};

/**
 * 安全中心配置接口（10 文档 §2）。
 * 权限：member:security:list / member:security:edit
 */
export const listSecurityConfig = (): AxiosPromise<ConfigItemVO[]> => {
  return request({
    url: '/infra/member/security/config/list',
    method: 'get'
  });
};

export const saveSecurityConfig = (data: ConfigBatchForm): AxiosPromise<number> => {
  return request({
    url: '/infra/member/security/config',
    method: 'put',
    data
  });
};
