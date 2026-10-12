/**
 * KYC 实名验证（需求文档 11）类型定义。
 */
export interface KycVendorQuery {
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
  status?: number;
}

export interface KycVendorVO {
  vendorId: number;
  vendorCode: string;
  vendorName: string;
  priority?: number;
  supportCountries?: string;
  enabledCountries?: string;
  feeDesc?: string;
  dailyCap?: number;
  todayCount?: number;
  totalCount?: number;
  todaySuccess?: number;
  todayFail?: number;
  totalSuccess?: number;
  totalFail?: number;
  status?: number;
  operatorId?: string;
  updatedAt?: string;
  todayRemain?: number;
  todayPassRate?: number;
  totalPassRate?: number;
}

export interface KycVendorForm {
  vendorId?: number;
  vendorCode: string;
  vendorName: string;
  priority?: number;
  supportCountries?: string;
  enabledCountries?: string;
  feeDesc?: string;
  dailyCap?: number;
  status?: number;
}

export interface KycRecordQuery {
  pageNum?: number;
  pageSize?: number;
  uid?: number | string;
  loginName?: string;
  verifyStatus?: number;
  kycLevel?: number;
  params?: Record<string, unknown>;
}

export interface KycRecordVO {
  id: number;
  uid: number;
  loginName?: string;
  kycLevel?: number;
  realName?: string;
  idCardNoMask?: string;
  idCardType?: number;
  verifyStatus?: number;
  rejectReason?: string;
  verifiedAt?: string;
  createdAt?: string;
}

export interface KycAuditForm {
  id: number;
  /** PASS / REJECT */
  action: string;
  reason?: string;
}
