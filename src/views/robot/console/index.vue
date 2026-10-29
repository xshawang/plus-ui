<template>
  <div class="app-container robot-console-page">
    <div class="console-header">
      <div>
        <div class="eyebrow">OPERATIONS CONTROL</div>
        <h1>棋牌机器人运营控制台</h1>
      </div>
      <div class="header-actions">
        <el-date-picker
          v-model="range"
          type="daterange"
          value-format="YYYY-MM-DD"
          unlink-panels
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 280px"
        />
      </div>
    </div>

    <div class="data-status">
      <el-icon><Clock /></el-icon>
      <span>数据口径：已结算结果；实时桌况来自最近牌局快照</span>
    </div>

    <el-card shadow="never" class="tabs-card">
      <nav class="console-tabs" role="tablist" aria-label="运营控制台功能">
        <button
          v-for="tab in tabs"
          :key="tab.name"
          type="button"
          role="tab"
          class="console-tab"
          :class="{ active: activeTab === tab.name }"
          :aria-selected="activeTab === tab.name"
          @click="activeTab = tab.name"
        >
          {{ tab.label }}
        </button>
      </nav>

      <OverviewPanel v-if="activeTab === 'overview'" :range="range" />
      <ParticipationPanel v-else-if="activeTab === 'participation'" :range="range" />
      <LiveTablesPanel v-else-if="activeTab === 'tables'" />
      <BudgetPanel v-else-if="activeTab === 'budget'" />
      <AnalyticsPanel v-else-if="activeTab === 'analytics'" :range="range" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Clock } from '@element-plus/icons-vue';
import AnalyticsPanel from './components/AnalyticsPanel.vue';
import BudgetPanel from './components/BudgetPanel.vue';
import LiveTablesPanel from './components/LiveTablesPanel.vue';
import OverviewPanel from './components/OverviewPanel.vue';
import ParticipationPanel from './components/ParticipationPanel.vue';

defineOptions({ name: 'RobotConsole' });

const activeTab = ref('overview');
const tabs = [
  { name: 'overview', label: '运营总览' },
  { name: 'participation', label: '游戏参与' },
  { name: 'tables', label: '实时桌台' },
  { name: 'budget', label: '预算风控' },
  { name: 'analytics', label: '只读分析' }
];
const today = localDate(new Date());
const range = ref<string[]>([today, today]);

function localDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
</script>

<style scoped>
.robot-console-page {
  min-height: calc(100vh - 96px);
  background: linear-gradient(180deg, #f8fafc 0, #f3f6fb 260px, transparent 260px);
}
.console-header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
  padding: 18px 20px;
  border: 1px solid #e8edf5;
  border-radius: 16px;
  background: radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.12), transparent 38%),
              linear-gradient(135deg, #ffffff, #f8fbff);
}
.eyebrow { color: #2563eb; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; }
h1 { margin: 6px 0 8px; font-size: 26px; line-height: 1.25; }
.console-header p { margin: 0; color: var(--el-text-color-secondary); font-size: 13px; }
.header-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: 10px; }
.data-status {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 9px;
  margin: 12px 2px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.tabs-card { border-radius: 14px; }
.console-tabs {
  display: flex;
  gap: 28px;
  margin: 0 0 18px;
  overflow-x: auto;
  border-bottom: 1px solid var(--el-border-color-light);
}
.console-tab {
  position: relative;
  flex: 0 0 auto;
  height: 46px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--el-text-color-regular);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.console-tab:hover { color: var(--el-color-primary); }
.console-tab.active { color: var(--el-color-primary); }
.console-tab.active::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: var(--el-color-primary);
  content: '';
}
.console-tab:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 3px; }
@media (max-width: 900px) {
  .console-header { flex-direction: column; }
  .header-actions { justify-content: flex-start; width: 100%; }
  .header-actions :deep(.el-date-editor) { width: 100% !important; }
}
</style>
