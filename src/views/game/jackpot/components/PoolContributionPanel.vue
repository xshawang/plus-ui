<template>
  <div class="jackpot-panel">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" :model="query">
        <el-form-item label="游戏编码">
          <el-input v-model="query.gameCode" placeholder="如 kts_9848" clearable style="width: 160px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="会员UID">
          <el-input v-model="query.uid" placeholder="下注会员UID" clearable style="width: 180px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="请求ID">
          <el-input v-model="query.requestId" placeholder="单局幂等键" clearable style="width: 220px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="注入时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="-"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="table-heading">
          <h3>奖池注入逐笔</h3>
          <span class="tip">
            口径：每局每层一行（slot_jackpot_contribution），唯一键含 request_id；
            注入额 = 本局总注 × 该层份额 × 注资比例，是「池里的钱从哪来」的明细凭据
          </span>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="注入时间" align="center" width="170">
          <template #default="{ row }">{{ time(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="游戏" align="center" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono">{{ row.gameCode }}</span>
            <span v-if="row.gameName" class="sub">{{ row.gameName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="池层级" align="center" prop="jackpotType" width="120" />
        <el-table-column label="序号" align="center" prop="jackpotLevel" width="70" />
        <el-table-column label="投注档位" align="center" prop="tier" width="90" />
        <el-table-column label="会员UID" align="center" prop="uid" min-width="170" show-overflow-tooltip />
        <el-table-column label="本局总注" align="right" width="130">
          <template #default="{ row }"><span class="font-mono">{{ amount(row.betAmount) }}</span></template>
        </el-table-column>
        <el-table-column label="注资比例" align="right" width="100">
          <template #default="{ row }">{{ pct(row.contributionRate) }}</template>
        </el-table-column>
        <el-table-column label="注入额" align="right" width="120">
          <template #default="{ row }"><b class="font-mono">{{ amount(row.amount) }}</b></template>
        </el-table-column>
        <el-table-column label="注入后累积" align="right" width="130">
          <template #default="{ row }"><span class="font-mono">{{ amount(row.afterAccumulated) }}</span></template>
        </el-table-column>
        <el-table-column label="注入后池值" align="right" width="130">
          <template #default="{ row }"><span class="font-mono">{{ amount(row.afterPool) }}</span></template>
        </el-table-column>
        <el-table-column label="局ID" align="center" prop="roundId" min-width="150" show-overflow-tooltip />
        <el-table-column label="请求ID" align="center" prop="requestId" min-width="190" show-overflow-tooltip />
      </el-table>
      <pagination
        v-show="total > 0"
        v-model:page="query.pageNum"
        v-model:limit="query.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { listJackpotContributions } from '@/api/game/jackpot';
import type { JackpotContributionVO } from '@/api/game/jackpot/types';
import { amount, pct, time } from '../format';

defineOptions({ name: 'JackpotContributionPanel' });

const loading = ref(false);
const rows = ref<JackpotContributionVO[]>([]);
const total = ref(0);
const dateRange = ref<string[]>([]);
const query = reactive<any>({ pageNum: 1, pageSize: 10, gameCode: undefined, uid: undefined, requestId: undefined });

async function getList() {
  loading.value = true;
  try {
    query.beginTime = dateRange.value?.[0] || undefined;
    query.endTime = dateRange.value?.[1] || undefined;
    const res: any = await listJackpotContributions(query);
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function handleQuery() {
  query.pageNum = 1;
  getList();
}

function resetQuery() {
  Object.assign(query, {
    pageNum: 1,
    gameCode: undefined,
    uid: undefined,
    requestId: undefined,
    beginTime: undefined,
    endTime: undefined
  });
  dateRange.value = [];
  getList();
}

onMounted(getList);
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
.sub {
  color: #909399;
  font-size: 12px;
  margin-left: 6px;
}
</style>
