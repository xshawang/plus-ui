/**
 * 充值大类与通道页的常量与纯函数（从 index.vue 拆出，供表格、弹窗共用）。
 */
import type {
  FinanceChannelGroupVO,
  FinanceChannelRouteForm,
  FinanceChannelRouteVO
} from '@/api/finance/channel/types';
import type {
  WithdrawChannelProfileForm,
  WithdrawChannelProfileVO
} from '@/api/finance/withdraw-channel/types';

export const P2P_GROUP_CODE = 'P2P';
export const P2P_GROUP_TYPE = 6;
export const QUICK_PAY_CLIENT_CODES = ['FASTPAY', 'SNAPQR', '1PAY', 'TAPSCAN'];
/** 成功率样本少于该值时不做颜色预警 */
export const MIN_RATE_SAMPLE = 30;

export const groupTypeOptions = [
  { label: '在线充值', value: 1 },
  { label: '转账充值', value: 2 },
  { label: '客服代充', value: 3 },
  { label: '加密货币', value: 4 },
  { label: '礼品卡', value: 5 },
  { label: 'P2P 充值', value: 6 }
];

export const methodOptions = [
  { label: '银行转账', value: 'BANKS' },
  { label: '充值卡', value: 'CARD' },
  { label: '电子钱包', value: 'EWALLET' },
  { label: '加密货币', value: 'CRYPTO' },
  { label: '快捷充值', value: 'QUICK_PAY' },
  { label: 'P2P 充值', value: 'P2P' },
  { label: '礼品卡', value: 'GIFT_CARD' }
];

export const methodLabel = (method?: string) =>
  methodOptions.find((item) => item.value === method)?.label ?? method ?? '未配置';

export const isCryptoGroup = (group: FinanceChannelGroupVO) => group.groupCode === 'CRYPTO' || group.groupType === 4;
export const isQuickPayGroup = (group: FinanceChannelGroupVO) => (group.groupCode ?? '').toUpperCase() === 'QUICK_PAY';
export const isP2pGroup = (group: FinanceChannelGroupVO) =>
  (group.groupCode ?? '').toUpperCase() === P2P_GROUP_CODE || group.groupType === P2P_GROUP_TYPE;

/** 快捷充值只展示客户端契约内的 4 个平台；历史档位行（BM_/GB_/CP_*）不展示 */
export const visibleRoutes = (group: FinanceChannelGroupVO): FinanceChannelRouteVO[] => {
  const routes = group.routes ?? [];
  if (!isQuickPayGroup(group)) return routes;
  return routes.filter((route) => QUICK_PAY_CLIENT_CODES.includes((route.routeCode || route.clientCode || '').toUpperCase()));
};

/** 没有三方候选时，按支付方式说明资金实际去向 */
export const selfSourceLabel = (route: FinanceChannelRouteVO): string => {
  switch (route.methodType) {
    case 'CRYPTO': return '自有地址 · crypto_config';
    case 'CARD': return '卡密直连 · card_config';
    case 'GIFT_CARD': return '外链兑换';
    case 'P2P': return '独立渠道 · 提现渠道表';
    default: return '未绑定三方';
  }
};

export const usableCandidates = (route: FinanceChannelRouteVO) =>
  (route.candidates ?? []).filter((item) => item.usable);

/** 异常原因（前端计算）：有候选但无可用 / 今日成功率低 / 有候选在自动摘流期 */
export const abnormalReason = (route: FinanceChannelRouteVO): string => {
  if (route.status !== 1) return '';
  const candidates = route.candidates ?? [];
  if (candidates.length > 0 && usableCandidates(route).length === 0) return '无可用三方';
  if ((route.todayOrderCount ?? 0) >= MIN_RATE_SAMPLE && (route.todaySuccessRate ?? 100) < 50) return '今日成功率低于 50%';
  const now = Date.now();
  if (candidates.some((item) => item.enabled === 1 && item.autoDisabledUntil && Date.parse(item.autoDisabledUntil.replace(' ', 'T')) > now)) {
    return '有候选处于自动摘流期';
  }
  return '';
};

export const parseChannelConfig = (json?: string): Record<string, any> => {
  try {
    const root = JSON.parse(json || '{}');
    return root && typeof root === 'object' && !Array.isArray(root) ? root : {};
  } catch {
    return {};
  }
};

