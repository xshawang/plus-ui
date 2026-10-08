<template>
  <div class="p-2 app-container ops-report-retention-page">
    <el-card shadow="hover" class="search-panel">
      <el-tabs v-model="algo" @tab-change="handleQuery">
        <el-tab-pane label="充值留存(市场普遍算法)" name="recharge_common" />
        <el-tab-pane label="充值留存(精准算法)" name="recharge_precise" />
        <el-tab-pane label="设备端充值留存(市场普遍算法)" name="device_recharge_common" />
        <el-tab-pane label="设备端充值留存(精准算法)" name="device_recharge_precise" />
        <el-tab-pane label="投注留存(市场普遍算法)" name="bet_common" />
        <el-tab-pane label="投注留存(精准算法)" name="bet_precise" />
      </el-tabs>
      <el-form :inline="true" class="query-form">
        <el-form-item>
          <el-radio-group v-model="quickRange" @change="handleQuickRange">
            <el-radio-button label="day">日</el-radio-button>
            <el-radio-button label="week">周</el-radio-button>
            <el-radio-button label="month">月</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="统计日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 280px"
          />
        </el-form-item>
        <el-form-item label="会员范围">
          <el-select v-model="queryParams.memberScope" clearable placeholder="全部会员" style="width: 140px">
            <el-option label="全部会员" value="all" />
            <el-option label="新注册会员" value="new" />
          </el-select>
        </el-form-item>
        <template v-if="isDeviceTab">
          <el-form-item label="设备类型">
            <el-select v-model="queryParams.deviceType" clearable placeholder="全部设备类型" style="width: 150px">
              <el-option v-for="item in options.deviceTypes" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="设备端">
            <el-select v-model="queryParams.deviceClient" clearable placeholder="全部设备端" style="width: 150px">
              <el-option v-for="item in options.deviceClients" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </template>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
        <el-form-item>
          <el-button v-hasPermi="['ops:report:retention:export']" type="success" plain icon="Download" @click="handleExport">导出报表</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <el-alert
        v-if="isRealtimeSource"
        type="warning"
        :closable="false"
        class="mb-2"
        title="当前为「钱包流水」实时兜底口径"
        description="查询区间内没有 T+1 汇总数据（go88-job 未跑批，或充值未经过支付通道），已改用钱包流水实时计算：充值留存取充值入账流水，投注留存取下注扣款流水。数据实时，口径=钱包实际入账。"
      />
      <el-table v-loading="loading" border :data="displayRows" empty-text="暂无数据" max-height="580">
        <el-table-column
          v-for="col in columns"
          :key="col.prop"
          :label="col.label"
          :prop="col.prop"
          :width="col.width"
          :min-width="col.width ? undefined : 110"
          align="center"
          show-overflow-tooltip
        >
          <template #header>
            <span>{{ col.label }}</span>
            <el-tooltip v-if="col.tip" :content="col.tip" placement="top">
              <el-icon class="ml-1"><QuestionFilled /></el-icon>
            </el-tooltip>
          </template>
          <template #default="{ row }">
            <span>{{ formatCell(row, col) }}</span>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
  </div>
</template>

<script setup name="OpsReportRetention" lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { exportRetention, getRetentionOptions, listRetention } from '@/api/ops/report/retention';
import type { RetentionRow } from '@/api/ops/report/retention/types';

const OFFSETS = [2, 3, 4, 7, 14, 30, 60];

const { loading, withLoading } = useLoading(true);
const algo = ref('recharge_common');
const quickRange = ref('day');
const dateRange = ref<string[]>([]);
const rows = ref<RetentionRow[]>([]);
const average = ref<RetentionRow>({});
const total = ref(0);
const isRealtimeSource = ref(false);

const queryParams = reactive({
  memberScope: 'all',
  deviceType: '',
  deviceClient: '',
  pageNum: 1,
  pageSize: 10
});

const options = reactive({
  algos: [] as Array<{ label: string; value: string }>,
  deviceTypes: [] as Array<{ label: string; value: string }>,
  deviceClients: [] as Array<{ label: string; value: string }>
});

const isDeviceTab = computed(() => algo.value.startsWith('device_'));
const isBetTab = computed(() => algo.value.startsWith('bet'));
const retentionLabel = computed(() => (isBetTab.value ? '投注留存率' : '充值留存率'));

