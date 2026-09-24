<template>
  <div class="p-2 app-container agent-center-page">
    <el-card shadow="hover" class="search-panel">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="所有代理" name="all" />
        <el-tab-pane label="顶层代理" name="top" />
        <el-tab-pane name="pending">
          <template #label>
            专业代理待审核
            <el-badge v-if="tabCounts.pending > 0" :value="tabCounts.pending" class="tab-badge" />
          </template>
        </el-tab-pane>
        <el-tab-pane name="rejected">
          <template #label>
            专业代理被拒绝
            <el-badge v-if="tabCounts.rejected > 0" :value="tabCounts.rejected" type="danger" class="tab-badge" />
          </template>
        </el-tab-pane>
        <el-tab-pane name="approved">
          <template #label>
            专业代理已通过
            <el-badge v-if="tabCounts.approved > 0" :value="tabCounts.approved" type="success" class="tab-badge" />
          </template>
        </el-tab-pane>
      </el-tabs>

      <el-form :inline="true" class="query-form">
        <el-form-item>
          <el-radio-group v-model="query.timeScope" size="default" @change="handleScopeChange">
            <el-radio-button value="day">日</el-radio-button>
            <el-radio-button value="week">周</el-radio-button>
            <el-radio-button value="month">月</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="query.timeScope === 'month'">
          <el-date-picker v-model="monthValue" type="month" value-format="YYYY-MM" placeholder="选择月份" style="width: 150px" />
        </el-form-item>
        <el-form-item v-else>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="-"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 260px"
          />
        </el-form-item>

        <template v-if="isApplyTab">
          <el-form-item>
            <el-select v-model="query.timeField" style="width: 130px">
              <el-option label="申请时间" value="appliedAt" />
              <el-option label="操作时间" value="operatedAt" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="query.accountField" style="width: 130px">
              <el-option label="会员账号" value="LOGIN_NAME" />
              <el-option label="会员ID" value="UID" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-input v-model="query.accountKeyword" placeholder="请输入会员账号" clearable style="width: 190px" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-select v-model="query.vipLevel" placeholder="全部VIP等级" clearable style="width: 150px">
              <el-option v-for="item in vipOptions" :key="item" :label="`VIP${item}`" :value="item" />
            </el-select>
          </el-form-item>
        </template>

        <template v-else>
          <el-form-item>
            <el-input
              v-model="query.accountKeyword"
              :placeholder="isTopTab ? '顶层代理账号（支持批量搜索，可用英文）' : '精准账号（支持批量搜索，可用英文）'"
              clearable
              style="width: 300px"
              @keyup.enter="handleQuery"
            />
          </el-form-item>
          <template v-if="advanced">
            <el-form-item label="累计佣金">
              <el-input-number v-model="query.commissionMin" :min="0" :controls="false" placeholder="最小值" style="width: 110px" />
              <span class="range-sep">-</span>
              <el-input-number v-model="query.commissionMax" :min="0" :controls="false" placeholder="最大值" style="width: 110px" />
            </el-form-item>
            <el-form-item v-if="isTopTab" label="下级层数">
              <el-input-number v-model="query.subLayerMin" :min="0" :controls="false" placeholder="最小值" style="width: 110px" />
              <span class="range-sep">-</span>
              <el-input-number v-model="query.subLayerMax" :min="0" :controls="false" placeholder="最大值" style="width: 110px" />
            </el-form-item>
            <el-form-item>
              <el-select v-model="query.currency" placeholder="全部币种" clearable style="width: 160px">
                <el-option v-for="item in options.currencies" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px">
                <el-option label="正常" :value="1" />
                <el-option label="冻结" :value="0" />
              </el-select>
            </el-form-item>
          </template>
          <el-form-item>
            <el-select v-model="query.withdrawMethod" placeholder="全部提现方式" clearable style="width: 170px">
              <el-option v-for="item in options.withdrawMethods" :key="item.value" :label="item.label" :value="Number(item.value)" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="query.agentWay" placeholder="全部代理方式" clearable style="width: 150px">
              <el-option v-for="item in options.agentWays" :key="item.value" :label="item.label" :value="Number(item.value)" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="query.layerId" placeholder="全部代理等级" clearable style="width: 150px">
              <el-option v-for="item in options.layers" :key="item.value" :label="item.label" :value="Number(item.value)" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="query.registerSource" placeholder="全部注册来源" clearable style="width: 160px">
              <el-option v-for="item in options.registerSources" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </template>

        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button v-if="!isApplyTab" icon="Filter" @click="advanced = !advanced">
            {{ advanced ? '收起高级搜索' : '高级搜索' }}
          </el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <div class="toolbar-actions">
        <el-button v-hasPermi="['agent:account:add']" type="primary" icon="Plus" @click="openAdd">新增代理</el-button>
        <el-button v-if="activeTab === 'all'" v-hasPermi="['agent:account:import']" type="warning" plain icon="Upload" @click="triggerImport">
          导入代理
        </el-button>
        <el-button v-hasPermi="[isApplyTab ? 'agent:apply:export' : 'agent:account:export']" icon="Download" @click="handleExport">
          导出报表
        </el-button>
        <el-button icon="Refresh" @click="refreshAll">刷新</el-button>
      </div>

      <AgentAccountPanel
        v-if="!isApplyTab"
        ref="accountPanelRef"
        :rows="rows"
        :loading="loading"
        :tab="activeTab"
        :options="options"
        @row-action="handleRowAction"
        @bind-switch="handleBindSwitch"
        @selection-change="handleSelectionChange"
      />
      <AgentApplyPanel
        v-else
        ref="applyPanelRef"
        :rows="rows"
        :loading="loading"
        :tab="activeTab"
        @row-action="handleRowAction"
        @selection-change="handleSelectionChange"
      />

      <div v-if="!isApplyTab" class="summary-bar">
        <span class="summary-label">小计（当前页）</span>
        <span>直属数：{{ pageSubtotal.directCount }}</span>
        <span>{{ isTopTab ? '代理总数' : '其他数' }}：{{ isTopTab ? pageSubtotal.agentTotal : pageSubtotal.otherCount }}</span>
        <span v-if="isTopTab">下级总数：{{ pageSubtotal.subTotal }}</span>
        <span>累计佣金：{{ formatMoney(pageSubtotal.totalCommission) }}</span>
        <span>累计领取：{{ formatMoney(pageSubtotal.withdrawnAmount) }}</span>
        <span>未领取：{{ formatMoney(pageSubtotal.pendingAmount) }}</span>
        <el-divider direction="vertical" />
        <span class="summary-label">总计</span>
        <template v-if="summaryRows.length">
          <span v-for="item in summaryRows" :key="item.currency">
            {{ item.currency }}：代理 {{ item.agentCount }} / 累计佣金 {{ formatMoney(item.totalCommission) }} / 未领取
            {{ formatMoney(item.pendingAmount) }}
          </span>
        </template>
        <el-button v-else link type="primary" @click="loadSummary">点击以计算总数</el-button>
      </div>

      <div class="batch-bar">
        <el-checkbox v-model="selectCurrentPage" @change="toggleCurrentPage">全选当前页</el-checkbox>
        <el-select v-model="batchAction" placeholder="批量操作" style="width: 170px" @change="onBatchActionChange">
          <el-option label="修改提现方式" value="withdrawMethod" />
          <el-option label="修改直属层级" value="layer" />
          <el-option label="修改直属标签" value="label" />
          <el-option label="批量冻结" value="status0" />
          <el-option label="批量启用" value="status1" />
          <el-option label="移出代理" value="remove" />
        </el-select>
        <el-select v-if="batchAction === 'withdrawMethod'" v-model="batchForm.withdrawMethod" placeholder="提现方式" style="width: 170px">
          <el-option v-for="item in options.withdrawMethods" :key="item.value" :label="item.label" :value="Number(item.value)" />
        </el-select>
        <el-select v-if="batchAction === 'layer'" v-model="batchForm.layerId" placeholder="层级" style="width: 150px">
          <el-option v-for="item in options.layers" :key="item.value" :label="item.label" :value="Number(item.value)" />
        </el-select>
        <el-select v-if="batchAction === 'label'" v-model="batchForm.labelId" placeholder="标签" style="width: 150px">
          <el-option v-for="item in options.labels" :key="item.value" :label="item.label" :value="Number(item.value)" />
        </el-select>
        <el-button type="primary" plain size="small" @click="handleBatch">执行</el-button>
        <span class="ml-2 text-gray-500">已选择 {{ selectedIds.length }} 条数据</span>
        <span class="ml-4 text-gray-500">共 {{ total }} 条</span>
      </div>

      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 新增代理弹窗（截图 03 白色弹出框） -->
    <AgentAddDialog v-model:visible="addDialogVisible" :options="options" @success="afterWrite" />

    <!-- 修改代理模式弹窗（截图 02） -->
    <AgentModeDialog v-model:visible="modeDialogVisible" :agent-id="current.agentId" @success="afterWrite" />

    <!-- 更多操作四类弹窗（截图 01 下拉） -->
    <AgentMoreDialogs v-model:visible="moreDialogVisible" :action="moreAction" :row="current" :options="options" @success="afterWrite" />

    <!-- 专业代理审核弹窗 -->
    <AgentApplyAuditDialog
      v-model:visible="auditDialogVisible"
      :apply-ids="auditApplyIds"
      :options="options"
      @success="afterApplyAudit"
    />

    <!-- 代理详情抽屉 -->
    <el-drawer v-model="detailVisible" title="代理详情" size="520px" destroy-on-close>
      <el-descriptions v-if="detail.account" :column="1" border size="small">
        <el-descriptions-item label="代理账号">{{ detail.account.loginName }}</el-descriptions-item>
        <el-descriptions-item label="代理ID">{{ detail.account.agentId }}</el-descriptions-item>
        <el-descriptions-item label="币种">{{ detail.account.currency }}</el-descriptions-item>
        <el-descriptions-item label="层级 / 标签">
          {{ detail.account.layerTag || '—' }} / {{ detail.account.labelName || '—' }}
        </el-descriptions-item>
        <el-descriptions-item label="上级 / 顶层">
          {{ detail.account.parentLoginName || '—' }} / {{ detail.account.topLoginName || '—' }}
        </el-descriptions-item>
        <el-descriptions-item label="代理模式">{{ detail.account.modeName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="提现方式">{{ detail.account.withdrawMethodText || '—' }}</el-descriptions-item>
        <el-descriptions-item label="累计佣金 / 累计领取 / 未领取">
          {{ formatMoney(detail.account.totalCommission) }} / {{ formatMoney(detail.account.withdrawnAmount) }} /
          {{ formatMoney(detail.account.pendingAmount) }}
        </el-descriptions-item>
        <el-descriptions-item label="推广链接">{{ detail.account.promoLink || '—' }}</el-descriptions-item>
        <el-descriptions-item label="直属下级数">{{ detail.children ?? 0 }}</el-descriptions-item>
      </el-descriptions>
      <el-divider content-position="left">变更轨迹</el-divider>
      <el-table :data="detail.logs" border size="small" empty-text="暂无变更记录">
        <el-table-column label="动作" prop="action" width="150" />
        <el-table-column label="变更前" prop="beforeValue" show-overflow-tooltip />
        <el-table-column label="变更后" prop="afterValue" show-overflow-tooltip />
        <el-table-column label="操作人" prop="operatorId" width="110" />
        <el-table-column label="时间" prop="createdAt" width="170" />
      </el-table>
    </el-drawer>
  </div>
</template>

<script setup name="AgentCenter" lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { saveBlob } from '@/utils/save';
import AgentAccountPanel from './components/AgentAccountPanel.vue';
import AgentApplyPanel from './components/AgentApplyPanel.vue';
import AgentAddDialog from './components/AgentAddDialog.vue';
import AgentModeDialog from './components/AgentModeDialog.vue';
import AgentMoreDialogs from './components/AgentMoreDialogs.vue';
import AgentApplyAuditDialog from './components/AgentApplyAuditDialog.vue';
import {
  batchAgentAccount,
  exportAgentAccounts,
  getAgentDetail,
  getAgentOptions,
  getAgentSummary,
  importAgentAccounts,
  listAgentAccounts,
  listTopAgentAccounts,
  switchAgentBind
} from '@/api/agent/account';
import { exportAgentApplies, getAgentApplyTabCounts, listApprovedApplies, listPendingApplies, listRejectedApplies } from '@/api/agent/apply';
import type { AgentAccountQuery, AgentAccountVO, AgentOptionsVO, AgentSummaryVO } from '@/api/agent/account/types';
import type { AgentApplyQuery, AgentApplyVO } from '@/api/agent/apply/types';

type AnyRow = AgentAccountVO & AgentApplyVO & Record<string, any>;

const { loading, withLoading } = useLoading(true);
const activeTab = ref('all');
const advanced = ref(false);
const dateRange = ref<[string, string] | null>(null);
const monthValue = ref<string>('');
const rows = ref<AnyRow[]>([]);
const total = ref(0);
const tabCounts = ref({ pending: 0, approved: 0, rejected: 0 });
const summaryRows = ref<AgentSummaryVO[]>([]);
const options = ref<AgentOptionsVO>({
  currencies: [],
  withdrawMethods: [],
  agentWays: [],
  registerSources: [],
  applyStatuses: [],
  modes: [],
  layers: [],
  labels: [],
  brands: []
});
// 雪花ID超出 JS 安全整数范围，必须原样透传字符串
const selectedIds = ref<Array<number | string>>([]);
const selectCurrentPage = ref(false);
const batchAction = ref('');
const batchForm = reactive<{ withdrawMethod?: number; layerId?: number; labelId?: number }>({});
const accountPanelRef = ref();
const applyPanelRef = ref();
const addDialogVisible = ref(false);
const modeDialogVisible = ref(false);
const moreDialogVisible = ref(false);
const moreAction = ref('parent');
const auditDialogVisible = ref(false);
const auditApplyIds = ref<Array<number | string>>([]);
const detailVisible = ref(false);
const detail = reactive<{ account?: AgentAccountVO; logs: AnyRow[]; children: number }>({ logs: [], children: 0 });
const current = ref<AnyRow>({} as AnyRow);

const query = ref<AgentAccountQuery & AgentApplyQuery>({
  pageNum: 1,
  pageSize: 100,
  timeScope: 'day',
  timeField: 'appliedAt',
  accountField: 'LOGIN_NAME'
});

const vipOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const isApplyTab = computed(() => ['pending', 'rejected', 'approved'].includes(activeTab.value));
const isTopTab = computed(() => activeTab.value === 'top');

const pageSubtotal = computed(() => {
  const sum = { directCount: 0, otherCount: 0, agentTotal: 0, subTotal: 0, totalCommission: 0, withdrawnAmount: 0, pendingAmount: 0 };
  rows.value.forEach((row) => {
    sum.directCount += Number(row.directCount ?? 0);
    sum.otherCount += Number(row.otherCount ?? 0);
    sum.agentTotal += Number(row.agentTotal ?? 0);
    sum.subTotal += Number(row.subTotal ?? 0);
    sum.totalCommission += Number(row.totalCommission ?? 0);
    sum.withdrawnAmount += Number(row.withdrawnAmount ?? 0);
    sum.pendingAmount += Number(row.pendingAmount ?? 0);
  });
  return sum;
});

/** 日期区间：按「日/周/月」联动默认范围（与截图时间粒度按钮一致） */
const applyScopeRange = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  const fmt = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  if (query.value.timeScope === 'week') {
    const start = new Date(now.getTime() - 6 * 24 * 3600 * 1000);
    dateRange.value = [fmt(start), fmt(now)];
  } else if (query.value.timeScope === 'month') {
    monthValue.value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  } else {
    dateRange.value = [fmt(now), fmt(now)];
  }
};

/** 组装时间过滤（日期补时分秒，避免与 datetime(3) 比较时漏掉当天数据） */
const buildTimeParams = () => {
  if (query.value.timeScope === 'month' && monthValue.value) {
    const [year, month] = monthValue.value.split('-').map((item) => Number(item));
    const lastDay = new Date(year, month, 0).getDate();
    return {
      beginTime: `${monthValue.value}-01 00:00:00`,
      endTime: `${monthValue.value}-${String(lastDay).padStart(2, '0')} 23:59:59`
    };
  }
  const range = dateRange.value ?? [new Date().toISOString().slice(0, 10), new Date().toISOString().slice(0, 10)];
  return { beginTime: `${range[0]} 00:00:00`, endTime: `${range[1]} 23:59:59` };
};

const buildParams = () => {
  const time = buildTimeParams();
  if (isApplyTab.value) {
    return {
      ...query.value,
      ...time,
      vipLevel: query.value.vipLevel === null || query.value.vipLevel === undefined ? undefined : query.value.vipLevel
    } as AgentApplyQuery;
  }
  return { ...query.value, ...time } as AgentAccountQuery;
};

const getList = async () => {
  selectCurrentPage.value = false;
  summaryRows.value = [];
  await withLoading(async () => {
    try {
      const params = buildParams();
      const res: any =
        activeTab.value === 'all'
          ? await listAgentAccounts(params as AgentAccountQuery)
          : activeTab.value === 'top'
            ? await listTopAgentAccounts(params as AgentAccountQuery)
            : activeTab.value === 'pending'
              ? await listPendingApplies(params as AgentApplyQuery)
              : activeTab.value === 'rejected'
                ? await listRejectedApplies(params as AgentApplyQuery)
                : await listApprovedApplies(params as AgentApplyQuery);
      rows.value = res?.rows ?? res?.data?.rows ?? [];
      total.value = res?.total ?? res?.data?.total ?? 0;
      handleSelectionChange([]);
    } catch (error) {
      rows.value = [];
      total.value = 0;
    }
  });
};

const loadTabCounts = async () => {
  try {
    const res: any = await getAgentApplyTabCounts();
    tabCounts.value = { pending: 0, approved: 0, rejected: 0, ...res?.data };
  } catch (error) {
    tabCounts.value = { pending: 0, approved: 0, rejected: 0 };
  }
};

const loadOptions = async () => {
  try {
    const res: any = await getAgentOptions();
    const data = (res?.data ?? {}) as AgentOptionsVO;
    options.value = { ...options.value, ...data };
    if (data.pageSize) {
      query.value.pageSize = Number(data.pageSize);
    }
  } catch (error) {
    // 保留空下拉，避免页面报错
  }
};

/** 总计：仅在用户点击「点击以计算总数」时请求，避免每次翻页做全表聚合 */
const loadSummary = async () => {
  try {
    const res: any = await getAgentSummary(isTopTab.value ? 'top' : 'all', query.value.currency);
    summaryRows.value = (res?.data ?? []) as AgentSummaryVO[];
  } catch (error) {
    summaryRows.value = [];
  }
};

const handleTabChange = () => {
  query.value.pageNum = 1;
  selectedIds.value = [];
  setDefaultRange();
  getList();
  loadTabCounts();
};

const handleScopeChange = () => {
  setDefaultRange();
};

const setDefaultRange = () => {
  monthValue.value = '';
  applyScopeRange();
};

const handleQuery = () => {
  query.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  query.value = {
    pageNum: 1,
    pageSize: options.value.pageSize ?? 100,
    timeScope: 'day',
    timeField: 'appliedAt',
    accountField: 'LOGIN_NAME'
  };
  advanced.value = false;
  batchAction.value = '';
  setDefaultRange();
  getList();
};

const refreshAll = () => {
  getList();
  loadTabCounts();
};

const afterWrite = (message: string) => {
  modal.msgSuccess(message || '操作成功');
  getList();
  loadTabCounts();
  loadSummary();
};

const afterApplyAudit = (message: string) => {
  modal.msgSuccess(message || '审核完成');
  getList();
  loadTabCounts();
  loadSummary();
};

const openAdd = () => {
  addDialogVisible.value = true;
};

const handleRowAction = async (payload: { action: string; row: AnyRow }) => {
  current.value = payload.row;
  if (payload.action === 'detail') {
    await openDetail(payload.row);
    return;
  }
  if (payload.action === 'mode') {
    modeDialogVisible.value = true;
    return;
  }
  if (payload.action === 'audit') {
    auditApplyIds.value = [payload.row.applyId];
    auditDialogVisible.value = true;
    return;
  }
  moreAction.value = payload.action;
  moreDialogVisible.value = true;
};

const openDetail = async (row: AnyRow) => {
  try {
    const res: any = await getAgentDetail(row.agentId);
    const data = res?.data ?? {};
    detail.account = data.account;
    detail.logs = data.logs ?? [];
    detail.children = data.children ?? 0;
    detailVisible.value = true;
  } catch (error) {
    modal.msgError('详情加载失败');
  }
};

/** 新下级绑定开关：开/关即时写库，失败时回滚开关显示 */
const handleBindSwitch = async (payload: { row: AnyRow; value: number }) => {
  try {
    await switchAgentBind({ agentId: payload.row.agentId, bindNewSub: payload.value });
    modal.msgSuccess(payload.value === 1 ? '已开启新下级绑定' : '已关闭新下级绑定');
  } catch (error) {
    payload.row.bindNewSub = payload.value === 1 ? 0 : 1;
  }
};

const handleSelectionChange = (selection: AnyRow[]) => {
  selectedIds.value = selection.map((item) => (isApplyTab.value ? item.applyId : item.agentId));
};

const toggleCurrentPage = () => {
  const panel: any = isApplyTab.value ? applyPanelRef.value : accountPanelRef.value;
  if (selectCurrentPage.value) {
    rows.value.forEach((row) => panel?.toggleRowSelection(row, true));
  } else {
    panel?.clearSelection();
    selectedIds.value = [];
  }
};

const onBatchActionChange = () => {
  if (selectedIds.value.length === 0) {
    return;
  }
};

const handleBatch = async () => {
  if (selectedIds.value.length === 0) {
    modal.msgWarning('请先选择需要操作的数据');
    return;
  }
  if (isApplyTab.value) {
    if (activeTab.value !== 'pending') {
      modal.msgWarning('仅「专业代理待审核」页签支持批量审核');
      return;
    }
    auditApplyIds.value = [...selectedIds.value];
    auditDialogVisible.value = true;
    return;
  }
  if (!batchAction.value) {
    modal.msgWarning('请选择批量操作类型');
    return;
  }
  const action = batchAction.value;
  const payload: Record<string, any> = { ids: selectedIds.value };
  if (action === 'withdrawMethod') {
    if (!batchForm.withdrawMethod) {
      modal.msgWarning('请选择提现方式');
      return;
    }
    payload.action = 'withdrawMethod';
    payload.withdrawMethod = batchForm.withdrawMethod;
  } else if (action === 'layer') {
    if (!batchForm.layerId) {
      modal.msgWarning('请选择层级');
      return;
    }
    payload.action = 'layer';
    payload.layerId = batchForm.layerId;
  } else if (action === 'label') {
    if (!batchForm.labelId) {
      modal.msgWarning('请选择标签');
      return;
    }
    payload.action = 'label';
    payload.labelId = batchForm.labelId;
  } else if (action === 'status0' || action === 'status1') {
    payload.action = 'status';
    payload.status = action === 'status1' ? 1 : 0;
  } else {
    payload.action = 'remove';
  }
  try {
    await modal.confirm(`确认对已选 ${selectedIds.value.length} 条数据执行该操作？`);
  } catch {
    return;
  }
  try {
    const res: any = await batchAgentAccount(payload as any);
    modal.msgSuccess(`操作成功（影响 ${res?.data ?? 0} 条）`);
    selectCurrentPage.value = false;
    getList();
    loadSummary();
  } catch (error) {
    // 统一错误提示
  }
};

const triggerImport = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    try {
      const res: any = await importAgentAccounts(file);
      const data = res?.data ?? {};
      if (data.fail > 0) {
        modal.alert(`导入完成：成功 ${data.success} 行，失败 ${data.fail} 行\n${data.failDetail || ''}`);
      } else {
        modal.msgSuccess(`导入完成：成功 ${data.success} 行`);
      }
      getList();
    } catch (error) {
      // 统一错误提示
    }
  };
  input.click();
};

const handleExport = async () => {
  try {
    const params = buildParams();
    const blob: any = isApplyTab.value
      ? await exportAgentApplies(activeTab.value === 'approved' ? 2 : activeTab.value === 'rejected' ? 3 : 1, params as AgentApplyQuery)
      : await exportAgentAccounts(activeTab.value, params as AgentAccountQuery);
    saveBlob(blob, `代理_${activeTab.value}_${Date.now()}.csv`);
  } catch (error) {
    modal.msgError('导出失败，请稍后重试');
  }
};

const formatMoney = (value?: number) => ((Number(value ?? 0) / 100).toFixed(2));

onMounted(async () => {
  setDefaultRange();
  await loadOptions();
  await loadTabCounts();
  await getList();
});
</script>

<style scoped>
.search-panel {
  margin-bottom: 8px;
}

.query-form {
  margin-top: 4px;
}

.range-sep {
  margin: 0 6px;
}

.toolbar-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 8px;
}

.summary-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-top: 10px;
  padding: 8px 12px;
  background: #fafafa;
  border: 1px solid #ebeef5;
  font-size: 13px;
}

.summary-label {
  font-weight: 600;
}

.batch-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}

.tab-badge {
  margin-left: 6px;
  margin-top: -2px;
}
</style>
