import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { MemberBetDailyVO, MemberBetQuery, MemberBetSummaryVO } from './types';

/**
 * 会员投注细目接口（03 文档）。
 * 权限：member:bet:list
 * 数据源：荷官桌注单 game_dealer_round_bet（其他玩法明细待并入）。
 */
export const listMemberBetDetail = (query?: MemberBetQuery): AxiosPromise<any> => {
  return request({
    url: '/infra/member/bet/detail/list',
    method: 'get',
    params: query
  });
};

/** 输赢分析：单会员按日趋势 */
export const listMemberWinLoss = (uid: number | string, startDate?: string, endDate?: string, granularity = 'DAY'): AxiosPromise<MemberBetDailyVO[]> => {
  return request({
    url: '/infra/member/bet/win-loss/' + uid,
    method: 'get',
    params: { startDate, endDate, granularity }
  });
};

/** 列表上方按游戏统计 */
export const listMemberBetSummary = (query?: MemberBetQuery): AxiosPromise<any[]> => {
  return request({ url: '/infra/member/bet/summary', method: 'get', params: query });
};

/** 累计投注/派发/差额（懒加载） */
export const getMemberBetCumulative = (query?: MemberBetQuery): AxiosPromise<any> => {
  return request({ url: '/infra/member/bet/cumulative', method: 'get', params: query });
};

/** 有注单数据的游戏编码（筛选下拉） */
export const listMemberBetGameCodes = (): AxiosPromise<string[]> => {
  return request({
    url: '/infra/member/bet/game-codes',
    method: 'get'
  });
};
