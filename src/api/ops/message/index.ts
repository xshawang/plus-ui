import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type {
  MessageRecordQuery,
  MessageRecordVO,
  MessageTaskActionForm,
  MessageTaskForm,
  MessageTaskQuery,
  MessageTaskScheduleForm,
  MessageTaskVO,
  MessageTemplateForm,
  MessageTemplateQuery,
  MessageTemplateStateForm,
  MessageTemplateVO
} from './types';

export const listMessageTemplate = (query?: MessageTemplateQuery): AxiosPromise<PageResult<MessageTemplateVO>> => {
  return request({ url: '/infra/ops/message/template/list', method: 'get', params: query });
};

export const getMessageTemplate = (id: number | string): AxiosPromise<MessageTemplateVO> => {
  return request({ url: '/infra/ops/message/template/' + id, method: 'get' });
};

export const addMessageTemplate = (data: MessageTemplateForm): AxiosPromise => {
  return request({ url: '/infra/ops/message/template', method: 'post', data });
};

export const updateMessageTemplate = (data: MessageTemplateForm): AxiosPromise => {
  return request({ url: '/infra/ops/message/template', method: 'put', data });
};

export const delMessageTemplate = (ids: string | number | (string | number)[]): AxiosPromise => {
  return request({ url: '/infra/ops/message/template/' + ids, method: 'delete' });
};

export const updateMessageTemplateStatus = (data: MessageTemplateStateForm): AxiosPromise => {
  return request({ url: '/infra/ops/message/template/status', method: 'put', data });
};

export const listMessageTask = (query?: MessageTaskQuery): AxiosPromise<PageResult<MessageTaskVO>> => {
  return request({ url: '/infra/ops/message/task/list', method: 'get', params: query });
};

export const getMessageTask = (id: number | string): AxiosPromise<MessageTaskVO> => {
  return request({ url: '/infra/ops/message/task/' + id, method: 'get' });
};

export const addMessageTask = (data: MessageTaskForm): AxiosPromise => {
  return request({ url: '/infra/ops/message/task', method: 'post', data });
};

export const updateMessageTask = (data: MessageTaskForm): AxiosPromise => {
  return request({ url: '/infra/ops/message/task', method: 'put', data });
};

export const delMessageTask = (ids: string | number | (string | number)[]): AxiosPromise => {
  return request({ url: '/infra/ops/message/task/' + ids, method: 'delete' });
};

export const sendMessageTask = (data: MessageTaskActionForm): AxiosPromise => {
  return request({ url: '/infra/ops/message/task/send', method: 'post', data });
};

export const scheduleMessageTask = (data: MessageTaskScheduleForm): AxiosPromise => {
  return request({ url: '/infra/ops/message/task/schedule', method: 'post', data });
};

export const cancelMessageTask = (data: MessageTaskActionForm): AxiosPromise => {
  return request({ url: '/infra/ops/message/task/cancel', method: 'post', data });
};

export const retryMessageTask = (data: MessageTaskActionForm): AxiosPromise => {
  return request({ url: '/infra/ops/message/task/retry', method: 'post', data });
};

export const listMessageRecord = (query?: MessageRecordQuery): AxiosPromise<PageResult<MessageRecordVO>> => {
  return request({ url: '/infra/ops/message/task/records/list', method: 'get', params: query });
};
