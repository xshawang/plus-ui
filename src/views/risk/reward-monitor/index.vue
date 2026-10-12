<template>
  <div class="p-2 app-container risk-reward-monitor-page">
    <!-- 四个状态页签（设计稿：待处理带红点计数） -->
    <el-tabs v-model="activeTab" class="risk-tabs" @tab-change="handleTabChange">
      <el-tab-pane v-for="item in TABS" :key="item.name" :name="item.name">
        <template #label>
          <span class="tab-label">
            {{ item.label }}
            <el-badge v-if="item.countKey" :value="counts[item.countKey] || 0" :hidden="!counts[item.countKey]" />
          </span>
        </template>
      </el-tab-pane>
    </el-tabs>

    <el-card shadow="hover" class="search-panel">
      <el-form :model="queryParams" :inline="true" class="query-form">
        <el-form-item label="统计口径">
          <el-radio-group v-model="queryParams.period">
            <el-radio-button value="DAY">日</el-radio-button>
            <el-radio-button value="MONTH">月</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="触发时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="-"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="会员账号">
          <el-select v-model="queryParams.accountField" style="width: 120px">
            <el-option label="会员账号" value="LOGIN_NAME" />
            <el-option label="会员ID" value="UID" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="queryParams.accountValue"
            placeholder="请输入会员账号"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="监测类型">
          <el-select v-model="queryParams.monitorType" placeholder="全部类型" clearable style="width: 170px">
            <el-option
              v-for="item in monitorTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="Number(item.value)"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>派奖监控</h3>
            <span class="text-gray-400 text-sm">命中仅产生台账，不冻结、不拒绝、不派奖</span>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['risk:reward:export']" icon="Download" @click="handleExport">导出报表</el-button>
            <el-button v-hasPermi="['risk:reward:config']" type="primary" icon="Setting" @click="configVisible = true">
              监测参数
            </el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" border :data="rows" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="币种" prop="currency" width="130" align="center" />
        <el-table-column label="会员ID" prop="uid" min-width="170" show-overflow-tooltip />
        <el-table-column label="会员账号" prop="loginName" min-width="140" show-overflow-tooltip />
        <el-table-column label="会员状态" width="100" align="center">
          <template #default="{ row }">{{ row.memberStatusText || row.memberStatus }}</template>
        </el-table-column>
        <el-table-column label="登录IP" prop="loginIp" min-width="150" show-overflow-tooltip />
        <el-table-column label="注册来源" prop="registerSource" width="110" align="center" />
        <el-table-column label="监测类型" width="150" align="center">
          <template #default="{ row }">{{ row.monitorTypeText || row.monitorType }}</template>
        </el-table-column>
        <el-table-column label="实际参数" width="120" align="center">
          <template #default="{ row }">{{ row.actualText || row.actualValue }}</template>
        </el-table-column>
        <el-table-column label="注单编号" prop="orderNo" min-width="160" show-overflow-tooltip />
        <el-table-column label="触发时间" prop="triggerAt" width="170" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ row.statusText || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="90" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 1"
              v-hasPermi="['risk:reward:handle']"
              link
              type="primary"
              @click="openHandle(row)"
            >
              处理
            </el-button>
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>
        <el-table-column label="操作人" prop="operatorId" width="110" align="center" />
        <el-table-column label="操作时间" prop="operatedAt" width="170" align="center" />
      </el-table>

      <div class="table-footer">
        <el-button
          v-hasPermi="['risk:reward:handle']"
          type="primary"
          plain
          :disabled="ids.length === 0"
          @click="openBatchHandle"
        >
          批量处理
        </el-button>
        <span class="text-gray-500 text-sm">已选择 {{ ids.length }} 条数据 / 共 {{ total }} 条</span>
        <pagination
          v-show="total > 0"
          v-model:page="queryParams.pageNum"
          v-model:limit="queryParams.pageSize"
          :total="total"
          @pagination="getList"
        />
      </div>
    </el-card>

    <reward-handle-dialog v-model="handleVisible" :ids="handleIds" @success="afterHandle" />
    <reward-config-dialog v-model="configVisible" @success="getList" />
  </div>
</template>

<script setup name="RiskRewardMonitor" lang="ts">
import {
  exportRewardMonitor,
  getRewardMonitorOptions,
  getRewardTabCounts,
  listRewardMonitor
} from '@/api/risk/reward-monitor';
import type {
  RiskRewardMonitorQuery,
  RiskRewardMonitorVO,
  RiskRewardStatus,
  RiskRewardTabCounts
} from '@/api/risk/reward-monitor/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useDateRangeQuery } from '@/hooks/form/useDateRangeQuery';
import { useTableSelection } from '@/hooks/table/useTableSelection';
import { computed, onMounted, reactive, ref } from 'vue';
import RewardConfigDialog from './components/RewardConfigDialog.vue';
import RewardHandleDialog from './components/RewardHandleDialog.vue';

