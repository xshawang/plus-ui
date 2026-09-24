import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { ConfigBatchForm, ConfigItemVO } from '@/api/member/config/types';

/**
 * 财务-充值设置接口（需求文档 2_财务/01、06、07、11）。
 *
 * 十组设置共用 member_module_config 通用 KV 表与同一套读写端点，只有分组名不同：
 * 后端实现在 go88-service-infra：GET/PUT /infra/finance/recharge-config/{groupKey}(/list)
 * 权限标识：finance:recharge-config:list | finance:recharge-config:edit
 */
const listOf = (group: string): AxiosPromise<ConfigItemVO[]> =>
  request({ url: `/infra/finance/recharge-config/${group}/list`, method: 'get' });

const saveOf = (group: string, data: ConfigBatchForm): AxiosPromise<number> =>
  request({ url: `/infra/finance/recharge-config/${group}`, method: 'put', data });

/** 充值页优惠活动展示设置 */
export const listPromoConfig = () => listOf('finance-recharge-promo');
export const savePromoConfig = (data: ConfigBatchForm) => saveOf('finance-recharge-promo', data);

/** 充值页面展示设置 */
export const listPageDisplayConfig = () => listOf('finance-recharge-page');
export const savePageDisplayConfig = (data: ConfigBatchForm) => saveOf('finance-recharge-page', data);

/** 充值通知设置 */
export const listNotifyConfig = () => listOf('finance-recharge-notify');
export const saveNotifyConfig = (data: ConfigBatchForm) => saveOf('finance-recharge-notify', data);

/** 会员充值填写信息设置 */
export const listFormConfig = () => listOf('finance-recharge-form');
export const saveFormConfig = (data: ConfigBatchForm) => saveOf('finance-recharge-form', data);

/** 充值提示弹窗设置 */
export const listPopupConfig = () => listOf('finance-recharge-popup');
export const savePopupConfig = (data: ConfigBatchForm) => saveOf('finance-recharge-popup', data);

/** 按汇率转为数字货币充值 */
export const listCryptoConfig = () => listOf('finance-recharge-crypto');
export const saveCryptoConfig = (data: ConfigBatchForm) => saveOf('finance-recharge-crypto', data);

/** 在线充值-充值设置（全局风控） */
export const listRechargeSettingConfig = () => listOf('finance-recharge-setting');
export const saveRechargeSettingConfig = (data: ConfigBatchForm) => saveOf('finance-recharge-setting', data);

/** 转账充值-充值设置 */
export const listTransferSettingConfig = () => listOf('finance-transfer-setting');
export const saveTransferSettingConfig = (data: ConfigBatchForm) => saveOf('finance-transfer-setting', data);

/** 客服代充-设置 */
export const listCsRechargeSettingConfig = () => listOf('finance-cs-recharge-setting');
export const saveCsRechargeSettingConfig = (data: ConfigBatchForm) => saveOf('finance-cs-recharge-setting', data);

/** 提现设置 */
export const listWithdrawSettingConfig = () => listOf('finance-withdraw-setting');
export const saveWithdrawSettingConfig = (data: ConfigBatchForm) => saveOf('finance-withdraw-setting', data);

/** 稽核任务-设置 */
export const listAuditSettingConfig = () => listOf('finance-audit-setting');
export const saveAuditSettingConfig = (data: ConfigBatchForm) => saveOf('finance-audit-setting', data);
