/**
 * 大厅 Banner（运营管理 → 大厅Banner）接口类型。
 * 契约来源：go88-service-infra /infra/ops/banner/**
 */

export interface BannerVO {
  id: string;
  /** Banner 标识（写入客户端 namebanner，唯一） */
  namebanner: string;
  /** 展示顺序（发布时统一重排为 0..n-1） */
  sortIndex: number;
  /** 图片地址：OSS 绝对 https 或 /banner/ 相对路径 */
  imageUrl: string;
  /** OSS 文件ID（新图上传后记录） */
  imageOssId?: number;
  /** 跳转类型：none/events/url/game */
  actionType: string;
  /** 客户端 gameid（events/url/游戏编码） */
  actionGameid?: string;
  /** 外链地址（actionType=url 时必填） */
  actionUrl?: string;
  mobileEnable?: number;
  webEnable?: number;
  /** VIP 金额门槛（0=不限） */
  vipMinAmount?: number;
  /** 0停用 1启用 */
  status?: number;
  remark?: string;
  updatedAt?: string;
}

/** 列表响应：条目 + 下发状态 */
export interface BannerListResult {
  rows: BannerVO[];
  total: number;
  /** 启用中的条目数（= 下次发布会写入客户端的条数） */
  enabledCount?: number;
  /** 当前已写入 bannerInfo 的条数 */
  publishedCount?: number;
  bannerInfoUpdatedAt?: string | null;
  filePath?: string;
  fileExists?: boolean;
  fileUpdatedAt?: string | null;
  fileSize?: number;
}

export interface BannerForm {
  id?: string;
  namebanner?: string;
  imageUrl?: string;
  imageOssId?: number;
  actionType?: string;
  actionGameid?: string;
  actionUrl?: string;
  mobileEnable?: number;
  webEnable?: number;
  vipMinAmount?: number;
  status?: number;
  remark?: string;
}
