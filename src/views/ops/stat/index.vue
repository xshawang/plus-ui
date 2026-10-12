<template>
  <div class="p-2 app-container ops-stat-page">
    <el-card shadow="hover" class="search-panel">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="日运营报表" name="daily" />
        <el-tab-pane label="会员总报表" name="memberTotal" />
        <el-tab-pane label="单个会员报表" name="memberSingle" />
        <el-tab-pane label="周活跃图表" name="activeWeek" />
        <el-tab-pane label="日活跃图表" name="activeDay" />
        <el-tab-pane label="投注图表" name="bet" />
        <el-tab-pane label="未登入会员分析" name="notLogin" />
        <el-tab-pane label="未充值会员分析" name="notRecharge" />
      </el-tabs>
      <el-form :inline="true" class="query-form">
        <el-form-item>
          <el-radio-group v-model="quickRange" @change="handleQuickRange">
            <el-radio-button label="day">日</el-radio-button>
            <el-radio-button label="week">周</el-radio-button>
            <el-radio-button label="month">月</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" range-separator="-" start-placeholder="开始" end-placeholder="结束" />
        </el-form-item>
        <el-form-item v-if="activeTab === 'memberSingle'" label="会员UID">
          <el-input v-model="uid" placeholder="请输入 uid" style="width: 160px" />
        </el-form-item>
        <template v-if="activeTab === 'memberTotal'">
          <el-form-item label="精准会员账号">
            <el-select v-model="queryParams.searchType" style="width: 140px">
              <el-option label="会员账号" value="account" />
              <el-option label="会员ID" value="uid" />
              <el-option label="上级代理" value="agent" />
            </el-select>
            <el-input v-model="queryParams.keyword" placeholder="请输入精准搜索值" clearable style="width: 180px; margin-left: 8px" />
          </el-form-item>
        </template>
        <el-form-item v-if="activeTab === 'memberTotal' || activeTab === 'memberSingle'" label="分类">
          <el-select v-model="queryParams.categories" multiple collapse-tags clearable placeholder="请选择分类" style="width: 260px">
            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="loadCurrent">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
        <el-form-item v-if="activeTab !== 'notLogin' && activeTab !== 'notRecharge'">
          <el-button v-hasPermi="['ops:stat:export']" type="success" plain icon="Download" @click="handleExport">导出报表</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 日运营报表 -->
    <el-card v-if="activeTab === 'daily'" shadow="hover" class="table-panel">
      <el-table v-loading="loading" border :data="tableRows" empty-text="暂无数据" max-height="560">
        <el-table-column v-for="col in dailyColumns" :key="col.prop" :label="col.label" :prop="col.prop" :min-width="col.width || 110" align="center" show-overflow-tooltip />
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="loadCurrent" />
    </el-card>

    <!-- 会员总报表：逐会员行 + 总计行（截图口径） -->
    <el-card v-else-if="activeTab === 'memberTotal' || activeTab === 'memberSingle'" shadow="hover" class="table-panel">
      <el-table v-loading="loading" border :data="memberRows" empty-text="暂无数据" max-height="560">
        <el-table-column v-for="col in memberColumns" :key="col.prop" :label="col.label" :prop="col.prop" :min-width="col.width || 110" align="center" show-overflow-tooltip />
      </el-table>
      <div class="total-row">
        <span class="total-label">总计</span>
        <span v-for="col in memberColumns" :key="'t-' + col.prop" class="total-cell">{{ fmtNum(memberFooter[col.prop]) }}</span>
      </div>
      <pagination v-show="memberTotal > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="memberTotal" @pagination="loadCurrent" />
    </el-card>

    <!-- 未登入 / 未充值会员分析（交叉表） -->
    <el-card v-else-if="activeTab === 'notLogin' || activeTab === 'notRecharge'" shadow="hover" class="table-panel">
      <el-table v-loading="loading" border :data="crossRows" empty-text="暂无数据" max-height="560">
        <el-table-column label="会员状态" prop="statusName" align="center" width="120" fixed="left" />
        <el-table-column v-for="bucket in currentBuckets" :key="bucket.key" :label="bucket.label" align="center" width="140">
          <template #header>
            <div>
              <span>{{ bucket.label }}</span>
              <el-tooltip :content="bucket.tip" placement="top">
                <el-icon class="ml-1"><QuestionFilled /></el-icon>
              </el-tooltip>
              <div>
                <el-button link type="primary" @click="handleBucketExport(bucket.key)">导出</el-button>
              </div>
            </div>
          </template>
          <template #default="scope">{{ fmtNum(scope.row[bucket.key]) }}</template>
        </el-table-column>
        <el-table-column label="总计" prop="total" align="center" width="120">
          <template #default="scope"><span class="font-bold">{{ fmtNum(scope.row.total) }}</span></template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 周活跃 / 日活跃：老会员（留存/流失） + 新会员（留存/充值/注册）双图；投注：有效投注 + 投注比 -->
    <el-card v-else shadow="hover" class="table-panel">
      <div v-if="activeTab === 'activeWeek' || activeTab === 'activeDay'" class="chart-row">
        <div ref="oldChartRef" class="chart-half"></div>
        <div ref="newChartRef" class="chart-half"></div>
      </div>
      <div v-else ref="chartRef" style="width: 100%; height: 320px"></div>
      <el-table v-loading="loading" border :data="chartRows" empty-text="暂无数据" max-height="360" class="mt-2">
        <el-table-column v-for="col in chartColumns" :key="col.prop" :label="col.label" :prop="col.prop" align="center" min-width="120" />
      </el-table>
    </el-card>

    <!-- 导出任务（创建 → 生成 → 下载） -->
    <el-card v-if="exportTasks.length" shadow="hover" class="table-panel mt-2">
      <template #header><span>导出任务</span></template>
      <el-table :data="exportTasks" border size="small">
        <el-table-column label="任务号" prop="taskNo" align="center" min-width="200" />
        <el-table-column label="类型" prop="bizType" align="center" width="120" />
        <el-table-column label="状态" align="center" width="100">
          <template #default="scope">{{ exportStatusText(scope.row.status) }}</template>
        </el-table-column>
        <el-table-column label="行数" prop="rowCount" align="center" width="90" />
        <el-table-column label="文件" align="center" min-width="220" show-overflow-tooltip>
          <template #default="scope">{{ scope.row.fileUrl || scope.row.failReason || '—' }}</template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createdAt" align="center" width="170" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup name="OpsStat" lang="ts">
