import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import { getToken } from '@/utils/auth';

/**
 * 会员批量导入导出接口（批次 7）。
 * 权限：member:user:export / member:user:import
 */
export interface MemberImportResult {
  total?: number;
  created?: number;
  failedCount?: number;
  failed?: { line: string; reason: string }[];
}

/** 导入结果 */
export const importMembers = (file: File): AxiosPromise<MemberImportResult> => {
  const form = new FormData();
  form.append('file', file);
  return request({
    url: '/infra/member/users/import',
    method: 'post',
    data: form,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

/** 导出全部（当前筛选条件）：由浏览器直接下载，避免大响应进内存 */
export const exportMembers = (params: Record<string, unknown>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });
  const token = getToken() ?? '';
  const url = `${import.meta.env.VITE_APP_BASE_API ?? ''}/infra/member/users/export?${query.toString()}`;
  return { url, token };
};
