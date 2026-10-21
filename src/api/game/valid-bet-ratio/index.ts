import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

export interface ValidBetRatioVO {
  gameCode: string;
  gameName?: string;
  ratioPercent: number;
  status?: number;
  remark?: string;
  operatorId?: string;
  updatedAt?: string;
  /** 游戏类型编码（game_catalog.game_type） */
  gameType?: number;
  /** 游戏类型名称（game_type_config.type_name） */
  gameTypeName?: string;
}

export interface ValidBetRatioQuery {
  keyword?: string;
  status?: number;
  /** 游戏类型编码 */
  gameType?: number;
}

export interface ValidBetRatioTypeOption {
  gameType: number;
  gameTypeName?: string;
}

export const listValidBetRatio = (params?: ValidBetRatioQuery): AxiosPromise<ValidBetRatioVO[]> =>
  request({ url: '/infra/game/valid-bet-ratio/list', method: 'get', params });

/** 游戏类型下拉（game_catalog.game_type + game_type_config.type_name） */
export const listValidBetRatioTypeOptions = (): AxiosPromise<ValidBetRatioTypeOption[]> =>
  request({ url: '/infra/game/valid-bet-ratio/type-options', method: 'get' });

export const saveValidBetRatio = (data: ValidBetRatioVO): AxiosPromise<void> =>
  request({ url: '/infra/game/valid-bet-ratio/save', method: 'post', data });

export const batchSaveValidBetRatio = (data: ValidBetRatioVO[]): AxiosPromise<number> =>
  request({ url: '/infra/game/valid-bet-ratio/batch', method: 'post', data });

export const seedMissingValidBetRatio = (): AxiosPromise<number> =>
  request({ url: '/infra/game/valid-bet-ratio/seed-missing', method: 'post' });