import { computed, nextTick, onMounted, reactive, ref, toRefs, watch } from 'vue';
import * as echarts from 'echarts';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import {
  exportStat,
  exportMemberBucket,
  getActiveChart,
  getBetChartEnhanced,
  getDailyOperate,
  getMemberReportPage,
  getNotLoginAnalysis,
  getNotRechargeAnalysis,
  getStatCategories,
  listStatExportTasks
} from '@/api/ops/stat';
import type { StatExportTask, StatRow } from '@/api/ops/stat/types';

const { loading, withLoading } = useLoading(true);
const activeTab = ref('daily');
const quickRange = ref('day');
const dateRange = ref<string[]>([]);
const uid = ref<string>('');
const tableRows = ref<StatRow[]>([]);
const crossRows = ref<StatRow[]>([]);
const chartRows = ref<StatRow[]>([]);
const memberRows = ref<StatRow[]>([]);
const memberFooter = ref<StatRow>({});
const memberTotal = ref(0);
const categoryOptions = ref<Array<{ label: string; value: string }>>([]);
const exportTasks = ref<StatExportTask[]>([]);
const total = ref(0);
const chartRef = ref<HTMLElement>();
const oldChartRef = ref<HTMLElement>();
const newChartRef = ref<HTMLElement>();
let chart: echarts.ECharts | undefined;
let oldChart: echarts.ECharts | undefined;
let newChart: echarts.ECharts | undefined;

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  searchType: 'account',
  keyword: '',
  categories: [] as string[]
});

/** 日运营报表列（与后端 dailyOperate 字段一一对应；比率为服务端计算值） */
const dailyColumns = [
  { label: '日期', prop: 'statDate', width: 110 },
  { label: '注册', prop: 'registerCount' },
  { label: '登入', prop: 'loginCount' },
  { label: '首充人数', prop: 'firstRechargeCount' },
  { label: '充值总额', prop: 'rechargeAmount', width: 130 },
  { label: '充值人数', prop: 'rechargeUserCount' },
  { label: '充值次数', prop: 'rechargeCount' },
  { label: '提现总额', prop: 'withdrawAmount', width: 130 },
  { label: '提现人数', prop: 'withdrawUserCount' },
  { label: '提现次数', prop: 'withdrawCount' },
  { label: '充提差额', prop: 'chargeWithdrawDiff', width: 130 },
  { label: '投注额', prop: 'betAmount', width: 130 },
  { label: '投注人数', prop: 'betUserCount' },
  { label: '损益', prop: 'profit', width: 130 },
  { label: '杀率', prop: 'killRate' },
  { label: '大R玩家', prop: 'bigPlayerCount' },
  { label: '未首充投注人数', prop: 'noRechargeBetUserCount', width: 140 },
  { label: '访问量', prop: 'visitorCount' }
];

