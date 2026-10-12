/**
 * 会员 KV 配置（防刷风控 / 安全中心，需求文档 10）类型定义。
 *
 * 配置值为 JSON 文本：开关用 "0"/"1"，枚举用 "\"XXX\""，集合用 "[\"A\"]"。
 */
export interface ConfigItemVO {
  configId: number;
  configKey: string;
  configValue: string;
  configDesc?: string;
  operatorId?: string;
  updatedAt?: string;
}

export interface ConfigItemForm {
  configKey: string;
  configValue: string;
}

export interface ConfigBatchForm {
  items: ConfigItemForm[];
}
