import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type {
  BetRecordVO,
  ReconcileDiffVO,
  RemoteVendorVO,
  VendorConfigVO,
  VendorGameVO,
  VendorImportResult,
  VendorPlatformVO,
  WalletTxnVO
} from './types';

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

// ---------- 游戏上下架（厂商级 + 游戏级），改动即时同步到玩家大厅 ----------

export const listVendorPlatforms = (): AxiosPromise<VendorPlatformVO[]> => request({ url: `${BASE}/platforms`, method: 'get' });

export const listVendorGames = (params: Record<string, unknown>): AxiosPromise<PageResult<VendorGameVO>> =>
  request({ url: `${BASE}/games`, method: 'get', params });

export const setVendorGamesStatus = (codes: string[], status: number): AxiosPromise<{ rows: number }> =>
  request({ url: `${BASE}/games/status`, method: 'put', data: { codes, status } });

export const setVendorGameMaintenance = (gameCode: string, maintenance: number, message?: string): AxiosPromise<void> =>
  request({ url: `${BASE}/games/${gameCode}/maintenance`, method: 'put', data: { maintenance, message } });

export const setVendorGameDisplay = (gameCode: string, isTop: number, sortOrder: number): AxiosPromise<void> =>
  request({ url: `${BASE}/games/${gameCode}/display`, method: 'put', data: { isTop, sortOrder } });

export const setVendorPlatformStatus = (providerCode: string, status: number): AxiosPromise<void> =>
  request({ url: `${BASE}/platforms/${providerCode}/status`, method: 'put', data: { status } });

export const setVendorPlatformGamesStatus = (providerCode: string, status: number): AxiosPromise<{ rows: number }> =>
  request({ url: `${BASE}/platforms/${providerCode}/games/status`, method: 'put', data: { status } });

export const setVendorPlatformMaintenance = (providerCode: string, maintenance: number, message?: string): AxiosPromise<void> =>
  request({ url: `${BASE}/platforms/${providerCode}/maintenance`, method: 'put', data: { maintenance, message } });

export const setVendorPlatformDisplay = (providerCode: string, isTop: number, sortOrder: number): AxiosPromise<void> =>
  request({ url: `${BASE}/platforms/${providerCode}/display`, method: 'put', data: { isTop, sortOrder } });
