import request from '@/utils/request';

/**
 * 代理授权树会员关系接口。
 *
 * 所有 UID/代理 ID 保持字符串透传；服务端按当前 Sa-Token 代理会话再次裁剪范围。
 */
export const listAgentMembers = (params: Record<string, any>) =>
  request({ url: '/infra/agent/member/list', method: 'get', params });

export const getAgentMemberPath = (uid: string | number, statDate?: string, offset = 0, limit = 50) =>
  request({ url: `/infra/agent/member/${uid}/path`, method: 'get', params: { statDate, offset, limit } });
