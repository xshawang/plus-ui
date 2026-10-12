<template>
  <div class="p-2 app-container ops-report-ledger-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item>
          <el-radio-group v-model="quickRange" @change="handleQuickRange">
            <el-radio-button label="day">日</el-radio-button>
            <el-radio-button label="week">周</el-radio-button>
            <el-radio-button label="month">月</el-radio-button>
          </el-radio-group>
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
        <el-form-item label="会员账号">
          <el-input v-model="queryParams.account" placeholder="请输入会员账号" clearable style="width: 160px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="最后操作人">
          <el-input v-model="queryParams.operator" placeholder="请输入最后操作人" clearable style="width: 160px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="变动钱包">
          <el-select v-model="queryParams.wallet" clearable placeholder="全部" style="width: 120px">
            <el-option v-for="item in options.wallets" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="账变大类">
          <el-select v-model="queryParams.category" clearable placeholder="全部" style="width: 140px">
            <el-option v-for="item in options.categories" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="warning" plain icon="Setting" @click="openQueryDays">前端数据展示天数</el-button>
          <el-button v-hasPermi="['ops:report:ledger:export']" type="success" plain icon="Download" @click="handleExport">导出报表</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <el-table v-loading="loading" border :data="rows" empty-text="暂无数据" max-height="580">
        <el-table-column type="expand" width="42">
          <template #default="{ row }">
            <el-descriptions :column="4" border size="small">
              <el-descriptions-item label="单号">{{ row.ledgerNo }}</el-descriptions-item>
              <el-descriptions-item label="交易时间">{{ row.tradeTime }}</el-descriptions-item>
              <el-descriptions-item label="业务单号">{{ row.bizNo }}</el-descriptions-item>
              <el-descriptions-item label="请求号">{{ row.requestId }}</el-descriptions-item>
              <el-descriptions-item label="账变大类">{{ row.categoryName }}</el-descriptions-item>
              <el-descriptions-item label="小类明细">{{ row.subDetail }}</el-descriptions-item>
              <el-descriptions-item label="变动钱包">{{ row.walletName }}</el-descriptions-item>
              <el-descriptions-item label="币种">{{ row.currency }}</el-descriptions-item>
              <el-descriptions-item label="前台备注">{{ row.frontRemark || '—' }}</el-descriptions-item>
              <el-descriptions-item label="后台备注">{{ row.backRemark || '—' }}</el-descriptions-item>
              <el-descriptions-item label="最后操作人">{{ row.lastOperator || '—' }}</el-descriptions-item>
              <el-descriptions-item label="游戏编码">{{ row.gameCode || '—' }}</el-descriptions-item>
            </el-descriptions>
          </template>
        </el-table-column>
        <el-table-column label="单号" prop="ledgerNo" min-width="200" show-overflow-tooltip />
        <el-table-column label="交易时间" prop="tradeTime" align="center" width="170" sortable />
        <el-table-column label="币种" prop="currency" align="center" width="90" />
        <el-table-column label="会员ID" prop="uid" align="center" width="110" />
        <el-table-column label="会员账号" prop="account" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="上级代理账号" prop="parentAgentAccount" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="注册来源" prop="registerSource" align="center" width="110" show-overflow-tooltip />
        <el-table-column label="变动钱包" align="center" width="100">
          <template #default="{ row }">
            <el-tag type="primary" effect="plain">{{ row.walletName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="账变大类" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="categoryTagType(row.categoryCode)" effect="plain">{{ row.categoryName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="小类明细" prop="subDetail" min-width="180" show-overflow-tooltip />
        <el-table-column label="变动前余额" align="center" width="120">
          <template #default="{ row }">{{ fmtMoney(row.beforeAmount) }}</template>
        </el-table-column>
        <el-table-column label="变动金额" align="center" width="120" sortable>
          <template #default="{ row }">
            <span :class="Number(row.changeAmount) >= 0 ? 'text-red-500' : ''">{{ fmtMoney(row.changeAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="变动后余额" align="center" width="120">
          <template #default="{ row }">{{ fmtMoney(row.afterAmount) }}</template>
        </el-table-column>
        <el-table-column label="前台备注" prop="frontRemark" min-width="150" show-overflow-tooltip />
        <el-table-column label="后台备注" prop="backRemark" min-width="150" show-overflow-tooltip />
        <el-table-column label="最后操作人" prop="lastOperator" align="center" width="120" />
      </el-table>

      <el-table :data="footerRows" border :show-header="false" class="summary-table">
        <el-table-column label="项目" prop="label" width="200" align="right" />
        <el-table-column label="金额" prop="amount" align="center" />
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 前端数据展示天数（截图弹窗：只含白色弹框内容） -->
    <el-dialog v-model="queryDaysVisible" title="前端数据展示天数" width="640px" append-to-body>
      <el-form ref="queryDaysFormRef" :model="queryDaysForm" label-width="180px">
        <el-form-item v-for="item in queryDaysItems" :key="item.key" :label="'*' + item.label" :prop="item.key" required>
          <el-select v-model="queryDaysForm[item.key]" placeholder="请选择可查询天数" style="width: 220px">
            <el-option v-for="day in queryDaysOptions" :key="day" :label="day + '天'" :value="day" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="queryDaysVisible = false">取消</el-button>
        <el-button type="primary" @click="submitQueryDays">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="OpsReportLedger" lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { exportLedger, getLedgerOptions, getQueryDays, listLedger, saveQueryDays } from '@/api/ops/report/ledger';
import type { LedgerRow, QueryDaysConfig } from '@/api/ops/report/ledger/types';

const { loading, withLoading } = useLoading(true);
const rows = ref<LedgerRow[]>([]);
const total = ref(0);
const quickRange = ref('day');
const timeRange = ref<string[]>([]);
const queryDaysVisible = ref(false);
const queryDaysFormRef = ref();
const queryDaysConfig = ref<QueryDaysConfig>({ values: {}, options: [], items: [] });
const queryDaysForm = reactive<Record<string, number>>({});

const queryParams = reactive({
  account: '',
  operator: '',
  wallet: '',
  category: '',
  pageNum: 1,
  pageSize: 100
});

const options = reactive({
  categories: [] as Array<{ label: string; value: string }>,
  wallets: [] as Array<{ label: string; value: string }>,
  currencies: [] as string[]
});

const queryDaysItems = computed(() => queryDaysConfig.value.items || []);
const queryDaysOptions = computed(() => queryDaysConfig.value.options || []);
const footerRows = computed(() => [
  { label: '小计', amount: fmtMoney(subtotal.value) },
  { label: '总计', amount: fmtMoney(totalAmount.value) }
]);
const subtotal = ref(0);
const totalAmount = ref(0);

type TagType = 'primary' | 'success' | 'info' | 'warning' | 'danger';

const categoryTagType = (code: string): TagType =>
  (({
    recharge: 'primary',
    withdraw: 'warning',
    transfer: 'info',
    activity: 'danger',
    rebate: 'danger',
    manual: 'info',
    commission: 'primary',
    safe: 'info',
    bet: 'success'
  } as Record<string, TagType>)[code] || 'info');

const fmtMoney = (value: any) => (value === null || value === undefined || value === '' ? '0.00' : Number(value).toFixed(2));

const pad = (num: number) => String(num).padStart(2, '0');
const dayText = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** 日/周/月快捷：切换后自动重置起止时间（截图默认「日」= 当天 00:00:00 ~ 23:59:59） */
const handleQuickRange = () => {
  const now = new Date();
  if (quickRange.value === 'week') {
    const day = now.getDay() === 0 ? 7 : now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day + 1);
    timeRange.value = [`${dayText(start)} 00:00:00`, `${dayText(now)} 23:59:59`];
  } else if (quickRange.value === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    timeRange.value = [`${dayText(start)} 00:00:00`, `${dayText(now)} 23:59:59`];
  } else {
    timeRange.value = [`${dayText(now)} 00:00:00`, `${dayText(now)} 23:59:59`];
  }
  queryParams.pageNum = 1;
  getList();
};

const getList = async () => {
  await withLoading(async () => {
    const res = await listLedger({
      ...queryParams,
      startTime: timeRange.value?.[0],
      endTime: timeRange.value?.[1]
    });
    rows.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
    subtotal.value = Number(res.data?.subtotal || 0);
    totalAmount.value = Number(res.data?.totalAmount || 0);
  });
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.account = '';
  queryParams.operator = '';
  queryParams.wallet = '';
  queryParams.category = '';
  quickRange.value = 'day';
  handleQuickRange();
};

const loadOptions = async () => {
  const res = await getLedgerOptions();
  options.categories = res.data?.categories || [];
  options.wallets = res.data?.wallets || [];
  options.currencies = res.data?.currencies || [];
};

/** 打开「前端数据展示天数」弹窗（必须先取回当前配置，避免覆盖运营已保存的值） */
const openQueryDays = async () => {
  const res = await getQueryDays();
  queryDaysConfig.value = res.data || { values: {}, options: [], items: [] };
  Object.keys(queryDaysForm).forEach((key) => delete queryDaysForm[key]);
  (res.data?.items || []).forEach((item) => {
    queryDaysForm[item.key] = item.value;
  });
  queryDaysVisible.value = true;
};

const submitQueryDays = async () => {
  const missing = queryDaysItems.value.find((item) => !queryDaysForm[item.key]);
  if (missing) {
    modal.msgWarning(`请选择${missing.label}`);
    return;
  }
  await saveQueryDays({ ...queryDaysForm });
  modal.msgSuccess('保存成功');
  queryDaysVisible.value = false;
};

const handleExport = async () => {
  const res = await exportLedger({
    ...queryParams,
    startTime: timeRange.value?.[0],
    endTime: timeRange.value?.[1]
  });
  const taskNo = res.data?.taskNo || '';
  const status = res.data?.status;
  if (status === 2) {
    modal.msgSuccess(`导出任务已生成（任务号 ${taskNo}），请到「报表 → 导出下载」下载`);
  } else {
    modal.msgError(`导出任务生成失败（任务号 ${taskNo}），请到「导出下载」查看原因`);
  }
};

onMounted(async () => {
  await loadOptions();
  handleQuickRange();
});
</script>
