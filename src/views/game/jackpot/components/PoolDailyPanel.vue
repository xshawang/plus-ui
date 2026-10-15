<template>
  <div class="jackpot-panel">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" :model="query">
        <el-form-item label="统计日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item label="游戏">
          <el-input v-model="query.gameId" placeholder="游戏编码（留空=全部）" clearable style="width: 200px" @keyup.enter="getList" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="getList">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="table-heading">
          <h3>奖池资金日报（game_jackpot_daily）</h3>
          <span class="tip">
            口径：期初 + 玩家贡献 + 平台贡献 + 调整 − 派发 = 期末（对账差额应恒为 0）；由 go88-job 的 RTP 统计任务按日重算。
            当前「平台贡献」尚未接入奖池初始值写入，恒为 0 属已知待办
          </span>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="统计日期" align="center" prop="statDate" width="120" />
        <el-table-column label="游戏" align="center" prop="gameId" min-width="140" />
        <el-table-column label="奖池" align="center" prop="jackpotId" width="110" />
        <el-table-column label="期初" align="right" width="140">
          <template #default="{ row }"><span class="font-mono">{{ amount(row.openingBalance) }}</span></template>
        </el-table-column>
        <el-table-column label="玩家贡献" align="right" width="140">
          <template #default="{ row }"><span class="font-mono text-income">{{ amount(row.playerContribution) }}</span></template>
        </el-table-column>
        <el-table-column label="平台贡献" align="right" width="130">
          <template #default="{ row }"><span class="font-mono">{{ amount(row.platformContribution) }}</span></template>
        </el-table-column>
        <el-table-column label="调整" align="right" width="120">
          <template #default="{ row }"><span class="font-mono">{{ amount(row.adjustmentAmount) }}</span></template>
        </el-table-column>
        <el-table-column label="派发" align="right" width="140">
          <template #default="{ row }"><span class="font-mono text-expense">{{ amount(row.payoutAmount) }}</span></template>
        </el-table-column>
        <el-table-column label="期末" align="right" width="140">
          <template #default="{ row }"><b class="font-mono">{{ amount(row.closingBalance) }}</b></template>
        </el-table-column>
        <el-table-column label="对账差额" align="right" width="130">
          <template #default="{ row }">
            <span class="font-mono" :class="Number(row.reconDiff) === 0 ? '' : 'text-expense'">
              {{ amount(row.reconDiff) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="row.dataStatus === 'OK' ? 'success' : 'warning'" size="small">{{ row.dataStatus }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { getRtpJackpotDaily } from '@/api/report/rtp';
import type { RtpJackpotDailyRow } from '@/api/report/rtp/types';
import { amount } from '../format';

defineOptions({ name: 'JackpotDailyPanel' });

const loading = ref(false);
const rows = ref<RtpJackpotDailyRow[]>([]);
const dateRange = ref<string[]>([]);
const query = reactive<{ gameId?: string }>({ gameId: undefined });

/** 默认查最近 7 个自然日（日报体量小，默认给个能看出趋势的窗口） */
function defaultRange(): string[] {
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return [fmt(start), fmt(end)];
}

async function getList() {
  loading.value = true;
  try {
    const res: any = await getRtpJackpotDaily({
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1],
      gameId: query.gameId || undefined
    });
    rows.value = res.data ?? [];
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  query.gameId = undefined;
  dateRange.value = defaultRange();
  getList();
}

onMounted(() => {
  dateRange.value = defaultRange();
  getList();
});
</script>

<style scoped>
.table-heading h3 {
  margin: 0 0 4px;
  font-size: 15px;
}
.tip {
  color: #909399;
  font-size: 12px;
}
.text-income {
  color: #16a34a;
}
.text-expense {
  color: #dc2626;
}
</style>