/** 会员总报表 / 单个会员报表列（与后端 member-report/page 字段一一对应） */
const memberColumns = [
  { label: '币种', prop: 'currency' },
  { label: '会员账号', prop: 'account', width: 120 },
  { label: '会员ID', prop: 'uid', width: 120 },
  { label: '上级代理', prop: 'parentAgent', width: 110 },
  { label: '会员层级', prop: 'clubLevel', width: 100 },
  { label: 'VIP等级', prop: 'vipLevel', width: 90 },
  { label: '姓名', prop: 'nickName', width: 110 },
  { label: '注册来源', prop: 'registerSource', width: 110 },
  { label: '登录次数', prop: 'loginCount', width: 100 },
  { label: '充值次数', prop: 'rechargeCount', width: 100 },
  { label: '充值天数', prop: 'rechargeDays', width: 100 },
  { label: '充值金额', prop: 'rechargeAmount', width: 120 },
  { label: '提现次数', prop: 'withdrawCount', width: 100 },
  { label: '提现金额', prop: 'withdrawAmount', width: 120 },
  { label: '充提差额', prop: 'chargeWithdrawDiff', width: 120 },
  { label: '手动加款', prop: 'manualCredit', width: 110 },
  { label: '手动扣除', prop: 'manualDebit', width: 110 },
  { label: '注单数量', prop: 'betCount', width: 110 },
  { label: '投注金额', prop: 'betAmount', width: 120 }
];

const currentBuckets = computed(() =>
  activeTab.value === 'notLogin'
    ? [
        { key: 'd0_7', label: '0-7天', tip: '未登录天数达 0 天且未满 7 天的会员' },
        { key: 'd7_14', label: '7-14天', tip: '未登录天数达 7 天且未满 14 天的会员' },
        { key: 'd14_30', label: '14-30天', tip: '未登录天数达 14 天且未满 30 天的会员' },
        { key: 'd30_90', label: '30-90天', tip: '未登录天数达 30 天且未满 90 天的会员' },
        { key: 'd90_180', label: '90-180天', tip: '未登录天数达 90 天且未满 180 天的会员' },
        { key: 'd180', label: '>180天', tip: '未登录天数超过 180 天的会员' },
        { key: 'never', label: '从未登录', tip: '从未登录过的会员' }
      ]
    : [
        { key: 'd0_7', label: '0-7天', tip: '未充值天数达 0 天且未满 7 天的会员' },
        { key: 'd7_14', label: '7-14天', tip: '未充值天数达 7 天且未满 14 天的会员' },
        { key: 'd14_30', label: '14-30天', tip: '未充值天数达 14 天且未满 30 天的会员' },
        { key: 'd30_90', label: '30-90天', tip: '未充值天数达 30 天且未满 90 天的会员' },
        { key: 'd90_180', label: '90-180天', tip: '未充值天数达 90 天且未满 180 天的会员' },
        { key: 'd180', label: '>180天', tip: '未充值天数超过 180 天的会员' }
      ]
);

const chartColumns = computed(() => {
  if (activeTab.value === 'bet') {
    return [
      { label: '日期', prop: 'statDate' },
      { label: '有效投注', prop: 'validBetAmount' },
      { label: '充值总额', prop: 'rechargeAmount' },
      { label: '投注人数', prop: 'betUserCount' },
      { label: '投注比', prop: 'betRatio' }
    ];
  }
  return [
    { label: activeTab.value === 'activeWeek' ? '周区间' : '日期', prop: 'label' },
    { label: '老会员-留存人数', prop: 'oldRetained' },
    { label: '老会员-流失人数', prop: 'oldLost' },
    { label: '新会员-注册人数', prop: 'newRegistered' },
    { label: '新会员-充值人数', prop: 'newRecharged' },
    { label: '新会员-留存人数', prop: 'newRetained' }
  ];
});

const fmtNum = (value: any) => (value === null || value === undefined || value === '' ? '—' : String(value));
const exportStatusText = (status?: number) =>
  status === 0 ? '待生成' : status === 1 ? '生成中' : status === 2 ? '已完成' : status === 3 ? '失败' : '—';

const rangeParams = () => ({
  startDate: dateRange.value?.[0],
  endDate: dateRange.value?.[1]
});

