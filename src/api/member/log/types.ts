/**
 * 会员日志（需求文档 07）类型定义。
 */
export interface MemberLogQuery {
  pageNum?: number;
  pageSize?: number;
  uid?: number | string;
  loginName?: string;
  loginIp?: string;
  loginResult?: number;
  loginChannel?: number;
  params?: Record<string, unknown>;
}

export interface MemberLogVO {
  id: number;
  uid: number;
  loginName?: string;
  loginIp?: string;
  loginDevice?: string;
  loginChannel?: number;
  /** 1=成功 2=失败 */
  loginResult?: number;
  failReason?: string;
  loginAt?: string;
}
