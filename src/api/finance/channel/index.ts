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
  request({ url: '/infra/finance/channel/groups', method: 'get', params: { ...query, withRoutes: true, withStats: true } });

/** 大类整组重排：groupIds 为全部大类的新顺序 */
export const reorderChannelGroups = (groupIds: number[]): AxiosPromise<number> =>
  request({ url: '/infra/finance/channel/groups/reorder', method: 'put', data: { ids: groupIds } });

/** 子通道整组重排：routeIds 为该大类下全部子通道的新顺序 */
export const reorderChannelRoutes = (groupId: number, routeIds: number[]): AxiosPromise<number> =>
  request({ url: '/infra/finance/channel/routes/reorder', method: 'put', data: { groupId, ids: routeIds } });

export const updateChannelRouteRemark = (routeId: number, remark: string): AxiosPromise<number> =>
  request({ url: `/infra/finance/channel/route/${routeId}/remark`, method: 'put', data: { remark } });

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
