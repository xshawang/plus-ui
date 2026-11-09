<template>
  <div class="p-2 app-container">
    <el-card shadow="hover">
      <el-tabs v-model="tab">
        <el-tab-pane label="直属数据" name="direct" lazy>
          <AgentReportTable code="data1-direct" :columns="cols" />
        </el-tab-pane>
        <el-tab-pane label="其他数据" name="other" lazy>
          <AgentReportTable code="data1-other" :columns="cols" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup name="AgentData1" lang="ts">
import { ref } from 'vue';
import AgentReportTable from '../components/AgentReportTable.vue';
import { AGENT_COLS, FIN_COLS, GAME_COLS } from '../components/reportColumns';
import type { ReportCol } from '../components/reportColumns';

/** 代理数据1（方案 §12）：日 × 代理，直属（深度 1）/ 其他（深度 ≥2）下级的财务与游戏数据，来自 agent_stat_daily */
const tab = ref('direct');

const cols: ReportCol[] = [
  { label: '日期', prop: 'statDate', kind: 'text' },
  ...AGENT_COLS,
  { label: '活跃人数', prop: 'activeUsers', kind: 'num' },
  { label: '新增人数', prop: 'newUsers', kind: 'num' },
  ...FIN_COLS,
  ...GAME_COLS
];
</script>
