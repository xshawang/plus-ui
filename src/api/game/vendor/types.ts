/** 第三方游戏（OneAPI）全局接入配置：Key/Secret 返回掩码，保存时为空或含 **** 视为不修改。 */
export interface VendorConfigVO {
  id?: number;
  configCode?: string;
  apiBaseUrl: string;
  apiKey: string;
  apiSecret: string;
  apiKeyConfigured?: boolean;
  apiSecretConfigured?: boolean;
  usernamePrefix: string;
  prefixLocked?: number;
  currency: string;
  unitMultiplier: number;
  balanceRoundMode: string;
  balanceScale: number;
  amountRoundMode: string;
  defaultValidRatio: string;
  lobbyUrl: string;
  defaultLanguage: string;
  defaultPlatform: string;
  callbackIpAllowlist: string;
  sessionTtlSeconds: number;
  connectTimeoutMs: number;
  readTimeoutMs: number;
  status: number;
  lastTestAt?: string;
  lastTestResult?: string;
  remark?: string;
}

export interface RemoteVendorVO {
  code: string;
  name: string;
  currencyCode: string;
  categoryCode: string;
  imported: boolean;
}

export interface VendorImportResult {
  providerCode: string;
  remote: number;
  inserted: number;
  updated: number;
  skipped: string[];
  unclassified: string[];
}

export interface WalletTxnVO {
  id: string;
  transactionId: string;
  api: string;
  resultType: string;
  uid: number;
  username: string;
  vendorCode: string;
  gameCode: string;
  betId: string;
  roundId: string;
  amountK: number;
  amountVnd: number;
  roundingDiff: number;
  walletCommand: string;
  status: string;
  rejectCode: string;
  balanceAfter: number;
  traceId: string;
  requestBody: string;
  createdAt: string;
}

export interface BetRecordVO {
  id: number;
  betId: string;
  uid: number;
  vendorCode: string;
  gameCode: string;
  roundId: string;
  betAmount: number;
  winAmount: number;
  jackpotAmount: number;
  reversedBetAmount: number;
  reversedWinAmount: number;
  adjustAmount: number;
  effectiveTurnover: number;
  winLoss: number;
  status: number;
  isFreeSpin: number;
  orphan: number;
  manualRequired: number;
  reconcileStatus: number;
  betTime: number;
  settledTime: number;
}

export interface ReconcileDiffVO {
  id: number;
  betId: string;
  diffType: string;
  localSnapshot: string;
  remoteSnapshot: string;
  handled: number;
  createdAt: string;
  updatedAt: string;
}
