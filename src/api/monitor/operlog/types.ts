export interface OperLogQuery extends PageQuery {
  operIp: string;
  title: string;
  operName: string;
  userId: string;
  deptId: string;
  clientKey: string;
  deviceType: string;
  browser: string;
  os: string;
  businessType: string;
  status: string;
  orderByColumn: string;
  isAsc: string;
  /** 时间粒度：day/week/month（截图筛选区「日/周/月」按钮） */
  timeScope?: string;
  beginTime?: string;
  endTime?: string;
}

export interface OperLogVO extends BaseEntity {
  operId: string | number;
  tenantId: string;
  title: string;
  businessType: number;
  businessTypes: number[] | undefined;
  method: string;
  requestMethod: string;
  operatorType: number;
  operName: string;
  userId: string | number;
  deptId: string | number;
  deptName: string;
  clientKey: string;
  deviceType: string;
  browser: string;
  os: string;
  operUrl: string;
  operIp: string;
  operLocation: string;
  operParam: string;
  jsonResult: string;
  status: number;
  errorMsg: string;
  operTime: string;
  costTime: number;
  /** 浏览器品牌与版本（截图「浏览器品牌」列，由后端 LogAspect 解析 UA 写入） */
  browserBrand: string;
  /** 系统版本（截图「系统版本」列） */
  systemVersion: string;
  /** 链路 traceId（截图列） */
  traceId: string;
  /** 设备号（截图列） */
  deviceNo: string;
  /** 设备指纹（截图列） */
  deviceFingerprint: string;
  /** 操作行为（截图列，形如「通过,订单号3102562…」） */
  operBehavior: string;
}

export interface OperLogForm {
  operId: number | string | undefined;
  tenantId: string | number | undefined;
  title: string;
  businessType: number;
  businessTypes: number[] | undefined;
  method: string;
  requestMethod: string;
  operatorType: number;
  operName: string;
  userId: string | number | undefined;
  deptId: string | number | undefined;
  deptName: string;
  clientKey: string;
  deviceType: string;
  browser: string;
  os: string;
  operUrl: string;
  operIp: string;
  operLocation: string;
  operParam: string;
  jsonResult: string;
  status: number;
  errorMsg: string;
  operTime: string;
  costTime: number;
}
