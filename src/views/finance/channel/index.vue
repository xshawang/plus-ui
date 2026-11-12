<template>
  <div class="p-2 app-container deposit-channel-page">
    <el-card shadow="hover" class="mb-2">
      <div class="page-head">
        <div>
          <h2 class="title">充值大类与通道</h2>
          <p class="hint">客户端通道编码与供应商通道编码按匹配行配置；双击任意单元格编辑整行。</p>
        </div>
        <div class="actions">
          <el-button icon="Refresh" @click="loadAll">刷新</el-button>
          <el-button icon="Setting" @click="goPaymentConfig">支付配置中心</el-button>
          <el-button v-hasPermi="['finance:channel:edit']" type="primary" icon="Plus" @click="openCreate">
            新增匹配行
          </el-button>
        </div>
      </div>
      <div class="category-strip">
        <div class="category-card" :class="{ active: activeGroup === 'ALL' }" @click="selectGroup('ALL')">
          <div class="category-name">全部大类</div>
          <div class="category-meta">{{ rows.length }} 条匹配行</div>
        </div>
        <div
          v-for="group in groups"
          :key="group.groupId"
          class="category-card"
          :class="{ active: activeGroup === group.groupCode }"
          @click="selectGroup(group.groupCode)"
        >
          <div class="category-head">
            <div class="category-name">{{ group.groupName }}</div>
            <el-switch
              :model-value="group.status"
              :active-value="1"
              :inactive-value="0"
              size="small"
              @click.stop
              @change="(value: any) => changeGroupStatus(group, Number(value))"
            />
          </div>
          <div class="category-meta">
            {{ rows.filter((row) => row.groupCode === group.groupCode).length }} 条 · {{ group.groupCode }}
          </div>
        </div>
      </div>
    </el-card>

    <el-card shadow="hover" class="mb-2">
      <el-form :inline="true" class="query-form">
        <el-form-item label="大类">
          <el-select v-model="query.groupId" clearable placeholder="全部大类" style="width: 150px">
            <el-option v-for="group in groups" :key="group.groupId" :label="group.groupName" :value="group.groupId" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户端编码">
          <el-input v-model="query.clientCode" clearable placeholder="如 USDT_CODE" />
        </el-form-item>
        <el-form-item label="供应商">
          <el-select v-model="query.provider" clearable placeholder="全部供应商" style="width: 150px">
            <el-option v-for="provider in providerOptions" :key="provider" :label="provider" :value="provider" />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商通道编码">
          <el-input v-model="query.channelCode" clearable placeholder="如 bank_qr" />
        </el-form-item>
        <el-form-item label="维护状态">
          <el-select v-model="query.status" clearable placeholder="全部状态" style="width: 110px">
            <el-option label="开启" :value="1" />
            <el-option label="关闭" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" clearable placeholder="银行、币种、备注" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="loadRows">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" shadow="hover">
      <template #header>
        <div class="table-head">
          <div>
            <span class="table-title">通道匹配行</span>
            <el-tag class="ml-2" type="success">开启 {{ filteredRows.filter((row) => row.enabled === 1).length }}</el-tag>
            <el-tag class="ml-2" type="info">关闭 {{ filteredRows.filter((row) => row.enabled !== 1).length }}</el-tag>
          </div>
          <span class="hint">全部大类只显示公共列；选择大类后显示该类专属列。</span>
        </div>
      </template>
      <DepositChannelRowTable
        :rows="filteredRows"
        :active-group="activeGroup"
        @save="handleSave"
        @status="handleRowStatus"
      />
    </el-card>

    <DepositChannelRowDialog
      v-model="dialogVisible"
      :initial="editingRow"
      :groups="groups"
      :routes="allRoutes"
      :accounts="accounts"
      :saving="saving"
      @submit="handleDialogSave"
    />
  </div>
</template>

<script setup name="FinanceChannel" lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import modal from '@/plugins/modal';
import {
  changeChannelGroupStatus,
  changeDepositChannelRowStatus,
  listChannelGroups,
  listDepositChannelRows,
  saveDepositChannelRow
} from '@/api/finance/channel';
import type {
  DepositChannelRowForm,
  DepositChannelRowVO,
  FinanceChannelGroupVO,
  FinanceChannelRouteVO
} from '@/api/finance/channel/types';
import { listProviderAccounts } from '@/api/finance/payment-provider';
import type { ProviderAccountVO } from '@/api/finance/payment-provider';
import DepositChannelRowTable from './components/DepositChannelRowTable.vue';
import DepositChannelRowDialog from './components/DepositChannelRowDialog.vue';

const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const groups = ref<FinanceChannelGroupVO[]>([]);
const rows = ref<DepositChannelRowVO[]>([]);
const accounts = ref<ProviderAccountVO[]>([]);
const activeGroup = ref('ALL');
const dialogVisible = ref(false);
const editingRow = ref<DepositChannelRowVO>();
const query = reactive({
  groupId: undefined as number | undefined,
  clientCode: '',
  provider: '',
  channelCode: '',
  status: 1 as number | undefined,
  keyword: ''
});

