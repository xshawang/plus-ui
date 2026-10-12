<template>
  <div class="p-2 app-container risk-reward-page">
    <el-card shadow="hover" class="search-panel">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane name="1">
          <template #label>
            <span>待处理</span>
            <el-badge v-if="tabCounts.pending" :value="tabCounts.pending" :max="999" class="ml-1" />
          </template>
        </el-tab-pane>
        <el-tab-pane label="已处理" name="2" />
        <el-tab-pane label="已忽略" name="3" />
        <el-tab-pane label="全部" name="all" />
      </el-tabs>

      <el-form :inline="true" class="query-form">
        <el-form-item>
          <el-radio-group v-model="period" @change="onPeriodChange">
            <el-radio-button value="DAY">日</el-radio-button>
            <el-radio-button value="MONTH">月</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-date-picker
            v-if="period === 'DAY'"
            v-model="dateRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            range-separator="-"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 380px"
          />
          <el-date-picker
            v-else
            v-model="month"
            type="month"
            value-format="YYYY-MM"
            placeholder="请选择月份"
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.accountField" style="width: 120px">
            <el-option label="会员账号" value="LOGIN_NAME" />
            <el-option label="会员ID" value="UID" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="query.accountValue" placeholder="请输入会员账号" clearable style="width: 180px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-select v-model="query.monitorType" placeholder="全部类型" clearable style="width: 190px">
            <el-option v-for="item in monitorTypeOptions" :key="item.value" :label="item.label" :value="Number(item.value)" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <div class="toolbar-actions">
        <el-button v-hasPermi="['risk:reward:export']" icon="Download" @click="handleExport">导出报表</el-button>
        <el-button v-hasPermi="['risk:reward:config']" type="primary" plain icon="Setting" @click="openConfig">监测参数</el-button>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        border
        empty-text="暂无数据"
        row-key="monitorId"
        :data="rows"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" reserve-selection width="46" align="center" />
        <el-table-column label="币种" prop="currency" align="center" width="120" />
        <el-table-column label="会员ID" prop="uid" align="center" width="150" show-overflow-tooltip />
        <el-table-column label="会员账号" prop="loginName" align="center" min-width="140" show-overflow-tooltip />
        <el-table-column label="会员状态" align="center" width="100">
          <template #default="scope">{{ scope.row.memberStatusText }}</template>
        </el-table-column>
        <el-table-column label="登录IP" prop="loginIp" align="center" min-width="170" show-overflow-tooltip />
        <el-table-column label="注册来源" prop="registerSource" align="center" width="120" />
        <el-table-column label="监测类型" align="center" width="160">
          <template #default="scope">{{ scope.row.monitorTypeText }}</template>
        </el-table-column>
        <el-table-column label="实际参数" align="center" width="120">
          <template #default="scope">
            <span class="actual-value">{{ scope.row.actualText }}</span>
          </template>
        </el-table-column>
        <el-table-column label="注单编号" align="center" min-width="150" show-overflow-tooltip>
          <template #default="scope">{{ scope.row.orderNo || '—' }}</template>
        </el-table-column>
        <el-table-column label="触发时间" align="center" width="180">
          <template #default="scope">{{ formatTime(scope.row.triggerAt) }}</template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="100">
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row.status)">{{ scope.row.statusText }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" align="center" min-width="140" show-overflow-tooltip />
        <el-table-column label="操作" align="center" width="100" fixed="right">
          <template #default="scope">
            <el-button
              v-if="scope.row.status === 1"
              v-hasPermi="['risk:reward:handle']"
              link
              type="primary"
              @click="openHandle(scope.row)"
              >处理</el-button
            >
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>
        <el-table-column label="操作人" prop="operatorId" align="center" width="120" />
        <el-table-column label="操作时间" align="center" width="180">
          <template #default="scope">{{ formatTime(scope.row.operatedAt) }}</template>
        </el-table-column>
      </el-table>

      <div class="batch-bar">
        <el-checkbox v-model="selectCurrentPage" @change="toggleCurrentPage">全选当前页</el-checkbox>
        <el-select v-model="batchAction" placeholder="批量操作" style="width: 160px">
          <el-option label="批量处理" value="2" />
          <el-option label="批量忽略" value="3" />
        </el-select>
        <el-button type="primary" plain size="small" @click="handleBatch">执行</el-button>
        <span class="ml-2 text-gray-500">已选择 {{ selectedIds.length }} 条数据</span>
        <span class="ml-4 text-gray-500">共 {{ total }} 条</span>
      </div>

      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 处理弹窗 -->
    <el-dialog v-model="handleDialog.visible" title="处理" width="520px" append-to-body destroy-on-close>
      <el-form label-width="100px">
        <el-form-item label="处理结果">
          <el-radio-group v-model="handleForm.resultStatus">
            <el-radio :value="2">已处理（风险成立）</el-radio>
            <el-radio :value="3">已忽略（误报）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="handleForm.remark" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="请输入处理备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitHandle">确认</el-button>
      </template>
    </el-dialog>

    <!-- 监测参数弹窗（截图两个页签） -->
    <el-dialog v-model="configDialog.visible" title="监测参数" width="760px" append-to-body destroy-on-close>
      <el-tabs v-model="configTab">
        <el-tab-pane label="派奖监测设置" name="reward">
          <div class="config-toolbar">
            <el-select v-model="configForm.currency" style="width: 220px" @change="loadConfig">
              <el-option v-for="item in currencyOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </div>
          <el-table :data="configRows" border size="small">
            <el-table-column label="类型" prop="label" align="center" width="220">
              <template #default="scope">
                <el-tooltip :content="scope.row.tip" placement="top">
                  <span>{{ scope.row.label }} <el-icon><QuestionFilled /></el-icon></span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column label="参数设置" align="center">
              <template #default="scope">
                <el-input-number v-model="scope.row.value" :min="0" :controls="false" style="width: 180px" />
                <span class="ml-2 text-gray-500">{{ scope.row.unit }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="风控提醒设置" name="alert">
          <el-table :data="alertRows" border size="small">
            <el-table-column label="风控提醒" prop="label" align="center" width="220" />
            <el-table-column label="提示开关" align="center">
              <template #default="scope">
                <el-checkbox v-if="scope.row.key === 'enabled'" v-model="alertForm.enabled">开启</el-checkbox>
                <el-input-number v-else v-model="alertForm.intervalSeconds" :min="1" :max="86400" :controls="false" style="width: 180px" />
                <span v-if="scope.row.key !== 'enabled'" class="ml-2 text-gray-500">s</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="configDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitConfig">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="RiskRewardMonitor" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { QuestionFilled } from '@element-plus/icons-vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { saveBlob } from '@/utils/save';
import {
  exportRewardMonitor,
  getAlertConfig,
  getRewardConfig,
  getRewardOptions,
  getRewardTabCounts,
  handleRewardMonitor,
  listRewardCurrencies,
  listRewardMonitor,
  saveAlertConfig,
  saveRewardConfig
} from '@/api/risk/reward';
import type { RiskDictOption } from '@/api/risk/blacklist/types';
import type { RiskCurrencyOption, RiskRewardQuery } from '@/api/risk/reward/types';

type AnyRow = Record<string, any>;

const { loading, withLoading } = useLoading(true);
const submitting = ref(false);
const saving = ref(false);
const activeTab = ref('1');
const period = ref<'DAY' | 'MONTH'>('DAY');
const dateRange = ref<[string, string] | null>(null);
const month = ref<string>('');
const rows = ref<AnyRow[]>([]);
const total = ref(0);
const tabCounts = ref<Record<string, number>>({});
// 雪花ID 超出 JS 安全整数范围，必须原样透传字符串，禁止 Number() 转换
const selectedIds = ref<Array<number | string>>([]);
const selectCurrentPage = ref(false);
const batchAction = ref('2');
const tableRef = ref();
const monitorTypeOptions = ref<RiskDictOption[]>([]);
const currencyOptions = ref<RiskCurrencyOption[]>([]);
const handleDialog = reactive({ visible: false });
const configDialog = reactive({ visible: false });
const configTab = ref('reward');

const query = ref<RiskRewardQuery>({ pageNum: 1, pageSize: 10, accountField: 'LOGIN_NAME' });
const handleForm = reactive<{ id?: number | string; resultStatus: number; remark: string }>({ resultStatus: 2, remark: '' });
const configForm = reactive<{ currency: string }>({ currency: 'VND1000:1' });
const alertForm = reactive<{ enabled: boolean; intervalSeconds: number }>({ enabled: true, intervalSeconds: 60 });

/** 监测参数 5 行（与截图顺序、单位一致） */
const configRows = ref([
  { key: 'highMultiple', label: '高倍爆奖', unit: '倍', value: 500, tip: '派奖金额 ÷ 有效投注 达到该倍数即命中' },
  { key: 'highMultipleWinAmount', label: '高倍爆奖中奖金额', unit: 'VND', value: 15000, tip: '单笔派奖金额达到该值即命中' },
  { key: 'largeWinAmount', label: '大额中奖', unit: 'VND', value: 60000, tip: '单笔派奖金额达到该值即命中' },
  { key: 'profitRatio', label: '会员获利比', unit: '%', value: 20, tip: '(派奖 − 投注) ÷ 投注 × 100 达到该值即命中' },
  { key: 'profitRatioValidBet', label: '获利比触发有效投注值', unit: 'VND', value: 30000, tip: '有效投注达到该值后才参与获利比判定' }
]);

const alertRows = [
  { key: 'enabled', label: '风控提示' },
  { key: 'intervalSeconds', label: '间隔时间(s)' }
];

const statusTagType = (status?: number) => (status === 1 ? 'danger' : status === 2 ? 'success' : 'info');
const formatTime = (value?: string) => (value ? String(value).replace('T', ' ').slice(0, 19) : '—');

const defaultDayRange = (): [string, string] => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  return [fmt(start), fmt(end)];
};

