<template>
  <div class="p-2 app-container withdraw-channel-page">
    <el-card shadow="hover" class="mb-2">
      <div class="page-head">
        <div>
          <h2 class="title">提现渠道管理</h2>
          <p class="hint">
            五个提现大类由客户端固定；当前页只维护客户端可见通道、供应商代付匹配和运营参数。
            供应商账号复用支付配置中心。
          </p>
        </div>
        <div class="actions">
          <el-button icon="Building2" @click="goProviderAccounts">管理供应商账号</el-button>
          <el-button icon="MonitorSmartphone" @click="showClientManifest">客户端下发预览</el-button>
          <el-button v-hasPermi="['finance:withdrawchannel:edit']" type="primary" icon="Plus" @click="openCreate">
            新增匹配行
          </el-button>
          <el-button icon="Refresh" @click="loadAll">刷新</el-button>
        </div>
      </div>

      <el-alert type="info" :closable="false" show-icon class="mb-3">
        <template #title>
          未支持的四家供应商通道不会出现在选项中。BANK/CARD/CRYPTO/COIN12/P2P 以外的通道不能强行写入。
        </template>
      </el-alert>

      <div class="category-grid">
        <button
          v-for="tab in orderedTabs"
          :key="tab.tabCode"
          type="button"
          class="category-card"
          :class="{ active: activeTab === tab.tabCode }"
          @click="activeTab = tab.tabCode"
        >
          <span class="category-head">
            <span class="category-name">
              <span class="category-icon" :style="{ color: categoryColor(tab.tabCode) }">
                <el-icon><component :is="categoryIcon(tab.tabCode)" /></el-icon>
              </span>
              {{ tab.displayName }}
            </span>
            <el-switch
              :model-value="tab.status"
              :active-value="1"
              :inactive-value="0"
              size="small"
              @click.stop
              @change="(value: any) => toggleTab(tab, Number(value))"
            />
          </span>
          <span class="category-meta">
            {{ rowsByTab(tab.tabCode).length }} 条匹配 · {{ tab.tabCode }}
          </span>
        </button>
      </div>
    </el-card>

    <el-card shadow="hover" class="mb-2">
      <el-form :inline="true" class="query-form">
        <el-form-item label="客户端编码">
          <el-input v-model="query.clientCode" clearable placeholder="如 BIDV、USDT" style="width: 170px" />
        </el-form-item>
        <el-form-item label="供应商">
          <el-select v-model="query.provider" clearable placeholder="全部供应商" style="width: 150px">
            <el-option v-for="provider in providerOptions" :key="provider" :label="provider" :value="provider" />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商通道">
          <el-input v-model="query.channelCode" clearable placeholder="如 BANKCARD、5001" style="width: 180px" />
        </el-form-item>
        <el-form-item label="维护状态">
          <el-select v-model="query.status" placeholder="全部状态" style="width: 110px">
            <el-option label="全部状态" :value="null" />
            <el-option label="开启" :value="1" />
            <el-option label="关闭" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键字">
          <el-input v-model="query.keyword" clearable placeholder="银行、币种、备注" style="width: 180px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="applyFilter">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading" shadow="hover">
      <template #header>
        <div class="table-head">
          <div class="table-title">
            <strong>{{ activeTabName }}匹配行</strong>
            <el-tag type="success">开启 {{ enabledCount }}</el-tag>
            <el-tag type="info">关闭 {{ filteredRows.length - enabledCount }}</el-tag>
          </div>
          <span class="hint">一行对应一条供应商匹配；双击行或点击编辑打开完整配置。</span>
        </div>
      </template>
      <WithdrawChannelRowTable
        :rows="filteredRows"
        :tab-code="activeTab"
        @edit="openEdit"
        @status="handleRowStatus"
      />
      <el-empty v-if="filteredRows.length === 0" description="当前条件下没有提现匹配行" />
    </el-card>

    <WithdrawChannelRowDialog
      v-model="dialogVisible"
      :initial="editingRow"
      :tabs="orderedTabs"
      :accounts="accounts"
      :saving="saving"
      @submit="handleSave"
    />

    <el-dialog v-model="manifestVisible" title="客户端提现下发预览" width="720px" append-to-body>
      <el-input :model-value="manifestText" type="textarea" :rows="18" readonly />
    </el-dialog>
  </div>