const allRoutes = computed<FinanceChannelRouteVO[]>(() =>
  groups.value.flatMap((group) => (group.routes || []).map((route) => ({ ...route, groupId: group.groupId }))));
const providerOptions = computed(() =>
  [...new Set(rows.value.map((row) => row.providerName).filter(Boolean))].toSorted());
const filteredRows = computed(() => {
  const client = query.clientCode.trim().toLowerCase();
  const channel = query.channelCode.trim().toLowerCase();
  const keyword = query.keyword.trim().toLowerCase();
  return rows.value.filter((row) => {
    if (activeGroup.value !== 'ALL' && row.groupCode !== activeGroup.value) return false;
    if (query.groupId && row.groupId !== query.groupId) return false;
    if (client && !String(row.clientCode || '').toLowerCase().includes(client)) return false;
    if (query.provider && row.providerName !== query.provider) return false;
    if (channel && !String(row.providerChannelCode || '').toLowerCase().includes(channel)) return false;
    if (query.status !== undefined && row.enabled !== query.status) return false;
    if (keyword) {
      const text = [
        row.clientCode, row.clientName, row.providerName, row.providerChannelCode,
        row.bankCode, row.bankName, row.currency, row.remark,
        ...Object.values(row.display || {}).map(String)
      ].join(' ').toLowerCase();
      if (!text.includes(keyword)) return false;
    }
    return true;
  });
});

async function loadGroups() {
  const response = await listChannelGroups({ direction: 1 });
  groups.value = response.data || [];
}

async function loadRows() {
  loading.value = true;
  try {
    const response = await listDepositChannelRows({
      direction: 1,
      groupId: query.groupId,
      status: query.status
    });
    rows.value = response.data || [];
  } finally {
    loading.value = false;
  }
}

async function loadAccounts() {
  const response = await listProviderAccounts();
  accounts.value = response.data || [];
}

async function loadAll() {
  await Promise.all([loadGroups(), loadRows(), loadAccounts()]);
}

function selectGroup(groupCode: string) {
  activeGroup.value = groupCode;
  const group = groups.value.find((item) => item.groupCode === groupCode);
  query.groupId = group?.groupId;
  loadRows();
}

function resetQuery() {
  Object.assign(query, {
    groupId: undefined,
    clientCode: '',
    provider: '',
    channelCode: '',
    status: 1,
    keyword: ''
  });
  activeGroup.value = 'ALL';
  loadRows();
}

async function changeGroupStatus(group: FinanceChannelGroupVO, status: number) {
  await changeChannelGroupStatus(group.groupId, status);
  group.status = status;
  modal.msgSuccess(`${group.groupName}已${status ? '开启' : '关闭'}`);
}

async function handleRowStatus(row: DepositChannelRowVO, status: number) {
  await changeDepositChannelRowStatus(row.routeId, row.matchKey || 'self', status);
  modal.msgSuccess('当前匹配行已更新');
  await loadRows();
}

function openCreate() {
  editingRow.value = undefined;
  dialogVisible.value = true;
}

async function handleSave(payload: DepositChannelRowForm) {
  saving.value = true;
  try {
    await saveDepositChannelRow(payload);
    modal.msgSuccess('整行配置已生效');
    await loadRows();
  } finally {
    saving.value = false;
  }
}

async function handleDialogSave(payload: DepositChannelRowForm) {
  saving.value = true;
  try {
    await saveDepositChannelRow(payload);
    dialogVisible.value = false;
    modal.msgSuccess('匹配行已保存并生效');
    await loadRows();
  } finally {
    saving.value = false;
  }
}

function goPaymentConfig() {
  router.push('/finance/payment-provider');
}

onMounted(loadAll);
</script>

<style scoped>
.page-head, .table-head, .actions, .category-head { display: flex; align-items: center; gap: 10px; }
.page-head, .table-head { justify-content: space-between; }
.title { margin: 0; font-size: 19px; }
.hint { margin: 4px 0 0; color: var(--el-text-color-secondary); font-size: 12px; }
.category-strip { display: grid; grid-template-columns: repeat(8, minmax(100px, 1fr)); gap: 9px; margin-top: 14px; }
.category-card { padding: 11px; border: 1px solid var(--el-border-color); border-radius: 8px; cursor: pointer; }
.category-card.active { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.category-name { font-weight: 500; }
.category-meta { margin-top: 4px; color: var(--el-text-color-secondary); font-size: 11px; }
.category-head { justify-content: space-between; }
.table-title { font-weight: 500; }
@media (max-width: 1200px) { .category-strip { grid-template-columns: repeat(4, minmax(100px, 1fr)); } }
@media (max-width: 700px) {
  .category-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .page-head, .table-head { align-items: flex-start; flex-direction: column; }
}
</style>
