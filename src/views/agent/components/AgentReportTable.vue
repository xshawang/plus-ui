<template>
  <div class="agent-report-table">
    <el-form :inline="true" class="query-form">
      <el-form-item :label="dateLabel || '日期'">
        <el-date-picker
          v-model="range"
          type="daterange"
          value-format="YYYY-MM-DD"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :clearable="false"
          style="width: 250px"
        />
      </el-form-item>
      <el-form-item v-if="showScope">
        <el-radio-group v-model="scope">
          <el-radio-button :value="5">全部下级</el-radio-button>
          <el-radio-button :value="1">直属</el-radio-button>
          <el-radio-button :value="2">其他</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="showAccounts !== false">
        <el-input v-model="accounts" placeholder="代理账号（支持批量，逗号或空格分隔）" clearable style="width: 260px" @keyup.enter="search" />
      </el-form-item>
      <el-form-item v-if="showLineType">
        <el-select v-model="lineType" placeholder="全部代理类型" clearable style="width: 150px">
          <el-option label="人人代理" :value="1" />
          <el-option label="专业代理" :value="2" />
        </el-select>
      </el-form-item>
      <slot name="filters" :params="extra" />
      <el-form-item>
        <el-button type="primary" icon="Search" @click="search">搜索</el-button>
        <el-button icon="Refresh" @click="reset">重置</el-button>
        <el-button v-hasPermi="['agent:report:export']" icon="Download" @click="doExport">导出</el-button>
      </el-form-item>
    </el-form>

    <el-table
      v-loading="loading"
      border
      :data="rows"
      empty-text="暂无数据"
      show-summary
      :summary-method="pageSummary"
      @sort-change="onSort"
    >
      <template v-for="col in columns" :key="col.prop + col.label">
        <el-table-column
          :label="col.label"
          :prop="col.prop"
          align="center"
          :min-width="col.width || (col.kind === 'text' ? 130 : 110)"
          :sortable="col.sortable ? 'custom' : false"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <el-link v-if="drill && col.prop === drill" type="primary" @click="emit('drill', row)">{{ show(col, row) }}</el-link>
            <span v-else :class="cls(col, row)">{{ show(col, row) }}</span>
          </template>
        </el-table-column>
      </template>
    </el-table>

    <div class="summary-bar">
      <span class="summary-label">总计</span>
      <template v-if="totals">
        <span v-for="col in sumCols" :key="'t' + col.prop">{{ col.label }}：{{ fmt(col, totals[col.prop]) }}</span>
        <span>行数：{{ totals.rowCount }}</span>
      </template>
      <el-button v-else link type="primary" @click="loadTotals">点击计算总计</el-button>
    </div>

    <pagination v-show="total > 0" v-model:page="pageNum" v-model:limit="pageSize" :total="total" @pagination="load" />
  </div>
</template>

<script setup name="AgentReportTable" lang="ts">
import { computed, onMounted, ref } from 'vue';
import modal from '@/plugins/modal';
import { saveBlob } from '@/utils/save';
import { exportReport, getReportSummary, listReport } from '@/api/agent/refactor';
import type { ReportCol } from './reportColumns';

/**
 * 代理报表通用表格：日期区间 + 账号批量 + 范围（直属/其他/全部下级）+ 分页 + 当前页小计 + 全量总计 + 导出。
 * 列 kind：money 接口原值金额 / num 数值 / pct 百分比(0~100) / rate 返佣比例 / text 文本 / map 字典映射。
 * 配色：对平台有利为红、不利为绿（winLoss 为会员视角，负数=平台盈利=红）。
 */

const props = defineProps<{
  code: string;
  columns: ReportCol[];
  dateLabel?: string;
  showScope?: boolean;
  showAccounts?: boolean;
  /** 是否展示代理线筛选；要求底层 SQL 已带 agent_account 别名 a */
  showLineType?: boolean;
  drill?: string;
  params?: Record<string, any>;
}>();

const emit = defineEmits<{ drill: [row: any] }>();

