import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { BannerForm, BannerListResult } from './types';

/** Banner 列表 + 下发状态 */
export const listBanner = (): AxiosPromise<BannerListResult> => {
  return request({ url: '/infra/ops/banner/list', method: 'get' });
};

/** 新增 Banner */
export const addBanner = (data: BannerForm): AxiosPromise => {
  return request({ url: '/infra/ops/banner', method: 'post', data });
};

/** 修改 Banner */
export const updateBanner = (data: BannerForm): AxiosPromise => {
  return request({ url: '/infra/ops/banner', method: 'put', data });
};

/** 排序（按传入 id 顺序重排） */
export const sortBanner = (ids: Array<string | number>): AxiosPromise => {
  return request({ url: '/infra/ops/banner/sort', method: 'put', data: { ids } });
};

/** 删除 Banner（软删） */
export const delBanner = (ids: Array<string | number>): AxiosPromise => {
  return request({ url: '/infra/ops/banner', method: 'delete', data: { ids } });
};

/**
 * 发布：组装 bannerInfo 并加密回写 8go88.bin。
 * 发布是高风险动作（直接影响客户端大厅），后端会做完整校验并自动备份原文件。
 */
export const publishBanner = (): AxiosPromise<BannerListResult> => {
  return request({ url: '/infra/ops/banner/publish', method: 'post' });
};
