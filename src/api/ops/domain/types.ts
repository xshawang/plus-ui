export interface DomainQuery extends PageQuery {
  domainType?: number;
  regionCode?: string;
  status?: number;
  domainName?: string;
}

export interface DomainVO {
  domainId: number;
  domainName: string;
  domainType: number;
  regionCode: string;
  isPrimary: number;
  weight: number;
  healthCheckPath: string;
  switchMode: number;
  status: number;
  remark: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DomainForm {
  domainId?: number;
  domainName?: string;
  domainType?: number;
  regionCode?: string;
  isPrimary?: number;
  weight?: number;
  healthCheckPath?: string;
  switchMode?: number;
  remark?: string;
}

export interface DomainStateForm {
  id: number;
  value: number;
}

export interface DomainHealthQuery extends PageQuery {
  domainId?: number;
  checkResult?: number;
}

export interface DomainHealthVO {
  logId: number;
  domainId: number;
  domainName: string;
  checkResult: number;
  httpCode: number;
  latencyMs: number;
  errorMsg: string;
  checkedAt: string;
}
