export interface ClientConfigItem extends BaseEntity {
  id?: string | number;
  /** 8go88 顶层配置键 */
  configKey: string;
  /** 值类型 */
  valueType?: string;
  /** 配置值（JSON 文本） */
  configValue?: string;
  /** 属性说明 */
  description?: string;
  /** 排序号 */
  sortNo?: number;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClientConfigInfo {
  filePath: string;
  exists: boolean;
  size?: number;
  lastModified?: number;
  dbCount?: number;
}

export interface ClientConfigSaveBody {
  items: ClientConfigItem[];
  writeFile: boolean;
}
