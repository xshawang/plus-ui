/**
 * 马甲包管理（运营后台 → 运营管理 → 马甲包管理）接口类型。
 * 契约来源：F:/G318Abt/MD_DOC/4_运营/08-马甲包管理.md（截图 运营-渠道-马甲包.png）。
 */
export interface ShellPackQuery extends PageQuery {
  /** onSale=出售中 purchased=已购买 pending=待付款 expired=已失效 all=全部 */
  tab?: string;
  packType?: string;
  storeName?: string;
  industry?: string;
  regionCode?: string;
  keyword?: string;
}

export interface ShellPackVO {
  packId: number;
  packType: string;
  appName?: string;
  appIconUrl?: string;
  storeName?: string;
  regionCode?: string;
  industry?: string;
  /** 未购买时为 *，已购买返回真实包名（服务端脱敏） */
  appPackageName?: string;
  storeUrl?: string;
  priceAmount?: number;
  priceCurrency?: string;
  priceText?: string;
  saleStatus: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShellPackOrderVO {
  orderId: number;
  orderNo: string;
  packId: number;
  appName?: string;
  packType?: string;
  priceAmount?: number;
  priceCurrency?: string;
  status: number;
  paidAt?: string;
  expireAt?: string;
  createdAt?: string;
}

export interface ShellPackDocVO {
  docId: number;
  docTitle: string;
  docUrl?: string;
  docType?: string;
}
