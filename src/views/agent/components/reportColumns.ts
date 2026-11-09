/**
 * 代理报表列定义（方案 §12）。金额为分；人数类跨天相加为“人次”。
 * kind：money 金额(分→元) / num 数值 / pct 百分比 / rate 返佣比例 / text 文本 / map 字典映射。
 */
export interface ReportCol {
  label: string;
  prop: string;
  kind?: 'money' | 'num' | 'pct' | 'rate' | 'text' | 'map';
  map?: Record<string, string>;
  width?: number;
  sortable?: boolean;
  /** 不参与合计 */
  noSum?: boolean;
  /** 会员视角输赢：负数（平台赢）标红 */
  platformWin?: boolean;
  /** 自定义展示（如留存“百分比(人数)”） */
  format?: (row: any) => string;
}

export const LINE_MAP = { '1': '人人代理', '2': '专业代理' };
export const PERIOD_MAP = { '1': '日结', '2': '周结', '3': '月结', '4': '自定义' };
export const ORDER_STATUS_MAP = { '1': '待审核', '2': '待领取', '3': '已领取', '4': '已拒绝', '5': '已撤回', '6': '已过期' };
export const BATCH_STATUS_MAP = { '1': '运行中', '2': '成功', '3': '失败', '4': '已撤回重出' };

export const AGENT_COLS: ReportCol[] = [
  { label: '代理账号', prop: 'loginName', kind: 'text' },
  { label: '代理ID', prop: 'agentId', kind: 'text', width: 170 },
  { label: '代理类型', prop: 'lineType', kind: 'map', map: LINE_MAP, width: 100 },
  { label: '代理模式', prop: 'modeName', kind: 'text' }
];

export const GAME_COLS: ReportCol[] = [
  { label: '有效投注', prop: 'validBet', kind: 'money', sortable: true },
  { label: '总投注', prop: 'betAmount', kind: 'money' },
  { label: '总输赢', prop: 'winLoss', kind: 'money', platformWin: true },
  { label: '领取奖励', prop: 'claimAmount', kind: 'money' }
];

export const FIN_COLS: ReportCol[] = [
  { label: '充值', prop: 'rechargeAmount', kind: 'money', sortable: true },
  { label: '充值人次', prop: 'rechargeUsers', kind: 'num' },
  { label: '首充', prop: 'firstDepAmount', kind: 'money' },
  { label: '首充人数', prop: 'firstDepUsers', kind: 'num' },
  { label: '当天注册首充', prop: 'regFirstAmount', kind: 'money' },
  { label: '当天注册首充人数', prop: 'regFirstUsers', kind: 'num', width: 140 },
  { label: '二充', prop: 'secondDepAmount', kind: 'money' },
  { label: '二充人数', prop: 'secondDepUsers', kind: 'num' },
  { label: '提现', prop: 'withdrawAmount', kind: 'money' },
  { label: '提现人次', prop: 'withdrawUsers', kind: 'num' },
  { label: '充提差', prop: 'depositDiff', kind: 'money' },
  { label: '修正补单', prop: 'fixAmount', kind: 'money' }
];

export const COMM_COLS: ReportCol[] = [
  { label: '结算佣金', prop: 'settleCommission', kind: 'money', sortable: true },
  { label: '实发佣金', prop: 'actualCommission', kind: 'money' },
  { label: '已领取', prop: 'claimedCommission', kind: 'money' }
];

export const NEW_USERS: ReportCol = { label: '新增会员', prop: 'newUsers', kind: 'num' };

/** 首充转化率 = 首充人数 ÷ 新增会员（括号内为当天注册口径） */
export const CONVERT_COL: ReportCol = {
  label: '首充转化率',
  prop: 'firstDepUsers',
  kind: 'text',
  noSum: true,
  format: (r) => {
    const n = Number(r.newUsers ?? 0);
    if (!n) {
      return '—';
    }
    return `${((Number(r.firstDepUsers ?? 0) / n) * 100).toFixed(2)}%（${((Number(r.regFirstUsers ?? 0) / n) * 100).toFixed(2)}%）`;
  }
};

export const retainCols = (): ReportCol[] => {
  const pctOf = (k: string) => (r: any) => {
    const size = Number(r.cohortSize ?? 0);
    if (r[k] === null || r[k] === undefined) {
      return '—';
    }
    return size ? `${((Number(r[k]) / size) * 100).toFixed(2)}%（${r[k]}）` : '0%';
  };
  return [
    { label: '代理账号', prop: 'loginName', kind: 'text' },
    { label: '批次日期', prop: 'cohortDate', kind: 'text' },
    { label: '批次人数', prop: 'cohortSize', kind: 'num' },
    ...['d2', 'd3', 'd4', 'd7', 'd14', 'd30', 'd60'].map(
      (k) => ({ label: `${k.slice(1)}日留存`, prop: k, kind: 'text', noSum: true, format: pctOf(k) }) as ReportCol
    )
  ];
};

export const CLAIM_ITEMS: Record<string, string> = {
  activity: '活动',
  rebate: '返水',
  task: '任务',
  vip: 'VIP',
  agent_commission: '代理佣金',
  other: '其他'
};