</template>

<script setup name="FinanceWithdrawChannel" lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Coin,
  CreditCard,
  Money,
  RefreshRight,
  Wallet
} from '@element-plus/icons-vue';
import modal from '@/plugins/modal';
import {
  changeWithdrawChannelRowStatus,
  changeWithdrawTabStatus,
  getWithdrawClientManifest,
  listWithdrawChannelRows,
  listWithdrawTabs,
  saveWithdrawChannelRow
} from '@/api/finance/withdraw-channel';
import type {
  WithdrawChannelRowForm,
  WithdrawChannelRowVO,
  WithdrawTabVO
} from '@/api/finance/withdraw-channel/types';
import { listProviderAccounts } from '@/api/finance/payment-provider';
import type { ProviderAccountVO } from '@/api/finance/payment-provider';
import WithdrawChannelRowDialog from './components/WithdrawChannelRowDialog.vue';
import WithdrawChannelRowTable from './components/WithdrawChannelRowTable.vue';

const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const tabs = ref<WithdrawTabVO[]>([]);
const rows = ref<WithdrawChannelRowVO[]>([]);
const accounts = ref<ProviderAccountVO[]>([]);
const activeTab = ref('BANK');
const dialogVisible = ref(false);
const editingRow = ref<WithdrawChannelRowVO>();
const manifestVisible = ref(false);
const manifestText = ref('');
const query = reactive({
  clientCode: '',
  provider: '',
  channelCode: '',
  status: null as number | null,
  keyword: ''
});
const appliedQuery = reactive({ ...query });
const FIXED_TAB_ORDER = ['BANK', 'CARD', 'CRYPTO', 'COIN12', 'P2P'];

const orderedTabs = computed(() => tabs.value.toSorted(
  (left, right) => FIXED_TAB_ORDER.indexOf(left.tabCode) - FIXED_TAB_ORDER.indexOf(right.tabCode)
));
const providerOptions = computed(() =>
  [...new Set(rows.value.map((row) => row.providerName).filter(Boolean))].toSorted());
const activeTabName = computed(() =>
  tabs.value.find((tab) => tab.tabCode === activeTab.value)?.displayName || activeTab.value);
const filteredRows = computed(() => {
  const client = appliedQuery.clientCode.trim().toLowerCase();
  const channel = appliedQuery.channelCode.trim().toLowerCase();
  const keyword = appliedQuery.keyword.trim().toLowerCase();
  return rows.value.filter((row) => {
    if (row.tabCode !== activeTab.value) return false;
    if (client && !row.clientCode.toLowerCase().includes(client)) return false;
    if (appliedQuery.provider && row.providerName !== appliedQuery.provider) return false;
    if (channel && !String(row.providerChannelCode || '').toLowerCase().includes(channel)) return false;
    if (appliedQuery.status !== null && row.enabled !== appliedQuery.status) return false;
    if (keyword) {
      const haystack = [
        row.clientCode, row.clientSubCode, row.channelName, row.providerName,
        row.merchantCode, row.providerChannelCode, row.bankCode, row.remark,
        ...Object.values(row.display || {}).map(String)
      ].join(' ').toLowerCase();
      if (!haystack.includes(keyword)) return false;
    }
    return true;
  });
});
const enabledCount = computed(() => filteredRows.value.filter((row) => row.enabled === 1).length);

async function loadAll() {
  loading.value = true;
  try {
    const [tabResponse, rowResponse, accountResponse] = await Promise.all([
      listWithdrawTabs(),
      listWithdrawChannelRows(),
      listProviderAccounts(undefined, false)
    ]);
    tabs.value = tabResponse.data || [];
    rows.value = rowResponse.data || [];
    accounts.value = accountResponse.data || [];
    if (!tabs.value.some((tab) => tab.tabCode === activeTab.value) && tabs.value.length) {
      activeTab.value = tabs.value[0].tabCode;
    }
  } finally {
    loading.value = false;
  }
}

