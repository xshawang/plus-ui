<template>
  <div class="p-2 app-container">
    <el-card shadow="hover" class="mb-2">
      <el-form :inline="true">
        <el-form-item>
          <el-date-picker v-model="range" type="daterange" value-format="YYYY-MM-DD" range-separator="-" style="width: 250px" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="q.accounts" placeholder="代理账号（支持批量）" clearable style="width: 220px" @keyup.enter="search" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="q.changeType" placeholder="全部变更类型" clearable style="width: 150px">
            <el-option v-for="(v, k) in TYPE_MAP" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="q.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option v-for="(v, k) in STATUS_MAP" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="q.operatorId" placeholder="操作人" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="search">搜索</el-button>
          <el-button icon="Refresh" @click="reset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card shadow="hover">
      <div class="toolbar">
        <el-button v-hasPermi="['agent:changelog:retry']" type="warning" :disabled="!selected.length" @click="retry">批量迁移重试</el-button>
        <span class="text-gray-500">仅“等级变更 · 失败”的记录可重试</span>
      </div>
      <el-table v-loading="loading" border :data="rows" row-key="logId" @selection-change="(s: any[]) => (selected = s)">
        <el-table-column type="selection" width="44" align="center" :selectable="(r: any) => Number(r.status) === 2" />
        <el-table-column label="币种" prop="currency" align="center" width="110" />
        <el-table-column label="代理账号" prop="loginName" align="center" min-width="130" />
        <el-table-column label="代理ID" prop="agentId" align="center" width="170" />
        <el-table-column label="代理模式" prop="modeName" align="center" min-width="110" />
        <el-table-column label="变更类型" align="center" width="120">
          <template #default="{ row }">{{ TYPE_MAP[String(row.changeType)] ?? row.changeType }}</template>
        </el-table-column>
        <el-table-column label="变更前" prop="beforeValue" align="center" min-width="140" show-overflow-tooltip />
        <el-table-column label="变更后" prop="afterValue" align="center" min-width="140" show-overflow-tooltip />
        <el-table-column label="状态" align="center" width="90">
          <template #default="{ row }">
            <el-tag :type="Number(row.status) === 1 ? 'success' : Number(row.status) === 2 ? 'danger' : 'warning'" size="small">
              {{ STATUS_MAP[String(row.status)] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="失败原因" prop="failReason" align="center" min-width="140" show-overflow-tooltip />
        <el-table-column label="操作人" prop="operatorId" align="center" width="110" />
        <el-table-column label="操作时间" prop="createdAt" align="center" width="170" />
      </el-table>
      <pagination v-show="total > 0" v-model:page="pageNum" v-model:limit="pageSize" :total="total" @pagination="load" />
    </el-card>
  </div>
</template>

<script setup name="AgentChangeLog" lang="ts">
import { ref } from 'vue';
import modal from '@/plugins/modal';
import { listChangeLogs, retryChangeLogs } from '@/api/agent/refactor';

/** 代理变更记录（截图“变更记录”）：等级/上级/模式/开通/冻结等 10 类变更，失败的等级变更可批量重试 */
const TYPE_MAP: Record<string, string> = {
  '1': '等级变更',
  '2': '修改上级',
  '3': '修改模式',
  '4': '开通人人代理',
  '5': '开通专业代理',
  '6': '冻结/解冻',
  '7': '移出代理',
  '8': '提佣方式',
  '9': '直属层级/标签',
  '10': '新下级绑定'
};
const STATUS_MAP: Record<string, string> = { '1': '成功', '2': '失败', '3': '处理中' };

const range = ref<[string, string] | null>(null);
const q = ref<Record<string, any>>({});
const rows = ref<any[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(50);
const loading = ref(false);
const selected = ref<any[]>([]);

const load = async () => {
  loading.value = true;
  try {
    const res: any = await listChangeLogs({
      ...q.value,
      beginDate: range.value?.[0],
      endDate: range.value?.[1],
      pageNum: pageNum.value,
      pageSize: pageSize.value
    });
    rows.value = res?.rows ?? [];
    total.value = res?.total ?? 0;
  } catch {
    rows.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

const search = () => {
  pageNum.value = 1;
  load();
};

const reset = () => {
  q.value = {};
  range.value = null;
  search();
};

const retry = async () => {
  try {
    await modal.confirm(`确认重试已选 ${selected.value.length} 条失败记录？`);
  } catch {
    return;
  }
  const res: any = await retryChangeLogs(selected.value.map((r) => String(r.logId)));
  const data = res?.data ?? {};
  if (data.failed?.length) {
    modal.alert(`成功 ${data.success} 条，失败 ${data.failed.length} 条：\n${data.failed.join('\n')}`);
  } else {
    modal.msgSuccess(`成功 ${data.success} 条`);
  }
  load();
};

load();
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
</style>
