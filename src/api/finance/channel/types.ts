/**
 * 充值大类与通道路由（需求文档 2_财务/02）类型定义。
 */
export interface FinanceChannelGroupVO {
  groupId: number;
  groupCode: string;
  groupName: string;
  groupIcon?: string;
  /** 1在线充值 2转账充值 3客服代充 4数字货币 5礼品卡 6 P2P充值 */
  groupType?: number;
  linkGroupCode?: string;
  sortNo?: number;
  status?: number;
  /** 充值黑名单开关：1=命中标签的玩家不可见、不可下单 */
  blacklistEnable?: number;
  /** 黑名单会员标签编码，逗号分隔（member_tag.tag_code） */
  blacklistTagCode?: string;
  remark?: string;
  operatorId?: string;
  createdAt?: string;
  updatedAt?: string;
  routes?: FinanceChannelRouteVO[];
}

export interface FinanceChannelRouteVO {
  routeId: number;
  groupId: number;
  /** P2P 通道事实源为 finance_withdraw_channel.withdraw_channel_id */
  withdrawChannelId?: number;
  routeCode: string;
  channelName: string;
  subSort?: number;
  merchantId?: number;
  merchantName?: string;
  currency?: string;
  amountMin?: number;
  amountMax?: number;
  providerAmountMin?: number;
  providerAmountMax?: number;
  providerRouteCount?: number;
  recommendAmounts?: string;
  feeRate?: number;
  successRate?: number;
  channelRemark?: string;
  status?: number;
  mergeFlag?: number;
  frontEnable?: number;
  blacklistEnable?: number;
  operatorId?: string;
  createdAt?: string;
  updatedAt?: string;
  platform?: string;
  direction?: number;
  methodType?: string;
  configRefId?: number;
  clientCode?: string;
  clientSubCode?: string;
  dailyLimit?: number;
  maintenanceCode?: string;
  addressV1Enabled?: number;
  addressV3Enabled?: number;
  channelIcon?: string;
  openTimeStart?: string;
  openTimeEnd?: string;
  bankCode?: string;
  bankName?: string;
  smartpayCode?: string;
  account?: string;
  receiveNumber?: string;
  statementTime?: string;
  timeLimit?: number;
  orderNavigate?: number;
  cardBrand?: string;
  cardLabel?: string;
  denominations?: string;
  rate?: number;
  coinName?: string;
  networkName?: string;
  address?: string;
  qrData?: string;
  price?: number;
  platformRate?: number;
  prefix?: string;
  fee?: number;
  bonusAmount?: number;
  content?: string;
  accountName?: string;
  minAmount?: number;
  maxAmount?: number;
  thirdPartyParams?: string;
  giftCode?: string;
  giftName?: string;
  iconUrl?: string;
  jumpUrl?: string;
  /** P2P 渠道字段（独立提现渠道表） */
  payoutMode?: string;
  platformKey?: string;
  platformUrl?: string;
  beneficiaryAddress?: string;
  rateMode?: string;
  exchangeRate?: number;
  feeMode?: string;
  feeFixed?: number;
  feeCurrency?: string;
  beneficiaryType?: string;
  accountPattern?: string;
  clientFieldSchemaJson?: string;
  channelConfigJson?: string;
  priorityNo?: number;
  /** P2P 挂单与收款说明，最终存入 channel_config_json.p2p */
  p2pAssetName?: string;
  p2pPrice?: number;
  p2pPaymentTimeLimit?: number;
  p2pMakerUserName?: string;
  p2pMakerDisplayName?: string;
  p2pMinTotalDeposit?: number;
  p2pAutoReplyText?: string;
  p2pNote?: string;
  p2pDepositBankCode?: string;
  p2pDepositAccountNo?: string;
  p2pDepositAccountName?: string;
  p2pDepositContent?: string;
  /** 列表洞察（withStats=true）：只读的三方候选摘要、今日/近30日成功率。feeRate 是手填的“仅供参考”值，不在此计算 */
  candidates?: FinanceChannelCandidateVO[];
  todayOrderCount?: number;
  todaySuccessCount?: number;
  todaySuccessRate?: number | null;
  d30OrderCount?: number;
  d30SuccessCount?: number;
  d30SuccessRate?: number | null;
}

/** 子通道下的三方候选摘要（infra 只读汇总；三方通道的增减与启停在「支付渠道中心」维护） */
export interface FinanceChannelCandidateVO {
  candidateId: number;
  routeId: number;
  providerChannelId: number;
  providerChannelCode?: string;
  providerPayType?: string;
  providerId?: number;
  providerCode?: string;
  providerName?: string;
  merchantId?: number;
  merchantName?: string;
  amountMin?: number;
  amountMax?: number;
  enabled?: number;
  autoDisabledUntil?: string;
  remark?: string;
  usable?: boolean;
  todayOrderCount?: number;
  todaySuccessCount?: number;
  todaySuccessRate?: number | null;
  d30OrderCount?: number;
  d30SuccessCount?: number;
  d30SuccessRate?: number | null;
}

