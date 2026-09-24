import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type { ImportResult, ImportTaskOptions, ImportTaskQuery, ImportTaskRow } from './types';

/** 导入任务分页列表 */
export const listImportTasks = (query?: ImportTaskQuery): AxiosPromise<PageResult<ImportTaskRow>> => {
  return request({ url: '/infra/ops/report/import/list', method: 'get', params: query });
};

/** 状态计数 */
export const getImportStatusCounts = (): AxiosPromise<Array<{ status: number; cnt: number }>> => {
  return request({ url: '/infra/ops/report/import/status-counts', method: 'get' });
};

/** 下拉选项（所属模块 / 执行状态） */
export const getImportOptions = (): AxiosPromise<ImportTaskOptions> => {
  return request({ url: '/infra/ops/report/import/options', method: 'get' });
};

/** 上传受理（同一文件按 md5 幂等拦截） */
export const uploadImportFile = (data: FormData): AxiosPromise<ImportTaskRow> => {
  return request({
    url: '/infra/ops/report/import/upload',
    method: 'post',
    data,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

/** 执行导入 */
export const executeImportTask = (taskId: number): AxiosPromise<ImportTaskRow> => {
  return request({ url: `/infra/ops/report/import/${taskId}/execute`, method: 'post' });
};

/** 执行结果详情（含失败明细） */
export const getImportResult = (taskId: number, pageNum = 1, pageSize = 10): AxiosPromise<ImportResult> => {
  return request({ url: `/infra/ops/report/import/${taskId}/result`, method: 'get', params: { pageNum, pageSize } });
};

/** 下载失败明细 CSV */
export const downloadImportFailFile = (taskId: number): AxiosPromise<Blob> => {
  return request({ url: `/infra/ops/report/import/${taskId}/fail-file`, method: 'get', responseType: 'blob' });
};

/** 删除（支持批量） */
export const removeImportTasks = (taskIds: Array<number>): AxiosPromise<number> => {
  return request({ url: `/infra/ops/report/import/${taskIds.join(',')}`, method: 'delete' });
};
