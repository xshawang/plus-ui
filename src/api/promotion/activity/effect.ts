import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

export const listActivityEffect = (query: Record<string, unknown>): AxiosPromise<Array<Record<string, unknown>>> =>
  request({ url: '/infra/promotion/activity/effect/list', method: 'get', params: query });

export const getActivityEffectSummary = (query: Record<string, unknown>): AxiosPromise<Record<string, unknown>> =>
  request({ url: '/infra/promotion/activity/effect/summary', method: 'get', params: query });

export const listActivityRanking = (query: Record<string, unknown>): AxiosPromise<Array<Record<string, unknown>>> =>
  request({ url: '/infra/promotion/activity/effect/ranking', method: 'get', params: query });
