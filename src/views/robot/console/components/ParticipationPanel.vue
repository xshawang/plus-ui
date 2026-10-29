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
      title="首期只读参与控制"
      description="本期先核对各游戏在线、目标、档位和策略版本。目标在线、补位上下限等写操作将在审批与变更日志上线后开放。"
      class="mb-3"
    />

    <div class="filter-row">
      <el-select v-model="gameCode" clearable placeholder="选择游戏名 / game_code" style="width: 280px">
        <el-option
          v-for="game in ROBOT_GAME_OPTIONS"
          :key="game.code"
          :label="gameOptionLabel(game)"
          :value="game.code"
        />
      </el-select>
      <el-input v-model="keyword" clearable placeholder="搜索游戏名称或代码" style="width: 260px" />
      <el-radio-group v-model="typeFilter">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button value="P2P">P2P</el-radio-button>
        <el-radio-button value="DEALER">庄家型</el-radio-button>
      </el-radio-group>
      <span class="summary-text">显示 {{ filteredRows.length }} / {{ rows.length }} 款游戏</span>
    </div>

    <el-card shadow="never">
      <el-table :data="filteredRows" border stripe row-key="gameCode">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-box">
              <el-descriptions :column="3" border>
                <el-descriptions-item label="策略版本" :span="2">{{ row.strategySummary }}</el-descriptions-item>
                <el-descriptions-item label="参与配置">{{ row.configured ? '已配置' : '未发现游戏级配置' }}</el-descriptions-item>
                <el-descriptions-item label="LOW 机器人">{{ integerValue(row.lowRobotCount) }}</el-descriptions-item>
                <el-descriptions-item label="MID 机器人">{{ integerValue(row.midRobotCount) }}</el-descriptions-item>
                <el-descriptions-item label="HIGH 机器人">{{ integerValue(row.highRobotCount) }}</el-descriptions-item>
                <el-descriptions-item label="窗口投注">{{ moneyFen(row.robotBetFen) }}</el-descriptions-item>
                <el-descriptions-item label="窗口派彩">{{ moneyFen(row.robotWinFen) }}</el-descriptions-item>
                <el-descriptions-item label="机器人净盈亏">
                  <span :class="pnlClass(row.robotNetFen)">{{ moneyFen(row.robotNetFen) }}</span>
                </el-descriptions-item>
              </el-descriptions>
              <div class="ux-note">
                参与人数由真实桌位与机器人调度共同决定。目标在线数仅作为运营目标，不等于强制同时在线数。
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="游戏" min-width="220" fixed>
          <template #default="{ row }">
            <div class="game-name">{{ row.gameName }}</div>
            <div class="game-code">{{ row.gameCode }}</div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.gameType === 'P2P' ? 'primary' : 'warning'" effect="plain">
              {{ row.gameType === 'P2P' ? 'P2P' : '庄家型' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="105">
          <template #default="{ row }">
            <el-tag :type="stateType(row.state)">{{ stateLabel(row.state) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="在线/目标" width="120" align="right">
          <template #default="{ row }">
            <strong>{{ integerValue(row.sittingRobots) }}</strong>
            <span class="muted"> / {{ integerValue(row.targetOnline) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="账号池" width="95" align="right">
          <template #default="{ row }">{{ integerValue(row.robotCount) }}</template>
        </el-table-column>
        <el-table-column label="权重 目标/实际" width="145" align="right">
          <template #default="{ row }">
            {{ row.targetWeight == null ? '—' : percent(row.targetWeight) }}
            /
            {{ row.actualWeight == null ? '—' : percent(row.actualWeight) }}
          </template>
        </el-table-column>
        <el-table-column label="档位分布 L/M/H" width="145" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ integerValue(row.lowRobotCount) }}</el-tag>
            <el-tag size="small" type="success">{{ integerValue(row.midRobotCount) }}</el-tag>
            <el-tag size="small" type="warning">{{ integerValue(row.highRobotCount) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="预算状态" width="120">
          <template #default="{ row }">
            <el-tag :type="budgetType(row.budgetStatus)" effect="light">{{ row.budgetStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="机器人净盈亏" width="140" align="right">
          <template #default="{ row }">
            <span :class="pnlClass(row.robotNetFen)">{{ moneyFen(row.robotNetFen) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="策略摘要" min-width="300" show-overflow-tooltip prop="strategySummary" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { robotOpsGames } from '@/api/robot/ops';
import { integerValue, moneyFen, percent, stateLabel, stateType } from '../format';
import { gameOptionLabel, ROBOT_GAME_OPTIONS } from '../gameOptions';
import { usePanelAutoRefresh } from '../usePanelAutoRefresh';
import PanelToolbar from './PanelToolbar.vue';

const props = defineProps<{ range: string[] }>();
const rows = ref<any[]>([]);
const keyword = ref('');
const gameCode = ref('');
const typeFilter = ref('');

const filteredRows = computed(() => rows.value.filter((row) => {
  if (gameCode.value && row.gameCode !== gameCode.value) return false;
  if (typeFilter.value && row.gameType !== typeFilter.value) return false;
  const query = keyword.value.trim().toLowerCase();
  return !query || `${row.gameName} ${row.gameCode}`.toLowerCase().includes(query);
}));

function pnlClass(value: unknown) {
  return Number(value) >= 0 ? 'positive' : 'negative';
}
function budgetType(status: string) {
  if (status === 'PAUSED') return 'danger';
  if (status === 'WARN') return 'warning';
  return status === 'UNCONFIGURED' ? 'info' : 'success';
}
async function load(forceRefresh = false) {
  const res: any = await robotOpsGames({
    startDate: props.range?.[0],
    endDate: props.range?.[1],
    forceRefresh: forceRefresh || undefined
  });
  rows.value = res?.data?.rows || [];
}
const { loading, autoRefresh, refreshedAt, refresh } = usePanelAutoRefresh(load);
watch(() => [props.range?.[0], props.range?.[1]], () => refresh(false));
</script>

<style scoped>
.filter-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 12px; }
.summary-text { color: var(--el-text-color-secondary); font-size: 13px; }
.game-name { font-weight: 600; }
.game-code { margin-top: 3px; color: var(--el-text-color-secondary); font-size: 12px; }
.muted { color: var(--el-text-color-secondary); }
.expand-box { padding: 8px 20px 18px; }
.ux-note { margin-top: 12px; color: var(--el-text-color-secondary); font-size: 12px; }
.positive { color: #16a34a; font-weight: 600; }
.negative { color: #dc2626; font-weight: 600; }
.mb-3 { margin-bottom: 16px; }
</style>
