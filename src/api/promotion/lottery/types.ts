/**
 * 抽奖活动（需求文档 03 盲盒抽奖 / 04 幸运转盘）类型定义。
 */
export interface PromoLotteryQuery {
  pageNum?: number;
  pageSize?: number;
  /** 1=盲盒 2=幸运转盘 */
  lotteryType?: number;
  configId?: number;
  keyword?: string;
  account?: string;
  status?: number;
  prizeType?: number;
  isWin?: number;
  timeStart?: string;
  timeEnd?: string;
}

export interface PromoLotteryConfigVO {
  configId: number;
  lotteryType: number;
  configName: string;
  currency: string;
  startAt?: string;
  endAt?: string;
  costType?: number;
  costAmount?: number;
  dailyLimit?: number;
  enabled?: number;
  coverImage?: string;
  ruleDesc?: string;
  operatorId?: string;
  updatedAt?: string;
  prizeCount?: number;
  totalStock?: number;
  recordCount?: number;
}

export interface PromoLotteryConfigForm {
  configId?: number;
  lotteryType: number;
  configName: string;
  currency: string;
  startAt?: string;
  endAt?: string;
  costType?: number;
  costAmount?: number;
  dailyLimit?: number;
  luckyPointRuleJson?: string;
  exchangeRuleJson?: string;
  enabled?: number;
  coverImage?: string;
  ruleDesc?: string;
}

export interface PromoLotteryPrizeVO {
  prizeId: number;
  configId: number;
  prizeName: string;
  /** 1=金币 2=奖金 3=实物 4=幸运值 5=空奖 */
  prizeType: number;
  prizeValue?: number;
  prizeImage?: string;
  probability?: number;
  stock?: number;
  sentCount?: number;
  sortOrder?: number;
  enabled?: number;
  winCount?: number;
}

export interface PromoLotteryPrizeForm {
  prizeId?: number;
  configId: number;
  prizeName: string;
  prizeType: number;
  prizeValue?: number;
  prizeImage?: string;
  probability?: number;
  stock?: number;
  sortOrder?: number;
  enabled?: number;
}

export interface PromoPhysicalOrderVO {
  orderId: number;
  orderNo: string;
  configId?: number;
  configName?: string;
  lotteryType?: number;
  uid?: number;
  account?: string;
  prizeName?: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  status?: number;
  expressCompany?: string;
  expressNo?: string;
  remark?: string;
  operatorId?: string;
  createdAt?: string;
  shipAt?: string;
}

export interface PromoPhysicalShipForm {
  orderId: number;
  expressCompany: string;
  expressNo: string;
  remark?: string;
}
