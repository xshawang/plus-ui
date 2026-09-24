<template>
  <div class="p-2 app-container member-persuade-page">
    <el-alert
      type="warning"
      :closable="false"
      title="资金提示：提交劝退会通过钱包核心真实扣款并全额退还剩余本金，扣款/退款均写钱包流水，同一请求幂等号只处理一次。"
      class="mb-2"
    />

    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="会员ID">
          <el-input v-model="queryParams.uid" placeholder="会员ID" clearable style="width: 170px" @keyup.enter="getList" />
        </el-form-item>
        <el-form-item label="会员账号">
          <el-input v-model="queryParams.loginName" placeholder="会员账号" clearable style="width: 160px" @keyup.enter="getList" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="待处理" :value="1" />
            <el-option label="处理中" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
            <el-option label="异常" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="getList">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>劝退记录</h3>
            <p>共 {{ total }} 单；「已劝退」不可逆，异常单可重试（复用同一幂等键，不会重复入账）。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['member:user:edit']" type="primary" plain icon="Plus" @click="openSubmit">发起劝退</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="提交时间" prop="createdAt" align="center" width="180" />
        <el-table-column label="会员ID" align="center" width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="goDetail(row.uid)">{{ row.uid }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="会员账号" prop="loginName" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="劝退状态" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="row.persuadeStatus === 2 ? 'danger' : row.persuadeStatus === 1 ? 'warning' : 'info'">
              {{ persuadeStatusLabel(row.persuadeStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="处置前余额" align="right" width="140">
          <template #default="{ row }">{{ fmtFen(row.availableBefore) }}</template>
        </el-table-column>
        <el-table-column label="扣款" align="right" width="130">
          <template #default="{ row }">{{ fmtFen(row.penaltyAmount) }}</template>
        </el-table-column>
        <el-table-column label="退还本金" align="right" width="130">
          <template #default="{ row }">{{ fmtFen(row.refundAmount) }}</template>
        </el-table-column>
        <el-table-column label="原因" prop="reason" align="left" min-width="160" show-overflow-tooltip />
        <el-table-column label="单据状态" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="失败原因" prop="failReason" align="left" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.failReason || '—' }}</template>
        </el-table-column>
        <el-table-column label="操作人" prop="operatorName" align="center" width="120" />
        <el-table-column label="操作" align="center" width="170" fixed="right">
          <template #default="{ row }">
            <el-button
              v-hasPermi="['member:user:edit']"
              link
              type="primary"
              :disabled="row.status !== 5 && row.status !== 2"
              @click="handleRetry(row as PersuadeOrderVO)"
              >重试</el-button
            >
            <el-button
              v-hasPermi="['member:user:edit']"
              link
              type="danger"
              :disabled="row.status !== 1 && row.status !== 5"
              @click="handleCancel(row as PersuadeOrderVO)"
              >取消</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>

    <el-dialog v-model="submitDialog.visible" title="发起劝退" width="620px" append-to-body destroy-on-close>
      <el-form ref="submitFormRef" :model="submitForm" :rules="submitRules" label-width="140px">
        <el-form-item label="会员ID" prop="uid">
          <el-input v-model="submitForm.uid" placeholder="请输入会员ID" />
        </el-form-item>
        <el-form-item label="扣款金额(分)" prop="penaltyAmount">
          <el-input-number v-model="submitForm.penaltyAmount" :min="0" :precision="0" controls-position="right" style="width: 100%" />
          <div class="text-gray-400 text-sm">默认 0（不扣款）；剩余可用余额将全额退还本金。</div>
        </el-form-item>
        <el-form-item label="请求幂等号" prop="requestId">
          <el-input v-model="submitForm.requestId" placeholder="重复提交相同值不会重复入账" />
        </el-form-item>
        <el-form-item label="劝退原因" prop="reason">
          <el-input v-model="submitForm.reason" type="textarea" :rows="2" maxlength="255" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="submitForm.remark" type="textarea" :rows="2" maxlength="255" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="saving" @click="submitFormNow">确认劝退</el-button>
        <el-button @click="submitDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MemberPersuade" lang="ts">
import { onMounted, reactive, ref, toRefs } from 'vue';
import { useRouter } from 'vue-router';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { cancelPersuade, listPersuadeOrder, retryPersuade, submitPersuade } from '@/api/member/persuade';
import type { PersuadeOrderQuery, PersuadeOrderVO, PersuadeSubmitForm } from '@/api/member/persuade/types';

type PageBody<T> = { rows?: T[]; total?: number };
type DataBody<T> = { data?: T };

const router = useRouter();
const { loading, withLoading } = useLoading(true);
const { loading: saving, withLoading: withSaving } = useLoading(false);
const rows = ref<PersuadeOrderVO[]>([]);
const total = ref(0);
const submitFormRef = ref();
const submitDialog = reactive({ visible: false });

const data = reactive<{ queryParams: PersuadeOrderQuery; submitForm: PersuadeSubmitForm }>({
  queryParams: { pageNum: 1, pageSize: 10 },
  submitForm: { uid: '', requestId: '', penaltyAmount: 0, reason: '', remark: '' }
});
const { queryParams, submitForm } = toRefs(data);

const submitRules = {
  uid: [{ required: true, message: '会员ID不能为空', trigger: 'blur' }],
  requestId: [{ required: true, message: '请求幂等号不能为空', trigger: 'blur' }],
  reason: [{ required: true, message: '劝退原因不能为空', trigger: 'blur' }]
};

const fmtFen = (fen?: number) => (Number(fen ?? 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const statusLabel = (status?: number) =>
  ({ 1: '待处理', 2: '处理中', 3: '已完成', 4: '已取消', 5: '异常' } as Record<number, string>)[status ?? -1] ?? '—';
const statusTagType = (status?: number) => (status === 3 ? 'success' : status === 5 ? 'danger' : status === 4 ? 'info' : 'warning');
const persuadeStatusLabel = (status?: number) => (status === 2 ? '已劝退' : status === 1 ? '劝退中' : '无');

const getList = async () => {
  await withLoading(async () => {
    const res = (await listPersuadeOrder(queryParams.value)) as unknown as PageBody<PersuadeOrderVO>;
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  });
};

const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: 10 };
  getList();
};

const openSubmit = () => {
  Object.assign(submitForm.value, {
    uid: '',
    requestId: 'PSD' + Date.now(),
    penaltyAmount: 0,
    reason: '',
    remark: ''
  });
  submitDialog.visible = true;
};

const submitFormNow = () => {
  submitFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) {
      return;
    }
    const res = (await withSaving(async () => submitPersuade(submitForm.value))) as unknown as DataBody<number>;
    modal.msgSuccess(`劝退单已提交（orderId ${res.data ?? '-'}），请核对钱包流水与单据状态`);
    submitDialog.visible = false;
    await getList();
  });
};

const handleRetry = async (row: PersuadeOrderVO) => {
  const res = (await retryPersuade({ orderId: row.orderId, reason: '后台重试' })) as unknown as DataBody<number>;
  modal.msgSuccess(`重试完成（影响 ${res.data ?? 0} 条）`);
  await getList();
};

const handleCancel = async (row: PersuadeOrderVO) => {
  const res = (await cancelPersuade({ orderId: row.orderId, reason: '后台取消' })) as unknown as DataBody<number>;
  modal.msgSuccess(`取消完成（影响 ${res.data ?? 0} 条）`);
  await getList();
};

const goDetail = (uid: number | string) => {
  const target = router.resolve({ path: '/member/detail' });
  if (target.matched.length === 0) {
    return;
  }
  router.push({ path: '/member/detail', query: { uid: String(uid) } });
};

onMounted(() => getList());
</script>
