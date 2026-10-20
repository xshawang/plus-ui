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
}

export const listValidBetRatio = (params?: { keyword?: string; status?: number }): AxiosPromise<ValidBetRatioVO[]> =>
  request({ url: '/infra/game/valid-bet-ratio/list', method: 'get', params });

export const saveValidBetRatio = (data: ValidBetRatioVO): AxiosPromise<void> =>
  request({ url: '/infra/game/valid-bet-ratio/save', method: 'post', data });

export const batchSaveValidBetRatio = (data: ValidBetRatioVO[]): AxiosPromise<number> =>
  request({ url: '/infra/game/valid-bet-ratio/batch', method: 'post', data });

export const seedMissingValidBetRatio = (): AxiosPromise<number> =>
  request({ url: '/infra/game/valid-bet-ratio/seed-missing', method: 'post' });
