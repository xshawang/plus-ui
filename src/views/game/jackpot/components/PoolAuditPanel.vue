<template>
  <div class="jackpot-panel">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" :model="query">
        <el-form-item label="游戏编码">
          <el-input v-model="query.gameCode" placeholder="如 kts_9848" clearable style="width: 160px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="池层级">
          <el-input v-model="query.jackpotType" placeholder="如 GRAND" clearable style="width: 140px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="变更时间">
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
          <h3>奖池参数变更记录</h3>
          <span class="tip">
            口径：初始值是平台资金且永不派出，任何一次改动都留 谁/何时/字段/旧值/新值/原因（slot_jackpot_pool_audit）
          </span>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="变更时间" align="center" width="170">
          <template #default="{ row }">{{ time(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="游戏" align="center" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono">{{ row.gameCode }}</span>
            <span v-if="row.gameName" class="sub">{{ row.gameName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="池层级" align="center" prop="jackpotType" width="130" />
        <el-table-column label="变更字段" align="center" prop="field" width="140" />
        <el-table-column label="旧值" align="right" width="140">
          <template #default="{ row }"><span class="font-mono">{{ row.oldValue ?? '—' }}</span></template>
        </el-table-column>
        <el-table-column label="新值" align="right" width="140">
          <template #default="{ row }"><b class="font-mono">{{ row.newValue ?? '—' }}</b></template>
        </el-table-column>
        <el-table-column label="变更原因" align="left" prop="reason" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作人" align="center" width="160">
          <template #default="{ row }">{{ row.operatorName || row.operatorId || '—' }}</template>
        </el-table-column>
        <el-table-column label="来源" align="center" width="90">
          <template #default="{ row }">
            <el-tag :type="row.source === 'OPS' ? 'primary' : 'info'" size="small">{{ row.source || '—' }}</el-tag>
          </template>
        </el-table-column>
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
import { listJackpotPoolAudits } from '@/api/game/jackpot';
import type { JackpotPoolAuditVO } from '@/api/game/jackpot/types';
import { time } from '../format';

defineOptions({ name: 'JackpotPoolAuditPanel' });

const loading = ref(false);
const rows = ref<JackpotPoolAuditVO[]>([]);
const total = ref(0);
const dateRange = ref<string[]>([]);
const query = reactive<any>({ pageNum: 1, pageSize: 10, gameCode: undefined, jackpotType: undefined });

async function getList() {
  loading.value = true;
  try {
    query.beginTime = dateRange.value?.[0] || undefined;
    query.endTime = dateRange.value?.[1] || undefined;
    const res: any = await listJackpotPoolAudits(query);
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
    jackpotType: undefined,
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
