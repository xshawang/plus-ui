import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type { ExportTaskOptions, ExportTaskQuery, ExportTaskRow } from './types';

/** 导出任务分页列表 */
export const listExportTasks = (query?: ExportTaskQuery): AxiosPromise<PageResult<ExportTaskRow>> => {
  return request({ url: '/infra/ops/report/export/list', method: 'get', params: query });
};

/** 状态计数 */
export const getExportStatusCounts = (): AxiosPromise<Array<{ status: number; cnt: number }>> => {
  return request({ url: '/infra/ops/report/export/status-counts', method: 'get' });
};

/** 下拉选项（一级菜单 / 状态） */
export const getExportOptions = (): AxiosPromise<ExportTaskOptions> => {
  return request({ url: '/infra/ops/report/export/options', method: 'get' });
};

/** 任务详情（含文件密码） */
export const getExportDetail = (taskId: number): AxiosPromise<ExportTaskRow> => {
  return request({ url: `/infra/ops/report/export/detail/${taskId}`, method: 'get' });
};

/** 下载导出文件（返回二进制流，由页面保存为文件） */
export const downloadExportFile = (taskId: number): AxiosPromise<Blob> => {
  return request({ url: `/infra/ops/report/export/download/${taskId}`, method: 'get', responseType: 'blob' });
};

/** 删除（支持批量） */
export const removeExportTasks = (taskIds: Array<number>): AxiosPromise<number> => {
  return request({ url: `/infra/ops/report/export/${taskIds.join(',')}`, method: 'delete' });
};

/** 重新生成（仅失败任务） */
export const retryExportTasks = (taskIds: Array<number>): AxiosPromise<number> => {
  return request({ url: `/infra/ops/report/export/retry/${taskIds.join(',')}`, method: 'post' });
};
