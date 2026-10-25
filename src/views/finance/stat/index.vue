<template>
  <div class="p-2 app-container finance-stat-page">
    <el-card shadow="hover" class="search-panel">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="充值统计" name="recharge" />
      </el-tabs>

      <el-form :inline="true" class="query-form">
        <el-form-item label="统计时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 360px"
          />
        </el-form-item>
        <el-form-item label="商户">
          <el-select v-model="rechargeQuery.merchantId" placeholder="全部" clearable filterable style="width: 190px">
            <el-option label="未分配商户" :value="0" />
            <el-option
              v-for="item in report?.merchants || []"
              :key="item.merchantId"
              :label="item.merchantName"
              :value="item.merchantId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="渠道">
          <el-select
            v-model="rechargeQuery.groupId"
            placeholder="全部"
            clearable
            style="width: 160px"
            @change="handleGroupChange"
          >
            <el-option
              v-for="item in report?.groups || []"
              :key="item.groupId"
              :label="item.groupName"
              :value="item.groupId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="通道">
          <el-select v-model="rechargeQuery.routeId" placeholder="全部" clearable filterable style="width: 190px">
            <el-option
              v-for="item in routeOptions"
              :key="item.routeId"
              :label="`${item.channelName}（${item.routeCode}）`"
              :value="item.routeId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="币种">
          <el-select v-model="rechargeQuery.currency" placeholder="全部" clearable style="width: 120px">
            <el-option label="VND" value="VND" />
            <el-option label="USDT" value="USDT" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" :loading="rechargeLoading" @click="loadRechargeReport">统计</el-button>
          <el-button icon="Refresh" @click="resetRechargeQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="stat-caption">
        统计口径：payment_order.type = 1；成功率 = 成功笔数 ÷ 总笔数 × 100%；
        到账延时仅统计成功且存在回调时间的订单。时间段内按日期、商户、渠道、通道、币种合并。
        <span v-if="rangeText">当前区间：{{ rangeText }}</span>
      </div>
    </el-card>

    <div class="kpi-grid">
      <el-card v-for="card in kpiCards" :key="card.label" shadow="hover" class="kpi-card">
        <div class="kpi-label">{{ card.label }}</div>
        <div class="kpi-value" :class="card.tone">{{ card.value }}</div>
        <div v-if="card.hint" class="kpi-hint">{{ card.hint }}</div>
      </el-card>
    </div>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>充值统计明细</h3>
            <p>共 {{ reportRows.length }} 个聚合分组；日期、商户、渠道、通道和币种共同构成一行。</p>
          </div>
          <el-button icon="Refresh" :loading="rechargeLoading" @click="loadRechargeReport">刷新</el-button>
        </div>
      </template>
      <el-table
        v-loading="rechargeLoading"
        border
        :data="reportRows"
        row-key="__rowKey"
        max-height="720"
      >
          <el-table-column label="日期" prop="statDate" width="110" fixed="left" />
          <el-table-column label="商户" prop="merchantName" min-width="150" show-overflow-tooltip />
          <el-table-column label="充值大类" prop="channelName" min-width="120" show-overflow-tooltip />
          <el-table-column label="具体通道" min-width="190" show-overflow-tooltip>
            <template #default="{ row }">
              <div>{{ row.routeName || '未匹配通道' }}</div>
              <div class="cell-sub">{{ row.routeCode || '—' }}</div>
            </template>
          </el-table-column>
          <el-table-column label="币种" prop="currency" width="90" align="center" />
          <el-table-column label="总笔数" prop="totalCount" width="90" align="right" />
          <el-table-column label="成功" prop="successCount" width="80" align="right" />
          <el-table-column label="失败" prop="failedCount" width="80" align="right" />
          <el-table-column label="取消" prop="cancelledCount" width="80" align="right" />
          <el-table-column label="待处理" prop="pendingCount" width="90" align="right" />
          <el-table-column label="成功率" width="100" align="right">
            <template #default="{ row }">
              <el-tag :type="rateTagType(row.successRate)" effect="plain">{{ formatRate(row.successRate) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="成功 VND 金额" prop="successVndAmount" width="155" align="right">
            <template #default="{ row }">{{ formatMoney(row.successVndAmount) }} VND</template>
          </el-table-column>
          <el-table-column label="平台币入账" prop="successCreditAmount" width="135" align="right">
            <template #default="{ row }">{{ formatMoney(row.successCreditAmount) }}</template>
          </el-table-column>
          <el-table-column label="手续费" prop="feeAmount" width="120" align="right">
            <template #default="{ row }">{{ formatMoney(row.feeAmount) }}</template>
          </el-table-column>
          <el-table-column label="充值赠送" prop="bonusAmount" width="125" align="right">
            <template #default="{ row }">{{ formatMoney(row.bonusAmount) }}</template>
          </el-table-column>
          <el-table-column label="平均到账延时" prop="avgLatencySeconds" width="130" align="right">
            <template #default="{ row }">{{ formatLatency(row.avgLatencySeconds) }}</template>
          </el-table-column>
          <el-table-column label="最大延时" prop="maxLatencySeconds" width="110" align="right">
            <template #default="{ row }">{{ formatLatency(row.maxLatencySeconds) }}</template>
          </el-table-column>
          <el-table-column label="充值人数" prop="memberCount" width="100" align="right" />
          <el-table-column label="客单价" prop="avgVndAmount" width="130" align="right">
            <template #default="{ row }">{{ formatMoney(row.avgVndAmount) }} VND</template>
          </el-table-column>
          <template #empty>
            <el-empty :image-size="70" description="当前条件下没有充值订单" />
          </template>
      </el-table>
    </el-card>
  </div>
</template>

<script setup name="FinanceStat" lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { formatMoney } from '@/utils/money';
import { getRechargeStatReport } from '@/api/finance/recharge-stat';
import type {
  FinanceRechargeReport,
  FinanceRechargeReportRow,
  FinanceRechargeReportRouteOption,
  FinanceStatQuery
} from '@/api/finance/recharge-stat/types';

const activeTab = ref<'recharge'>('recharge');
const rechargeLoading = ref(false);
const report = ref<FinanceRechargeReport>();
const dateRange = ref<[string, string]>(defaultRange());
const rechargeQuery = reactive<FinanceStatQuery>({});

const reportRows = computed<Array<FinanceRechargeReportRow & { __rowKey: string }>>(() =>
  (report.value?.rows || []).map((row, index) => ({ ...row, __rowKey: `${row.statDate}-${index}` }))
);
const summary = computed(() => report.value?.summary);
const routeOptions = computed<FinanceRechargeReportRouteOption[]>(() => {
  const routes = report.value?.routes || [];
  return rechargeQuery.groupId
    ? routes.filter((route) => route.groupId === rechargeQuery.groupId)
    : routes;
});
const rangeText = computed(() =>
  report.value
    ? `${report.value.beginTime.slice(0, 19)} 至 ${report.value.endTime.slice(0, 19)}`
    : ''
);
const kpiCards = computed(() => [
  {
    label: '充值总笔数',
    value: String(summary.value?.totalCount ?? 0),
    hint: `成功 ${summary.value?.successCount ?? 0} · 失败 ${summary.value?.failedCount ?? 0} · 待处理 ${summary.value?.pendingCount ?? 0}`
  },
  {
    label: '充值成功率',
    value: formatRate(summary.value?.successRate),
    hint: '成功笔数 ÷ 总笔数',
    tone: rateToneClass(summary.value?.successRate)
  },
  {
    label: '成功 VND 金额',
    value: `${formatMoney(summary.value?.successVndAmount ?? 0)} VND`,
    tone: 'tone-primary'
  },
  {
    label: '平台币入账',
    value: formatMoney(summary.value?.successCreditAmount ?? 0)
  },
  {
    label: '充值手续费',
    value: formatMoney(summary.value?.feeAmount ?? 0),
    hint: '订单原币种汇总'
  },
  {
    label: '充值赠送',
    value: formatMoney(summary.value?.bonusAmount ?? 0),
    hint: '订单原币种汇总'
  },
  {
    label: '平均到账延时',
    value: formatLatency(summary.value?.avgLatencySeconds),
    hint: `最大 ${formatLatency(summary.value?.maxLatencySeconds)}`
  },
  {
    label: '成功充值人数',
    value: String(summary.value?.memberCount ?? 0),
    hint: `客单价 ${formatMoney(summary.value?.avgVndAmount ?? 0)} VND`
  }
]);

const loadRechargeReport = async () => {
  rechargeLoading.value = true;
  try {
    const query: FinanceStatQuery = { ...rechargeQuery };
    if (dateRange.value) {
      query.beginTime = dateRange.value[0];
      query.endTime = dateRange.value[1];
    }
    const res = await getRechargeStatReport(query);
    report.value = res.data;
  } finally {
    rechargeLoading.value = false;
  }
};

const handleGroupChange = () => {
  rechargeQuery.routeId = undefined;
};

const resetRechargeQuery = () => {
  rechargeQuery.merchantId = undefined;
  rechargeQuery.groupId = undefined;
  rechargeQuery.routeId = undefined;
  rechargeQuery.currency = undefined;
  dateRange.value = defaultRange();
  loadRechargeReport();
};

const formatRate = (value?: number) => `${Number(value ?? 0).toFixed(2)}%`;
const formatLatency = (value?: number) =>
  value === null || value === undefined ? '—' : `${Number(value).toFixed(2)} 秒`;
const rateTagType = (value?: number): 'success' | 'warning' | 'danger' => {
  if (Number(value ?? 0) >= 90) return 'success';
  if (Number(value ?? 0) >= 70) return 'warning';
  return 'danger';
};
const rateToneClass = (value?: number) => {
  if (Number(value ?? 0) >= 90) return 'tone-success';
  if (Number(value ?? 0) >= 70) return 'tone-warning';
  return 'tone-danger';
};
function defaultRange(): [string, string] {
  const end = new Date();
  end.setHours(23, 59, 59, 0);
  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return [formatLocalDateTime(start), formatLocalDateTime(end)];
}

function formatLocalDateTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
    + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

onMounted(loadRechargeReport);
</script>

<style scoped>
.stat-caption {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.8;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 12px 0;
}

.kpi-card {
  min-height: 108px;
}

.kpi-label {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.kpi-value {
  margin-top: 10px;
  color: var(--el-text-color-primary);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.kpi-hint {
  margin-top: 7px;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.tone-primary {
  color: var(--el-color-primary);
}

.tone-success {
  color: var(--el-color-success);
}

.tone-warning {
  color: var(--el-color-warning);
}

.tone-danger {
  color: var(--el-color-danger);
}

.cell-sub {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

@media (width <= 1200px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (width <= 720px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>
