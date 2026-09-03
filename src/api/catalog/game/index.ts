import type { AxiosPromise } from '@/utils/api-types';
import type { PageResult } from '@/api/types';
import request from '@/utils/request';
import type { GameCatalogForm, GameCatalogQuery, GameCatalogVO } from './types';

/** 分页查询游戏目录 */
export const listGameCatalog = (query?: GameCatalogQuery): AxiosPromise<PageResult<GameCatalogVO>> => {
  return request({
    url: '/infra/catalog/game/list',
    method: 'get',
    params: query
  });
};

/** 游戏详情 */
export const getGameCatalog = (id: string | number): AxiosPromise<GameCatalogVO> => {
  return request({
    url: '/infra/catalog/game/' + id,
    method: 'get'
  });
};

/** 新增游戏 */
export const addGameCatalog = (data: GameCatalogForm) => {
  return request({
    url: '/infra/catalog/game',
    method: 'post',
    data: data
  });
};

/** 修改游戏 */
export const updateGameCatalog = (data: GameCatalogForm) => {
  return request({
    url: '/infra/catalog/game',
    method: 'put',
    data: data
  });
};

/** 删除游戏 */
export const delGameCatalog = (id: string | number | Array<string | number>) => {
  return request({
    url: '/infra/catalog/game/' + id,
    method: 'delete'
  });
};

/** 启停 */
export const changeGameCatalogStatus = (id: string | number, status: number) => {
  return request({
    url: '/infra/catalog/game/changeStatus',
    method: 'put',
    data: { id, status }
  });
};
