export function moneyFen(value: unknown): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return '-';
  return Math.round(n / 100).toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

export function percent(value: unknown, digits = 2): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '未配置';
  return `${(n * 100).toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })}%`;
}

export function numberValue(value: unknown, digits = 4): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '不可判定';
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

export function integerValue(value: unknown): string {
  if (value == null || value === '') return '-';
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  return Math.round(n).toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

export function stateType(state: string): 'success' | 'warning' | 'danger' | 'info' {
  if (state === 'NORMAL') return 'success';
  if (state === 'WARN') return 'warning';
  if (state === 'PAUSED') return 'danger';
  return 'info';
}

export function stateLabel(state: string): string {
  const labels: Record<string, string> = {
    NORMAL: '正常',
    WARN: '预算预警',
    PAUSED: '预算暂停',
    NO_DATA: '暂无数据'
  };
  return labels[state] || state || '未知';
}

export function timeText(value: unknown): string {
  if (!value) return '-';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('zh-CN', { hour12: false });
}
