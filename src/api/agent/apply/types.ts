/**
 * 专业代理申请（待审核 / 被拒绝 / 已通过）接口类型。
 * 契约来源：F:/G318Abt/MD_DOC/10_代理/03-专业代理申请审核需求.md
 */

/** 申请查询条件（三个页签共用） */
export interface AgentApplyQuery extends PageQuery {
  /** appliedAt（默认，申请时间）/ operatedAt（操作时间） */
  timeField?: string;
  timeScope?: string;
  beginTime?: string;
  endTime?: string;
  /** LOGIN_NAME（默认）/ UID */
  accountField?: string;
  accountKeyword?: string;
  /** 全部VIP等级时传 undefined */
  vipLevel?: number;
  currency?: string;
}

/** 申请行 */
export interface AgentApplyVO {
  /** 雪花ID，后端按字符串下发 */
  applyId: number | string;
  currency?: string;
  appliedAt?: string;
  operatedAt?: string;
  uid?: number | string;
  loginName?: string;
  vipLevel?: number;
  modeId?: number | string;
  modeName?: string;
  realName?: string;
  inviteCount?: number;
  /** 金额单位：分 */
  depositAmount?: number;
  rechargeAmount?: number;
  withdrawAmount?: number;
  betAmount?: number;
  rewardAmount?: number;
  applyRemark?: string;
  rejectReason?: string;
  approveRemark?: string;
  /** 1待审核 2已通过 3已拒绝 */
  status?: number;
  statusText?: string;
  agentId?: number | string;
  operatorId?: string;
}

/** 审核提交对象（单条 applyId / 批量 applyIds 二选一） */
export interface AgentApplyAuditForm {
  applyId?: number | string;
  applyIds?: Array<number | string>;
  approve: boolean;
  modeId?: number;
  layerId?: number;
  directLayerId?: number;
  withdrawMethod?: number;
  remark: string;
}

/** 三页签计数 */
export interface AgentApplyTabCounts {
  pending: number;
  approved: number;
  rejected: number;
}
