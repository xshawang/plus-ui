import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

export interface GatewayAttrRow {
  key: string;
  type: 'bool' | 'int' | 'long' | 'string' | 'string-list' | 'ban-tiers' | 'action-matrix';
  value: unknown;
  recommendedValue: unknown;
  description: string;
  editable: boolean;
}

export const listGatewayAttrs = (): AxiosPromise<GatewayAttrRow[]> =>
  request({ url: '/infra/risk/gateway/attributes', method: 'get' });

export const saveGatewayAttrs = (items: Array<{ key: string; value: unknown }>, reason: string) =>
  request({ url: '/infra/risk/gateway/attributes', method: 'put', data: { items, reason } });
