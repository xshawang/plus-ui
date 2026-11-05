<template>
  <el-card shadow="hover">
    <el-form :inline="true">
      <el-form-item label="注单号"><el-input v-model="query.betId" clearable style="width: 200px" @keyup.enter="search" /></el-form-item>
      <el-form-item label="差异类型">
        <el-select v-model="query.diffType" clearable style="width: 160px"><el-option v-for="(l, v) in diffTypes" :key="v" :label="l" :value="v" /></el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="search">搜索</el-button>
      </el-form-item>
      <el-form-item label="对账窗口(分钟)">
        <el-input-number v-model="minutes" :min="1" :max="1440" style="width: 130px" />
        <el-button v-hasPermi="['game:vendor:txn']" type="warning" plain class="ml8" :loading="running" @click="run">立即对账</el-button>
      </el-form-item>
    </el-form>
    <el-alert type="info" :closable="false" show-icon class="mb12"
      title="对账按结算时间拉取 OneAPI 注单（/transaction/list）与本地注单比对，只记录差异、不改资金；定时任务每 10 分钟对最近 15 分钟（接入启用后在 SnailJob 打开 gameVendorReconcile）。" />
    <el-table v-loading="loading" border :data="rows">
      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="snap"><b>本地：</b><pre>{{ pretty(row.localSnapshot) }}</pre></div>
          <div class="snap"><b>OneAPI：</b><pre>{{ pretty(row.remoteSnapshot) }}</pre></div>
        </template>
      </el-table-column>
      <el-table-column label="发现时间" prop="createdAt" width="170" />
      <el-table-column label="最近刷新" prop="updatedAt" width="170" />
      <el-table-column label="注单号" prop="betId" min-width="200" show-overflow-tooltip />
      <el-table-column label="差异类型" width="160"><template #default="{ row }">{{ diffTypes[row.diffType] ?? row.diffType }}</template></el-table-column>
      <el-table-column label="已处理" width="90"><template #default="{ row }">{{ row.handled === 1 ? '是' : '否' }}</template></el-table-column>
    </el-table>
    <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="getList" />
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { listReconcileDiffs, runReconcile } from '@/api/game/vendor';

const diffTypes: Record<string, string> = { MISSING_LOCAL: '本地缺注单', AMOUNT: '金额不一致', STATUS: '状态不一致' };
const loading = ref(false);
const running = ref(false);
const minutes = ref(60);
const rows = ref<any[]>([]);
const total = ref(0);
const query = reactive<any>({ pageNum: 1, pageSize: 20 });

async function getList() {
  loading.value = true;
  try {
    const res: any = await listReconcileDiffs({ ...query });
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

async function run() {
  running.value = true;
  try {
    const res: any = await runReconcile(minutes.value);
    const d = res.data ?? {};
    if (d.skipped || d.error) ElMessage.warning(`未完成：${d.skipped ?? d.error}`);
    else ElMessage.success(`核对 ${d.checked} 笔，一致 ${d.matched}，差异 ${d.diffs}`);
    getList();
  } finally {
    running.value = false;
  }
}

function pretty(raw: string) {
  if (!raw) return '（无）';
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

onMounted(getList);
</script>

<style scoped>
.snap pre { margin: 4px 0 8px; font-size: 12px; white-space: pre-wrap; word-break: break-all; }
.snap { padding: 0 16px; }
.mb12 { margin-bottom: 12px; }
.ml8 { margin-left: 8px; }
</style>
