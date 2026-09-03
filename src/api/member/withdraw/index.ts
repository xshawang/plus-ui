import type { PageResult } from '@/api/types';
import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { WithdrawActionForm, WithdrawOrderQuery, WithdrawOrderVO } from './types';

/**
 * 分页查询提现列表
 *
 * 后端实现在 go88-service-infra：GET /member/withdraw/list
 * 权限标识：member:withdraw:list
 */
export const listMemberWithdraw = (query?: WithdrawOrderQuery): AxiosPromise<PageResult<WithdrawOrderVO>> => {
  return request({
    url: '/infra/member/withdraw/list',
    method: 'get',
    params: query
  });
};

/**
 * 审核通过（仅变更订单状态，如 0待审核 -> 1已审核/待打款）
 * 权限标识：member:withdraw:edit
 */
export const auditMemberWithdraw = (data: WithdrawActionForm) => {
  return request({
    url: '/infra/member/withdraw/audit',
    method: 'put',
    data: data
  });
};

/**
 * 提现成功（预留第三方打款对接，当前由后端占位实现并推进状态）
 * 权限标识：member:withdraw:edit
 */
export const successMemberWithdraw = (data: WithdrawActionForm) => {
  return request({
    url: '/infra/member/withdraw/success',
    method: 'put',
    data: data
  });
};

/**
 * 取消提现（后端需退回冻结金额并写入 user_wallet_ledger 流水）
 * 权限标识：member:withdraw:edit
 */
export const cancelMemberWithdraw = (data: WithdrawActionForm) => {
  return request({
    url: '/infra/member/withdraw/cancel',
    method: 'put',
    data: data
  });
};