/** 仅用到 label/value，兼容后端字典选项与本地兜底常量 */
interface DictOption {
  label: string;
  value: string;
}

/** 四个状态页签（name 与后端 status 的映射见 STATUS_OF_TAB） */
const TABS = [
  { name: 'pending', label: '待处理', countKey: 'pending' as keyof RiskRewardTabCounts },
  { name: 'handled', label: '已处理', countKey: undefined },
  { name: 'ignored', label: '已忽略', countKey: undefined },
  { name: 'all', label: '全部', countKey: undefined }
];

/** 页签 → 后端 status；all 不传 status 表示全部 */
const STATUS_OF_TAB: Record<string, RiskRewardStatus | undefined> = {
  pending: 1,
  handled: 2,
  ignored: 3,
  all: undefined
};

/** 监测类型字典缺失时的兜底，避免筛选框整体不可用（值与后端 Integer 一一对应） */
const FALLBACK_MONITOR_TYPES: DictOption[] = [
  { label: '高倍爆奖', value: '1' },
  { label: '高倍爆奖中奖金额', value: '2' },
  { label: '大额中奖', value: '3' },
  { label: '会员获利比', value: '4' }
];

const activeTab = ref('pending');
const rows = ref<RiskRewardMonitorVO[]>([]);
const total = ref(0);
const counts = ref<RiskRewardTabCounts>({});
const monitorTypes = ref<DictOption[]>([]);
const handleVisible = ref(false);
const configVisible = ref(false);
const handleIds = ref<Array<string | number>>([]);
const { loading, withLoading } = useLoading(true);
const { dateRange, applyDateRange, resetDateRange } = useDateRangeQuery();
const { ids, handleSelectionChange, clearSelection } = useTableSelection<RiskRewardMonitorVO>(
  row => row.monitorId ?? ''
);

const queryParams = reactive<RiskRewardMonitorQuery>({
  pageNum: 1,
  pageSize: 10,
  period: 'DAY',
  accountField: 'LOGIN_NAME'
});

const monitorTypeOptions = computed(() =>
  monitorTypes.value.length > 0 ? monitorTypes.value : FALLBACK_MONITOR_TYPES
);

// 台账的 betAmount/payoutAmount 虽在 VO 中，但单位（分 vs VND）与配置阈值口径未对齐、
// 设计稿也没有这两列，因此页面只展示服务端拼好的 actualText，避免在前端做错的换算。
const statusTagType = (status?: number) => {
  if (status === 1) return 'danger';
  if (status === 2) return 'success';
  if (status === 3) return 'info';
  return 'info';
};

const statusLabel = computed(() => TABS.find(item => item.name === activeTab.value)?.label || '全部');

const getList = async () => {
  await withLoading(async () => {
    const query: RiskRewardMonitorQuery = { ...queryParams, status: STATUS_OF_TAB[activeTab.value] };
    const res = await listRewardMonitor(applyDateRange(query));
    rows.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};

const getCounts = async () => {
  const res = await getRewardTabCounts();
  counts.value = res.data || {};
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

/** 切页签清空选择：跨状态批量处理会让「已处理/已忽略」的语义混乱 */
const handleTabChange = () => {
  queryParams.pageNum = 1;
  clearSelection();
  getList();
};

const resetQuery = () => {
  queryParams.pageNum = 1;
  queryParams.accountValue = undefined;
  queryParams.accountField = 'LOGIN_NAME';
  queryParams.monitorType = undefined;
  queryParams.period = 'DAY';
  resetDateRange();
  clearSelection();
  getList();
};

const openHandle = (row: RiskRewardMonitorVO) => {
  handleIds.value = [row.monitorId as string | number];
  handleVisible.value = true;
};

const openBatchHandle = () => {
  handleIds.value = [...ids.value];
  handleVisible.value = true;
};

/** 处理后刷新列表与页签计数：待处理红点必须跟着减少，否则运营会误判 */
const afterHandle = async () => {
  clearSelection();
  await Promise.all([getList(), getCounts()]);
};

const handleExport = async () => {
  const query: RiskRewardMonitorQuery = { ...queryParams, status: STATUS_OF_TAB[activeTab.value] };
  await exportRewardMonitor(applyDateRange(query), statusLabel.value);
};

onMounted(async () => {
  const res = await getRewardMonitorOptions();
  monitorTypes.value = res.data?.monitorTypes || [];
  await Promise.all([getList(), getCounts()]);
});
</script>

<style scoped>
.risk-tabs {
  margin-bottom: 8px;
}

.tab-label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.search-panel {
  margin-bottom: 12px;
}

.toolbar-shell {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}
</style>
