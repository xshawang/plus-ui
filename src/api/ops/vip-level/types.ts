export interface VipLevelQuery extends PageQuery {
  status?: number;
  keyword?: string;
}

export interface VipLevelVO {
  vipLevel: number;
  levelName: string;
  iconUrl: string;
  levelDesc: string;
  minPayTotal: string;
  minRounds: number;
  dailyGift: string;
  feeDiscountRate: string;
  withdrawDailyLimit: string;
  benefitsJson?: string;
  status: number;
  sortOrder: number;
  userCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface VipLevelForm {
  vipLevel?: number;
  levelName?: string;
  iconUrl?: string;
  levelDesc?: string;
  minPayTotal?: string | number;
  minRounds?: number;
  dailyGift?: string | number;
  feeDiscountRate?: string | number;
  withdrawDailyLimit?: string | number;
  benefitsJson?: string;
  sortOrder?: number;
}

export interface VipLevelStateForm {
  id: number;
  value: number;
}
