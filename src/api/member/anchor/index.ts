import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  StreamerChangeForm,
  StreamerCreateForm,
  StreamerQuery,
  StreamerRemarkLogVO,
  StreamerTransactionQuery,
  StreamerTransactionVO,
  StreamerVO
} from './types';

/**
 * 主播号接口（18 文档）。
 * 权限：member:anchor:list / member:anchor:edit
 */
export const listStreamer = (query?: StreamerQuery): AxiosPromise<StreamerVO[]> => {
  return request({ url: '/infra/member/anchor/list', method: 'get', params: query });
};

export const getStreamer = (streamerId: number | string): AxiosPromise<StreamerVO> => {
  return request({ url: '/infra/member/anchor/' + streamerId, method: 'get' });
};

/** 新增主播号（初始额度写虚拟余额并落账变流水） */
export const addStreamer = (data: StreamerCreateForm): AxiosPromise<number> => {
  return request({ url: '/infra/member/anchor', method: 'post', data });
};

/** 人工变更（状态/余额/VIP/层级/密码/备注，一次一个维度） */
export const changeStreamer = (data: StreamerChangeForm): AxiosPromise<number> => {
  return request({ url: '/infra/member/anchor/change', method: 'put', data });
};

/** 账户交易（虚拟账变） */
export const listStreamerTransaction = (query: StreamerTransactionQuery): AxiosPromise<StreamerTransactionVO[]> => {
  return request({ url: '/infra/member/anchor/transaction/list', method: 'get', params: query });
};

/** 操作历史（变更履历） */
export const listStreamerRemarkLog = (streamerId: number | string, query?: { pageNum?: number; pageSize?: number }): AxiosPromise<StreamerRemarkLogVO[]> => {
  return request({ url: '/infra/member/anchor/remark-log/' + streamerId, method: 'get', params: query });
};
