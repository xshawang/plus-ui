import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type {
  WithdrawCardConfigForm,
  WithdrawCardConfigVO,
  WithdrawChannelProfileForm,
  WithdrawChannelProfileVO,
  WithdrawChannelQuery,
  WithdrawClientManifest,
  WithdrawCryptoPlatformForm,
  WithdrawCryptoPlatformVO,
  WithdrawTabForm,
  WithdrawTabVO
} from './types';

/** 财务管理 → 提现通道管理；权限 finance:withdrawchannel:list|edit。 */
export const listWithdrawTabs = (): AxiosPromise<WithdrawTabVO[]> =>
  request({ url: '/infra/finance/withdraw-channel/tabs', method: 'get' });

export const saveWithdrawTabs = (data: WithdrawTabForm[]): AxiosPromise<WithdrawClientManifest> =>
  request({ url: '/infra/finance/withdraw-channel/tabs', method: 'post', data });

export const changeWithdrawTabStatus = (tabId: number, status: number): AxiosPromise<number> =>
  request({ url: `/infra/finance/withdraw-channel/tabs/${tabId}/status/${status}`, method: 'put' });

export const getWithdrawClientManifest = (): AxiosPromise<WithdrawClientManifest> =>
  request({ url: '/infra/finance/withdraw-channel/client-manifest', method: 'get' });

export const listWithdrawChannelProfiles = (
  query?: WithdrawChannelQuery
): AxiosPromise<WithdrawChannelProfileVO[]> =>
  request({ url: '/infra/finance/withdraw-channel/channels', method: 'get', params: query });

export const saveWithdrawChannelProfile = (data: WithdrawChannelProfileForm): AxiosPromise<number> =>
  request({ url: '/infra/finance/withdraw-channel/channel', method: 'post', data });

export const changeWithdrawChannelStatus = (id: number, status: number): AxiosPromise<number> =>
  request({ url: `/infra/finance/withdraw-channel/${id}/status/${status}`, method: 'put' });

export const listWithdrawCardConfigs = (platform = 'go88'): AxiosPromise<WithdrawCardConfigVO[]> =>
  request({ url: '/infra/finance/withdraw-channel/card-configs', method: 'get', params: { platform } });

export const saveWithdrawCardConfig = (data: WithdrawCardConfigForm): AxiosPromise<number> =>
  request({ url: '/infra/finance/withdraw-channel/card-config', method: 'post', data });

export const listWithdrawCryptoPlatforms = (): AxiosPromise<WithdrawCryptoPlatformVO[]> =>
  request({ url: '/infra/finance/withdraw-channel/crypto-platforms', method: 'get' });

export const saveWithdrawCryptoPlatforms = (
  data: WithdrawCryptoPlatformForm[]
): AxiosPromise<WithdrawCryptoPlatformVO[]> =>
  request({ url: '/infra/finance/withdraw-channel/crypto-platforms', method: 'put', data });
