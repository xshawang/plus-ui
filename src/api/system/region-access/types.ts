/**
 * 非经营地访问限制（系统 → 非经营地访问限制）接口类型。
 * 契约来源：F:/G318Abt/MD_DOC/11_系统/03-非经营地访问限制需求.md（截图 系统-非经营地访问限制.png）。
 */
export interface RegionAccessQuery extends PageQuery {
  keyword?: string;
  /** 访问类型：1禁止 2允许 */
  status?: number;
  beginTime?: string;
  endTime?: string;
}

export interface RegionAccessVO {
  id: string;
  /** 国家/地区中文展示名 */
  country: string;
  /** 国家/地区 ISO-3166 alpha-2（入口层判定依据；选择下拉后由前端一并提交） */
  countryCode?: string;
  siteName: string;
  accessType: number;
  permDownload: number;
  permApp: number;
  remark?: string;
  operatorId?: string;
  createdAt?: string;
  /** 策略生效开始（NULL=立即生效） */
  effectiveStart?: string | null;
  /** 策略生效结束（NULL=长期有效） */
  effectiveEnd?: string | null;
}

export interface RegionAccessForm {
  id?: string;
  country?: string;
  /** ISO-2 码：与 country 同时提交，入口层按它判定 */
  countryCode?: string;
  siteName?: string;
  accessType?: number;
  permDownload?: number;
  permApp?: number;
  remark?: string;
  effectiveStart?: string | null;
  effectiveEnd?: string | null;
}
