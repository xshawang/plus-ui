<template>
  <div v-loading="loading" class="ops-panel">
    <PanelToolbar
      v-model:auto-refresh="autoRefresh"
      :loading="loading"
      :updated-at="refreshedAt"
      @refresh="refresh"
    />

    <div class="filter-row">
      <el-select v-model="minutes" style="width: 170px">
        <el-option label="最近 15 分钟" :value="15" />
        <el-option label="最近 30 分钟" :value="30" />
        <el-option label="最近 1 小时" :value="60" />
        <el-option label="最近 24 小时" :value="1440" />
      </el-select>
      <el-select v-model="gameCode" clearable placeholder="选择游戏名 / game_code" style="width: 280px">
        <el-option
          v-for="game in ROBOT_GAME_OPTIONS"
          :key="game.code"
          :label="gameOptionLabel(game)"
          :value="game.code"
        />
      </el-select>
    </div>

    <el-alert type="info" :closable="false" show-icon title="桌况为最近已结算牌局的快照" description="用于发现空桌、机器人比例异常和桌面盈亏偏移；不代表当前局最终结果。" />

    <el-card shadow="never" class="table-card">
      <el-table :data="rows" border stripe>
        <el-table-column label="游戏" min-width="220">
          <template #default="{ row }">
            <div class="game-name">{{ gameName(row.gameCode) }}</div>
            <div class="game-code">{{ row.gameCode }}</div>
          </template>
        </el-table-column>
        <el-table-column label="桌号/局号" min-width="230" prop="tableId" show-overflow-tooltip />
        <el-table-column label="最近结算" width="180">
          <template #default="{ row }">{{ timeText(row.lastSettledAt) }}</template>
        </el-table-column>
        <el-table-column label="座位" width="90" align="right">
          <template #default="{ row }">{{ integerValue(row.seats) }}</template>
        </el-table-column>
        <el-table-column label="真人" width="90" align="right">
          <template #default="{ row }">{{ integerValue(row.humans) }}</template>
        </el-table-column>
        <el-table-column label="机器人" width="90" align="right">
          <template #default="{ row }">{{ integerValue(row.robots) }}</template>
        </el-table-column>
        <el-table-column label="机器人占比" width="120" align="right">
          <template #default="{ row }">{{ tableRobotRate(row) }}</template>
        </el-table-column>
        <el-table-column label="窗口手数" width="105" align="right">
          <template #default="{ row }">{{ integerValue(row.hands) }}</template>
        </el-table-column>
        <el-table-column label="机器人净盈亏" width="145" align="right">
          <template #default="{ row }">
            <span :class="Number(row.robotNetFen) >= 0 ? 'positive' : 'negative'">{{ moneyFen(row.robotNetFen) }}</span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !rows.length" description="当前窗口没有已结算桌况" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { robotOpsTables } from '@/api/robot/ops';
import { integerValue, moneyFen, percent, timeText } from '../format';
import { gameOptionLabel, ROBOT_GAME_OPTIONS } from '../gameOptions';
import { usePanelAutoRefresh } from '../usePanelAutoRefresh';
import PanelToolbar from './PanelToolbar.vue';

const minutes = ref(30);
const gameCode = ref('');
const rows = ref<any[]>([]);
const gameNames = new Map(ROBOT_GAME_OPTIONS.map(game => [game.code, game.name]));

function gameName(code: string) {
  return gameNames.get(code) || code;
}

function tableRobotRate(row: any) {
  const seats = Number(row.seats || 0);
  return seats <= 0 ? '-' : percent(Number(row.robots || 0) / seats, 1);
}
async function load(forceRefresh = false) {
  const res: any = await robotOpsTables({
    minutes: minutes.value,
    gameCode: gameCode.value || undefined,
    forceRefresh: forceRefresh || undefined
  });
  rows.value = res?.data?.rows || [];
}
const { loading, autoRefresh, refreshedAt, refresh } = usePanelAutoRefresh(load);
watch([minutes, gameCode], () => refresh(false));
</script>

<style scoped>
.filter-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 12px; }
.freshness { color: var(--el-text-color-secondary); font-size: 12px; }
.game-name { font-weight: 600; }
.game-code { margin-top: 3px; color: var(--el-text-color-secondary); font-size: 12px; }
.table-card { margin-top: 12px; }
.positive { color: #16a34a; font-weight: 600; }
.negative { color: #dc2626; font-weight: 600; }
</style>
