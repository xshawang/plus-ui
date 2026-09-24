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
  country: string;
  siteName: string;
  accessType: number;
  permDownload: number;
  permApp: number;
  remark?: string;
  operatorId?: string;
  createdAt?: string;
}

export interface RegionAccessForm {
  id?: string;
  country?: string;
  siteName?: string;
  accessType?: number;
  permDownload?: number;
  permApp?: number;
  remark?: string;
}