const buildParams = (): RiskRewardQuery => {
  const params: Record<string, any> = {};
  if (period.value === 'DAY') {
    const range = dateRange.value ?? defaultDayRange();
    params.beginTime = range[0];
    params.endTime = range[1];
  } else if (month.value) {
    const [year, mon] = month.value.split('-').map((item) => Number(item));
    const lastDay = new Date(year, mon, 0).getDate();
    params.beginTime = `${month.value}-01 00:00:00`;
    params.endTime = `${month.value}-${String(lastDay).padStart(2, '0')} 23:59:59`;
  }
  return {
    ...query.value,
    status: activeTab.value === 'all' ? undefined : Number(activeTab.value),
    period: period.value,
    params
  };
};

const getList = async () => {
  selectCurrentPage.value = false;
  await withLoading(async () => {
    try {
      const res: any = await listRewardMonitor(buildParams());
      rows.value = res?.data?.rows ?? res?.rows ?? [];
      total.value = res?.data?.total ?? res?.total ?? 0;
      tableRef.value?.clearSelection();
    } catch (error) {
      rows.value = [];
      total.value = 0;
    }
  });
};

const loadTabCounts = async () => {
  try {
    const res: any = await getRewardTabCounts();
    tabCounts.value = (res?.data ?? {}) as Record<string, number>;
  } catch (error) {
    tabCounts.value = {};
  }
};

