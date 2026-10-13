import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { RiskBetPeaksMeta, RiskRecordQuery, RiskReleaseForm, RiskRecordVO } from './types';

/**
 * 风控记录分页查询（只读）。
 *
 * 说明：接口由 **go88-service-infra** 提供（`/infra/risk/records`）。
 * 2026-09-29 由 go88-service-live 迁入 infra —— 原因是 live 没有 `/infra/**` 的登录+权限点拦截
 * （子服务 `@SaCheckPermission` 不生效），`/live/risk/**` 匿名即可读记录、解封封禁。
 * 权限点：risk:center:list。
 */
export const listRiskRecords = (query?: RiskRecordQuery): AxiosPromise<{ total: number; rows: RiskRecordVO[] }> => {
  return request({ url: '/infra/risk/records', method: 'get', params: query });
};

/** 解封（后端 `@SaCheckPermission("risk:center:release")`，操作人取自登录会话）。 */
export const releaseRisk = (data: RiskReleaseForm): AxiosPromise<boolean> => {
  return request({ url: '/infra/risk/release', method: 'post', data });
};

/**
 * 下注频率观测（FIX-10 阈值标定，只读）。
 *
 * 数据来自网关写的 Redis 哈希 `go88:risk:cnt:bet:peak`（历史峰值笔/秒，TTL 1 天）；
 * 当前限频为 dry-run（只统计不拦截），阈值确认后才在业务层实现。
 */
export const listBetPeaks = (top = 20): AxiosPromise<Array<{ uid: string; peakPerSecond: number }>> => {
  return request({ url: '/infra/risk/bet-peaks', method: 'get', params: { top } });
};

/**
 * 下注频率采集健康度（FIX-10 C 项）。
 *
 * 为什么要单独一个请求：/bet-peaks 的 data 是列表（契约不能改），空列表无法区分
 * 「采集链路没工作」与「确实没有高频下注」，meta 用 emptyReason + 活性字段给出结论。
 */
export const getBetPeaksMeta = (): AxiosPromise<RiskBetPeaksMeta> => {
  return request({ url: '/infra/risk/bet-peaks/meta', method: 'get' });
};
