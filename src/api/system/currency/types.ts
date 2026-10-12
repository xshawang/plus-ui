/**
 * 币种管理（系统 → 币种管理）接口类型。
 * 契约来源：F:/G318Abt/MD_DOC/11_系统/01-币种管理需求.md（截图 系统-币种管理2-NO.png）。
 * 注意：currencyId 为雪花ID，前后端一律按 string 透传，禁止 Number() 转换（既有多起精度丢失事故）。
 */
export interface CurrencyQuery extends PageQuery {
  keyword?: string;
  /** 筛选字段：currencyType（币种类型）/ master（总开关）/ lobby（大厅开关） */
  field?: string;
  value?: string;
  /** 开关值：0关 1开 */
  status?: number;
}

export interface CurrencyVO {
  currencyId: string;
  currencyCode: string;
  currencyName: string;
  currencyCountry: string;
  currencyIcon: string;
  thousandSep: string;
  currencySymbol: string;
  currencyRatio: string;
  currencyType: string;
  masterSwitch: number;
  lobbySwitch: number;
  isTop: number;
  sortNo: number;
  remark?: string;
  operatorId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CurrencyForm {
  currencyId?: string;
  currencyCode?: string;
  currencyName?: string;
  currencyCountry?: string;
  currencyIcon?: string;
  thousandSep?: string;
  currencySymbol?: string;
  currencyRatio?: string;
  currencyType?: string;
  masterSwitch?: number;
  lobbySwitch?: number;
  isTop?: number;
  sortNo?: number;
  remark?: string;
}

export interface CurrencyOptions {
  currencyTypes: { label: string; value: string }[];
  pageSize: number;
}
