<template>
  <div class="p-2 app-container promotion-reward-flow-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="会员UID">
          <el-input v-model="queryParams.uid" placeholder="精确UID" clearable style="width: 150px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="会员账号">
          <el-input v-model="queryParams.account" placeholder="会员账号" clearable style="width: 160px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="业务单号">
          <el-input v-model="queryParams.bizNo" placeholder="发放/返水/回收单号" clearable style="width: 210px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="优惠来源">
          <el-select v-model="queryParams.category" style="width: 140px">
            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="收支类型">
          <el-select v-model="queryParams.changeType" clearable placeholder="全部" style="width: 120px">
            <el-option label="发放入账" :value="1" />
            <el-option label="回收扣款" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="变动钱包">
          <el-select v-model="queryParams.wallet" clearable placeholder="全部" style="width: 120px">
            <el-option v-for="item in options.wallets" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="币种">
          <el-select v-model="queryParams.currency" clearable placeholder="全部" style="width: 100px">
            <el-option v-for="item in options.currencies" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="交易时间">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            range-separator="-"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 380px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          <el-button v-hasPermi="['ops:reportledger:export']" type="success" plain icon="Download" @click="handleExport">
            导出
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>统一优惠流水</h3>
            <p>口径：以钱包流水为唯一事实源，包含活动、任务、新人、VIP、返水及奖励回收，不包含真实人工调账。</p>
          </div>
        </div>
      </template>

      <div class="metric-grid">
        <div class="metric-card">
          <span>记录数</span>
          <strong>{{ total }}</strong>
        </div>
        <div class="metric-card credit">
          <span>发放合计</span>
          <strong>{{ fmtMoney(creditAmount) }}</strong>
        </div>
        <div class="metric-card debit">
          <span>回收合计</span>
          <strong>{{ fmtMoney(debitAmount) }}</strong>
        </div>
        <div class="metric-card net">
          <span>净优惠</span>
          <strong>{{ fmtSigned(totalAmount) }}</strong>
        </div>
        <div class="metric-card">
          <span>本页净额</span>
          <strong>{{ fmtSigned(subtotal) }}</strong>
        </div>
      </div>

      <el-table v-loading="loading" border :data="rows" empty-text="当前条件下没有优惠流水" max-height="620">
        <el-table-column type="expand" width="42">
          <template #default="{ row }">
            <el-descriptions :column="4" border size="small">
              <el-descriptions-item label="钱包流水号">{{ row.ledgerNo }}</el-descriptions-item>
              <el-descriptions-item label="业务单号">{{ row.bizNo }}</el-descriptions-item>
              <el-descriptions-item label="优惠大类">{{ row.categoryName }}</el-descriptions-item>
              <el-descriptions-item label="优惠明细">{{ row.subDetail }}</el-descriptions-item>
              <el-descriptions-item label="前台备注">{{ row.frontRemark || '—' }}</el-descriptions-item>
              <el-descriptions-item label="后台备注">{{ row.backRemark || '—' }}</el-descriptions-item>
              <el-descriptions-item label="最后操作人">{{ row.lastOperator || '—' }}</el-descriptions-item>
              <el-descriptions-item label="账本版本">{{ row.accountVersion ?? '—' }}</el-descriptions-item>
            </el-descriptions>
          </template>
        </el-table-column>
        <el-table-column label="交易时间" prop="tradeTime" align="center" width="170" />
        <el-table-column label="会员UID" prop="uid" align="center" width="180" show-overflow-tooltip />
        <el-table-column label="会员账号" prop="account" align="center" min-width="130" show-overflow-tooltip />
        <el-table-column label="优惠来源" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="categoryTagType(row.categoryCode)" effect="plain">{{ row.categoryName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优惠明细" prop="subDetail" min-width="190" show-overflow-tooltip />
        <el-table-column label="业务单号" prop="bizNo" min-width="200" show-overflow-tooltip />
        <el-table-column label="收支类型" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="Number(row.changeType) === 2 ? 'danger' : 'success'" effect="plain">
              {{ Number(row.changeType) === 2 ? '回收' : '发放' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="变动钱包" prop="walletName" align="center" width="100" />
        <el-table-column label="变动金额" align="right" width="140">
          <template #default="{ row }">
            <span class="font-mono" :class="Number(row.changeAmount) < 0 ? 'amount-debit' : 'amount-credit'">
              {{ fmtSigned(row.changeAmount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="变动前" align="right" width="135">
          <template #default="{ row }">{{ fmtMoney(row.beforeAmount) }}</template>
        </el-table-column>
        <el-table-column label="变动后" align="right" width="135">
          <template #default="{ row }">{{ fmtMoney(row.afterAmount) }}</template>
        </el-table-column>
        <el-table-column label="币种" prop="currency" align="center" width="80" />
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>
  </div>
</template>

<script setup name="PromotionRewardFlow" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { exportLedger, getLedgerOptions, listLedger } from '@/api/ops/report/ledger';
import type { LedgerQuery, LedgerRow } from '@/api/ops/report/ledger/types';

type TagType = 'primary' | 'success' | 'info' | 'warning' | 'danger';

const { loading, withLoading } = useLoading(true);
const rows = ref<LedgerRow[]>([]);
const total = ref(0);
const subtotal = ref(0);
const totalAmount = ref(0);
const creditAmount = ref(0);
const debitAmount = ref(0);
const timeRange = ref<string[]>([]);

const queryParams = reactive({
  uid: '',
  account: '',
  bizNo: '',
  category: 'reward',
  changeType: undefined as number | undefined,
  wallet: '',
  currency: '',
  pageNum: 1,
  pageSize: 20
});

const options = reactive({
  wallets: [] as Array<{ label: string; value: string }>,
  currencies: [] as string[]
});

const categoryOptions = [
  { label: '全部优惠', value: 'reward' },
  { label: '活动奖励', value: 'activity' },
  { label: '任务奖励', value: 'task' },
  { label: 'VIP奖励/回收', value: 'vip' },
  { label: '返水', value: 'rebate' }
];

const numberFormat = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const fmtMoney = (value: unknown) => {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? numberFormat.format(amount) : '0.00';
};

const fmtSigned = (value: unknown) => {
  const amount = Number(value ?? 0);
  return `${amount > 0 ? '+' : ''}${fmtMoney(amount)}`;
};

const categoryTagType = (code: string): TagType =>
  (({
    activity: 'primary',
    task: 'warning',
    vip: 'danger',
    rebate: 'success'
  } as Record<string, TagType>)[code] || 'info');

const pad = (value: number) => String(value).padStart(2, '0');
const dateText = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const applyToday = () => {
  const today = dateText(new Date());
  timeRange.value = [`${today} 00:00:00`, `${today} 23:59:59`];
};

const buildQuery = (): LedgerQuery => ({
  uid: queryParams.uid || undefined,
  account: queryParams.account || undefined,
  bizNo: queryParams.bizNo || undefined,
  category: queryParams.category || 'reward',
  changeType: queryParams.changeType,
  wallet: queryParams.wallet || undefined,
  currency: queryParams.currency || undefined,
  startTime: timeRange.value?.[0],
  endTime: timeRange.value?.[1],
  pageNum: queryParams.pageNum,
  pageSize: queryParams.pageSize
});

const getList = async () => {
  if (queryParams.uid && !/^\d+$/.test(queryParams.uid)) {
    modal.msgWarning('会员UID必须是数字');
    return;
  }
  await withLoading(async () => {
    const response = await listLedger(buildQuery());
    rows.value = response.data?.rows || [];
    total.value = Number(response.data?.total || 0);
    subtotal.value = Number(response.data?.subtotal || 0);
    totalAmount.value = Number(response.data?.totalAmount || 0);
    creditAmount.value = Number(response.data?.creditAmount || 0);
    debitAmount.value = Number(response.data?.debitAmount || 0);
  });
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.uid = '';
  queryParams.account = '';
  queryParams.bizNo = '';
  queryParams.category = 'reward';
  queryParams.changeType = undefined;
  queryParams.wallet = '';
  queryParams.currency = '';
  queryParams.pageNum = 1;
  applyToday();
  getList();
};

const loadOptions = async () => {
  const response = await getLedgerOptions();
  options.wallets = response.data?.wallets || [];
  options.currencies = response.data?.currencies || [];
};

const handleExport = async () => {
  const response = await exportLedger(buildQuery());
  const taskNo = response.data?.taskNo || '';
  if (response.data?.status === 2) {
    modal.msgSuccess(`导出任务已生成（任务号 ${taskNo}），请到「报表 → 导出下载」下载`);
  } else {
    modal.msgError(`导出任务生成失败（任务号 ${taskNo}），请到「导出下载」查看原因`);
  }
};

onMounted(async () => {
  applyToday();
  await loadOptions();
  await getList();
});
</script>

<style scoped lang="scss">
.promotion-reward-flow-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-panel,
.table-panel {
  margin: 0;
}

.query-form {
  row-gap: 8px;
}

.toolbar-shell,
.table-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.table-heading {
  flex-direction: column;

  h3 {
    margin: 0;
  }

  p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 13px;
  }
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(150px, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.metric-card {
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;

  span {
    color: #64748b;
    font-size: 12px;
  }

  strong {
    display: block;
    margin-top: 6px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 20px;
    color: #0f172a;
  }

  &.credit strong {
    color: #15803d;
  }

  &.debit strong {
    color: #dc2626;
  }
}

.amount-credit {
  color: #15803d;
}

.amount-debit {
  color: #dc2626;
}

@media (max-width: 1200px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(150px, 1fr));
  }
}
</style>
