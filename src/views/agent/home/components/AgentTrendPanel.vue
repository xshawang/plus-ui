<template>
  <section class="panel trend-panel">
    <div class="panel-head">
      <div>
        <h3>经营趋势</h3>
        <span>按统计日展示，数据口径 T+1</span>
      </div>
      <div class="trend-controls">
        <el-radio-group v-model="trendDays" size="small">
          <el-radio-button :value="7">近 7 天</el-radio-button>
          <el-radio-button :value="30">近 30 天</el-radio-button>
        </el-radio-group>
        <el-select v-model="metric" size="small" style="width: 130px">
          <el-option v-for="item in metrics" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>
    </div>
    <TrendChart
      v-if="points.length"
      :labels="points.map(item => item.date)"
      :values="points.map(item => Number(item[metric]))"
      :unit="metric === 'newUsers' || metric === 'activeUserVisits' || metric === 'firstDepositUsers' ? 'count' : 'money'"
      :series-name="selectedMetric.label"
      :height="286"
      :color="selectedMetric.color"
    />
    <el-empty v-else description="暂无趋势数据" :image-size="54" />
  </section>
</template>

<script setup name="AgentTrendPanel" lang="ts">
import { computed, ref } from 'vue';
import TrendChart from '@/components/Dashboard/TrendChart.vue';
import type { AgentHomeTrendPoint } from '@/api/agent/home/types';

type MetricKey = 'newUsers' | 'activeUserVisits' | 'rechargeAmount' | 'firstDepositUsers' | 'validBet' | 'winLoss' | 'commission';

const props = defineProps<{ rows: AgentHomeTrendPoint[] }>();
const trendDays = ref<7 | 30>(30);
const metric = ref<MetricKey>('newUsers');

const metrics: Array<{ value: MetricKey; label: string; color: string }> = [
  { value: 'newUsers', label: '新增会员', color: '#4f7cff' },
  { value: 'activeUserVisits', label: '活跃人次', color: '#7c5cff' },
  { value: 'rechargeAmount', label: '充值金额', color: '#22b07d' },
  { value: 'firstDepositUsers', label: '首充人数', color: '#21a7b7' },
  { value: 'validBet', label: '有效投注', color: '#f59a3c' },
  { value: 'winLoss', label: '团队输赢', color: '#d15454' },
  { value: 'commission', label: '佣金', color: '#8256d0' }
];

const selectedMetric = computed(() => metrics.find(item => item.value === metric.value) ?? metrics[0]);
const points = computed(() => props.rows.slice(-trendDays.value));
</script>

<style scoped lang="scss">
.panel {
  min-width: 0;
  padding: 18px;
  border: 1px solid #e7ebf3;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(36, 51, 85, 0.05);
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 10px;

  h3 {
    margin: 0;
    color: #17223b;
    font-size: 16px;
  }

  span {
    display: block;
    margin-top: 5px;
    color: #8a94a9;
    font-size: 12px;
  }
}

.trend-controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 720px) {
  .panel-head {
    flex-direction: column;
  }

  .trend-controls {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
