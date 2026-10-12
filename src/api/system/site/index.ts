import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { PageResult } from '@/api/types';
import type { SiteForm, SiteOptions, SiteQuery, SiteVO } from './types';

/** 页面下拉与顶部信息（站点/币种/字典） */
export const getSiteOptions = (): AxiosPromise<SiteOptions> => {
  return request({ url: '/infra/sys/site/options', method: 'get' });
};

/** 站点列表（页签「站点信息」） */
export const listSite = (query?: SiteQuery): AxiosPromise<PageResult<SiteVO>> => {
  return request({ url: '/infra/sys/site/list', method: 'get', params: query });
};

export const getSite = (siteId: string | number): AxiosPromise<SiteVO> => {
  return request({ url: '/infra/sys/site/' + siteId, method: 'get' });
};

export const addSite = (data: SiteForm): AxiosPromise => {
  return request({ url: '/infra/sys/site', method: 'post', data });
};

export const updateSite = (data: SiteForm): AxiosPromise => {
  return request({ url: '/infra/sys/site', method: 'put', data });
};

export const delSite = (ids: string[]): AxiosPromise => {
  return request({ url: '/infra/sys/site', method: 'delete', data: { ids } });
};

/** 行级「维护」（维护费 + 站点状态） */
export const maintainSite = (data: { siteId: string; maintainFee?: number; siteStatus?: number; remark?: string }): AxiosPromise => {
  return request({ url: '/infra/sys/site/maintain', method: 'put', data });
};

/** 行级「修改安全码」 */
export const changeSiteSecurityCode = (data: { siteId: string; securityCode: string }): AxiosPromise => {
  return request({ url: '/infra/sys/site/security-code', method: 'put', data });
};

/** 右上角「提现审核模式设置」 */
export const setWithdrawReviewMode = (data: { siteId: string; mode: number }): AxiosPromise => {
  return request({ url: '/infra/sys/site/withdraw-mode', method: 'put', data });
};

/** 行级「充币」（幂等：同单号只生效一次） */
export const rechargeSite = (data: {
  siteId: string;
  amount: number;
  currency?: string;
  orderNo?: string;
  payType?: string;
  thirdOrderNo?: string;
  remark?: string;
}): AxiosPromise => {
  return request({ url: '/infra/sys/site/recharge', method: 'post', data });
};

/** 关联页签分页（open/bill/balance/quota/coin/credit/fee） */
export const listSiteTab = (tab: string, query?: SiteQuery): AxiosPromise<PageResult<any>> => {
  return request({ url: `/infra/sys/site/tab/${tab}`, method: 'get', params: query });
};

export const saveSiteOpen = (data: Record<string, any>): AxiosPromise => {
  return request({ url: '/infra/sys/site/open', method: 'post', data });
};

export const saveSiteQuota = (data: Record<string, any>): AxiosPromise => {
  return request({ url: '/infra/sys/site/quota', method: 'post', data });
};

export const saveSiteCredit = (data: Record<string, any>): AxiosPromise => {
  return request({ url: '/infra/sys/site/credit', method: 'post', data });
};

export const saveSiteFee = (data: Record<string, any>): AxiosPromise => {
  return request({ url: '/infra/sys/site/fee', method: 'post', data });
};

/** 按收费标准生成账单（同站点同月同类型幂等） */
export const generateSiteBill = (data: { siteId: string; billMonth: string; billType?: number }): AxiosPromise => {
  return request({ url: '/infra/sys/site/bill/generate', method: 'post', data });
};

/** 账单结算（扣减站点余额并写余额账变） */
export const settleSiteBill = (billId: string | number): AxiosPromise => {
  return request({ url: `/infra/sys/site/bill/${billId}/settle`, method: 'put' });
};
