import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { ClientConfigInfo, ClientConfigItem, ClientConfigSaveBody } from './types';

/** 文件与库概况 */
export const getClientConfigInfo = (): AxiosPromise<ClientConfigInfo> => {
  return request({
    url: '/infra/catalog/client-config/info',
    method: 'get'
  });
};

/** 解密 8go88.bin 并同步 DB */
export const syncClientConfig = (): AxiosPromise<ClientConfigItem[]> => {
  return request({
    url: '/infra/catalog/client-config/sync',
    method: 'post'
  });
};

/** 全量配置项 */
export const listClientConfigItems = (): AxiosPromise<ClientConfigItem[]> => {
  return request({
    url: '/infra/catalog/client-config/items',
    method: 'get'
  });
};

/** 更新属性说明（仅 DB） */
export const updateClientConfigDescription = (configKey: string, description: string) => {
  return request({
    url: '/infra/catalog/client-config/description',
    method: 'put',
    data: { configKey, description }
  });
};

/** 保存配置；writeFile=true 时加密回写 8go88.bin */
export const saveClientConfig = (data: ClientConfigSaveBody): AxiosPromise<ClientConfigInfo> => {
  return request({
    url: '/infra/catalog/client-config/save',
    method: 'put',
    data: data
  });
};
