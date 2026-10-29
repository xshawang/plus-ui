<template>
  <div v-loading="loading" class="ops-panel">
    <PanelToolbar
      v-model:auto-refresh="autoRefresh"
      :loading="loading"
      :updated-at="refreshedAt"
      @refresh="refresh"
    />

    <el-alert
      type="warning"
      :closable="false"
      show-icon
      title="预算只控制新局准入"
      description="预算达到阈值后只能阻止后续机器人取号/新对局，不改变进行中的牌局、牌面或开奖结果。首期预算页只读，真实拦截开关需二期审批。"
      class="mb-3"
    />

    <div class="budget-summary">
      <div class="budget-chip">
        <span>已配置</span>
        <strong>{{ integerValue(configuredCount) }}</strong>
      </div>
      <div class="budget-chip warn">
        <span>预警</span>
        <strong>{{ integerValue(warnCount) }}</strong>
      </div>
      <div class="budget-chip danger">
        <span>已暂停</span>
        <strong>{{ integerValue(pausedCount) }}</strong>
      </div>
      <div class="budget-chip">
        <span>当日总投入</span>
        <strong>{{ moneyFen(totalTopup) }}</strong>
      </div>
    </div>

    <div class="filter-row">
      <el-select v-model="gameCode" clearable placeholder="选择游戏名 / game_code" style="width: 280px">
        <el-option
          v-for="game in ROBOT_GAME_OPTIONS"
          :key="game.code"
          :label="gameOptionLabel(game)"
          :value="game.code"
        />
      </el-select>
      <span class="filter-result">当前显示 {{ filteredRows.length }} / {{ rows.length }} 款游戏</span>
    </div>

    <el-card shadow="never">
      <el-table :data="filteredRows" border stripe>
        <el-table-column label="游戏" min-width="190">
          <template #default="{ row }">
            <div class="game-name">{{ row.gameName }}</div>
            <div class="game-code">{{ row.gameCode }} · {{ row.gameType }}</div>
          </template>
        </el-table-column>
        <el-table-column label="预算状态" width="125">
          <template #default="{ row }">
            <el-tag :type="budgetType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="日预算" width="140" align="right">
          <template #default="{ row }">{{ row.dailyLossBudgetFen > 0 ? moneyFen(row.dailyLossBudgetFen) : '未配置' }}</template>
        </el-table-column>
        <el-table-column label="已用净亏损" width="145" align="right">
          <template #default="{ row }">{{ moneyFen(row.netLossFen) }}</template>
        </el-table-column>
        <el-table-column label="剩余额度" width="145" align="right">
          <template #default="{ row }">{{ row.remainingFen == null ? '-' : moneyFen(row.remainingFen) }}</template>
        </el-table-column>
        <el-table-column label="使用率" min-width="190">
          <template #default="{ row }">
            <el-progress
              v-if="row.usageRate != null"
              :percentage="Math.min(100, Math.max(0, Number(row.usageRate) * 100))"
              :status="row.status === 'PAUSED' ? 'exception' : row.status === 'WARN' ? 'warning' : undefined"
            />
            <span v-else class="muted">未配置预算</span>
          </template>
        </el-table-column>
        <el-table-column label="当日补额" width="140" align="right">
          <template #default="{ row }">{{ moneyFen(row.topupFen) }}</template>
        </el-table-column>
        <el-table-column label="拦截模式" width="120" align="center">
          <template #default>
            <el-tooltip content="实际 enforce 配置由 robot-platform 启动参数控制，首期不在 UI 伪展示" placement="top">
              <el-tag type="info" effect="plain">平台控制</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">{{ timeText(row.updatedAt) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { robotOpsBudgets } from '@/api/robot/ops';
import { integerValue, moneyFen, timeText } from '../format';
import { gameOptionLabel, ROBOT_GAME_OPTIONS } from '../gameOptions';
import { usePanelAutoRefresh } from '../usePanelAutoRefresh';
import PanelToolbar from './PanelToolbar.vue';

const rows = ref<any[]>([]);
const gameCode = ref('');

const filteredRows = computed(() => rows.value.filter(row => !gameCode.value || row.gameCode === gameCode.value));
const configuredCount = computed(() => filteredRows.value.filter(row => row.configured).length);
const warnCount = computed(() => filteredRows.value.filter(row => row.status === 'WARN').length);
const pausedCount = computed(() => filteredRows.value.filter(row => row.status === 'PAUSED').length);
const totalTopup = computed(() => filteredRows.value.reduce((sum, row) => sum + Number(row.topupFen || 0), 0));

function budgetType(status: string) {
  if (status === 'PAUSED') return 'danger';
  if (status === 'WARN') return 'warning';
  return status === 'UNCONFIGURED' ? 'info' : 'success';
}
async function load(forceRefresh = false) {
  const res: any = await robotOpsBudgets({ forceRefresh: forceRefresh || undefined });
  rows.value = res?.data?.rows || [];
}
const { loading, autoRefresh, refreshedAt, refresh } = usePanelAutoRefresh(load);
</script>

<style scoped>
.budget-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 16px; }
.budget-chip { padding: 14px 16px; border-radius: 10px; background: var(--el-fill-color-light); }
.budget-chip span { display: block; color: var(--el-text-color-secondary); font-size: 12px; }
.budget-chip strong { display: block; margin-top: 7px; font-size: 22px; }
.budget-chip.warn { background: var(--el-color-warning-light-9); }
.budget-chip.danger { background: var(--el-color-danger-light-9); }
.filter-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 14px; }
.filter-result { color: var(--el-text-color-secondary); font-size: 12px; }
.game-name { font-weight: 600; }
.game-code { margin-top: 3px; color: var(--el-text-color-secondary); font-size: 12px; }
.muted { color: var(--el-text-color-secondary); }
.mb-3 { margin-bottom: 16px; }
</style>
