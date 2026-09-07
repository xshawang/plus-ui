export interface ChannelQuery extends PageQuery {
  channelCode?: string;
  channelName?: string;
  channelType?: number;
  status?: number;
  parentChannelId?: number;
}

export interface ChannelVO {
  channelId: number;
  channelCode: string;
  channelName: string;
  channelType: number;
  parentChannelId: number;
  status: number;
  remark: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ChannelForm {
  channelId?: number;
  channelCode?: string;
  channelName?: string;
  channelType?: number;
  parentChannelId?: number;
  remark?: string;
}

export interface ChannelStateForm {
  id: number;
  value: number;
}

export interface ChannelStatQuery {
  channelId?: number;
  channelType?: number;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

export interface ChannelStatVO {
  channelId: number;
  channelCode: string;
  channelName: string;
  channelType: number;
  registerCount: number;
  loginCount: number;
  payUserCount: number;
  payAmount: number;
  withdrawUserCount: number;
  withdrawAmount: number;
  gameRounds: number;
  revenueAmount: number;
}
