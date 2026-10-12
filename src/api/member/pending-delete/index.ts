import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  DeleteLogVO,
  PendingDeleteAutoForm,
  PendingDeleteClearForm,
  PendingDeleteEnqueueForm,
  PendingDeleteQuery,
  PendingDeleteResult,
  PendingDeleteVO
} from './types';

/**
 * 待删除会员接口（08 文档 §3）。
 * 权限：member:pending-delete:list / :edit / :clear（高危单独收口）
 */
export const listPendingDelete = (query?: PendingDeleteQuery): AxiosPromise<PendingDeleteVO[]> => {
  const params = { ...query } as Record<string, unknown>;
  if (query?.planTimeRange?.length === 2) {
    params.planTimeStart = query.planTimeRange[0];
    params.planTimeEnd = query.planTimeRange[1];
    delete params.planTimeRange;
  } else {
    delete params.planTimeRange;
  }
  return request({ url: '/infra/member/pending-delete/list', method: 'get', params });
};

/** 人工入队（批量） */
export const enqueuePendingDelete = (data: PendingDeleteEnqueueForm): AxiosPromise<number> => {
  return request({ url: '/infra/member/pending-delete/enqueue', method: 'post', data });
};

/** 自动删除无效会员（按规则入队，不直接删除） */
export const autoPendingDelete = (data: PendingDeleteAutoForm): AxiosPromise<PendingDeleteResult> => {
  return request({ url: '/infra/member/pending-delete/auto', method: 'post', data });
};

/** 取消入队（反悔） */
export const cancelPendingDelete = (uid: number | string): AxiosPromise<number> => {
  return request({ url: '/infra/member/pending-delete/cancel', method: 'post', params: { uid } });
};

/** 执行删除（逻辑标记 + 审计） */
export const executePendingDelete = (uids: (number | string)[], reason?: string): AxiosPromise<PendingDeleteResult> => {
  return request({ url: '/infra/member/pending-delete/execute', method: 'post', data: { uids, reason } });
};

/** 高危：清空站点全部数据（仅队列内账号，需确认词 CLEAR-SITE-ALL） */
export const clearSitePendingDelete = (data: PendingDeleteClearForm): AxiosPromise<PendingDeleteResult> => {
  return request({ url: '/infra/member/pending-delete/clear-site', method: 'post', data });
};

export const listDeleteLog = (query?: PendingDeleteQuery): AxiosPromise<DeleteLogVO[]> => {
  return request({ url: '/infra/member/pending-delete/log/list', method: 'get', params: query });
};
