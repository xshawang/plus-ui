export interface OssConfigVO extends BaseEntity {
  ossConfigId: number | string;
  configKey: string;
  accessKey: string;
  secretKey: string;
  bucketName: string;
  prefix: string;
  endpoint: string;
  /** 自定义域名（FIX: 2026-09-28 与后端 SysOssConfig.domain / 库列 domain 对齐；原写 domainUrl 导致该列读不到值） */
  domain: string;
  isHttps: string;
  region: string;
  status: string;
  ext1: string;
  remark: string;
  accessPolicy: string;
}

export interface OssConfigQuery extends PageQuery {
  configKey: string;
  bucketName: string;
  status: string;
}

export interface OssConfigForm {
  ossConfigId: string | number | undefined;
  configKey: string;
  accessKey: string;
  secretKey: string;
  bucketName: string;
  prefix: string;
  endpoint: string;
  /** 自定义域名（同 VO，字段名必须为 domain） */
  domain: string;
  isHttps: string;
  accessPolicy: string;
  region: string;
  status: string;
  remark: string;
}
