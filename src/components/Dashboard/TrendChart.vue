<template>
  <div ref="chartEl" class="dashboard-trend-chart" :style="{ height: height + 'px' }" />
</template>

<script setup name="DashboardTrendChart" lang="ts">
import * as echarts from 'echarts';
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

type TrendUnit = 'count' | 'money' | 'signed';

const props = withDefaults(
  defineProps<{
    labels: string[];
    values: Array<number | null | undefined>;
    unit?: TrendUnit;
    seriesName?: string;
    color?: string;
    height?: number;
    area?: boolean;
  }>(),
  {
    unit: 'count',
    seriesName: '数值',
    color: '#4f7cff',
    height: 300,
    area: true
  }
);

const chartEl = ref<HTMLDivElement>();
let chart: echarts.ECharts | undefined;
let resizeObserver: ResizeObserver | undefined;

const compactNumber = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return (value / 1_000_000_000).toFixed(2).replace(/\.?0+$/, '') + 'B';
  if (abs >= 1_000_000) return (value / 1_000_000).toFixed(2).replace(/\.?0+$/, '') + 'M';
  if (abs >= 10_000) return (value / 1_000).toFixed(1).replace(/\.?0$/, '') + 'K';
  return String(value);
};

const buildOption = () => {
  const categories = props.labels.map(label => label.slice(5));
  const seriesData = props.values.map(value => (value === null || value === undefined ? null : value));
  const hasMany = categories.length > 32;
  const yIsMoney = props.unit === 'money' || props.unit === 'signed';
  return {
    animation: false,
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e4e7ed',
      textStyle: { color: '#303133', fontSize: 12 },
      formatter: (params: Array<{ axisValue: string; value: number | null }>) => {
        const row = params?.[0];
        if (!row) return '';
        const raw = row.value;
        const text = raw === null || raw === undefined ? '暂无数据' : String(raw);
        return `${row.axisValue}<br/>${props.seriesName}：${text}`;
      }
    },
    grid: { left: 16, right: 16, top: 36, bottom: 4, containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      boundaryGap: false,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisLabel: {
        color: '#909399',
        fontSize: 11,
        interval: hasMany ? Math.ceil(categories.length / 10) : 'auto'
      }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: '#ebeef5' } },
      axisLabel: {
        color: '#909399',
        fontSize: 11,
        formatter: (value: number) => (yIsMoney ? compactNumber(value) : String(value))
      }
    },
    series: [
      {
        name: props.seriesName,
        type: 'line',
        data: seriesData,
        smooth: false,
        showSymbol: categories.length <= 31,
        symbolSize: 5,
        connectNulls: false,
        lineStyle: { width: 2, color: props.color },
        itemStyle: { color: props.color },
        areaStyle: props.area
          ? {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: props.color + '33' },
                { offset: 1, color: props.color + '00' }
              ])
            }
          : undefined
      }
    ]
  };
};

const render = async () => {
  await nextTick();
  if (!chartEl.value) return;
  if (!chart) {
    chart = echarts.init(chartEl.value);
  }
  chart.setOption(buildOption(), true);
};

watch(
  () => [props.labels, props.values, props.unit, props.color],
  () => void render(),
  { deep: true }
);

onMounted(() => {
  void render();
  if (chartEl.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => chart?.resize());
    resizeObserver.observe(chartEl.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  chart?.dispose();
  chart = undefined;
});
</script>
