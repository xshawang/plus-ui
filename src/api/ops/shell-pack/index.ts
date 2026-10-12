import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type { ShellPackDocVO, ShellPackOrderVO, ShellPackQuery, ShellPackVO } from './types';

/** 市场列表（六页签） */
export const listShellPack = (query?: ShellPackQuery): AxiosPromise<PageResult<ShellPackVO>> => {
  return request({ url: '/infra/ops/shell-pack/list', method: 'get', params: query });
};

/** 页签计数（出售中红点） */
export const getShellPackTabCounts = (): AxiosPromise<Record<string, number>> => {
  return request({ url: '/infra/ops/shell-pack/tab-counts', method: 'get' });
};

export const getShellPack = (packId: number | string): AxiosPromise<ShellPackVO> => {
  return request({ url: '/infra/ops/shell-pack/' + packId, method: 'get' });
};

/** 购买（创建待付款订单，重复点击复用未完成订单） */
export const purchaseShellPack = (packId: number): AxiosPromise<Record<string, any>> => {
  return request({ url: '/infra/ops/shell-pack/purchase', method: 'post', data: { id: packId } });
};

/** 订单列表 */
export const listShellPackOrders = (query?: { status?: number; buyerId?: number; pageNum?: number; pageSize?: number }): AxiosPromise<PageResult<ShellPackOrderVO>> => {
  return request({ url: '/infra/ops/shell-pack/order/list', method: 'get', params: query });
};

export const payShellPackOrder = (orderId: number | string): AxiosPromise => {
  return request({ url: '/infra/ops/shell-pack/order/pay/' + orderId, method: 'put' });
};

export const cancelShellPackOrder = (orderId: number | string): AxiosPromise => {
  return request({ url: '/infra/ops/shell-pack/order/cancel/' + orderId, method: 'put' });
};

/** 对接文档 */
export const listShellPackDocs = (): AxiosPromise<ShellPackDocVO[]> => {
  return request({ url: '/infra/ops/shell-pack/docs', method: 'get' });
};
