import { ref } from 'vue';

/**
 * 时间粒度查询（日 / 周 / 月 三段按钮 + 对应日期选择器）。
 *
 * 背景：运营后台多张列表（系统-币种管理/访问控制/非经营地/站点管理/后台日志，以及既有的代理、
 * 优惠、游戏等页面）筛选区左上角都是「日 周 月」三段按钮，点击后联动默认时间区间。
 * 为什么抽成 hook：原实现每个页面各写一份「默认区间 + 补时分秒」逻辑，导致同一后台不同页面
 * 的区间口径不一致（例如某页含当天、某页不含），抽出来后所有页面共享同一口径。
 * 协作关系：页面把 buildTimeParams() 结果并入查询参数（后端统一按 beginTime/endTime 过滤）。
 */
type TimeScope = 'day' | 'week' | 'month';

interface TimeScopeOptions {
  /** 默认粒度；截图多数页面默认「月」，可按页面覆盖 */
  defaultScope?: TimeScope;
}

export function useTimeScopeQuery(options: TimeScopeOptions = {}) {
  const timeScope = ref<TimeScope>(options.defaultScope ?? 'month');
  const dateRange = ref<string[]>([]);
  const monthValue = ref<string>('');

  const pad = (value: number) => String(value).padStart(2, '0');
  const fmt = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  /** 按当前粒度重置默认区间（日=今天、周=近 7 天、月=当前自然月） */
  const applyScopeRange = () => {
    const now = new Date();
    if (timeScope.value === 'week') {
      dateRange.value = [fmt(new Date(now.getTime() - 6 * 24 * 3600 * 1000)), fmt(now)];
    } else if (timeScope.value === 'month') {
      monthValue.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
    } else {
      dateRange.value = [fmt(now), fmt(now)];
    }
  };

  const handleScopeChange = () => {
    applyScopeRange();
  };

  /**
   * 组装时间过滤参数。
   *
   * 为什么补 00:00:00 / 23:59:59：库里是 datetime(3)，只传日期会漏掉当天（比较时按 00:00:00 判等）。
   */
  const buildTimeParams = (): { beginTime?: string; endTime?: string } => {
    if (timeScope.value === 'month' && monthValue.value) {
      const [year, month] = monthValue.value.split('-').map(item => Number(item));
      const lastDay = new Date(year, month, 0).getDate();
      return {
        beginTime: `${monthValue.value}-01 00:00:00`,
        endTime: `${monthValue.value}-${pad(lastDay)} 23:59:59`
      };
    }
    const range = dateRange.value?.length === 2 && dateRange.value[0] ? dateRange.value : null;
    if (!range) {
      return {};
    }
    return { beginTime: `${range[0]} 00:00:00`, endTime: `${range[1]} 23:59:59` };
  };

  return {
    timeScope,
    dateRange,
    monthValue,
    applyScopeRange,
    handleScopeChange,
    buildTimeParams
  };
}
