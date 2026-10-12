import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PersuadeActionForm, PersuadeOrderQuery, PersuadeOrderVO, PersuadeSubmitForm } from './types';

/**
 * 会员劝退接口（08 文档，真实资金链路）。
 * 权限：member:user:list / member:user:edit
 *
 * 注意：提交劝退会经钱包核心真实扣款/退款，requestId 必须全局唯一（幂等键）。
 */
export const listPersuadeOrder = (query?: PersuadeOrderQuery): AxiosPromise<PersuadeOrderVO[]> => {
  return request({ url: '/infra/member/persuade/list', method: 'get', params: query });
};

export const submitPersuade = (data: PersuadeSubmitForm): AxiosPromise<number> => {
  return request({ url: '/infra/member/persuade', method: 'post', data });
};

export const cancelPersuade = (data: PersuadeActionForm): AxiosPromise<number> => {
  return request({ url: '/infra/member/persuade/cancel', method: 'put', data });
};

export const retryPersuade = (data: PersuadeActionForm): AxiosPromise<number> => {
  return request({ url: '/infra/member/persuade/retry', method: 'put', data });
};
