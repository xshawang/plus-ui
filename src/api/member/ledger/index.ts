import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { GameCodeOption, WalletLedgerQuery, WalletLedgerSummaryVO, WalletLedgerVO } from './types';

/**
 * 分页查询钱包流水
 *
 * 后端实现在 go88-service-infra：GET /member/ledger/list
 * 权限标识：member:ledger:list
 */
export const listWalletLedger = (query?: WalletLedgerQuery): AxiosPromise<PageResult<WalletLedgerVO>> => {
  return request({
    url: '/infra/member/ledger/list',
    method: 'get',
    params: query
  });
};

/**
 * 游戏下拉选项（game_catalog：game_code + 中文名）
 */
export const listLedgerGameCodes = (): AxiosPromise<GameCodeOption[]> => {
  return request({
    url: '/infra/member/ledger/game-codes',
    method: 'get'
  });
};

/**
 * 按查询条件分组统计（列表上方统计区）。
 *
 * 与列表接口同一套查询条件与权限点（member:ledger:list），但不分页——
 * 统计必须覆盖全部命中数据，否则翻页时统计值会随当前页抖动。
 */
export const getWalletLedgerSummary = (query?: WalletLedgerQuery): AxiosPromise<WalletLedgerSummaryVO> => {
  return request({
    url: '/infra/member/ledger/summary',
    method: 'get',
    params: query
  });
};