const columns = computed(() => {
  const list: Array<{ label: string; prop: string; width?: number; tip?: string; percent?: boolean; amount?: boolean }> = [
    { label: '统计日期', prop: 'statDate', width: 120 },
    { label: '币种', prop: 'currency', width: 100 }
  ];
  if (isDeviceTab.value) {
    list.push({ label: '设备类型', prop: 'deviceType', width: 110 });
    list.push({ label: '设备端', prop: 'deviceClient', width: 120 });
  }
  list.push(
    { label: '首充金额', prop: 'firstRechargeAmount', width: 120, amount: true },
    { label: '首充比例', prop: 'firstRechargeRatio', width: 110, tip: '当日之首充人数除以注册人数', percent: true },
    { label: '首充人数', prop: 'firstRechargeUsers', width: 110 },
    { label: '注册且首充人数', prop: 'registerFirstRechargeUsers', width: 140, tip: '当日注册且当日首充的人数（精准算法分母）' },
    { label: '二充人数', prop: 'secondRechargeUsers', width: 110 },
    { label: '二充比例', prop: 'secondRechargeRatio', width: 110, percent: true },
    { label: '复充金额', prop: 'repeatRechargeAmount', width: 120, tip: '当日首充者之总充值金额减去首充金额', amount: true },
    { label: '复充比例', prop: 'repeatRechargeRatio', width: 110, percent: true },
    { label: '复充人数', prop: 'repeatRechargeUsers', width: 110 }
  );
  OFFSETS.forEach((offset) => {
    list.push({ label: `${offset}日${retentionLabel.value}`, prop: `d${offset}`, width: 130, percent: true, tip: `${offset}日${retentionLabel.value}（括号为衰减率）` });
  });
  return list;
});

/** 明细行 + 底部「平均值」行（平均值由服务端计算，前端只展示） */
const displayRows = computed(() => {
  const list = [...rows.value];
  if (average.value && Object.keys(average.value).length) {
    list.push({ ...average.value, statDate: '平均值' });
  }
  return list;
});

const formatCell = (row: RetentionRow, col: { prop: string; percent?: boolean; amount?: boolean }) => {
  const value = row[col.prop];
  if (value === null || value === undefined || value === '') {
    return col.amount ? '0.00' : col.percent ? '0.00%' : '0';
  }
  if (col.amount) {
    return Number(value).toFixed(2);
  }
  if (col.percent) {
    const rate = (Number(value) * 100).toFixed(2) + '%';
    const decay = row[`${col.prop}Decay`];
    if (decay === undefined || decay === null || col.prop === 'firstRechargeRatio' || col.prop === 'secondRechargeRatio' || col.prop === 'repeatRechargeRatio') {
      return rate;
    }
    return `${rate} (${(Number(decay) * 100).toFixed(2)}%)`;
  }
  return String(value);
};

const pad = (num: number) => String(num).padStart(2, '0');
const dayText = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

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
  getList();
};

const getList = async () => {
  await withLoading(async () => {
    const res = await listRetention({
      algo: algo.value,
      memberScope: queryParams.memberScope,
      deviceType: isDeviceTab.value ? queryParams.deviceType : undefined,
      deviceClient: isDeviceTab.value ? queryParams.deviceClient : undefined,
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1],
      pageNum: queryParams.pageNum,
      pageSize: queryParams.pageSize
    });
    rows.value = res.data?.rows || [];
    average.value = res.data?.average || {};
    total.value = res.data?.total || 0;
    // 数据源提示：summary=T+1 汇总口径；ledger=钱包流水实时兜底口径（服务端判定并下发）
    isRealtimeSource.value = String(average.value?.dataSource || rows.value[0]?.dataSource || '') === 'ledger';
  });
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.memberScope = 'all';
  queryParams.deviceType = '';
  queryParams.deviceClient = '';
  quickRange.value = 'day';
  handleQuickRange();
};

const handleExport = async () => {
  const res = await exportRetention({
    algo: algo.value,
    memberScope: queryParams.memberScope,
    deviceType: isDeviceTab.value ? queryParams.deviceType : undefined,
    deviceClient: isDeviceTab.value ? queryParams.deviceClient : undefined,
    startDate: dateRange.value?.[0],
    endDate: dateRange.value?.[1]
  });
  if (res.data?.status === 2) {
    modal.msgSuccess(`导出任务已生成（任务号 ${res.data?.taskNo}），请到「报表 → 导出下载」下载`);
  } else {
    modal.msgError('导出任务生成失败，请到「导出下载」查看原因');
  }
};

onMounted(async () => {
  const res = await getRetentionOptions();
  options.algos = res.data?.algos || [];
  options.deviceTypes = res.data?.deviceTypes || [];
  options.deviceClients = res.data?.deviceClients || [];
  handleQuickRange();
});
</script>
