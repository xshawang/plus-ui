<template>
  <div class="jackpot-panel">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" :model="query">
        <el-form-item label="游戏编码">
          <el-input v-model="query.gameCode" placeholder="如 vgmn_206" clearable style="width: 160px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="会员UID">
          <el-input v-model="query.uid" placeholder="中奖会员UID" clearable style="width: 180px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="请求ID">
          <el-input v-model="query.requestId" placeholder="JP:游戏:局ID" clearable style="width: 220px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="派奖时间">
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
          <h3>奖池派奖流水</h3>
          <span class="tip">
            口径：每次爆奖一行（slot_jackpot_record）。slot 侧改制后「派奖金额 = 派奖前的本轮累积」，
            初始值快照用于自证初始值未被派出；lobby 侧（199/202/206/98/99/89/101）仍是旧口径「派整池 + 回落 base」，
            这些历史行「初始值快照 / 派奖前累积」为空属正常
          </span>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="派奖时间" align="center" width="170">
          <template #default="{ row }">{{ time(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="游戏" align="center" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="font-mono">{{ row.gameCode }}</span>
            <span v-if="row.gameName" class="sub">{{ row.gameName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="池层级" align="center" prop="jackpotType" width="130" />
        <el-table-column label="中奖UID" align="center" prop="uid" min-width="170">
          <template #default="{ row }"><span class="font-mono">{{ row.uid }}</span></template>
        </el-table-column>
        <el-table-column label="派奖金额" align="right" width="140">
          <template #default="{ row }"><b class="font-mono text-income">{{ amount(row.jackpotAmount) }}</b></template>
        </el-table-column>
        <el-table-column label="派奖前池值" align="right" width="140">
          <template #default="{ row }"><span class="font-mono">{{ amount(row.poolBefore) }}</span></template>
        </el-table-column>
        <el-table-column label="派奖后池值" align="right" width="140">
          <template #default="{ row }"><span class="font-mono">{{ amount(row.poolAfter) }}</span></template>
        </el-table-column>
        <el-table-column label="初始值快照" align="right" width="130">
          <template #default="{ row }">
            <span class="font-mono">{{ row.initialAmountSnapshot == null ? '—' : amount(row.initialAmountSnapshot) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="派奖前累积" align="right" width="130">
          <template #default="{ row }">
            <span class="font-mono">{{ row.contributionBefore == null ? '—' : amount(row.contributionBefore) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="余额变动" align="right" width="200">
          <template #default="{ row }">
            <span class="font-mono">{{ amount(row.balanceBefore) }} → {{ amount(row.balanceAfter) }}</span>
          </template>
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
import { listJackpotRecords } from '@/api/game/jackpot';
import type { JackpotRecordVO } from '@/api/game/jackpot/types';
import { amount, time } from '../format';

defineOptions({ name: 'JackpotRecordPanel' });

const loading = ref(false);
const rows = ref<JackpotRecordVO[]>([]);
const total = ref(0);
const dateRange = ref<string[]>([]);
const query = reactive<any>({ pageNum: 1, pageSize: 10, gameCode: undefined, uid: undefined, requestId: undefined });

/** 日期区间 → beginTime/endTime（后端为显式字段，避免再多一层 params 包装） */
const applyRange = () => {
  query.beginTime = dateRange.value?.[0] || undefined;
  query.endTime = dateRange.value?.[1] || undefined;
};

async function getList() {
  loading.value = true;
  try {
    applyRange();
    const res: any = await listJackpotRecords(query);
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
.text-income {
  color: #16a34a;
}
</style>
