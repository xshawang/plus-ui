import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { MemberDeviceActionForm, MemberDeviceQuery, MemberDeviceVO } from './types';

/**
 * 登录设备接口。
 *
 * 后端：go88-service-infra（MemberDeviceController）
 * 权限：member:device:list / member:device:edit
 */
export const listMemberDevice = (query?: MemberDeviceQuery): AxiosPromise<MemberDeviceVO[]> => {
  return request({
    url: '/infra/member/device/list',
    method: 'get',
    params: query
  });
};

/** 设备处置：TRUST / UNTRUST / BLACKLIST（支持批量），返回影响条数 */
export const actionMemberDevice = (data: MemberDeviceActionForm): AxiosPromise<number> => {
  return request({
    url: '/infra/member/device/action',
    method: 'put',
    data
  });
};