/** 统一取数：按当前页签调用对应接口，异常提示不留白屏 */
const loadCurrent = async () => {
  try {
    await withLoading(async () => {
      const range = rangeParams();
      if (activeTab.value === 'daily') {
        const res = await getDailyOperate({ ...range, ...queryParams });
        tableRows.value = res.data?.rows || [];
        total.value = res.data?.total || 0;
      } else if (activeTab.value === 'memberSingle') {
        if (!uid.value) {
          tableRows.value = [];
          total.value = 0;
          return;
        }
        const res = await getMemberReportPage({
          ...range,
          searchType: 'uid',
          keyword: uid.value,
          categories: queryParams.categories,
          pageNum: queryParams.pageNum,
          pageSize: queryParams.pageSize
        });
        memberRows.value = res.data?.rows || [];
        memberFooter.value = res.data?.footer || {};
        memberTotal.value = res.data?.total || 0;
      } else if (activeTab.value === 'memberTotal') {
        const res = await getMemberReportPage({
          ...range,
          searchType: queryParams.searchType,
          keyword: queryParams.keyword,
          categories: queryParams.categories,
          pageNum: queryParams.pageNum,
          pageSize: queryParams.pageSize
        });
        memberRows.value = res.data?.rows || [];
        memberFooter.value = res.data?.footer || {};
        memberTotal.value = res.data?.total || 0;
      } else if (activeTab.value === 'notLogin') {
        const res = await getNotLoginAnalysis();
        crossRows.value = res.data || [];
      } else if (activeTab.value === 'notRecharge') {
        const res = await getNotRechargeAnalysis();
        crossRows.value = res.data || [];
      } else if (activeTab.value === 'activeWeek') {
        const res = await getActiveChart({ ...range, granularity: 'week' });
        chartRows.value = res.data || [];
        await renderActiveCharts();
      } else if (activeTab.value === 'activeDay') {
        const res = await getActiveChart({ ...range, granularity: 'day' });
        chartRows.value = res.data || [];
        await renderActiveCharts();
      } else {
        const res = await getBetChartEnhanced(range);
        chartRows.value = res.data || [];
        await renderBetChart();
      }
    });
  } catch (error) {
    modal.msgError('统计数据加载失败，请检查日期区间或稍后重试');
  }
};

/** 老会员（留存/流失）与新会员（注册/充值/留存）两张分色柱图（截图左右并排，Y 轴量级不同不共用轴） */
const renderActiveCharts = async () => {
  await nextTick();
  const xAxis = chartRows.value.map((row: StatRow) => String(row.label || row.bucketStart || ''));
  if (oldChartRef.value) {
    oldChart = oldChart || echarts.init(oldChartRef.value);
    oldChart.setOption(
      {
        title: { text: '老会员', left: 'center', textStyle: { fontSize: 13 } },
        tooltip: { trigger: 'axis' },
        legend: { data: ['老会员-留存人数', '老会员-流失人数'], top: 24 },
        grid: { left: 60, right: 20, top: 60, bottom: 40 },
        xAxis: { type: 'category', data: xAxis },
        yAxis: { type: 'value' },
        series: [
          { name: '老会员-留存人数', type: 'bar', stack: 'old', data: chartRows.value.map((row: StatRow) => Number(row.oldRetained || 0)) },
          { name: '老会员-流失人数', type: 'bar', stack: 'old', data: chartRows.value.map((row: StatRow) => Number(row.oldLost || 0)) }
        ]
      },
      true
    );
  }
  if (newChartRef.value) {
    newChart = newChart || echarts.init(newChartRef.value);
    newChart.setOption(
      {
        title: { text: '新会员', left: 'center', textStyle: { fontSize: 13 } },
        tooltip: { trigger: 'axis' },
        legend: { data: ['新会员-留存人数', '新会员-充值人数', '新会员-注册人数'], top: 24 },
        grid: { left: 60, right: 20, top: 60, bottom: 40 },
        xAxis: { type: 'category', data: xAxis },
        yAxis: { type: 'value' },
        series: [
          { name: '新会员-留存人数', type: 'bar', stack: 'new', data: chartRows.value.map((row: StatRow) => Number(row.newRetained || 0)) },
          { name: '新会员-充值人数', type: 'bar', stack: 'new', data: chartRows.value.map((row: StatRow) => Number(row.newRecharged || 0)) },
          { name: '新会员-注册人数', type: 'bar', stack: 'new', data: chartRows.value.map((row: StatRow) => Number(row.newRegistered || 0)) }
        ]
      },
      true
    );
  }
};

