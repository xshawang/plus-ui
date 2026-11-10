import type { WithdrawChannelRowVO } from '@/api/finance/withdraw-channel/types';

export type WithdrawCategory = 'BANK' | 'CARD' | 'CRYPTO' | 'COIN12' | 'P2P';

export interface WithdrawColumn {
  key: string;
  label: string;
  minWidth: number;
  align?: 'left' | 'center' | 'right';
}

const PREFIX: WithdrawColumn[] = [
  { key: 'tabCode', label: '大类', minWidth: 78, align: 'center' },
  { key: 'client', label: '客户端通道', minWidth: 168 },
  { key: 'provider', label: '供应商 / 商户', minWidth: 178 }
];

const SUFFIX: WithdrawColumn[] = [
  { key: 'providerChannelCode', label: '供应商通道', minWidth: 126 },
  { key: 'amount', label: '单笔限额', minWidth: 168, align: 'right' },
  { key: 'sortNo', label: '排序', minWidth: 64, align: 'center' },
  { key: 'enabled', label: '维护', minWidth: 78, align: 'center' },
  { key: 'actions', label: '操作', minWidth: 92, align: 'center' }
];

export const CATEGORY_COLUMNS: Record<WithdrawCategory, WithdrawColumn[]> = {
  BANK: [
    { key: 'bankCode', label: '银行编码', minWidth: 96 },
    { key: 'dailyLimit', label: '每日限额', minWidth: 126, align: 'right' }
  ],
  CARD: [
    { key: 'cardBrand', label: '卡品牌', minWidth: 110 },
    { key: 'denominations', label: '推荐面额', minWidth: 158 },
    { key: 'cardRate', label: '兑换率', minWidth: 82, align: 'right' }
  ],
  CRYPTO: [
    { key: 'network', label: '币种 / 网络', minWidth: 126 },
    { key: 'clientPrice', label: '客户端价格', minWidth: 112, align: 'right' }
  ],
  COIN12: [
    { key: 'exchangeMode', label: '兑换方式', minWidth: 130 }
  ],
  P2P: [
    { key: 'asset', label: '资产', minWidth: 100 },
    { key: 'p2pPrice', label: '成交价', minWidth: 110, align: 'right' },
    { key: 'timeout', label: '支付时限', minWidth: 92, align: 'right' }
  ]
};

export function columnsFor(tabCode: string): WithdrawColumn[] {
  const code = tabCode as WithdrawCategory;
  return [...PREFIX, ...(CATEGORY_COLUMNS[code] || []), ...SUFFIX];
}

export function rowKey(row: WithdrawChannelRowVO): string {
  return `${row.withdrawChannelId}:${row.matchKey}`;
}

/**
 * 把渠道事实比例还原成客户端“1 币种 = N VND”的展示价。
 *
 * 背景：旧数据既存在 rateFrom=1、rateTo=0.00004，也存在历史测试写入的
 * rateFrom=26472、rateTo=1；二者比例等价，但直接读 displayJson 可能把换算
 * 倍率误显示为 0.00004。这里只做展示归一化，不修改资金换算方向。
 */
export function clientPriceFromChannel(row: WithdrawChannelRowVO): number {
  const rateFrom = Number(row.rateFrom);
  const rateTo = Number(row.rateTo);
  if (Number.isFinite(rateFrom) && Number.isFinite(rateTo) && rateFrom > 0 && rateTo > 0) {
    return rateFrom >= rateTo ? rateFrom / rateTo : rateTo / rateFrom;
  }
  const fallback = Number(row.display?.clientPrice ?? row.clientPrice);
  if (!Number.isFinite(fallback) || fallback <= 0) return 0;
  return fallback < 1 ? 1 / fallback : fallback;
}

export function rowValue(row: WithdrawChannelRowVO, key: string): any {
  if (key === 'client') {
    return [row.clientCode, row.clientSubCode].filter(Boolean).join(' / ');
  }
  if (key === 'provider') return row.providerName || row.providerCode || '未配置';
  if (key === 'providerChannelCode') return row.providerChannelCode || '-';
  if (key === 'amount') return { min: row.matchAmountMin ?? row.amountMin, max: row.matchAmountMax ?? row.amountMax };
  if (key === 'sortNo') return row.sortNo ?? 0;
  if (key === 'enabled') return row.enabled ?? 0;
  if (key === 'bankCode') return row.bankCode || row.clientCode;
  if (key === 'dailyLimit') return row.dailyLimit;
  if (key === 'cardBrand') return row.display?.cardBrand || row.clientCode;
  if (key === 'denominations') return row.display?.denominations || '-';
  if (key === 'cardRate') return row.display?.rate ?? row.display?.exchangeRate ?? 1;
  if (key === 'network') return [row.display?.coinName || row.clientCode, row.display?.networkName || row.clientSubCode]
    .filter(Boolean).join(' / ');
  if (key === 'clientPrice') return clientPriceFromChannel(row);
  if (key === 'exchangeMode') return row.display?.exchangeMode || '平台兑换';
  if (key === 'asset') return row.display?.asset || 'KCoin';
  if (key === 'p2pPrice') return row.display?.p2pPrice || row.display?.price;
  if (key === 'timeout') return row.display?.timeout || 0;
  return row[key as keyof WithdrawChannelRowVO] ?? row.display?.[key] ?? '';
}

export function defaultDisplay(tabCode: string): Record<string, any> {
  if (tabCode === 'BANK') return { bankCode: '', bankName: '' };
  if (tabCode === 'CARD') return { cardBrand: '', cardLabel: '', denominations: '', rate: 1 };
  if (tabCode === 'CRYPTO') return { coinName: 'USDT', networkName: 'TRC20', clientPrice: 0 };
  if (tabCode === 'COIN12') return { exchangeMode: '平台兑换', bannerUrl: '', helpUrl: '' };
  return { asset: 'KCoin', p2pPrice: 1000, timeout: 15, description: '' };
}
