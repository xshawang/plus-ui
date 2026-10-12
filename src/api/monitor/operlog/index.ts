import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { OperLogQuery, OperLogVO } from './types';

// 查询操作日志列表
export function list(query: OperLogQuery): AxiosPromise<PageResult<OperLogVO>> {
  return request({
    url: '/monitor/operlog/list',
    method: 'get',
    params: query
  });
}

/**
 * 模块下拉候选（后台日志页「模块」筛选框）。
 * 契约：GET /monitor/operlog/modules → string[]（来源 sys_oper_log.title 去重，随各控制器 @Log(title) 变化）。
 */
export function listModules(): AxiosPromise<string[]> {
  return request({
    url: '/monitor/operlog/modules',
    method: 'get'
  });
}

// 删除操作日志
export function delOperlog(operId: string | number | Array<string | number>) {
  return request({
    url: '/monitor/operlog/' + operId,
    method: 'delete'
  });
}

// 清空操作日志
export function cleanOperlog() {
  return request({
    url: '/monitor/operlog/clean',
    method: 'delete'
  });
}
