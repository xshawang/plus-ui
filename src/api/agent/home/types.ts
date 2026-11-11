/** 代理经营首页接口类型，对应 GET /infra/agent/dashboard/home。 */

export type AgentHomePeriod = 'yesterday' | 'last7' | 'last30';

export interface AgentHomeIdentity {
  agentId: string;
  loginName: string;
  lineType: number;
  topLevel: boolean;
  levelNo: number;
  levelName?: string | null;
  currency: string;
}

export interface AgentHomePeriodInfo {
  code: AgentHomePeriod;
  beginDate: string;
  endDate: string;
  dataThroughDate?: string | null;
  timezone: string;
  basis: 'T+1';
}

export interface AgentHomeSummary {
  teamUsers: number;
  directUsers: number;
  otherUsers: number;
  newUsers: number;
  activeUserVisits: number;
  rechargeUsers: number;
  rechargeAmount: number;
  firstDepositUsers: number;
  firstDepositAmount: number;
  registeredFirstDepositUsers: number;
  registeredFirstDepositAmount: number;
  validBet: number;
  winLoss: number;
  periodCommission: number;
  pendingCommission: number;
}

export interface AgentHomeComparison {
  newUsersRate?: number | null;
  activeUserVisitsRate?: number | null;
  rechargeAmountRate?: number | null;
  firstDepositUsersRate?: number | null;
  validBetRate?: number | null;
  winLossRate?: number | null;
  periodCommissionRate?: number | null;
}

export interface AgentHomeSegment {
  newUsers: number;
  activeUserVisits: number;
  rechargeUsers: number;
  rechargeAmount: number;
  firstDepositUsers: number;
  firstDepositAmount: number;
  registeredFirstDepositUsers: number;
  registeredFirstDepositAmount: number;
  validBet: number;
  winLoss: number;
  commission: number;
}

export interface AgentHomeSplit {
  direct: AgentHomeSegment;
  other?: AgentHomeSegment | null;
}

export interface AgentHomeCommission {
  settleCommission: number;
  actualCommission: number;
  directCommission: number;
  otherCommission?: number | null;
  pendingCommission: number;
  claimedCommission: number;
}

export interface AgentHomeTrendPoint {
  date: string;
  newUsers: number;
  activeUserVisits: number;
  rechargeAmount: number;
  firstDepositUsers: number;
  validBet: number;
  winLoss: number;
  commission: number;
}

export interface AgentHomeSnapshot {
  agent: AgentHomeIdentity;
  period: AgentHomePeriodInfo;
  summary: AgentHomeSummary;
  comparison: AgentHomeComparison;
  split: AgentHomeSplit;
  commission: AgentHomeCommission;
  trend: AgentHomeTrendPoint[];
  hasData: boolean;
}
