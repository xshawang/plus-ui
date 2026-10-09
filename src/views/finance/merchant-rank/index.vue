<template>
  <div class="p-2 app-container finance-merchant-rank-page">
    <el-card shadow="hover" class="search-panel">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="可用三方支付" name="PAY" />
        <el-tab-pane label="可用三方代付" name="PAYOUT" />
        <el-tab-pane name="RISK">
          <template #label>
            <span>跑路高风险三方<el-badge v-if="riskCount > 0" :value="riskCount" type="danger" class="ml-1" /></span>
          </template>
        </el-tab-pane>
      </el-tabs>
      <el-form :inline="true" class="query-form">
        <el-form-item label="币种">
          <el-select v-model="query.currency" placeholder="币种" clearable style="width: 130px">
            <el-option v-for="item in options.currencies" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="检索维度">
          <el-select v-model="query.dimension" style="width: 160px">
            <el-option v-for="item in options.dimensions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="query.keyword"
            :placeholder="`请输入${currentDimensionLabel}`"
            clearable
            style="width: 240px"
            @keyup.enter="getList"
          />
        </el-form-item>
        <el-form-item label="支持功能">
          <el-select v-model="query.supportFunc" placeholder="支持功能" clearable style="width: 130px">
            <el-option v-for="item in options.supportFuncs" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="getList">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
        <el-form-item>
          <el-link type="primary" :underline="false" @click="showTutorial">操作教程</el-link>
        </el-form-item>
      </el-form>
      <div class="text-gray-400 text-sm">
        口径：昨日指标取昨日自然日（00:00:00~23:59:59）；成功率 = 成功笔数 ÷ 发起总笔数；
        平均入款时间 = 成功订单「三方回调 - 下单」的平均耗时；指标由 payment_order(type=1) 按通道实时聚合，单位「分」，本页只读。
      </div>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>{{ tabTitle }}</h3>
            <p>共 {{ total }} 条 · 更新日期 {{ updateAt || '-' }}</p>
          </div>
          <div class="toolbar-actions">
            <el-popover placement="bottom-end" :width="260" trigger="click">
              <template #reference>
                <el-button icon="Setting">列设置</el-button>
              </template>
              <el-checkbox-group v-model="visibleColumns" @change="persistColumns">
                <el-checkbox v-for="column in columnDefs" :key="column.prop" :value="column.prop" class="mr-3">
                  {{ column.label }}
                </el-checkbox>
              </el-checkbox-group>
            </el-popover>
            <el-button icon="Download" @click="doExport">导出</el-button>
            <el-button icon="Refresh" @click="getList">刷新</el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" border :data="rows" @sort-change="handleSortChange">
        <el-table-column
          v-if="showColumn('accessAt')"
          label="接入时间"
          prop="accessAt"
          align="center"
          width="180"
          sortable="custom"
          show-overflow-tooltip
        />
        <el-table-column v-if="showColumn('currency')" label="币种" prop="currency" align="center" width="90" />
        <el-table-column v-if="showColumn('merchantCode')" label="三方ID" prop="merchantCode" align="center" min-width="150" show-overflow-tooltip />
        <el-table-column v-if="showColumn('merchantName')" label="三方支付名称" align="left" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="showDetail(row as MerchantRankVO)">
              {{ (row as MerchantRankVO).merchantName }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column v-if="activeTab === 'RISK' && showColumn('supportFunc')" label="支持功能" prop="supportFunc" align="center" width="100" />
        <el-table-column
          v-if="showColumn('depositDesc')"
          label="缴纳保证金"
          prop="depositDesc"
          align="center"
          width="150"
          sortable="custom"
          show-overflow-tooltip
        />
        <el-table-column v-if="showColumn('contactInfo')" label="联系方式" prop="contactInfo" align="left" min-width="190" show-overflow-tooltip />
        <el-table-column
          v-if="activeTab !== 'RISK' && showColumn('feeRate')"
          label="三方费率"
          prop="feeRate"
          align="right"
          width="110"
          sortable="custom"
        />
        <el-table-column
          v-if="activeTab !== 'RISK' && showColumn('ydCount')"
          label="昨日充值次数"
          prop="ydCount"
          align="right"
          width="130"
          sortable="custom"
        />
        <el-table-column
          v-if="activeTab !== 'RISK' && showColumn('totalCount')"
          label="累计充值次数"
          prop="totalCount"
          align="right"
          width="130"
          sortable="custom"
        />
        <el-table-column
          v-if="activeTab !== 'RISK' && showColumn('ydAmount')"
          label="昨日充值金额"
          prop="ydAmount"
          align="right"
          width="180"
          sortable="custom"
          :formatter="moneyColumnFormatter"
        />
        <el-table-column
          v-if="activeTab !== 'RISK' && showColumn('successAmount')"
          label="累计充值金额"
          prop="successAmount"
          align="right"
          width="190"
          sortable="custom"
          :formatter="moneyColumnFormatter"
        />
        <el-table-column
          v-if="activeTab !== 'RISK' && showColumn('successRate')"
          label="充值总成功率"
          prop="successRate"
          align="right"
          width="140"
          sortable="custom"
        >
          <template #default="{ row }">{{ rateText((row as MerchantRankVO).successRate) }}</template>
        </el-table-column>
        <el-table-column
          v-if="activeTab !== 'RISK' && showColumn('ydSuccessRate')"
          label="昨日充值成功率"
          prop="ydSuccessRate"
          align="right"
          width="150"
          sortable="custom"
        >
          <template #default="{ row }">{{ rateText((row as MerchantRankVO).ydSuccessRate) }}</template>
        </el-table-column>
        <el-table-column
          v-if="activeTab !== 'RISK' && showColumn('avgSeconds')"
          label="总平均入款时间"
          prop="avgSeconds"
          align="center"
          width="150"
          sortable="custom"
        >
          <template #default="{ row }">{{ durationText((row as MerchantRankVO).avgSeconds) }}</template>
        </el-table-column>
        <el-table-column
          v-if="activeTab !== 'RISK' && showColumn('ydAvgSeconds')"
          label="昨日平均入款时间"
          prop="ydAvgSeconds"
          align="center"
          width="160"
          sortable="custom"
        >
          <template #default="{ row }">{{ durationText((row as MerchantRankVO).ydAvgSeconds) }}</template>
        </el-table-column>
        <el-table-column v-if="activeTab !== 'RISK' && showColumn('updateAt')" label="更新日期" prop="updateAt" align="center" width="180" show-overflow-tooltip />
        <el-table-column
          v-if="activeTab === 'RISK' && showColumn('disableReason')"
          label="停用原因"
          prop="disableReason"
          align="left"
          min-width="260"
          show-overflow-tooltip
        >
          <template #header>
            <span class="risk-header">停用原因</span>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-model:page="query.pageNum"
        v-model:limit="query.pageSize"
        :page-sizes="[20, 50, 100]"
        :total="total"
        @pagination="getList"
      />
    </el-card>
  </div>
</template>

<script setup name="FinanceMerchantRank" lang="ts">
import { computed, reactive, ref } from 'vue';
import { ElMessageBox } from 'element-plus';
import modal from '@/plugins/modal';
import { getMerchantRankOptions, listMerchantRank } from '@/api/finance/merchant-rank';
import type { MerchantRankOptions, MerchantRankQuery, MerchantRankTab, MerchantRankVO } from '@/api/finance/merchant-rank';
import { exportCsv, type CsvColumn } from '../components/csvExport';
import { moneyColumnFormatter } from '@/utils/money';

/**
 * 三方支付排名页（需求文档 2_财务/08 的三方支付排名部分）。
 *
 * 三个页签共用一张表：可用三方支付/可用三方代付展示经营指标，跑路高风险三方展示"停用原因"；
 * 指标由后端实时聚合（payment_order type=1），本页只读；列显隐持久化在浏览器本地。
 */
const COLUMN_STORAGE_KEY = 'finance.merchant-rank.columns';

interface ColumnDef {
  label: string;
  prop: string;
}

const columnDefs: ColumnDef[] = [
  { label: '接入时间', prop: 'accessAt' },
  { label: '币种', prop: 'currency' },
  { label: '三方ID', prop: 'merchantCode' },
  { label: '三方支付名称', prop: 'merchantName' },
  { label: '支持功能', prop: 'supportFunc' },
  { label: '缴纳保证金', prop: 'depositDesc' },
  { label: '联系方式', prop: 'contactInfo' },
  { label: '三方费率', prop: 'feeRate' },
  { label: '昨日充值次数', prop: 'ydCount' },
  { label: '累计充值次数', prop: 'totalCount' },
  { label: '昨日充值金额', prop: 'ydAmount' },
  { label: '累计充值金额', prop: 'successAmount' },
  { label: '充值总成功率', prop: 'successRate' },
  { label: '昨日充值成功率', prop: 'ydSuccessRate' },
  { label: '总平均入款时间', prop: 'avgSeconds' },
  { label: '昨日平均入款时间', prop: 'ydAvgSeconds' },
  { label: '更新日期', prop: 'updateAt' },
  { label: '停用原因', prop: 'disableReason' }
];

const loading = ref(false);
const rows = ref<MerchantRankVO[]>([]);
const total = ref(0);
const updateAt = ref('');
const activeTab = ref<MerchantRankTab>('PAY');
const options = ref<MerchantRankOptions>({
  currencies: [],
  supportFuncs: ['支付', '代付'],
  riskCount: 0,
  riskByCurrency: [],
  dimensions: [
    { label: '三方支付名称', value: 'name' },
    { label: '三方ID', value: 'id' },
    { label: '三方回调IP', value: 'callbackIp' },
    { label: '下单地址', value: 'orderUrl' },
    { label: '查询地址', value: 'queryUrl' },
    { label: '联系方式', value: 'contact' }
  ]
});

const query = reactive<MerchantRankQuery>({
  tab: 'PAY',
  currency: undefined,
  supportFunc: undefined,
  dimension: 'name',
  keyword: '',
  orderBy: undefined,
  orderDir: 'desc',
  pageNum: 1,
  pageSize: 100
});

const visibleColumns = ref<string[]>(restoreColumns());

const riskCount = computed(() => options.value.riskCount ?? 0);
const tabTitle = computed(() =>
  activeTab.value === 'PAY' ? '可用三方支付' : activeTab.value === 'PAYOUT' ? '可用三方代付' : '跑路高风险三方'
);
const currentDimensionLabel = computed(
  () => options.value.dimensions.find((item) => item.value === query.dimension)?.label ?? '三方支付名称'
);

function restoreColumns(): string[] {
  const fallback = columnDefs.map((column) => column.prop);
  try {
    const raw = localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!raw) {
      return fallback;
    }
    const saved = JSON.parse(raw) as string[];
    const valid = fallback.filter((prop) => saved.includes(prop));
    // 至少保留"三方ID + 名称"，避免用户把所有列都关掉后表格为空
    return valid.length > 0 ? valid : fallback;
  } catch {
    return fallback;
  }
}

