import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { RtpConfigResult, RtpGamesResult, RtpSaveBody } from './types';

/** 14 款 slot 游戏 + 当前 RTP 配置 */
export const getRtpGames = (): AxiosPromise<RtpGamesResult> => {
  return request({
    url: '/infra/catalog/rtp/games',
    method: 'get'
  });
};

/** 读取 Nacos 全量配置 */
export const getRtpConfig = (): AxiosPromise<RtpConfigResult> => {
  return request({
    url: '/infra/catalog/rtp/config',
    method: 'get'
  });
};

/** 保存 RTP 配置并发布到 Nacos */
export const saveRtpConfig = (data: RtpSaveBody) => {
  return request({
    url: '/infra/catalog/rtp/config',
    method: 'put',
    data: data
  });
};

/** 强制从 Nacos 重载 */
export const reloadRtpConfig = (): AxiosPromise<RtpConfigResult> => {
  return request({
    url: '/infra/catalog/rtp/reload',
    method: 'post'
  });
};
