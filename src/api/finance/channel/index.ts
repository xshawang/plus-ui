import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  FinanceChannelGroupForm,
  FinanceChannelGroupVO,
  FinanceChannelQuery,
  FinanceChannelRouteForm,
  FinanceChannelRouteVO
} from './types';

/**
 * 充值大类与通道路由接口（需求文档 2_财务/02）。
 *
 * 后端：go88-service-infra /infra/finance/channel/**；权限：finance:channel:list | finance:channel:edit
 */
export const listChannelGroups = (query?: FinanceChannelQuery): AxiosPromise<FinanceChannelGroupVO[]> =>
  request({ url: '/infra/finance/channel/groups', method: 'get', params: { ...query, withRoutes: true } });

export const listChannelRoutes = (query?: FinanceChannelQuery): AxiosPromise<FinanceChannelRouteVO[]> =>
  request({ url: '/infra/finance/channel/routes', method: 'get', params: query });

export const saveChannelGroup = (data: FinanceChannelGroupForm): AxiosPromise<number> =>
  request({ url: '/infra/finance/channel/group', method: 'post', data });

export const saveChannelRoute = (data: FinanceChannelRouteForm): AxiosPromise<number> =>
  request({ url: '/infra/finance/channel/route', method: 'post', data });

export const sortChannelGroup = (groupId: number, sortNo: number): AxiosPromise<number> =>
  request({ url: `/infra/finance/channel/group/${groupId}/sort/${sortNo}`, method: 'put' });

export const sortChannelRoute = (routeId: number, subSort: number): AxiosPromise<number> =>
  request({ url: `/infra/finance/channel/route/${routeId}/sort/${subSort}`, method: 'put' });

export const changeChannelGroupStatus = (groupId: number, status: number): AxiosPromise<number> =>
  request({ url: `/infra/finance/channel/group/${groupId}/status/${status}`, method: 'put' });

export const changeChannelRouteSwitch = (routeId: number, field: string, value: number): AxiosPromise<number> =>
  request({ url: `/infra/finance/channel/route/${routeId}/switch/${field}/${value}`, method: 'put' });

export const deleteChannelRoute = (routeId: number): AxiosPromise<number> =>
  request({ url: `/infra/finance/channel/route/${routeId}`, method: 'delete' });
