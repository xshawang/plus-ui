import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { ConfigBatchForm, ConfigItemVO } from '@/api/member/config/types';

/**
 * 会员模块通用配置接口（批次 8）：短信 / 邮箱 / 注册与登录 / 会员基本信息。
 *
 * 四组配置共用 member_module_config 表，只有路径与权限点不同：
 * member:sms:*、member:email:*、member:register:*、member:info-config:*
 */
const listOf = (group: string): AxiosPromise<ConfigItemVO[]> =>
  request({ url: `/infra/member/${group}/config/list`, method: 'get' });

const saveOf = (group: string, data: ConfigBatchForm): AxiosPromise<number> =>
  request({ url: `/infra/member/${group}/config`, method: 'put', data });

/** 短信配置（12 文档） */
export const listSmsConfig = () => listOf('sms');
export const saveSmsConfig = (data: ConfigBatchForm) => saveOf('sms', data);

/** 邮箱验证（13 文档） */
export const listEmailConfig = () => listOf('email');
export const saveEmailConfig = (data: ConfigBatchForm) => saveOf('email', data);

/** 注册与登录配置（14 文档） */
export const listRegisterConfig = () => listOf('register');
export const saveRegisterConfig = (data: ConfigBatchForm) => saveOf('register', data);

/** 会员基本信息设置（01/05 文档） */
export const listInfoConfig = () => listOf('info-config');
export const saveInfoConfig = (data: ConfigBatchForm) => saveOf('info-config', data);

/** TG 机器人配置（19 文档；本批为配置项先行，实际收发需独立 TG 服务） */
export const listTgBotConfig = () => listOf('tg-bot');
export const saveTgBotConfig = (data: ConfigBatchForm) => saveOf('tg-bot', data);

/** TG 消息群发配置（20 文档） */
export const listTgBroadcastConfig = () => listOf('tg-broadcast');
export const saveTgBroadcastConfig = (data: ConfigBatchForm) => saveOf('tg-broadcast', data);
