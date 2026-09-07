export interface MessageTemplateQuery extends PageQuery {
  msgType?: number;
  status?: number;
  keyword?: string;
}

export interface MessageTemplateVO {
  templateId: number;
  templateCode: string;
  templateName: string;
  msgType: number;
  titleTemplate: string;
  contentTemplate?: string;
  variablesJson?: string;
  status: number;
  remark: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MessageTemplateForm {
  templateId?: number;
  templateCode?: string;
  templateName?: string;
  msgType?: number;
  titleTemplate?: string;
  contentTemplate?: string;
  variablesJson?: string;
  remark?: string;
}

export interface MessageTemplateStateForm {
  id: number;
  value: number;
}

export interface MessageTaskQuery extends PageQuery {
  taskName?: string;
  channel?: number;
  targetScope?: number;
  status?: number;
}

export interface MessageTaskVO {
  taskId: number;
  templateId?: number;
  templateName?: string;
  taskName: string;
  channel: number;
  title: string;
  content?: string;
  targetScope: number;
  scopeParamsJson?: string;
  sendType: number;
  scheduledAt?: string;
  status: number;
  totalCount: number;
  successCount: number;
  failCount: number;
  sentAt?: string;
  finishedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MessageTaskForm {
  taskId?: number;
  templateId?: number;
  taskName?: string;
  channel?: number;
  title?: string;
  content?: string;
  targetScope?: number;
  scopeParamsJson?: string;
  sendType?: number;
  scheduledAt?: string;
}

export interface MessageTaskActionForm {
  id: number;
}

export interface MessageTaskScheduleForm {
  id: number;
  scheduledAt?: string;
}

export interface MessageRecordQuery extends PageQuery {
  taskId?: number;
  uid?: number;
  status?: number;
}

export interface MessageRecordVO {
  id: number;
  taskId: number;
  uid: number;
  channel: number;
  status: number;
  mailId: number;
  failReason: string;
  sentAt?: string;
  readAt?: string;
}
