import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';

/**
 * 优惠模块公共设置接口（活动设置 / 领取与审核设置 / 任务开关 / 盲盒设置 / 转盘设置 / 返水设置 / VIP 公共设置）。
 *
 * 后端：go88-service-infra（org.dromara.go88.promotion.controller.PromoModuleConfigController）
 * 权限：promotion:config:list / promotion:config:edit
 * 设计：与会员模块 useKvConfig 同构（分组 + 键 + JSON 值），前端复用同一组合式函数。
 */
export interface PromoConfigItemVO {
  configKey: string;
  configValue: string;
  configDesc?: string;
  operatorId?: string;
  updatedAt?: string;
}

export interface PromoConfigBatchForm {
  items: Array<{ configKey: string; configValue: string }>;
}

export const listPromoConfig = (group: string): AxiosPromise<PromoConfigItemVO[]> => {
  return request({ url: `/infra/promotion/config/${group}`, method: 'get' });
};

export const savePromoConfig = (group: string, data: PromoConfigBatchForm): AxiosPromise<number> => {
  return request({ url: `/infra/promotion/config/${group}`, method: 'put', data });
};