const pad = (v: number) => String(v).padStart(2, '0');
const day = (offset: number) => {
  const d = new Date(Date.now() + offset * 86400000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const defaultRange = (): [string, string] => [day(-7), day(-1)];

const range = ref<[string, string]>(defaultRange());
const scope = ref(5);
const accounts = ref('');
const lineType = ref<number | undefined>();
const extra = ref<Record<string, any>>({});
const rows = ref<any[]>([]);
const total = ref(0);
const pageNum = ref(1);
const pageSize = ref(50);
const loading = ref(false);
const totals = ref<Record<string, any> | null>(null);
const sort = ref<{ sortField?: string; sortOrder?: string }>({});

const sumCols = computed(() => props.columns.filter((c) => (c.kind === 'money' || c.kind === 'num') && !c.noSum));

const buildParams = () => ({
  beginDate: range.value?.[0],
  endDate: range.value?.[1],
  accounts: accounts.value || undefined,
  lineType: props.showLineType ? lineType.value : undefined,
  scope: props.showScope ? scope.value : undefined,
  ...sort.value,
  ...props.params,
  ...extra.value
});

const load = async () => {
  loading.value = true;
  try {
    const res: any = await listReport(props.code, { ...buildParams(), pageNum: pageNum.value, pageSize: pageSize.value });
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
  totals.value = null;
  load();
};

const reset = () => {
  range.value = defaultRange();
  scope.value = 5;
  accounts.value = '';
  lineType.value = undefined;
  extra.value = {};
  sort.value = {};
  search();
};

const loadTotals = async () => {
  try {
    const res: any = await getReportSummary(props.code, buildParams());
    totals.value = res?.data ?? {};
  } catch {
    totals.value = null;
  }
};

const doExport = async () => {
  try {
    const blob: any = await exportReport(props.code, buildParams());
    saveBlob(blob, `代理报表_${props.code}_${Date.now()}.csv`);
  } catch {
    modal.msgError('导出失败，请稍后重试');
  }
};

const onSort = ({ prop, order }: { prop: string; order: string | null }) => {
  sort.value = order ? { sortField: prop, sortOrder: order === 'ascending' ? 'asc' : 'desc' } : {};
  search();
};

const get = (row: any, prop: string) => prop.split('.').reduce((o: any, k) => (o == null ? undefined : o[k]), row);

const fmt = (col: ReportCol, v: any) => {
  if (v === null || v === undefined || v === '') {
    return col.kind === 'text' || col.kind === 'map' ? '—' : col.kind === 'money' ? '0.00' : '0';
  }
  switch (col.kind) {
    case 'money':
      return String(v);
    case 'pct':
      return `${Number(v).toFixed(2)}%`;
    case 'rate':
      return `${Number(v).toFixed(2)}%`;
    case 'map':
      return col.map?.[String(v)] ?? String(v);
    case 'num':
      return Number(v).toLocaleString('zh-CN');
    default:
      return String(v);
  }
};

const show = (col: ReportCol, row: any) => (col.format ? col.format(row) : fmt(col, get(row, col.prop)));

const cls = (col: ReportCol, row: any) => {
  if (!col.platformWin) {
    return '';
  }
  const v = Number(get(row, col.prop) ?? 0);
  return v < 0 ? 'win-platform' : v > 0 ? 'lose-platform' : '';
};

/** 当前页小计（金额/数值列） */
const pageSummary = ({ columns }: { columns: any[] }) =>
  columns.map((c: any, i: number) => {
    if (i === 0) {
      return '小计';
    }
    const col = props.columns.find((x) => x.prop === c.property);
    if (!col || col.noSum || (col.kind !== 'money' && col.kind !== 'num')) {
      return '';
    }
    const s = rows.value.reduce((acc, r) => acc + Number(get(r, col.prop) ?? 0), 0);
    return fmt(col, s);
  });

defineExpose({ reload: search });

onMounted(load);
</script>

<style scoped>
.query-form {
  margin-bottom: 4px;
}

.summary-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
  margin-top: 10px;
  padding: 8px 12px;
  background: #fafafa;
  border: 1px solid #ebeef5;
  font-size: 13px;
}

.summary-label {
  font-weight: 600;
}

.win-platform {
  color: #f56c6c;
}

.lose-platform {
  color: #67c23a;
}
</style>
