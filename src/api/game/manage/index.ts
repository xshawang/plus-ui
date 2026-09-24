import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';

/**
 * 游戏管理接口（游戏 → 游戏管理：平台管理 / 子游戏管理 / 类型管理 / 模板管理）。
 *
 * 为什么按页面聚合在同一个文件：四个页签共享同一套「游戏域」字典（类型/平台/角标），
 * 聚合后页面内不需要跨文件找接口；权限点在各方法注释中标注，便于与后端 @SaCheckPermission 对齐。
 */

/** 平台管理列表（截图 10 项筛选） */
export const listPlatform = (query?: any): AxiosPromise<PageResult<any>> =>
  request({ url: '/infra/game/platform/list', method: 'get', params: query });

/** 平台下拉（子游戏管理/全网排名联动） */
export const platformOptions = (gameType?: number): AxiosPromise<any[]> =>
  request({ url: '/infra/game/platform/options', method: 'get', params: { gameType } });

export const getPlatform = (id: number | string): AxiosPromise<any> =>
  request({ url: `/infra/game/platform/${id}`, method: 'get' });

/** 平台新增/修改（权限 game:platform:edit） */
export const addPlatform = (data: any): AxiosPromise<void> =>
  request({ url: '/infra/game/platform', method: 'post', data });

export const updatePlatform = (data: any): AxiosPromise<void> =>
  request({ url: '/infra/game/platform', method: 'put', data });

/** 平台开关单点切换：field ∈ hotTpl1/hotTpl2/featureTpl1/featureTpl2/platformStatus/... */
export const switchPlatformField = (data: { id: number; field: string; value: number }): AxiosPromise<void> =>
  request({ url: '/infra/game/platform/switch', method: 'put', data });

/** 维护开关 + 维护文案 */
export const updatePlatformMaintenance = (data: any): AxiosPromise<void> =>
  request({ url: '/infra/game/platform/maintenance', method: 'put', data });

/** 置顶 / 批量排序 */
export const sortPlatform = (rows: any[]): AxiosPromise<void> =>
  request({ url: '/infra/game/platform/sort', method: 'put', data: rows, headers: { repeatSubmit: false } });

export const delPlatform = (id: number | string): AxiosPromise<void> =>
  request({ url: `/infra/game/platform/${id}`, method: 'delete' });

/** 子游戏管理列表（截图 13 项筛选） */
export const listSubGame = (query?: any): AxiosPromise<PageResult<any>> =>
  request({ url: '/infra/game/subgame/list', method: 'get', params: query });

/** 子游戏开关/角标切换（热门/特色开关会同步模板明细，需带 gameCode） */
export const switchSubGameField = (data: any): AxiosPromise<void> =>
  request({ url: '/infra/game/subgame/switch', method: 'put', data });

export const updateSubGameMaintenance = (data: any): AxiosPromise<void> =>
  request({ url: '/infra/game/subgame/maintenance', method: 'put', data });

export const updateSubGameRemark = (data: any): AxiosPromise<void> =>
  request({ url: '/infra/game/subgame/remark', method: 'put', data });

/** 类型管理 */
export const listGameType = (currency?: string): AxiosPromise<any[]> =>
  request({ url: '/infra/game/type/list', method: 'get', params: { currency } });

export const gameTypeOptions = (currency?: string): AxiosPromise<any[]> =>
  request({ url: '/infra/game/type/options', method: 'get', params: { currency } });

export const addGameType = (data: any): AxiosPromise<void> =>
  request({ url: '/infra/game/type', method: 'post', data });

export const updateGameType = (data: any): AxiosPromise<void> =>
  request({ url: '/infra/game/type', method: 'put', data });

export const switchGameTypeField = (data: { id: number; field: string; value: number }): AxiosPromise<void> =>
  request({ url: '/infra/game/type/switch', method: 'put', data });

export const delGameType = (id: number | string): AxiosPromise<void> =>
  request({ url: `/infra/game/type/${id}`, method: 'delete' });

/** 模板管理（热门模板一/二、特色模板一/二） */
export const listTemplate = (currency?: string): AxiosPromise<any[]> =>
  request({ url: '/infra/game/template/list', method: 'get', params: { currency } });

export const listTemplateItem = (query?: any): AxiosPromise<PageResult<any>> =>
  request({ url: '/infra/game/template/item/list', method: 'get', params: query });

export const setTemplateActive = (id: number | string): AxiosPromise<void> =>
  request({ url: `/infra/game/template/active/${id}`, method: 'put' });

export const sortTemplateItem = (rows: any[]): AxiosPromise<void> =>
  request({ url: '/infra/game/template/item/sort', method: 'put', data: rows, headers: { repeatSubmit: false } });

export const removeTemplateItem = (data: { templateCode: string; gameCode: string }): AxiosPromise<void> =>
  request({ url: '/infra/game/template/item/remove', method: 'put', data });

/** 游戏公共配置 / 有效投注配置（平台管理右上角两个弹窗） */
export const getCommonConfig = (currency?: string): AxiosPromise<any> =>
  request({ url: '/infra/game/config/common', method: 'get', params: { currency } });

export const saveCommonConfig = (data: any): AxiosPromise<void> =>
  request({ url: '/infra/game/config/common', method: 'put', data });

export const getValidBetConfig = (currency?: string): AxiosPromise<any> =>
  request({ url: '/infra/game/config/valid-bet', method: 'get', params: { currency } });

export const saveValidBetConfig = (data: any): AxiosPromise<void> =>
  request({ url: '/infra/game/config/valid-bet', method: 'put', data });

/** 游戏全网排名 */
export const listGameRank = (query?: any): AxiosPromise<PageResult<any>> =>
  request({ url: '/infra/game/rank/list', method: 'get', params: query });

export const gameRankMemo = (): AxiosPromise<any> =>
  request({ url: '/infra/game/rank/memo', method: 'get' });

export const exportGameRank = (query?: any): AxiosPromise<any[]> =>
  request({ url: '/infra/game/rank/export', method: 'get', params: query });

/** 添加热门（写入当前生效的热门模板） */
export const addHotGame = (data: { providerCode: string; gameCode: string; currency?: string }): AxiosPromise<boolean> =>
  request({ url: '/infra/game/rank/add-hot', method: 'post', data });
