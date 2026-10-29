<template>
  <div v-loading="loading" class="ops-panel">
    <PanelToolbar
      v-model:auto-refresh="autoRefresh"
      :loading="loading"
      :updated-at="refreshedAt"
      @refresh="refresh"
    />

    <div class="metric-grid">
      <div v-for="card in cards" :key="card.label" class="metric-card" :class="card.tone">
        <div class="metric-label">{{ card.label }}</div>
        <div class="metric-value">{{ card.value }}</div>
        <div class="metric-note">{{ card.note }}</div>
      </div>
    </div>

    <el-alert
      class="mb-3"
      type="info"
      :closable="false"
      show-icon
      title="P2P 与庄家型使用不同经济口径"
      description="P2P 展示机器人 EV、投入、派彩和净盈亏；庄家型展示投注、派彩及实际 RTP。机器人净盈亏不等于平台净收入。"
    />

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>游戏运营状态</span>
          <span class="freshness">更新于 {{ generatorText }}</span>
        </div>
      </template>
      <el-table :data="games" border stripe>
        <el-table-column label="游戏" min-width="190" fixed>
          <template #default="{ row }">
            <div class="game-name">{{ row.gameName }}</div>
            <div class="game-code">{{ row.gameCode }} · {{ row.gameType === 'P2P' ? 'P2P' : '庄家型' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tooltip :content="row.stateReason" placement="top">
              <el-tag :type="stateType(row.state)" effect="plain">{{ stateLabel(row.state) }}</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="在线/目标" width="110" align="right">
          <template #default="{ row }">{{ integerValue(row.sittingRobots) }} / {{ integerValue(row.targetOnline) }}</template>
        </el-table-column>
        <el-table-column label="机器人" width="90" align="right">
          <template #default="{ row }">{{ integerValue(row.robotCount) }}</template>
        </el-table-column>
        <el-table-column label="权重 目标/实际" width="145" align="right">
          <template #default="{ row }">
            {{ row.targetWeight == null ? '—' : percent(row.targetWeight) }}
            /
            {{ row.actualWeight == null ? '—' : percent(row.actualWeight) }}
          </template>
        </el-table-column>
        <el-table-column label="真人/机器人座位手" width="160" align="center">
          <template #default="{ row }">
            <el-tooltip content="统计窗口内累计座位手数，不是当前在座人数" placement="top">
              <span>{{ integerValue(humanSeatHands(row)) }} / {{ integerValue(row.robotSeatHands) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="投注额" width="125" align="right">
          <template #default="{ row }">{{ moneyFen(row.robotBetFen) }}</template>
        </el-table-column>
        <el-table-column label="中奖/派彩" width="125" align="right">
          <template #default="{ row }">{{ moneyFen(row.robotWinFen) }}</template>
        </el-table-column>
        <el-table-column label="机器人净盈亏" width="135" align="right">
          <template #default="{ row }">
            <span :class="pnlClass(row.robotNetFen)">{{ moneyFen(row.robotNetFen) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="EV / RTP" width="120" align="right">
          <template #default="{ row }">
            <span v-if="row.gameType === 'P2P'">{{ numberValue(row.evB) }}b</span>
            <span v-else>{{ percent(row.actualRtp) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="档位 L/M/H" width="125" align="center">
          <template #default="{ row }">
            {{ integerValue(row.lowRobotCount) }} / {{ integerValue(row.midRobotCount) }} / {{ integerValue(row.highRobotCount) }}
          </template>
        </el-table-column>
        <el-table-column label="预算" width="105">
          <template #default="{ row }">
            <el-tag :type="budgetType(row.budgetStatus)" size="small">{{ row.budgetStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="策略摘要" min-width="260" show-overflow-tooltip prop="strategySummary" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { robotOpsOverview } from '@/api/robot/ops';
import { integerValue, moneyFen, numberValue, percent, stateLabel, stateType, timeText } from '../format';
import { usePanelAutoRefresh } from '../usePanelAutoRefresh';
import PanelToolbar from './PanelToolbar.vue';

const props = defineProps<{ range: string[] }>();
const summary = ref<any>({});
const games = ref<any[]>([]);
const generatedAt = ref('');

const cards = computed(() => [
  { label: '机器人账号', value: integerValue(summary.value.totalRobots), note: '账号池总量', tone: 'blue' },
  { label: '当前在座', value: integerValue(summary.value.sittingRobots), note: 'SITTING 状态', tone: 'green' },
  { label: '活跃游戏', value: `${integerValue(summary.value.activeGames)}/${integerValue(summary.value.totalGames ?? 12)}`, note: '有机器人参与', tone: 'purple' },
  { label: '机器人投注', value: moneyFen(summary.value.robotBetFen), note: '已结算窗口', tone: 'cyan' },
  { label: '机器人派彩', value: moneyFen(summary.value.robotWinFen), note: '已结算窗口', tone: 'amber' },
  { label: '机器人净盈亏', value: moneyFen(summary.value.robotNetFen), note: '派彩 - 投注', tone: Number(summary.value.robotNetFen) >= 0 ? 'green' : 'red' },
  { label: '待处理告警', value: integerValue(summary.value.alertCount), note: '预算/数据状态', tone: Number(summary.value.alertCount) ? 'red' : 'gray' }
]);

const generatorText = computed(() => timeText(generatedAt.value || new Date()));

function humanSeatHands(row: any) {
  return Math.max(0, Number(row.seatHands ?? 0) - Number(row.robotSeatHands ?? 0));
}
function pnlClass(value: unknown) {
  return Number(value) >= 0 ? 'positive' : 'negative';
}
function budgetType(status: string) {
  if (status === 'PAUSED') return 'danger';
  if (status === 'WARN') return 'warning';
  if (status === 'UNCONFIGURED') return 'info';
  return 'success';
}

async function load(forceRefresh = false) {
  const res: any = await robotOpsOverview({
    startDate: props.range?.[0],
    endDate: props.range?.[1],
    forceRefresh: forceRefresh || undefined
  });
  const data = res?.data || {};
  summary.value = data.summary || {};
  games.value = data.games || [];
  generatedAt.value = data.generatedAt || '';
}

const { loading, autoRefresh, refreshedAt, refresh } = usePanelAutoRefresh(load);
watch(() => [props.range?.[0], props.range?.[1]], () => refresh(false));
</script>

<style scoped>
.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.metric-card {
  min-height: 104px;
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
}
.metric-card.green { border-left: 4px solid #16a34a; }
.metric-card.red { border-left: 4px solid #dc2626; }
.metric-card.blue { border-left: 4px solid #2563eb; }
.metric-card.purple { border-left: 4px solid #7c3aed; }
.metric-card.cyan { border-left: 4px solid #0891b2; }
.metric-card.amber { border-left: 4px solid #d97706; }
.metric-card.gray { border-left: 4px solid #64748b; }
.metric-label { color: var(--el-text-color-secondary); font-size: 13px; }
.metric-value { margin-top: 8px; font-size: 24px; font-weight: 700; line-height: 1.15; }
.metric-note { margin-top: 7px; color: var(--el-text-color-placeholder); font-size: 12px; }
.card-header { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
.freshness { color: var(--el-text-color-secondary); font-size: 12px; }
.game-name { font-weight: 600; }
.game-code { margin-top: 3px; color: var(--el-text-color-secondary); font-size: 12px; }
.positive { color: #16a34a; font-weight: 600; }
.negative { color: #dc2626; font-weight: 600; }
.mb-3 { margin-bottom: 16px; }
</style>
