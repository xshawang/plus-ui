import type { AxiosPromise } from '@/utils/api-types';
import request from '@/utils/request';
import type { KycAuditForm, KycRecordQuery, KycRecordVO, KycVendorForm, KycVendorQuery, KycVendorVO } from './types';

/**
 * KYC 接口（11 文档）。
 * 权限：member:kyc:list / member:kyc:edit
 */
export const listKycVendor = (query?: KycVendorQuery): AxiosPromise<KycVendorVO[]> => {
  return request({
    url: '/infra/member/kyc/vendor/list',
    method: 'get',
    params: query
  });
};

export const addKycVendor = (data: KycVendorForm) => {
  return request({
    url: '/infra/member/kyc/vendor',
    method: 'post',
    data
  });
};

export const updateKycVendor = (data: KycVendorForm) => {
  return request({
    url: '/infra/member/kyc/vendor',
    method: 'put',
    data
  });
};

export const delKycVendor = (vendorId: number) => {
  return request({
    url: '/infra/member/kyc/vendor/' + vendorId,
    method: 'delete'
  });
};

/** 实名单据列表（证件号掩码） */
export const listKycRecord = (query?: KycRecordQuery): AxiosPromise<KycRecordVO[]> => {
  return request({
    url: '/infra/member/kyc/record/list',
    method: 'get',
    params: query
  });
};

/** 审核单据：PASS / REJECT（驳回必填原因） */
export const auditKycRecord = (data: KycAuditForm): AxiosPromise<number> => {
  return request({
    url: '/infra/member/kyc/record/audit',
    method: 'put',
    data
  });
};
