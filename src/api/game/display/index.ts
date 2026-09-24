import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';

/**
 * 彩金池管理 / 中奖记录轮播接口（游戏域两个大厅展示位配置菜单）。
 *
 * 背景：两者都是「币种 + 展示位置 + 展示样式 + 是否展示」类配置，且都要实时预览，
 * 预览与客户端下发共用后端同一取数服务，因此聚合在一个文件。
 */

/** 彩金池管理 */
export const listJackpot = (query?: any): AxiosPromise<PageResult<any>> =>
  request({ url: '/infra/game/jackpot/list', method: 'get', params: query });

export const getJackpot = (id: number | string): AxiosPromise<any> =>
  request({ url: `/infra/game/jackpot/${id}`, method: 'get' });

/** 实时预览（弹窗右侧预览区） */
export const previewJackpot = (id: number | string): AxiosPromise<any> =>
  request({ url: `/infra/game/jackpot/preview/${id}`, method: 'get' });

export const addJackpot = (data: any): AxiosPromise<void> =>
  request({ url: '/infra/game/jackpot', method: 'post', data });

export const updateJackpot = (data: any): AxiosPromise<void> =>
  request({ url: '/infra/game/jackpot', method: 'put', data });

export const delJackpot = (id: number | string): AxiosPromise<void> =>
  request({ url: `/infra/game/jackpot/${id}`, method: 'delete' });

/** 中奖记录轮播 */
export const listCarousel = (query?: any): AxiosPromise<PageResult<any>> =>
  request({ url: '/infra/game/carousel/list', method: 'get', params: query });

export const getCarousel = (id: number | string): AxiosPromise<any> =>
  request({ url: `/infra/game/carousel/${id}`, method: 'get' });

/** 预览（弹窗右侧大奖记录预览） */
export const previewCarousel = (id: number | string): AxiosPromise<any[]> =>
  request({ url: `/infra/game/carousel/preview/${id}`, method: 'get' });

export const addCarousel = (data: any): AxiosPromise<number> =>
  request({ url: '/infra/game/carousel', method: 'post', data });

export const updateCarousel = (data: any): AxiosPromise<void> =>
  request({ url: '/infra/game/carousel', method: 'put', data });

/** 下架 / 上架 */
export const offlineCarousel = (id: number | string): AxiosPromise<void> =>
  request({ url: `/infra/game/carousel/offline/${id}`, method: 'put' });

export const onlineCarousel = (id: number | string): AxiosPromise<void> =>
  request({ url: `/infra/game/carousel/online/${id}`, method: 'put' });
