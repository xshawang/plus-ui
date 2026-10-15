/**
 * 彩金池管理页的展示格式化（与游戏域 RTP 报表同一口径）。
 *
 * 为什么单独抽一个文件：奖池台账 + 三类流水 + 日报共 5 个面板都要格式化金额/比率/时间，
 * 复制 5 份必然漂移（例如有的页面把 VND 整数显示成 1,000,000.00、有的显示成 1,000,000）。
 */

/** 金额：千分位，最多 2 位小数（VND 整数不补 .00） */
export const amount = (value?: number | string | null) =>
  Number(value ?? 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

/** 比例：0.0162 → 1.62% */
export const pct = (value?: number | string | null) => `${((Number(value) || 0) * 100).toFixed(2)}%`;

/** 时间：后端 LocalDateTime 正常返回 'yyyy-MM-dd HH:mm:ss'，兼容 ISO 的 'T' 分隔形态 */
export const time = (value?: string | null) => (value ? String(value).replace('T', ' ') : '-');

/** 池水位进度（本轮累积 ÷ 必爆点）：必爆点为 0（未武装）时显示 '-' */
export const progress = (cycle?: number | null, target?: number | null) => {
  const t = Number(target ?? 0);
  if (t <= 0) return '-';
  return `${((Number(cycle ?? 0) / t) * 100).toFixed(2)}%`;
};
