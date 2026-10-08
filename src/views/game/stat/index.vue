<template>
  <div class="p-2 app-container game-stat-page">
    <el-card shadow="hover">
      <el-form :inline="true">
        <el-form-item label="时间">
          <el-date-picker v-model="range" type="daterange" value-format="YYYY-MM-DD"
                          start-placeholder="开始日期" end-placeholder="结束日期" style="width: 280px" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="dimension" style="width: 170px" @change="load">
            <el-option label="游戏类型统计" value="TYPE" />
            <el-option label="子游戏统计" value="GAME" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="load">搜索</el-button>
          <el-button icon="Refresh" @click="reset">重置</el-button>
          <el-button v-hasPermi="['game:stat:export']" type="primary" plain icon="Download" @click="exportData">导出报表</el-button>
        </el-form-item>
      </el-form>

      <el-table v-loading="loading" border :data="rows" :row-class-name="rowClass">
        <el-table-column label="币种" align="center" prop="currency" width="130" />
        <el-table-column v-if="dimension === 'GAME'" label="平台" align="center" prop="platformName" width="140" />
        <el-table-column :label="dimension === 'GAME' ? '子游戏名称' : '游戏类型'" align="center" min-width="180">
          <template #default="{ row }">{{ dimension === 'GAME' ? row.gameName : row.gameTypeName }}</template>
        </el-table-column>
        <el-table-column label="平均日投注人数" align="center" prop="avgDailyPlayers" width="150" />
        <el-table-column label="注单数" align="center" prop="orderCount" width="130" sortable />
        <el-table-column label="有效投注" align="center" prop="validBet" width="170" sortable />
        <el-table-column label="杀率" align="center" width="110">
          <template #default="{ row }">{{ row.killRate }}%</template>
        </el-table-column>
        <el-table-column label="损益" align="center" prop="profit" width="160" sortable>
          <template #default="{ row }">
            <span :class="row.profit < 0 ? 'text-red' : 'text-green'">{{ row.profit }}</span>
          </template>
        </el-table-column>
      </el-table>
      <p class="total-tip">共 {{ rows.length }} 条（末行为总计；平均日投注人数不可累加，故总计行留空）</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { gameStatList, gameBetDefaultRange } from '@/api/game/bet';

defineOptions({ name: 'GameStat' });

const loading = ref(false);
const rows = ref<any[]>([]);
const dimension = ref('TYPE');
const range = ref<any>([]);

const rowClass = ({ row }: any) => (row.totalRow ? 'total-row' : '');

async function load() {
  loading.value = true;
  try {
    // FIX 2026-09-23：R<List> 取 .data（原实现导致表格 data 非数组、页面一直 loading）
    rows.value = ((await gameStatList({
      dimension: dimension.value,
      startDate: range.value?.[0],
      endDate: range.value?.[1],
      currency: 'VND1000:1'
    })) as unknown as any)?.data ?? [];
  } finally {
    loading.value = false;
  }
}

function reset() {
  range.value = [];
  dimension.value = 'TYPE';
  load();
}

async function exportData() {
  if (!rows.value.length) {
    ElMessage.warning('暂无可导出数据');
    return;
  }
  // 表头用中文列名（原实现导出 Object.keys 原始字段名，运营无法直接使用）
  const isGame = dimension.value === 'GAME';
  const cols: Array<[string, string]> = [
    ['币种', 'currency'],
    ...(isGame ? ([['平台', 'platformName']] as Array<[string, string]>) : []),
    [isGame ? '子游戏名称' : '游戏类型', isGame ? 'gameName' : 'gameTypeName'],
    ['平均日投注人数', 'avgDailyPlayers'],
    ['注单数', 'orderCount'],
    ['有效投注', 'validBet'],
    ['杀率(%)', 'killRate'],
    ['损益', 'profit']
  ];
  const header = cols.map((c) => c[0]).join(',');
  const body = rows.value.map((row: any) => cols.map((c) => `"${row[c[1]] ?? ''}"`).join(',')).join('\n');
  const blob = new Blob([`\ufeff${header}\n${body}`], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `游戏统计_${dimension.value}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * 首屏区间对齐后端定义的「近 7 天」（截图口径 2026-09-08 ~ 2026-09-14）。
 *
 * 为什么需要：原实现 range 初始为空 ⇒ 不传 startDate/endDate ⇒ 后端 parse(null) 落「当日」，
 * 与截图默认区间和后端 default-range 接口口径都不一致（今天无数据时页面直接空表）。
 * 取不到区间时保持空值，回落后端默认当日，不影响可用性。
 */
async function initRange() {
  try {
    const r: any = ((await gameBetDefaultRange()) as unknown as any)?.data;
    if (Array.isArray(r) && r.length === 2) {
      range.value = r;
    }
  } catch {
    range.value = [];
  }
}

onMounted(async () => {
  await initRange();
  await load();
});
</script>

<style scoped>
.total-tip {
  color: #909399;
  font-size: 12px;
}
.text-red {
  color: #f56c6c;
}
.text-green {
  color: #67c23a;
}
:deep(.total-row) {
  font-weight: 600;
  background: #fafafa;
}
</style>