export const methodTypeForGroup = (group: FinanceChannelGroupVO) => {
  const code = (group.groupCode ?? '').toUpperCase();
  if (methodOptions.some((item) => item.value === code)) return code;
  if (group.groupType === P2P_GROUP_TYPE) return 'P2P';
  return group.groupType === 4 ? 'CRYPTO' : 'BANKS';
};

export const inferMethodType = (route: FinanceChannelRouteVO) => {
  if (route.methodType) return route.methodType;
  if (route.qrData || route.coinName) return 'CRYPTO';
  if (route.cardBrand) return 'CARD';
  if (route.giftCode) return 'GIFT_CARD';
  if (route.prefix) return 'QUICK_PAY';
  return 'BANKS';
};

export const emptyRouteForm = (): FinanceChannelRouteForm => ({
  routeId: undefined, groupId: undefined, routeCode: '', channelName: '', subSort: 0, merchantId: undefined,
  currency: 'VND', amountMin: 0, amountMax: 0, recommendAmounts: '', channelRemark: '', status: 1,
  platform: 'go88', direction: 1, methodType: 'BANKS', clientCode: '', clientSubCode: '', dailyLimit: 0,
  maintenanceCode: '', addressV1Enabled: 1, addressV3Enabled: 1, channelIcon: '', openTimeStart: '00:00',
  openTimeEnd: '23:59', bankCode: '', bankName: '', smartpayCode: '', account: '', receiveNumber: '',
  statementTime: '', timeLimit: 0, orderNavigate: 0, cardBrand: '', cardLabel: '', denominations: '[]', rate: 0,
  coinName: '', networkName: '', address: '', qrData: '', price: 0, platformRate: 0, prefix: '', fee: 0,
  bonusAmount: 0, content: '', accountName: '', minAmount: 0, maxAmount: 0, thirdPartyParams: '', giftCode: '',
  giftName: '', iconUrl: '', jumpUrl: '', payoutMode: 'MANUAL', beneficiaryAddress: '', rateMode: 'NONE',
  exchangeRate: 1, feeMode: 'NONE', feeFixed: 0, feeCurrency: 'VND', beneficiaryType: 'BANK', accountPattern: '',
  clientFieldSchemaJson: '{}', channelConfigJson: '{}', priorityNo: 0, p2pAssetName: 'KDG', p2pPrice: 1000,
  p2pPaymentTimeLimit: 10, p2pMakerUserName: 'P2P-Platform', p2pMakerDisplayName: 'P2P Platform',
  p2pMinTotalDeposit: 1000000, p2pAutoReplyText: '', p2pNote: '', p2pDepositBankCode: '', p2pDepositAccountNo: '',
  p2pDepositAccountName: '', p2pDepositContent: ''
});

/** 新增子通道时按所属大类给出默认支付方式与币种 */
export const newRouteForm = (group: FinanceChannelGroupVO): FinanceChannelRouteForm => {
  const methodType = methodTypeForGroup(group);
  return {
    ...emptyRouteForm(),
    groupId: group.groupId,
    currency: group.groupType === 4 ? 'USDT' : 'VND',
    methodType,
    payoutMode: methodType === 'P2P' ? 'P2P' : 'MANUAL',
    beneficiaryType: methodType === 'P2P' ? 'P2P_BANK' : methodType === 'EWALLET' ? 'EWALLET' : 'BANK'
  };
};

/**
 * 列表行 → 编辑表单。
 * 不再回填 successRate / feeRate / mergeFlag / blacklistEnable：这些字段改版后不由后台写入。
 */
