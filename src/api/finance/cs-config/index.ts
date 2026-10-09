import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

/**
 * 客服代充渠道配置接口（财务管理 → 客服代充 → 代充配置；需求文档 2_财务/07）。
 *
 * 后端：go88-service-infra /infra/finance/cs-channel/**；
 * 权限：finance:cs-config:list（查询）/ finance:cs-config:edit（新增/修改/启停/删除）。
 * 口径（2026-10-09 用户确认）：赠送气泡总开关独立 KV（cs_bubble_enabled）；
 * 客服类型/充值类型取字典；支持币种多选；同渠道层级唯一、未命中回落默认层级；
 * 建代充单时按「客服渠道 + 会员层级」自动带出赠送金额。
 */
export interface CsChannelQuery {
  csName?: string;
  csTypeCode?: string;
  status?: number;
  levelId?: number;
  pageNum?: number;
  pageSize?: number;
}

/** 赠送比例明细行 */
export interface CsGiftRatioItem {
  levelId?: number;
  levelName?: string;
  /**
   * 赠送比例（%）。后端 JSON 里 decimal 会序列化成字符串（如 "5.00"），
   * 页面统一用 Number() 归一后再绑定，因此这里按 number 声明。
   */
  giftRate?: number;
}

export interface CsChannelVO {
  configId: number;
  csTypeCode?: string;
  csTypeLabel?: string;
  csName?: string;
  contactAccount?: string;
  /** 充值类型码（逗号分隔原值，编辑回显用） */
  rechargeTypes?: string;
  rechargeTypeLabels?: string;
  linkMode?: string;
  linkModeLabel?: string;
  csLink?: string;
  levelId?: number;
  levelName?: string;
  status?: number;
  currencyCodes?: string;
  currencyLabels?: string;
  bubbleShow?: number;
  bubbleColor?: string;
  /** 气泡是否真正生效（本渠道开启 且 全局总开关开启） */
  bubbleEffective?: boolean;
  bubbleEnabledGlobal?: number;
  remark?: string;
  operatorId?: string;
  createdAt?: string;
  updatedAt?: string;
  giftRatios?: CsGiftRatioItem[];
}

export interface CsChannelForm {
  csTypeCode?: string;
  csName?: string;
  contactAccount?: string;
  rechargeTypes?: string[];
  linkMode?: string;
  csLink?: string;
  levelId?: number;
  status?: number;
  currencyCodes?: string[];
  bubbleShow?: number;
  bubbleColor?: string;
  remark?: string;
  giftRatios?: CsGiftRatioItem[];
}

/** 弹窗下拉数据源 + 赠送气泡总开关 */
export interface CsChannelOptionsVO {
  csTypes: Array<{ value: string; label: string }>;
  rechargeTypes: Array<{ value: string; label: string }>;
  currencies: Array<{ value: string; label: string; ratio?: string; masterSwitch?: number }>;
  levels: Array<{ value: string; label: string }>;
  bubbleColors: string[];
  linkModes: Array<{ value: string; label: string }>;
  bubbleEnabled: boolean;
}

/** 赠送比例命中结果 */
export interface CsGiftResolutionVO {
  levelId?: number;
  levelName?: string;
  giftRate?: number | string;
  /** EXACT 命中会员层级 / DEFAULT 回落默认层级 / NONE 未配置 */
  matched?: string;
}

/** 分页查询客服渠道配置 */
export const listCsChannels = (query?: CsChannelQuery): AxiosPromise<PageResult<CsChannelVO>> =>
  request({ url: '/infra/finance/cs-channel/list', method: 'get', params: query });

/** 详情（编辑回显） */
export const getCsChannel = (configId: number): AxiosPromise<CsChannelVO> =>
  request({ url: `/infra/finance/cs-channel/${configId}`, method: 'get' });

/** 下拉数据源（客服类型/充值类型/币种/会员层级/气泡总开关） */
export const getCsChannelOptions = (): AxiosPromise<CsChannelOptionsVO> =>
  request({ url: '/infra/finance/cs-channel/options', method: 'get' });

/** 按「客服渠道 + 会员层级」取赠送比例（建单弹窗预览赠送金额） */
export const getCsGiftRatio = (configId: number, uid?: number): AxiosPromise<CsGiftResolutionVO> =>
  request({ url: '/infra/finance/cs-channel/gift-ratio', method: 'get', params: { configId, uid } });

/** 新增客服渠道配置 */
export const createCsChannel = (data: CsChannelForm): AxiosPromise<Record<string, unknown>> =>
  request({ url: '/infra/finance/cs-channel', method: 'post', data });

/** 修改客服渠道配置（赠送比例整体覆盖） */
export const updateCsChannel = (configId: number, data: CsChannelForm): AxiosPromise<Record<string, unknown>> =>
  request({ url: `/infra/finance/cs-channel/${configId}`, method: 'put', data });

/** 开启 / 关闭 */
export const changeCsChannelStatus = (configId: number, status: number): AxiosPromise<Record<string, unknown>> =>
  request({ url: `/infra/finance/cs-channel/${configId}/status/${status}`, method: 'put' });

/** 删除（逻辑删） */
export const removeCsChannel = (configId: number): AxiosPromise<Record<string, unknown>> =>
  request({ url: `/infra/finance/cs-channel/${configId}`, method: 'delete' });
