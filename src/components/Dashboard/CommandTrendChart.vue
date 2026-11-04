<template>
  <div ref="chartEl" class="command-trend-chart" :style="{ height: height + 'px' }" />
</template>

<script setup name="DashboardCommandTrendChart" lang="ts">
import { LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import { init, use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

use([LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

type TrendUnit = 'count' | 'money';

export interface CommandTrendSeries {
  key: string;
  name: string;
  values: Array<number | null | undefined>;
  unit: TrendUnit;
  color: string;
}

const props = withDefaults(
  defineProps<{
    labels: string[];
    series: CommandTrendSeries[];
    height?: number;
  }>(),
  {
    height: 260
  }
);

const chartEl = ref<HTMLDivElement>();
let chart: ReturnType<typeof init> | undefined;
let resizeObserver: ResizeObserver | undefined;

const compactNumber = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return Math.round(value / 1_000_000_000).toLocaleString('en-US') + 'B';
  if (abs >= 1_000_000) return Math.round(value / 1_000_000).toLocaleString('en-US') + 'M';
  if (abs >= 10_000) return Math.round(value / 1_000).toLocaleString('en-US') + 'K';
  return Math.round(value).toLocaleString('en-US');
};

const formatValue = (value: number, unit: TrendUnit) =>
  unit === 'money' ? compactNumber(value) : Math.round(value).toLocaleString('en-US');

const buildOption = () => ({
  animation: false,
  legend: {
    top: 4,
    left: 8,
    itemWidth: 14,
    itemHeight: 2,
    textStyle: { color: '#606266', fontSize: 11 }
  },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderColor: '#e4e7ed',
    textStyle: { color: '#303133', fontSize: 12 },
    formatter: (params: Array<{ axisValue: string; marker: string; seriesName: string; value: number | null }>) => {
      const rows = params ?? [];
      if (!rows.length) return '';
      return [
        rows[0].axisValue,
        ...rows.map(row => {
          const series = props.series.find(item => item.name === row.seriesName);
          const text =
            row.value === null || row.value === undefined
              ? '暂无数据'
              : formatValue(row.value, series?.unit ?? 'count');
          return `${row.marker}${row.seriesName}：${text}`;
        })
      ].join('<br/>');
    }
  },
  grid: { left: 16, right: 18, top: 42, bottom: 8, containLabel: true },
  xAxis: {
    type: 'category',
    data: props.labels,
    boundaryGap: false,
    axisTick: { show: false },
    axisLine: { lineStyle: { color: '#dcdfe6' } },
    axisLabel: { color: '#909399', fontSize: 10, interval: 3 }
  },
  yAxis: [
    {
      type: 'value',
      name: '金额',
      splitLine: { lineStyle: { type: 'dashed', color: '#ebeef5' } },
      axisLabel: { color: '#909399', fontSize: 10, formatter: compactNumber }
    },
    {
      type: 'value',
      name: '数量',
      splitLine: { show: false },
      axisLabel: { color: '#909399', fontSize: 10, formatter: (value: number) => String(value) }
    }
  ],
  series: props.series.map(item => ({
    name: item.name,
    type: 'line',
    data: item.values,
    smooth: false,
    showSymbol: false,
    connectNulls: false,
    yAxisIndex: item.unit === 'money' ? 0 : 1,
    lineStyle: { width: 2, color: item.color },
    itemStyle: { color: item.color }
  }))
});

const render = async () => {
  await nextTick();
  if (!chartEl.value) return;
  if (!chart) chart = init(chartEl.value);
  chart.setOption(buildOption(), true);
};

watch(
  () => [props.labels, props.series],
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

<style scoped>
.command-trend-chart {
  width: 100%;
}
</style>
