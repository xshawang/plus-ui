export interface LoginInfoVO {
  infoId: string | number;
  tenantId: string | number;
  userName: string;
  status: string;
  ipaddr: string;
  loginLocation: string;
  browser: string;
  os: string;
  msg: string;
  loginTime: string;
  /** 最后登出时间（截图「最后登出时间/最后登出IP/地区」列，登出时回填到同一次会话） */
  logoutTime?: string;
  /** 最后登出 IP */
  logoutIp?: string;
  /** 最后登出 IP 归属地区 */
  logoutLocation?: string;
  /** 在线时长（秒，前端按「时」展示；由后端登出时按 TIMESTAMPDIFF 计算） */
  onlineDuration?: number;
  /** 登录网址（截图列 n188.cg.ink） */
  loginDomain?: string;
  /** 系统版本（截图列） */
  systemVersion?: string;
  /** 设备号（截图列） */
  deviceNo?: string;
  /** 设备指纹（截图列） */
  deviceFingerprint?: string;
}

export interface LoginInfoQuery extends PageQuery {
  ipaddr: string;
  userName: string;
  status: string;
  orderByColumn: string;
  isAsc: string;
  /** 时间粒度：day/week/month（截图筛选区「日/周/月」按钮） */
  timeScope?: string;
  beginTime?: string;
  endTime?: string;
}
