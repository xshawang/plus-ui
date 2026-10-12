import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { MessageBoxVO } from './types';

/**
 * 消息盒子（登录后台后拉历史消息）。
 *
 * FIX(2026-10-13)：原实现硬编码 RuoYi 上游的 `/resource/message/box`，而本项目
 * go88-resource 没有该端点（其 SSE 依赖是注释状态）⇒ 打开推送开关后登录即弹
 * 「请求地址不存在」。现改为跟随消息路径配置（`VITE_APP_MESSAGE_PATH`，默认
 * `/infra/message`），与 SSE 订阅同源（均由 go88-service-infra 提供）。
 */
export function getMessageBox(): AxiosPromise<MessageBoxVO> {
  const messagePath = import.meta.env.VITE_APP_MESSAGE_PATH || '/infra/message';
  return request({
    url: `${messagePath}/box`,
    method: 'get'
  });
}