function rowsByTab(tabCode: string) {
  return rows.value.filter((row) => row.tabCode === tabCode);
}

function applyFilter() {
  Object.assign(appliedQuery, { ...query });
}

function resetQuery() {
  Object.assign(query, { clientCode: '', provider: '', channelCode: '', status: null, keyword: '' });
  applyFilter();
}

async function toggleTab(tab: WithdrawTabVO, status: number) {
  await changeWithdrawTabStatus(tab.tabId, status);
  tab.status = status;
  tab.visible = status;
  modal.msgSuccess(`${tab.displayName}已${status ? '开启' : '关闭'}`);
}

function openCreate() {
  editingRow.value = undefined;
  dialogVisible.value = true;
}

function openEdit(row: WithdrawChannelRowVO) {
  editingRow.value = row;
  dialogVisible.value = true;
}

async function handleSave(payload: WithdrawChannelRowForm) {
  saving.value = true;
  try {
    await saveWithdrawChannelRow(payload);
    activeTab.value = payload.tabCode;
    dialogVisible.value = false;
    modal.msgSuccess('提现匹配行已保存');
    await loadAll();
  } finally {
    saving.value = false;
  }
}

async function handleRowStatus(row: WithdrawChannelRowVO, status: number) {
  await changeWithdrawChannelRowStatus(row.withdrawChannelId, row.matchKey, status);
  modal.msgSuccess(status === 1 ? '供应商匹配已开启' : '供应商匹配已关闭');
  await loadAll();
}

function goProviderAccounts() {
  router.push({ path: '/finance/payment-provider', query: { tab: 'accounts' } });
}

async function showClientManifest() {
  const response = await getWithdrawClientManifest();
  manifestText.value = JSON.stringify(response.data, null, 2);
  manifestVisible.value = true;
}

function categoryColor(tabCode: string) {
  return ({ BANK: '#3b82f6', CARD: '#8b5cf6', CRYPTO: '#0891b2', COIN12: '#f59e0b', P2P: '#10b981' } as Record<string, string>)[tabCode];
}

function categoryIcon(tabCode: string) {
  return ({
    BANK: Wallet,
    CARD: CreditCard,
    CRYPTO: Coin,
    COIN12: Money,
    P2P: Money
  } as Record<string, any>)[tabCode] || RefreshRight;
}

onMounted(loadAll);
</script>

<style scoped>
.page-head, .table-head, .actions, .category-head, .table-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.page-head, .table-head, .category-head {
  justify-content: space-between;
}
.page-head { align-items: flex-start; }
.title { margin: 0; font-size: 20px; font-weight: 600; }
.hint { margin: 4px 0 0; color: var(--el-text-color-secondary); font-size: 12px; }
.actions { flex-wrap: wrap; justify-content: flex-end; }
.category-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(120px, 1fr));
  gap: 10px;
  margin-top: 14px;
}
.category-card {
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 9px;
  background: var(--el-fill-color-extra-light);
  color: var(--el-text-color-primary);
  text-align: left;
  transition: 140ms ease;
}
.category-card:hover { border-color: var(--el-color-primary-light-5); transform: translateY(-1px); }
.category-card.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  box-shadow: inset 0 0 0 1px var(--el-color-primary-light-7);
}
.category-name { display: flex; align-items: center; gap: 7px; min-width: 0; font-weight: 500; }
.category-icon {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: var(--el-bg-color);
}
.category-meta { display: block; margin-top: 8px; color: var(--el-text-color-secondary); font-size: 11px; }
.table-title strong { font-size: 14px; }
@media (max-width: 1200px) { .category-grid { grid-template-columns: repeat(3, minmax(120px, 1fr)); } }
@media (max-width: 700px) {
  .page-head, .table-head { align-items: flex-start; flex-direction: column; }
  .category-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .actions { justify-content: flex-start; }
}
@media (max-width: 420px) { .category-grid { grid-template-columns: 1fr; } }
</style>
