import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';

/**
 * 投注记录 / 游戏统计 / 会员投注细目接口（游戏域三个并列菜单）。
 *
 * 背景：三者共享同一份注单事实与同一套时间筛选，差异只在聚合维度，
 * 因此聚合在一个文件，前端页面按需引用。
 */

/** 投注明细 / 主播号投注明细 / 投注明细(按代理线) 共用列表（tab 区分） */
export const listGameBetDetail = (query?: any): AxiosPromise<PageResult<any>> =>
  request({ url: '/infra/game/bet/detail/list', method: 'get', params: query });

/** 筛选下拉与提示条（提示条原文：金额类列仅支持一日内查询） */
export const gameBetOptions = (tab?: string): AxiosPromise<any> =>
  request({ url: '/infra/game/bet/options', method: 'get', params: { tab } });

/** 批量备注 */
export const saveGameBetRemark = (data: { rows: any[]; remark: string }): AxiosPromise<number> =>
  request({ url: '/infra/game/bet/remark', method: 'put', data });

/** 投注统计（类型统计 + 子游戏统计 + 会员信息条，一次返回避免中间态） */
export const gameBetStat = (query?: any): AxiosPromise<any> =>
  request({ url: '/infra/game/bet/stat', method: 'get', params: query });

/** 游戏统计（dimension=TYPE/GAME） */
export const gameStatList = (query?: any): AxiosPromise<any[]> =>
  request({ url: '/infra/game/bet/game-stat/list', method: 'get', params: query });

/** 会员投注细目 */
export const memberBetDetailList = (query?: any): AxiosPromise<any[]> =>
  request({ url: '/infra/game/bet/member-detail/list', method: 'get', params: query });

/**
 * 会员投注细目（分页 + 6 维度筛选；截图「会员投注细目」）。
 * accountField：EXACT_ACCOUNT 精准账号 / FUZZY_ACCOUNT 模糊账号 / UID 会员ID /
 *               PARENT_AGENT 上级代理ID / MEMBER_LEVEL 会员层级 / CHANNEL 渠道名称(ID)
 */
export const memberBetDetailPage = (query?: any): AxiosPromise<PageResult<any>> =>
  request({ url: '/infra/game/bet/member-detail/page', method: 'get', params: query });

/** 默认统计区间（近 7 天，对齐截图 2026-09-08 ~ 2026-09-14） */
export const gameBetDefaultRange = (): AxiosPromise<string[]> =>
  request({ url: '/infra/game/bet/default-range', method: 'get' });