const handleTabChange = () => {
  query.value.pageNum = 1;
  getList();
};

const onPeriodChange = () => {
  query.value.pageNum = 1;
  getList();
};

const handleQuery = () => {
  query.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  query.value = { pageNum: 1, pageSize: 10, accountField: 'LOGIN_NAME' };
  period.value = 'DAY';
  dateRange.value = defaultDayRange();
  month.value = '';
  getList();
};

const handleSelectionChange = (selection: AnyRow[]) => {
  selectedIds.value = selection.map((item) => item.monitorId);
};

const toggleCurrentPage = () => {
  if (selectCurrentPage.value) {
    rows.value.forEach((row) => tableRef.value?.toggleRowSelection(row, true));
  } else {
    tableRef.value?.clearSelection();
    selectedIds.value = [];
  }
};

const openHandle = (row: AnyRow) => {
  handleForm.id = row.monitorId;
  handleForm.resultStatus = 2;
  handleForm.remark = '';
  handleDialog.visible = true;
};

const submitHandle = async () => {
  submitting.value = true;
  try {
    const res: any = await handleRewardMonitor({ ...handleForm });
    modal.msgSuccess(`处理成功（影响 ${res?.data ?? 0} 条）`);
    handleDialog.visible = false;
    await getList();
    await loadTabCounts();
  } catch (error) {
    // 统一错误提示
  } finally {
    submitting.value = false;
  }
};

