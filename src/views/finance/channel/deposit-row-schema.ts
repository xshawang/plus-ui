import type { DepositChannelRowVO } from '@/api/finance/channel/types';

export type DepositCategory = 'CRYPTO' | 'QUICK_PAY' | 'P2P' | 'EWALLET' | 'CARD' | 'GIFT' | 'BANK' | 'ALL';

export interface DepositColumn {
  key: string;
  label: string;
  width?: number;
  type?: 'number' | 'text';
  display?: boolean;
}

/**
 * 将数据库大类编码转换为充值配置页的列分类编码。
 *
 * 为什么单独转换：数据库历史编码是 BANKS，而本页专属列配置使用 BANK；
 * 不转换会导致银行转账只显示公共列，银行编码等字段无法维护。
 */
export function categoryCodeFor(group?: string): DepositCategory {
  const code = String(group || 'ALL').toUpperCase();
  if (code === 'BANKS') return 'BANK';
  if (code === 'GIFT_CARD') return 'GIFT';
  return code as DepositCategory;
}

export const COMMON_COLUMNS: DepositColumn[] = [
  { key: 'groupName', label: '大类', width: 104 },
  { key: 'clientCode', label: '客户端通道编码', width: 125, display: true },
  { key: 'clientName', label: '客户端名称', width: 105, display: true },
  { key: 'providerName', label: '供应商', width: 120 },
  { key: 'providerChannelCode', label: '供应商通道编码', width: 135 },
  { key: 'currency', label: '目标币种', width: 76 },
  { key: 'amountMin', label: '最低限额', width: 96, type: 'number' },
  { key: 'amountMax', label: '最高限额', width: 96, type: 'number' },
  { key: 'feeRate', label: '备注（费率）', width: 96 },
  { key: 'sortNo', label: '排序', width: 72, type: 'number' },
  { key: 'enabled', label: '维护开关', width: 72 },
  { key: 'actions', label: '操作', width: 110 }
];

export const CATEGORY_COLUMNS: Record<Exclude<DepositCategory, 'ALL'>, DepositColumn[]> = {
  CRYPTO: [
    { key: 'address', label: '收款地址', width: 190, display: true },
    { key: 'qr', label: '二维码', width: 160, display: true },
    { key: 'referencePrice', label: '参考价格', width: 105, type: 'number', display: true },
    { key: 'icon', label: '图标', width: 140, display: true },
    { key: 'openTime', label: '开放时段', width: 110, display: true }
  ],
  QUICK_PAY: [
    { key: 'bankCode', label: '银行编码', width: 90 },
    { key: 'bankName', label: '银行账户', width: 130 },
    { key: 'receiptAccount', label: '收款账号', width: 145 },
    { key: 'receiptName', label: '收款姓名', width: 160 },
    { key: 'tierPrefix', label: '档位前缀', width: 100 },
    { key: 'bonusAmount', label: '赠送金额', width: 95, type: 'number', display: true },
    { key: 'content', label: '支付内容', width: 170, display: true },
    { key: 'recommendAmounts', label: '推荐金额', width: 170 },
    { key: 'smartpayCode', label: 'SmartPay', width: 110 },
    { key: 'statementTime', label: '账单时间', width: 120 },
    { key: 'orderNavigate', label: '订单顺序', width: 95, type: 'number' },
    { key: 'timeLimit', label: '处理时限', width: 95, type: 'number' },
    { key: 'dailyLimit', label: '每日限额', width: 110, type: 'number' },
    { key: 'clientSubCode', label: '客户端子编码', width: 120 },
    { key: 'icon', label: '图标', width: 150, display: true },
    { key: 'openTime', label: '开放时段', width: 110, display: true }
  ],
  P2P: [
    { key: 'accountName', label: '账户名称', width: 150, display: true },
    { key: 'receiptAccount', label: '收款账号', width: 145, display: true },
    { key: 'p2pRate', label: 'P2P汇率', width: 110, type: 'number', display: true },
    { key: 'description', label: '说明', width: 180, display: true },
    { key: 'icon', label: '图标', width: 150, display: true },
    { key: 'openTime', label: '开放时段', width: 110, display: true }
  ],
  EWALLET: [
    { key: 'walletMethod', label: '钱包 Method', width: 110, display: true },
    { key: 'recommendAmounts', label: '推荐金额', width: 170, display: true },
    { key: 'icon', label: '图标', width: 150, display: true },
    { key: 'openTime', label: '开放时段', width: 110, display: true }
  ],
  CARD: [
    { key: 'denominations', label: '推荐面值', width: 180, display: true },
    { key: 'exchangeRate', label: '兑换率', width: 90, type: 'number', display: true },
    { key: 'icon', label: '图标', width: 150, display: true },
    { key: 'openTime', label: '开放时段', width: 110, display: true }
  ],
  GIFT: [
    { key: 'jumpUrl', label: '跳转地址', width: 180, display: true },
    { key: 'giftAccount', label: '礼品账户', width: 140, display: true },
    { key: 'icon', label: '图标', width: 150, display: true },
    { key: 'openTime', label: '开放时段', width: 110, display: true }
  ],
  BANK: [
    { key: 'bankCode', label: '银行编码', width: 90 },
    { key: 'bankName', label: '银行账户', width: 130 },
    { key: 'receiptAccount', label: '收款账号', width: 145 },
    { key: 'receiptName', label: '收款姓名', width: 160 },
    { key: 'recommendAmounts', label: '推荐金额', width: 170 },
    { key: 'smartpayCode', label: 'SmartPay', width: 110 },
    { key: 'statementTime', label: '账单时间', width: 120 },
    { key: 'orderNavigate', label: '订单顺序', width: 95, type: 'number' },
    { key: 'timeLimit', label: '处理时限', width: 95, type: 'number' },
    { key: 'dailyLimit', label: '每日限额', width: 110, type: 'number' },
    { key: 'clientSubCode', label: '客户端子编码', width: 120 },
    { key: 'icon', label: '图标', width: 150, display: true },
    { key: 'openTime', label: '开放时段', width: 110, display: true }
  ]
};