/** 投注图表：柱=有效投注（左轴），折线=投注比（右轴） */
const renderBetChart = async () => {
  await nextTick();
  if (!chartRef.value) {
    return;
  }
  chart = chart || echarts.init(chartRef.value);
  const xAxis = chartRows.value.map((row: StatRow) => String(row.statDate || ''));
  chart.setOption(
    {
      tooltip: { trigger: 'axis' },
      legend: { data: ['有效投注', '投注比'] },
      grid: { left: 70, right: 50, top: 40, bottom: 40 },
      xAxis: { type: 'category', data: xAxis },
      yAxis: [
        { type: 'value', name: '有效投注' },
        { type: 'value', name: '投注比', splitLine: { show: false } }
      ],
      series: [
        { name: '有效投注', type: 'bar', data: chartRows.value.map((row: StatRow) => Number(row.validBetAmount || 0)) },
        { name: '投注比', type: 'line', smooth: true, yAxisIndex: 1, data: chartRows.value.map((row: StatRow) => Number(row.betRatio || 0)) }
      ]
    },
    true
  );
};

const pad = (num: number) => String(num).padStart(2, '0');
const dayText = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** 日/周/月快捷：切换后自动重置起止日期并重新取数 */
const handleQuickRange = () => {
  const now = new Date();
  if (quickRange.value === 'week') {
    const day = now.getDay() === 0 ? 7 : now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day + 1);
    dateRange.value = [dayText(start), dayText(now)];
  } else if (quickRange.value === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    dateRange.value = [dayText(start), dayText(now)];
  } else {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    dateRange.value = [dayText(start), dayText(now)];
  }
  queryParams.pageNum = 1;
  loadCurrent();
};

/** 未登入/未充值分析：分桶「导出」→ 创建报表中心导出任务（在「报表 → 导出下载」下载） */
const handleBucketExport = async (bucket: string) => {
  const type = activeTab.value === 'notLogin' ? 'not_login' : 'not_recharge';
  const res = await exportMemberBucket(type, bucket);
  modal.msgSuccess(`分桶导出任务已创建（任务号 ${res.data?.taskNo || ''}），请到「报表 → 导出下载」下载`);
};

const handleTabChange = () => {
  queryParams.pageNum = 1;
  tableRows.value = [];
  crossRows.value = [];
  chartRows.value = [];
  loadCurrent();
  if (activeTab.value === 'daily' || activeTab.value === 'memberSingle') {
    loadExportTasks();
  }
};

const resetQuery = () => {
  dateRange.value = [];
  uid.value = '';
  queryParams.keyword = '';
  queryParams.searchType = 'account';
  queryParams.categories = [];
  handleTabChange();
};

const handleExport = async () => {
  const bizTypeMap: Record<string, string> = {
    daily: 'stat_daily',
    memberSingle: 'member_single',
    memberTotal: 'stat_daily',
    activeWeek: 'stat_daily',
    activeDay: 'stat_daily',
    bet: 'bet'
  };
  const bizType = bizTypeMap[activeTab.value] || 'stat_daily';
  try {
    const res = await exportStat({ bizType, ...rangeParams(), uid: uid.value ? Number(uid.value) : undefined });
    const fileUrl = res.data?.fileUrl;
    modal.msgSuccess(fileUrl ? `导出完成：${fileUrl}` : '导出任务已创建');
    loadExportTasks();
  } catch (error) {
    modal.msgError('导出失败，请缩小日期区间后重试');
  }
};

const loadExportTasks = async () => {
  try {
    const res = await listStatExportTasks({ pageNum: 1, pageSize: 5 });
    exportTasks.value = res.data?.rows || [];
  } catch (error) {
    exportTasks.value = [];
  }
};

watch(activeTab, () => {
  if (chart) {
    chart.dispose();
    chart = undefined;
  }
  if (oldChart) {
    oldChart.dispose();
    oldChart = undefined;
  }
  if (newChart) {
    newChart.dispose();
    newChart = undefined;
  }
});

onMounted(async () => {
  const res = await getStatCategories();
  categoryOptions.value = (res.data || []).map((item: StatRow) => ({ label: String(item.label), value: String(item.value) }));
  loadCurrent();
  loadExportTasks();
});
</script>

<style scoped>
.font-bold {
  font-weight: 600;
}

.total-row {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid var(--el-border-color);
  border-top: none;
  padding: 8px 0;
  font-weight: 600;
}

.total-label {
  min-width: 110px;
  text-align: center;
}

.total-cell {
  flex: 1;
  text-align: center;
  min-width: 110px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chart-row {
  display: flex;
  gap: 12px;
}

.chart-half {
  flex: 1;
  height: 320px;
}
</style>