const handleBatch = async () => {
  if (selectedIds.value.length === 0) {
    modal.msgWarning('请先选择需要处理的记录');
    return;
  }
  try {
    await modal.confirm(`确认将已选 ${selectedIds.value.length} 条记录标记为「${batchAction.value === '2' ? '已处理' : '已忽略'}」？`);
  } catch {
    return;
  }
  try {
    const res: any = await handleRewardMonitor({ ids: selectedIds.value, resultStatus: Number(batchAction.value), remark: '批量处理' });
    modal.msgSuccess(`处理成功（影响 ${res?.data ?? 0} 条）`);
    selectedIds.value = [];
    await getList();
    await loadTabCounts();
  } catch (error) {
    // 统一错误提示
  }
};

const openConfig = async () => {
  configDialog.visible = true;
  configTab.value = 'reward';
  if (currencyOptions.value.length === 0) {
    try {
      const res: any = await listRewardCurrencies();
      currencyOptions.value = (res?.data ?? []) as RiskCurrencyOption[];
    } catch (error) {
      currencyOptions.value = [{ label: '越南(VND1000:1)', value: 'VND1000:1' }];
    }
  }
  await loadConfig();
  try {
    const alert: any = await getAlertConfig();
    alertForm.enabled = Boolean(alert?.data?.enabled);
    alertForm.intervalSeconds = Number(alert?.data?.intervalSeconds ?? 60);
  } catch (error) {
    // 保留默认值
  }
};

const loadConfig = async () => {
  try {
    const res: any = await getRewardConfig(configForm.currency);
    const data = res?.data ?? {};
    configRows.value = configRows.value.map((row) => ({ ...row, value: Number(data[row.key] ?? row.value) }));
  } catch (error) {
    // 保留当前值
  }
};

const submitConfig = async () => {
  saving.value = true;
  try {
    if (configTab.value === 'reward') {
      const payload: Record<string, any> = { currency: configForm.currency };
      configRows.value.forEach((row) => {
        payload[row.key] = row.value;
      });
      await saveRewardConfig(payload as any);
      modal.msgSuccess('监测参数已保存');
    } else {
      await saveAlertConfig({ enabled: alertForm.enabled, intervalSeconds: alertForm.intervalSeconds });
      modal.msgSuccess('风控提醒设置已保存');
    }
    configDialog.visible = false;
  } catch (error) {
    // 统一错误提示
  } finally {
    saving.value = false;
  }
};

const handleExport = async () => {
  try {
    const blob: any = await exportRewardMonitor(buildParams());
    saveBlob(blob, `派奖监控_${Date.now()}.csv`);
  } catch (error) {
    modal.msgError('导出失败，请稍后重试');
  }
};

onMounted(async () => {
  dateRange.value = defaultDayRange();
  try {
    const res: any = await getRewardOptions();
    monitorTypeOptions.value = (res?.data?.monitorTypes ?? []) as RiskDictOption[];
  } catch (error) {
    monitorTypeOptions.value = [];
  }
  await loadTabCounts();
  await getList();
});
</script>

<style scoped>
.toolbar-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 8px;
}

.batch-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}

.config-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 8px;
}

.actual-value {
  color: #1677ff;
}
</style>
