export interface WithdrawTabVO {
  tabId: number;
  tabCode: 'BANK' | 'CARD' | 'CRYPTO' | 'COIN12' | 'P2P';
  clientKey: string;
  clientIndex: number;
  newTagIndex: number;
  displayName: string;
  sortNo: number;
  visible: number;
  newTag: number;
  isDefault: number;
  maintenanceCode: string;
  controlNote: string;
  remark: string;
  status: number;
  updatedAt?: string;
}

export interface WithdrawTabForm {
  tabId?: number;
  tabCode: string;
  displayName?: string;
  sortNo: number;
  visible: number;
  newTag: number;
  isDefault?: number;
  remark?: string;
}

export interface WithdrawChannelProfileVO {
  withdrawChannelId: number;
  channelCode: string;
  channelName: string;
  platformKey?: string;
  platformUrl?: string;
  iconArt?: string;
  tabCode: string;
  tabName?: string;
  platform: string;
  payoutMode: string;
  merchantId?: number;
  merchantCode?: string;
  merchantName?: string;
  providerId?: number;
  providerCode?: string;
  providerName?: string;
  clientCode?: string;
  clientSubCode?: string;
  providerChannelCode?: string;
  supportedBankCodes?: string;
  currency: string;
  settlementCurrency: string;
  rateFrom?: number;
  rateTo?: number;
  clientPrice: number;
  beneficiaryAddress?: string;
  amountMin?: number;
  amountMax?: number;
  dailyLimit?: number;
  maintenanceCode?: string;
  openTimeStart: string;
  openTimeEnd: string;
  rateMode: string;
  exchangeRate: number;
  feeMode: string;
  feeRate: number;
  feeFixed: number;
  feeCurrency: string;
  beneficiaryType: string;
  accountPattern?: string;
  clientFieldSchemaJson?: string;
  channelConfigJson?: string;
  priorityNo: number;
  sortNo: number;
  status: number;
  frontEnable: number;
  remark?: string;
  operatorId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WithdrawChannelProfileForm {
  withdrawChannelId?: number;
  channelCode: string;
  channelName: string;
  platformKey?: string;
  platformUrl?: string;
  iconArt?: string;
  tabCode: string;
  platform: string;
  payoutMode: string;
  merchantId?: number;
  clientCode?: string;
  clientSubCode?: string;
  supportedBankCodes: string[];
  currency: string;
  settlementCurrency: string;
  rateFrom: number;
  rateTo: number;
  clientPrice: number;
  beneficiaryAddress?: string;
  amountMin: number;
  amountMax: number;
  dailyLimit: number;
  maintenanceCode?: string;
  openTimeStart: string;
  openTimeEnd: string;
  rateMode: string;
  exchangeRate: number;
  feeMode: string;
  feeRate: number;
  feeFixed: number;
  feeCurrency: string;
  beneficiaryType: string;
  accountPattern?: string;
  clientFieldSchemaJson?: string;
  channelConfigJson?: string;
  priorityNo: number;
  sortNo: number;
  status: number;
  frontEnable: number;
  remark?: string;
}

export interface WithdrawChannelQuery {
  tabCode?: string;
  platform?: string;
  payoutMode?: string;
  channelKeyword?: string;
  status?: number;
}

export interface WithdrawCryptoPlatformVO {
  name: string;
  label: string;
  iconArt?: string;
  url?: string;
  active: boolean;
  sortNo: number;
}

export interface WithdrawCryptoPlatformForm {
  name: string;
  label: string;
  iconArt?: string;
  url?: string;
  active: boolean;
  sortNo: number;
}

export interface WithdrawCardConfigVO {
  id: number;
  platform: string;
  cardBrand: string;
  cardLabel: string;
  denominations: string;
  status: number;
  sortOrder: number;
  rate?: number;
}

export interface WithdrawCardConfigForm {
  id?: number;
  platform: string;
  cardBrand: string;
  cardLabel: string;
  denominations: string;
  status: number;
  sortOrder: number;
  rate?: number;
}

export interface WithdrawClientManifest {
  withdrawTabsOrder: Array<{
    key: string;
    tabCode: string;
    clientIndex: number;
    sortNo: number;
    visible: number;
    newTag: number;
  }>;
  tabsWithdrawToHide: number[];
  tabsWithNewTagWithdraw: number[];
  supportedControls: string[];
  unsupportedControls: string[];
  publishedToClientConfig?: boolean;
}

export interface WithdrawChannelRowVO {
  withdrawChannelId: number | string;
  tabCode: string;
  tabName: string;
  tabStatus: number;
  channelCode: string;
  channelName: string;
  platform: string;
  payoutMode: string;
  clientCode: string;
  clientSubCode: string;
  currency: string;
  settlementCurrency: string;
  rateFrom?: number | string;
  rateTo?: number | string;
  clientPrice?: number | string;
  amountMin?: number | string;
  amountMax?: number | string;
  dailyLimit?: number | string;
  maintenanceCode?: string;
  openTimeStart?: string;
  openTimeEnd?: string;
  feeRate?: number | string;
  channelSortNo?: number;
  configVersion?: number | string;
  matchKey: string;
  providerChannelId?: number | string;
  merchantId?: number | string;
  merchantCode?: string;
  merchantName?: string;
  merchantStatus?: string;
  providerId?: number | string;
  providerCode?: string;
  providerName?: string;
  adapterCode?: string;
  providerChannelCode?: string;
  providerPayType?: string;
  bankCode?: string;
  bankName?: string;
  amountUnit?: string;
  amountScale?: number;
  matchAmountMin?: number | string;
  matchAmountMax?: number | string;
  sortNo?: number;
  enabled?: number;
  extraJson?: string;
  remark?: string;
  display?: Record<string, any>;
}

export interface WithdrawChannelRowForm {
  withdrawChannelId?: number | string;
  tabCode: string;
  matchKey?: string;
  expectedVersion?: number | string;
  channelCode?: string;
  channelName?: string;
  platform?: string;
  payoutMode?: string;
  clientCode: string;
  clientSubCode?: string;
  currency: string;
  settlementCurrency: string;
  rateFrom?: number;
  rateTo?: number;
  clientPrice?: number;
  amountMin: number;
  amountMax: number;
  dailyLimit: number;
  maintenanceCode?: string;
  openTimeStart?: string;
  openTimeEnd?: string;
  feeRate?: number;
  sortNo: number;
  enabled: number;
  merchantId?: number | string;
  providerCode?: string;
  providerName?: string;
  adapterCode?: string;
  providerChannelCode?: string;
  providerPayType?: string;
  bankCode?: string;
  bankName?: string;
  amountUnit?: string;
  amountScale?: number;
  extraJson?: string;
  remark?: string;
  display: Record<string, any>;
}

export interface WithdrawChannelMatchOptionVO {
  providerId?: number | string;
  providerCode?: string;
  providerName?: string;
  adapterCode?: string;
  merchantId?: number | string;
  merchantCode?: string;
  merchantName?: string;
  providerChannelCode?: string;
  providerPayType?: string;
  bankCode?: string;
  bankName?: string;
  currency?: string;
  amountUnit?: string;
  amountScale?: number;
  amountMin?: number | string;
  amountMax?: number | string;
  enabled?: number;
  extraJson?: string;
}
