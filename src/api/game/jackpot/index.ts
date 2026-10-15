import type { AxiosPromise } from '@/utils/api-types';
import type { PageResult } from '@/api/types';
import request from '@/utils/request';
import type {
  JackpotContributionVO,
  JackpotFlowQuery,
  JackpotPoolAuditVO,
  JackpotPoolConfigRow,
  JackpotPoolOverviewVO,
  JackpotPoolQuery,
  JackpotRecordVO
} from './types';

/**
 * 彩金池管理（奖池运营台）接口。
 *
 * 背景：该菜单从「大厅展示配置」重定位为「真实奖池运营台」——
 * 主体是 slot 域生产在跑的奖池台账与三类流水，展示配置降为其中一个页签。
 * 写侧只有一处（修改初始值），必须经 Dubbo 回 slot，保证 DB + Redis 同源并写审计。
 */

/** 奖池台账分页（slot_jackpot_pool） */
export const listJackpotPools = (query?: JackpotPoolQuery): AxiosPromise<PageResult<JackpotPoolOverviewVO>> =>
  request({ url: '/infra/game/jackpot/pool/overview', method: 'get', params: query });

/** 派奖流水分页（slot_jackpot_record） */
export const listJackpotRecords = (query?: JackpotFlowQuery): AxiosPromise<PageResult<JackpotRecordVO>> =>
  request({ url: '/infra/game/jackpot/record/list', method: 'get', params: query });

/** 注入逐笔分页（slot_jackpot_contribution） */
export const listJackpotContributions = (
  query?: JackpotFlowQuery
): AxiosPromise<PageResult<JackpotContributionVO>> =>
  request({ url: '/infra/game/jackpot/contribution/list', method: 'get', params: query });

/** 奖池参数变更审计分页（slot_jackpot_pool_audit） */
export const listJackpotPoolAudits = (query?: JackpotFlowQuery): AxiosPromise<PageResult<JackpotPoolAuditVO>> =>
  request({ url: '/infra/game/jackpot/pool/audit', method: 'get', params: query });

/** 某游戏各层奖池实时参数快照（slot 侧 Redis 权威，Dubbo） */
export const getJackpotPoolConfigs = (gameCode: string): AxiosPromise<JackpotPoolConfigRow[]> =>
  request({ url: '/infra/game/jackpot/pool/list', method: 'get', params: { gameCode } });

/**
 * 修改某层奖池初始值（初始值只做展示与下限，永不派出）。
 *
 * 前置条件：amount ≥ 0、reason 非空（审计要求）。写侧由 slot 同时更新 DB + Redis 并写审计。
 */
export const updateJackpotInitialAmount = (data: {
  gameCode: string;
  jackpotType: string;
  amount: number;
  reason: string;
}): AxiosPromise<void> => request({ url: '/infra/game/jackpot/pool/initial', method: 'post', data });

/**
 * 运营手动配置某层奖池参数并让游戏生效（门槛 K_low / 上限 K_high / 命中率 p，可同时改初始值）。
 *
 * 三态语义（与后端一致）：字段缺省/null = 不改动；传 0 = 清除覆盖（恢复代码推导值）；传 >0 = 设为该值。
 * 校验与审计都在 slot 侧完成（窗口来自该游戏的 GameConfig），保存后下一局判定即生效。
 */
export const updateJackpotPoolParams = (data: {
  gameCode: string;
  jackpotType: string;
  gateLow?: number | null;
  gateHigh?: number | null;
  hitRate?: number | null;
  initialAmount?: number | null;
  reason: string;
}): AxiosPromise<void> => request({ url: '/infra/game/jackpot/pool/params', method: 'post', data });