export interface FinanceChannelGroupForm {
  groupId?: number;
  groupCode?: string;
  groupName?: string;
  groupIcon?: string;
  groupType?: number;
  linkGroupCode?: string;
  sortNo?: number;
  status?: number;
  blacklistEnable?: number;
  blacklistTagCode?: string;
  remark?: string;
}

export interface FinanceChannelRouteForm {
  routeId?: number;
  groupId?: number;
  withdrawChannelId?: number;
  routeCode?: string;
  channelName?: string;
  subSort?: number;
  merchantId?: number;
  currency?: string;
  amountMin?: number;
  amountMax?: number;
  recommendAmounts?: string;
  feeRate?: number;
  successRate?: number;
  channelRemark?: string;
  status?: number;
  mergeFlag?: number;
  frontEnable?: number;
  blacklistEnable?: number;
  platform?: string;
  direction?: number;
  methodType?: string;
  configRefId?: number;
  clientCode?: string;
  clientSubCode?: string;
  dailyLimit?: number;
  maintenanceCode?: string;
  addressV1Enabled?: number;
  addressV3Enabled?: number;
  channelIcon?: string;
  openTimeStart?: string;
  openTimeEnd?: string;
  bankCode?: string;
  bankName?: string;
  smartpayCode?: string;
  account?: string;
  receiveNumber?: string;
  statementTime?: string;
  timeLimit?: number;
  orderNavigate?: number;
  cardBrand?: string;
  cardLabel?: string;
  denominations?: string;
  rate?: number;
  coinName?: string;
  networkName?: string;
  address?: string;
  qrData?: string;
  price?: number;
  platformRate?: number;
  prefix?: string;
  fee?: number;
  bonusAmount?: number;
  content?: string;
  accountName?: string;
  minAmount?: number;
  maxAmount?: number;
  thirdPartyParams?: string;
  giftCode?: string;
  giftName?: string;
  iconUrl?: string;
  jumpUrl?: string;
  payoutMode?: string;
  beneficiaryAddress?: string;
  rateMode?: string;
  exchangeRate?: number;
  feeMode?: string;
  feeFixed?: number;
  feeCurrency?: string;
  beneficiaryType?: string;
  accountPattern?: string;
  clientFieldSchemaJson?: string;
  channelConfigJson?: string;
  priorityNo?: number;
  p2pAssetName?: string;
  p2pPrice?: number;
  p2pPaymentTimeLimit?: number;
  p2pMakerUserName?: string;
  p2pMakerDisplayName?: string;
  p2pMinTotalDeposit?: number;
  p2pAutoReplyText?: string;
  p2pNote?: string;
  p2pDepositBankCode?: string;
  p2pDepositAccountNo?: string;
  p2pDepositAccountName?: string;
  p2pDepositContent?: string;
}

export interface FinanceChannelQuery {
  groupKeyword?: string;
  routeKeyword?: string;
  groupId?: number;
  merchantId?: number;
  groupType?: number;
  status?: number;
  frontEnable?: number;
  platform?: string;
  direction?: number;
  methodType?: string;
}

/** 三表收口后的平铺充值匹配行。 */
export interface DepositChannelRowVO {
  routeId: number;
  groupId: number;
  groupCode: string;
  groupName: string;
  groupStatus: number;
  methodType: string;
  clientCode: string;
  clientName: string;
  merchantId?: number;
  merchantCode?: string;
  merchantName?: string;
  merchantStatus?: string;
  providerCode?: string;
  providerName?: string;
  adapterCode?: string;
  providerChannelCode?: string;
  providerPayType?: string;
  bankCode?: string;
  bankName?: string;
  currency?: string;
  amountUnit?: string;
  amountScale?: number;
  amountMin?: number;
  amountMax?: number;
  feeRate?: number;
  sortNo?: number;
  enabled?: number;
  remark?: string;
  matchKey?: string;
  configVersion?: number;
  display?: Record<string, any>;
}

export interface DepositChannelRowForm {
  direction?: number;
  groupId?: number;
  routeId?: number;
  matchKey?: string;
  merchantId?: number | string;
  providerCode?: string;
  providerName?: string;
  adapterCode?: string;
  providerChannelCode?: string;
  providerPayType?: string;
  bankCode?: string;
  bankName?: string;
  currency?: string;
  amountUnit?: string;
  amountScale?: number;
  amountMin?: number;
  amountMax?: number;
  feeRate?: number;
  sortNo?: number;
  enabled?: number;
  remark?: string;
  expectedVersion?: number;
  display?: Record<string, any>;
}
