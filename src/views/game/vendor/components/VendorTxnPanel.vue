<template>
  <el-card shadow="hover">
    <el-form :inline="true" class="query-form">
      <el-form-item>
        <el-radio-group v-model="mode" @change="search">
          <el-radio-button value="txn">回调台账</el-radio-button>
          <el-radio-button value="bet">注单</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="UID"><el-input v-model="query.uid" clearable style="width: 190px" @keyup.enter="search" /></el-form-item>
      <el-form-item label="注单号"><el-input v-model="query.betId" clearable style="width: 180px" @keyup.enter="search" /></el-form-item>
      <el-form-item label="游戏代码"><el-input v-model="query.gameCode" clearable style="width: 140px" @keyup.enter="search" /></el-form-item>
      <template v-if="mode === 'txn'">
        <el-form-item label="交易号"><el-input v-model="query.transactionId" clearable style="width: 200px" @keyup.enter="search" /></el-form-item>
        <el-form-item label="接口">
          <el-select v-model="query.api" clearable style="width: 130px"><el-option v-for="a in apis" :key="a" :label="a" :value="a" /></el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" clearable style="width: 120px"><el-option v-for="s in txnStatus" :key="s" :label="s" :value="s" /></el-select>
        </el-form-item>
      </template>
      <template v-else>
        <el-form-item label="注单状态">
          <el-select v-model="query.betStatus" clearable style="width: 120px"><el-option v-for="(l, v) in betStatus" :key="v" :label="l" :value="Number(v)" /></el-select>
        </el-form-item>
        <el-form-item label="待人工">
          <el-select v-model="query.manualRequired" clearable style="width: 100px"><el-option label="是" :value="1" /><el-option label="否" :value="0" /></el-select>
        </el-form-item>
      </template>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="search">搜索</el-button>
        <el-button icon="Refresh" @click="reset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-if="mode === 'txn'" v-loading="loading" border :data="rows">
      <el-table-column type="expand">
        <template #default="{ row }"><pre class="raw">{{ pretty(row.requestBody) }}</pre></template>
      </el-table-column>
      <el-table-column label="时间" prop="createdAt" width="170" />
      <el-table-column label="接口" prop="api" width="110" />
      <el-table-column label="结果类型" prop="resultType" width="100" />
      <el-table-column label="UID" prop="uid" width="180" />
      <el-table-column label="游戏" prop="gameCode" width="140" />
      <el-table-column label="交易号" prop="transactionId" min-width="200" show-overflow-tooltip />
      <el-table-column label="注单号" prop="betId" min-width="160" show-overflow-tooltip />
      <el-table-column label="金额(K)" prop="amountK" width="100" align="right" />
      <el-table-column label="入账(VND)" prop="amountVnd" width="110" align="right" />
      <el-table-column label="钱包命令" prop="walletCommand" min-width="160" show-overflow-tooltip />
      <el-table-column label="状态" width="150">
        <template #default="{ row }">
          <el-tag :type="row.status === 'REJECTED' ? 'danger' : row.status === 'APPLIED' ? 'success' : 'info'">{{ row.status }}</el-tag>
          <div v-if="row.rejectCode" class="muted">{{ row.rejectCode }}</div>
        </template>
      </el-table-column>
      <el-table-column label="余额(VND)" prop="balanceAfter" width="120" align="right" />
    </el-table>

    <el-table v-else v-loading="loading" border :data="rows">
      <el-table-column label="投注时间" width="170"><template #default="{ row }">{{ fmt(row.betTime) }}</template></el-table-column>
      <el-table-column label="注单号" prop="betId" min-width="160" show-overflow-tooltip />
      <el-table-column label="回合" prop="roundId" min-width="140" show-overflow-tooltip />
      <el-table-column label="UID" prop="uid" width="180" />
      <el-table-column label="厂商 / 游戏" min-width="150"><template #default="{ row }">{{ row.vendorCode }} / {{ row.gameCode }}</template></el-table-column>
      <el-table-column label="投注" prop="betAmount" width="100" align="right" />
      <el-table-column label="派奖" prop="winAmount" width="100" align="right" />
      <el-table-column label="奖池" prop="jackpotAmount" width="80" align="right" />
      <el-table-column label="冲正投注" prop="reversedBetAmount" width="100" align="right" />
      <el-table-column label="冲回派奖" prop="reversedWinAmount" width="100" align="right" />
      <el-table-column label="调整" prop="adjustAmount" width="90" align="right" />
      <el-table-column label="厂商有效投注" prop="effectiveTurnover" width="120" align="right" />
      <el-table-column label="状态" width="150">
        <template #default="{ row }">
          <el-tag>{{ betStatus[row.status] ?? row.status }}</el-tag>
          <el-tag v-if="row.manualRequired === 1" type="danger" class="ml4">待人工</el-tag>
          <el-tag v-if="row.orphan === 1" type="warning" class="ml4">孤儿</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="对账" width="80"><template #default="{ row }">{{ ['未对账', '一致', '差异'][row.reconcileStatus] ?? '-' }}</template></el-table-column>
    </el-table>
    <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="getList" />
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { listVendorBets, listVendorTxns } from '@/api/game/vendor';

const apis = ['BET', 'BET_RESULT', 'ROLLBACK', 'ADJUSTMENT'];
const txnStatus = ['APPLIED', 'NOOP', 'REJECTED', 'RECEIVED'];
const betStatus: Record<number, string> = { 0: '未结算', 1: '已结算', 2: '取消', 3: '退款' };
const mode = ref<'txn' | 'bet'>('txn');
const loading = ref(false);
const rows = ref<any[]>([]);
const total = ref(0);
const query = reactive<any>({ pageNum: 1, pageSize: 20 });

async function getList() {
  loading.value = true;
  try {
    const params: any = { ...query };
    if (mode.value === 'bet') {
      params.status = query.betStatus;
    }
    delete params.betStatus;
    const res: any = mode.value === 'txn' ? await listVendorTxns(params) : await listVendorBets(params);
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function search() {
  query.pageNum = 1;
  getList();
}

function reset() {
  Object.keys(query).forEach((k) => { if (k !== 'pageNum' && k !== 'pageSize') delete query[k]; });
  search();
}

function fmt(ms: number) {
  return ms ? new Date(ms).toLocaleString() : '-';
}

function pretty(raw: string) {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

onMounted(getList);
</script>

<style scoped>
.raw { margin: 0; padding: 8px 16px; font-size: 12px; white-space: pre-wrap; word-break: break-all; }
.muted { color: var(--el-text-color-secondary); font-size: 12px; }
.ml4 { margin-left: 4px; }
</style>
