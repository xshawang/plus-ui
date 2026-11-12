import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type { BetRecordVO, ReconcileDiffVO, RemoteVendorVO, VendorConfigVO, VendorImportResult, WalletTxnVO } from './types';

/**
 * 游戏管理 → 厂商接入（OneAPI）。经 infra GameVendorAdminProxyController 转发到 go88-service-gamevendor，
 * 权限点 game:vendor:list / edit / sync / txn / secret。
 */
const BASE = '/infra/game/vendor';

export const getVendorConfig = (): AxiosPromise<VendorConfigVO> => request({ url: `${BASE}/config`, method: 'get' });

export const getVendorSecret = (): AxiosPromise<{ apiKey: string; apiSecret: string }> =>
  request({ url: `${BASE}/config/secret`, method: 'get' });

export const saveVendorConfig = (data: Partial<VendorConfigVO>): AxiosPromise<void> =>
  request({ url: `${BASE}/config`, method: 'put', data });

export const testVendorConfig = (): AxiosPromise<Record<string, unknown>> =>
  request({ url: `${BASE}/config/test`, method: 'post', timeout: 30000 });

export const listRemoteVendors = (language?: string): AxiosPromise<RemoteVendorVO[]> =>
  request({ url: `${BASE}/vendors/remote`, method: 'get', params: { language }, timeout: 30000 });

export const importVendor = (code: string, name: string): AxiosPromise<VendorImportResult> =>
  request({ url: `${BASE}/vendors/${code}/import`, method: 'post', data: { name }, timeout: 180000 });

export const listVendorTxns = (params: Record<string, unknown>): AxiosPromise<PageResult<WalletTxnVO>> =>
  request({ url: `${BASE}/txns`, method: 'get', params });

export const listVendorBets = (params: Record<string, unknown>): AxiosPromise<PageResult<BetRecordVO>> =>
  request({ url: `${BASE}/bets`, method: 'get', params });

export const listReconcileDiffs = (params: Record<string, unknown>): AxiosPromise<PageResult<ReconcileDiffVO>> =>
  request({ url: `${BASE}/reconcile/diffs`, method: 'get', params });

export const runReconcile = (minutes: number): AxiosPromise<Record<string, unknown>> =>
  request({ url: `${BASE}/reconcile/run`, method: 'post', params: { minutes }, timeout: 120000 });

export const terminateVendorPlayer = (uid: number): AxiosPromise<Record<string, unknown>> =>
  request({ url: `${BASE}/terminate/${uid}`, method: 'post' });
