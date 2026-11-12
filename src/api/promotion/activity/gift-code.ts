import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

export interface PromoGiftCodeBatch {
  batchId: number;
  batchName: string;
  currency: string;
  rewardMode: 'FIXED' | 'RANDOM';
  rewardValue: number;
  minAmount: number;
  maxAmount: number;
  totalCount: number;
  usedCount: number;
  perUserLimit: number;
  applyTerminals?: string;
  auditMultiple?: number;
  validStartAt?: string;
  expireAt?: string;
  status: number;
  titleZh?: string;
  titleVi?: string;
  operatorId?: string;
  createdAt?: string;
}

export const listGiftCodeBatches = (query?: Record<string, unknown>): AxiosPromise<PromoGiftCodeBatch[]> =>
  request({ url: '/infra/promotion/gift-code/batch/list', method: 'get', params: query });

export const saveGiftCodeBatch = (data: Partial<PromoGiftCodeBatch>): AxiosPromise<number> =>
  request({ url: '/infra/promotion/gift-code/batch/save', method: 'post', data });

export const setGiftCodeBatchStatus = (batchId: number, status: number): AxiosPromise<void> =>
  request({ url: `/infra/promotion/gift-code/batch/${batchId}/status/${status}`, method: 'post' });

export const generateGiftCodes = (batchId: number, count: number): AxiosPromise<string[]> =>
  request({ url: `/infra/promotion/gift-code/batch/${batchId}/generate`, method: 'post', params: { count } });

export const importGiftCodes = (batchId: number, codes: string[]): AxiosPromise<number> =>
  request({ url: `/infra/promotion/gift-code/batch/${batchId}/import`, method: 'post', data: codes });

export const listGiftCodes = (batchId: number, limit = 500): AxiosPromise<Array<Record<string, unknown>>> =>
  request({ url: `/infra/promotion/gift-code/batch/${batchId}/codes`, method: 'get', params: { limit } });
