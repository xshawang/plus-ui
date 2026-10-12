<template>
  <div class="p-2 app-container member-reconcile-page">
    <el-card shadow="hover" class="search-panel">
      <el-row :gutter="12" class="mb-3">
        <el-col :span="6">
          <div class="stat-card">
            <p class="stat-label">待处理差异</p>
            <p class="stat-value text-red-500">{{ summary.pending ?? 0 }}</p>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <p class="stat-label">近 30 天差异天数</p>
            <p class="stat-value">{{ (summary.daily ?? []).length }}</p>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <p class="stat-label">近 30 天差异笔数</p>
            <p class="stat-value">{{ dailyTotal }}</p>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <p class="stat-label">近 30 天差异金额(分)</p>
            <p class="stat-value">{{ dailyAbsAmount }}</p>
          </div>
        </el-col>
      </el-row>
      <el-form :inline="true" class="query-form">
        <el-form-item label="会员ID">
          <el-input v-model="queryParams.uid" placeholder="会员ID" clearable style="width: 180px" @keyup.enter="getList" />
        </el-form-item>
        <el-form-item label="会员账号">
          <el-input v-model="queryParams.loginName" placeholder="会员账号" clearable style="width: 160px" @keyup.enter="getList" />
        </el-form-item>
        <el-form-item label="差异类型">
          <el-select v-model="queryParams.keyword" placeholder="全部" clearable style="width: 190px">
            <el-option label="业务单无钱包流水" value="业务单无对应钱包流水" />
            <el-option label="金额不一致" value="金额不一致" />
            <el-option label="钱包流水无业务单" value="钱包流水无对应业务单" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 130px">
            <el-option label="未处理" :value="0" />
            <el-option label="已修复" :value="1" />
            <el-option label="已忽略" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="差异时间">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="datetimerange"
            value-format="YYYY-MM-DDTHH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 340px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="getList">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="text-gray-400 text-sm">
        口径：差异由 go88-job 每日 01:40 对账任务写入（劝退 / VIP 奖励 / 任务奖励 ↔ 钱包流水，双向核对）；
        后台只做人工标记（已修复/忽略），<span class="text-orange-500">不自动补偿资金</span>，补偿请走人工调账流程。
      </div>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>会员资金链路对账差异</h3>
            <p>共 {{ total }} 条</p>
          </div>
          <div class="toolbar-actions">
            <el-button icon="Refresh" @click="refreshAll">刷新</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="差异ID" prop="id" align="center" width="180" show-overflow-tooltip />
        <el-table-column label="会员ID" prop="uid" align="center" width="180" show-overflow-tooltip />
        <el-table-column label="会员账号" prop="loginName" align="center" min-width="130" show-overflow-tooltip />
        <el-table-column label="账号类型" prop="accountType" align="center" width="110" />
        <el-table-column label="钱包侧金额(分)" prop="ledgerBalance" align="right" width="140" />
        <el-table-column label="差异金额(分)" align="right" width="130">
          <template #default="{ row }">
            <span :class="Number(row.diffAmount) > 0 ? 'text-red-500' : 'text-green-600'">{{ row.diffAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column label="差异明细" prop="remark" align="left" min-width="360" show-overflow-tooltip />
        <el-table-column label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'danger' : row.status === 1 ? 'success' : 'info'">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="产生时间" prop="createdAt" align="center" width="170" />
        <el-table-column label="处理时间" prop="handledAt" align="center" width="170" />
        <el-table-column label="操作" align="center" width="110" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['member:reconcile:edit']" link type="primary" :disabled="row.status !== 0" @click="openHandle(row as MemberReconcileErrorVO)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="handleDialog.visible" title="对账差异处理" width="620px" append-to-body destroy-on-close>
      <el-descriptions :column="1" border class="mb-3">
        <el-descriptions-item label="会员">{{ handleDialog.loginName }}（{{ handleDialog.uid }}）</el-descriptions-item>
        <el-descriptions-item label="差异明细">{{ handleDialog.remark }}</el-descriptions-item>
      </el-descriptions>
      <el-form :model="handleForm" label-width="110px">
        <el-form-item label="处理结果">
          <el-radio-group v-model="handleForm.status">
            <el-radio :value="1">已修复（已人工调账/已确认无误）</el-radio>
            <el-radio :value="2">忽略（历史遗留/业务可接受）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理说明">
          <el-input v-model="handleForm.note" type="textarea" :rows="3" maxlength="255" placeholder="必填：说明处理方式与依据" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="saving" @click="submitHandle">确 定</el-button>
        <el-button @click="handleDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MemberReconcile" lang="ts">
import { computed, onMounted, reactive, ref, toRefs } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { getReconcileSummary, handleReconcileError, listReconcileError } from '@/api/member/reconcile';
import type { MemberReconcileErrorVO, ReconcileQuery, ReconcileSummaryVO } from '@/api/member/reconcile/types';

type PageBody<T> = { rows?: T[]; total?: number };
type DataBody<T> = { data?: T };

const { loading, withLoading } = useLoading(true);
const { loading: saving, withLoading: withSaving } = useLoading(false);
const rows = ref<MemberReconcileErrorVO[]>([]);
const total = ref(0);
const summary = ref<ReconcileSummaryVO>({});
const handleDialog = reactive({ visible: false, id: 0, uid: '', loginName: '', remark: '' });

const data = reactive({
  queryParams: { pageNum: 1, pageSize: 10 } as ReconcileQuery,
  handleForm: { status: 1, note: '' }
});
const { queryParams, handleForm } = toRefs(data);

const dailyTotal = computed(() => (summary.value.daily ?? []).reduce((sum, row) => sum + Number(row.totalCount ?? 0), 0));
const dailyAbsAmount = computed(() => (summary.value.daily ?? []).reduce((sum, row) => sum + Number(row.absDiffAmount ?? 0), 0));

const statusLabel = (status?: number) => ({ 0: '未处理', 1: '已修复', 2: '忽略' } as Record<number, string>)[status ?? -1] ?? '—';

const getList = async () => {
  await withLoading(async () => {
    const res = (await listReconcileError(queryParams.value)) as unknown as PageBody<MemberReconcileErrorVO>;
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  });
};

const getSummary = async () => {
  const res = (await getReconcileSummary()) as unknown as DataBody<ReconcileSummaryVO>;
  summary.value = res.data ?? {};
};

const refreshAll = async () => {
  await getList();
  await getSummary();
};

const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: 10 };
  refreshAll();
};

const openHandle = (row: MemberReconcileErrorVO) => {
  Object.assign(handleDialog, { visible: true, id: row.id, uid: row.uid, loginName: row.loginName ?? '', remark: row.remark ?? '' });
  Object.assign(handleForm.value, { status: 1, note: '' });
};

const submitHandle = async () => {
  if (!handleForm.value.note) {
    modal.msgError('请填写处理说明');
    return;
  }
  await withSaving(async () => handleReconcileError({ id: handleDialog.id, status: handleForm.value.status, note: handleForm.value.note }));
  modal.msgSuccess('处理完成');
  handleDialog.visible = false;
  await refreshAll();
};

onMounted(() => refreshAll());
</script>

<style scoped>
.stat-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 12px 16px;
  background: var(--el-fill-color-blank);
}

.stat-label {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.stat-value {
  margin: 6px 0 0;
  font-size: 22px;
  font-weight: 600;
}
</style>