export const routeToForm = (route: FinanceChannelRouteVO): FinanceChannelRouteForm => ({
  ...emptyRouteForm(),
  ...pickDefined(route),
  merchantId: route.merchantId && route.merchantId > 0 ? route.merchantId : undefined,
  methodType: route.methodType || inferMethodType(route),
  bankCode: route.bankCode ?? route.clientCode ?? route.routeCode,
  bankName: route.bankName ?? route.channelName,
  account: route.account ?? route.receiveNumber ?? '',
  receiveNumber: route.receiveNumber ?? route.account ?? '',
  orderNavigate: route.orderNavigate ?? route.subSort ?? 0,
  cardBrand: route.cardBrand ?? route.clientCode ?? route.routeCode,
  cardLabel: route.cardLabel ?? route.channelName,
  coinName: route.coinName ?? route.clientCode ?? '',
  networkName: route.networkName ?? route.clientSubCode ?? '',
  platformRate: route.platformRate ?? route.price ?? 0,
  prefix: route.prefix ?? route.clientCode ?? route.routeCode,
  minAmount: route.minAmount ?? route.amountMin ?? 0,
  maxAmount: route.maxAmount ?? route.amountMax ?? 0,
  beneficiaryAddress: route.beneficiaryAddress ?? route.account ?? '',
  feeCurrency: route.feeCurrency ?? route.currency ?? 'VND',
  beneficiaryType: route.beneficiaryType ?? (route.methodType === 'P2P' ? 'P2P_BANK' : 'BANK'),
  priorityNo: route.priorityNo ?? route.subSort ?? 0,
  p2pMakerDisplayName: route.p2pMakerDisplayName ?? route.channelName,
  successRate: undefined,
  feeRate: undefined,
  mergeFlag: undefined,
  blacklistEnable: undefined,
  frontEnable: undefined
});

const OMIT_KEYS = new Set(['candidates', 'costFeeRate', 'todayOrderCount', 'todaySuccessCount', 'todaySuccessRate',
  'd30OrderCount', 'd30SuccessCount', 'd30SuccessRate', 'merchantName', 'providerAmountMin', 'providerAmountMax',
  'providerRouteCount', 'operatorId', 'createdAt', 'updatedAt', 'platformKey', 'platformUrl']);

const pickDefined = (route: FinanceChannelRouteVO): Partial<FinanceChannelRouteForm> => {
  const out: Record<string, unknown> = {};
  Object.entries(route).forEach(([key, value]) => {
    if (value !== undefined && value !== null && !OMIT_KEYS.has(key)) out[key] = value;
  });
  return out as Partial<FinanceChannelRouteForm>;
};

/** P2P 渠道读自 finance_withdraw_channel，这里转成子通道行展示 */
export const p2pRouteFromProfile = (profile: WithdrawChannelProfileVO, groupId: number): FinanceChannelRouteVO => {
  const p2p = parseChannelConfig(profile.channelConfigJson).p2p ?? {};
  return {
    routeId: profile.withdrawChannelId,
    withdrawChannelId: profile.withdrawChannelId,
    groupId,
    routeCode: profile.channelCode,
    channelName: profile.channelName,
    subSort: profile.priorityNo ?? profile.sortNo ?? 0,
    merchantId: profile.merchantId,
    merchantName: profile.merchantName,
    currency: profile.currency,
    amountMin: profile.amountMin ?? 0,
    amountMax: profile.amountMax ?? 0,
    recommendAmounts: '',
    channelRemark: profile.remark ?? '',
    status: profile.status,
    frontEnable: profile.frontEnable,
    platform: profile.platform,
    direction: 1,
    methodType: 'P2P',
    clientCode: profile.clientCode ?? '',
    clientSubCode: profile.clientSubCode ?? '',
    dailyLimit: profile.dailyLimit ?? 0,
    maintenanceCode: profile.maintenanceCode ?? '',
    channelIcon: profile.iconArt ?? '',
    openTimeStart: profile.openTimeStart,
    openTimeEnd: profile.openTimeEnd,
    account: profile.beneficiaryAddress ?? '',
    payoutMode: profile.payoutMode,
    beneficiaryAddress: profile.beneficiaryAddress,
    rateMode: profile.rateMode,
    exchangeRate: Number(profile.exchangeRate ?? 1),
    feeMode: profile.feeMode,
    feeFixed: Number(profile.feeFixed ?? 0),
    feeCurrency: profile.feeCurrency,
    beneficiaryType: profile.beneficiaryType,
    accountPattern: profile.accountPattern,
    clientFieldSchemaJson: profile.clientFieldSchemaJson,
    channelConfigJson: profile.channelConfigJson,
    priorityNo: profile.priorityNo,
    p2pAssetName: String(p2p.assetName || profile.clientCode || 'KDG'),
    p2pPrice: Number(p2p.price || 1000),
    p2pPaymentTimeLimit: Number(p2p.paymentTimeLimit || 10),
    p2pMakerUserName: String(p2p.makerUserName || 'P2P-Platform'),
    p2pMakerDisplayName: String(p2p.makerDisplayName || profile.channelName || 'P2P Platform'),
    p2pMinTotalDeposit: Number(p2p.minTotalDeposit || 0),
    p2pAutoReplyText: String(p2p.autoReplyText || ''),
    p2pNote: String(p2p.note || ''),
    p2pDepositBankCode: String(p2p.depositBankCode || ''),
    p2pDepositAccountNo: String(p2p.depositAccountNo || ''),
    p2pDepositAccountName: String(p2p.depositAccountName || ''),
    p2pDepositContent: String(p2p.depositContent || ''),
    candidates: []
  };
};

