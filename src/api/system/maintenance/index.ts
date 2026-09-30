import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { MaintenanceForm, MaintenanceResult } from './types';

/**
 * 维护开关列表（含下发版本号，页面据此判断"是否已同步到游戏侧"）
 * 后端：go88-service-infra GET /infra/sys/maintenance/list
 */
export const listMaintenance = (): AxiosPromise<MaintenanceResult> => {
  return request({ url: '/infra/sys/maintenance/list', method: 'get' });
};

/** 保存某个模块的维护开关并立即下发 */
export const saveMaintenance = (data: MaintenanceForm): AxiosPromise<{ version: number }> => {
  return request({ url: '/infra/sys/maintenance', method: 'put', data });
};

/** 强制重推配置到游戏侧 */
export const pushMaintenance = (): AxiosPromise<{ version: number }> => {
  return request({ url: '/infra/sys/maintenance/push', method: 'post' });
};