export function columnsFor(group?: string): DepositColumn[] {
  const code = categoryCodeFor(group);
  const specific = code !== 'ALL' && CATEGORY_COLUMNS[code as Exclude<DepositCategory, 'ALL'>]
    ? CATEGORY_COLUMNS[code as Exclude<DepositCategory, 'ALL'>] : [];
  return [...COMMON_COLUMNS.slice(0, 5), ...specific, ...COMMON_COLUMNS.slice(5)];
}

export function valueOf(row: DepositChannelRowVO, key: string): any {
  if (key === 'groupName') return row.groupName;
  if (key === 'providerName') return row.providerName;
  if (key === 'providerChannelCode') return row.providerChannelCode;
  if (key === 'bankCode') return row.bankCode;
  if (key === 'bankName') return row.bankName;
  if (key === 'currency') return row.currency || row.display?.currency;
  if (key === 'amountMin') return row.amountMin;
  if (key === 'amountMax') return row.amountMax;
  if (key === 'feeRate') return row.feeRate;
  if (key === 'sortNo') return row.sortNo;
  if (key === 'enabled') return row.enabled;
  return row.display?.[key] ?? (row as any)[key] ?? '';
}

export function rowKey(row: DepositChannelRowVO): string {
  return `${row.routeId}:${row.matchKey || 'self'}`;
}

export function blankDisplay(): Record<string, any> {
  return {
    accountName: '',
    bankCode: '',
    bankName: '',
    receiptAccount: '',
    receiptName: '',
    address: '',
    qr: '',
    referencePrice: '',
    denominations: '',
    tierPrefix: '',
    bonusAmount: 0,
    feeAmount: 0,
    content: '',
    recommendAmounts: '',
    walletMethod: '',
    p2pRate: '',
    description: '',
    exchangeRate: '',
    jumpUrl: '',
    giftAccount: '',
    smartpayCode: '',
    statementTime: '',
    orderNavigate: 0,
    timeLimit: 0,
    dailyLimit: 0,
    clientSubCode: '',
    icon: '',
    openTime: '00:00-23:59'
  };
}
