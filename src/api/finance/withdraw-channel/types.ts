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
  merchantName?: string;
  clientCode?: string;
  clientSubCode?: string;
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
