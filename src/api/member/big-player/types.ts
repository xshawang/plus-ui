/**
 * 大R提醒与报表（需求文档 09）类型定义。
 */
export interface BigPlayerConfigVO {
  configId: number;
  currency: string;
  /** 1=小R 2=中R 3=大R */
  playerType: number;
  dailyRechargeThreshold?: number;
  alertEnabled?: number;
  operatorId?: string;
  updatedAt?: string;
}

export interface BigPlayerConfigForm {
  currency: string;
  items: Array<{
    playerType: number;
    dailyRechargeThreshold: number;
    alertEnabled?: number;
  }>;
}

export interface BigPlayerReportQuery {
  startDate?: string;
  endDate?: string;
  currency?: string;
}

export interface BigPlayerReportVO {
  statDate: string;
  currency: string;
  smallRUserCount?: number;
  smallRRechargeAmount?: number;
  smallRWithdrawAmount?: number;
  mediumRUserCount?: number;
  mediumRRechargeAmount?: number;
  mediumRWithdrawAmount?: number;
  largeRUserCount?: number;
  largeRRechargeAmount?: number;
  largeRWithdrawAmount?: number;
}