function persistColumns() {
  localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(visibleColumns.value));
}

const showColumn = (prop: string) => visibleColumns.value.includes(prop);

/** 成功率展示：无数据时显示 0% */
function rateText(rate?: number) {
  if (rate === null || rate === undefined) {
    return '0%';
  }
  return `${Number(rate).toFixed(2)}%`;
}

/** 平均入款时间展示：秒 → 「26秒」/「1分44秒」 */
function durationText(seconds?: number) {
  if (seconds === null || seconds === undefined) {
    return '-';
  }
  const total = Math.round(Number(seconds));
  if (total < 60) {
    return `${total}秒`;
  }
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${minutes}分` : `${minutes}分${rest}秒`;
}

const loadOptions = async () => {
  const res = await getMerchantRankOptions();
  if (res.data) {
    options.value = res.data;
  }
};

const getList = async () => {
  loading.value = true;
  try {
    query.tab = activeTab.value;
    const res = await listMerchantRank(query);
    rows.value = res.data?.rows ?? [];
    total.value = res.data?.total ?? 0;
    updateAt.value = rows.value.length > 0 ? rows.value[0].updateAt ?? '' : '';
  } finally {
    loading.value = false;
  }
};

const resetQuery = () => {
  query.currency = undefined;
  query.supportFunc = undefined;
  query.dimension = 'name';
  query.keyword = '';
  query.orderBy = undefined;
  query.orderDir = 'desc';
  query.pageNum = 1;
  query.pageSize = 100;
  getList();
};

const handleTabChange = () => {
  query.pageNum = 1;
  // 页签切换时清掉默认排序，走各页签的默认排序口径（支付按累计金额、风险按接入时间）
  query.orderBy = undefined;
  getList();
};

const handleSortChange = ({ prop, order }: { prop: string; order: string | null }) => {
  if (!prop || !order) {
    query.orderBy = undefined;
    query.orderDir = 'desc';
  } else {
    query.orderBy = prop;
    query.orderDir = order === 'ascending' ? 'asc' : 'desc';
  }
  getList();
};

const showDetail = (row: MerchantRankVO) => {
  modal.alert(
    `三方支付名称：${row.merchantName}\n三方ID：${row.merchantCode}\n币种：${row.currency ?? '-'}\n`
      + `支持功能：${row.supportFunc ?? '-'}\n接入时间：${row.accessAt ?? '-'}\n`
      + `缴纳保证金：${row.depositDesc || '-'}\n联系方式：${row.contactInfo || '-'}\n`
      + `三方费率：${row.feeRate ?? 0}\n状态：${row.status === 1 ? '启用' : '停用'}（风险等级 ${row.riskLevel ?? '-'}）\n`
      + `停用原因：${row.disableReason || '-'}\n回调IP：${row.callbackIp || '-'}\n下单地址：${row.orderUrl || '-'}\n查询地址：${row.queryUrl || '-'}`
  );
};

const showTutorial = () => {
  ElMessageBox.alert(
    '1) 昨日指标：昨日 00:00:00~23:59:59 的成功充值笔数与金额；\n'
      + '2) 充值总成功率 = 累计成功笔数 ÷ 累计发起笔数 × 100%；\n'
      + '3) 平均入款时间 = 成功订单「三方回调时间 − 下单时间」的平均值；\n'
      + '4) 跑路高风险三方页签 = 已停用或标记高风险的商户，展示停用原因；\n'
      + '5) 指标由 payment_order(type=1) 按通道编码实时聚合，点「刷新」可重新计算。',
    '三方支付排名 · 操作教程'
  );
};

const doExport = () => {
  const columns: CsvColumn[] = columnDefs
    .filter((column) => showColumn(column.prop))
    .map((column) => ({ label: column.label, prop: column.prop }));
  exportCsv(`merchant-rank-${activeTab.value}-${Date.now()}.csv`,
    rows.value as unknown as Array<Record<string, unknown>>, columns);
};

loadOptions();
getList();
</script>

<style scoped>
.risk-header {
  color: #f56c6c;
  font-weight: 600;
}
</style>
