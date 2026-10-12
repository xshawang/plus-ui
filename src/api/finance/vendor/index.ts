import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

/**
 * 三方场馆资金管理接口（需求文档 2_财务/12）。
 *
 * 后端：go88-service-infra /infra/finance/vendor/**；权限沿用 finance:manual-adjust:list|edit。
 * 未接入厂商接口的场馆 integrated=false，只能走"人工确认拉回"（需场馆转出流水号与凭证）。
 */
export interface VendorWalletVO {
  vendorCode: string;
  vendorName: string;
  integrated: boolean;
  balance?: number;
  note?: string;
}

export interface VendorPullBackForm {
  uid?: number;
  account?: string;
  vendorCode: string;
  amount: number;
  externalTxnNo: string;
  voucherUrl: string;
  remark?: string;
  requestId?: string;
}

export const listVendorWallets = (params: { uid?: number; account?: string }): AxiosPromise<VendorWalletVO[]> =>
  request({ url: '/infra/finance/vendor/list', method: 'get', params });

export const pullBackVendor = (data: VendorPullBackForm): AxiosPromise<Record<string, unknown>> =>
  request({ url: '/infra/finance/vendor/pullback', method: 'post', data });