/** P2P 子通道表单 → 提现渠道档案保存载荷（沿用改版前逻辑） */
export const buildP2pPayload = (form: FinanceChannelRouteForm, original?: WithdrawChannelProfileVO): WithdrawChannelProfileForm => {
  const configRoot = parseChannelConfig(form.channelConfigJson);
  const p2p = {
    ...configRoot.p2p,
    assetName: String(form.p2pAssetName || 'KDG').trim(),
    price: Number(form.p2pPrice || 0),
    paymentTimeLimit: Number(form.p2pPaymentTimeLimit || 10),
    makerUserName: String(form.p2pMakerUserName || '').trim(),
    makerDisplayName: String(form.p2pMakerDisplayName || '').trim(),
    minTotalDeposit: Number(form.p2pMinTotalDeposit || 0),
    autoReplyText: String(form.p2pAutoReplyText || '').trim(),
    note: String(form.p2pNote || '').trim(),
    depositBankCode: String(form.p2pDepositBankCode || '').trim(),
    depositAccountNo: String(form.p2pDepositAccountNo || '').trim(),
    depositAccountName: String(form.p2pDepositAccountName || '').trim(),
    depositContent: String(form.p2pDepositContent || '').trim()
  };
  const rateValue = Number(form.exchangeRate || 1);
  return {
    withdrawChannelId: original?.withdrawChannelId,
    channelCode: String(form.routeCode || '').trim(),
    channelName: String(form.channelName || '').trim(),
    platformKey: original?.platformKey ?? '',
    platformUrl: original?.platformUrl ?? '',
    iconArt: original?.iconArt ?? form.channelIcon ?? '',
    tabCode: P2P_GROUP_CODE,
    platform: String(form.platform || 'go88').trim(),
    payoutMode: 'P2P',
    merchantId: form.merchantId,
    clientCode: String(form.clientCode || form.routeCode || '').trim(),
    clientSubCode: String(form.clientSubCode || '').trim(),
    supportedBankCodes: original?.supportedBankCodes
      ? original.supportedBankCodes.split(',').map((code) => code.trim()).filter(Boolean)
      : [],
    currency: String(form.currency || 'VND').trim(),
    settlementCurrency: original?.settlementCurrency || 'VND',
    rateFrom: Number(original?.rateFrom || rateValue),
    rateTo: Number(original?.rateTo || rateValue),
    clientPrice: Number(original?.clientPrice || rateValue),
    beneficiaryAddress: String(form.account || form.beneficiaryAddress || '').trim(),
    amountMin: Number(form.amountMin || 0),
    amountMax: Number(form.amountMax || 0),
    dailyLimit: Number(form.dailyLimit || 0),
    maintenanceCode: String(form.maintenanceCode || '').trim(),
    openTimeStart: form.openTimeStart || '00:00',
    openTimeEnd: form.openTimeEnd || '23:59',
    rateMode: original?.rateMode || 'REALTIME',
    exchangeRate: rateValue,
    feeMode: original?.feeMode || 'NONE',
    feeRate: Number(original?.feeRate || 0),
    feeFixed: Number(original?.feeFixed || 0),
    feeCurrency: original?.feeCurrency || 'VND',
    beneficiaryType: 'P2P_BANK',
    accountPattern: original?.accountPattern ?? '',
    clientFieldSchemaJson: original?.clientFieldSchemaJson ?? '{}',
    channelConfigJson: JSON.stringify({ ...configRoot, p2p }),
    priorityNo: Number(form.priorityNo ?? form.subSort ?? 0),
    sortNo: Number(form.subSort || 0),
    status: Number(form.status ?? 1),
    frontEnable: Number(form.status ?? 1),
    remark: String(form.channelRemark || '').trim()
  };
};
