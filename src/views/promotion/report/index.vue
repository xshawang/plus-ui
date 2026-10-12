<template>
  <div class="p-2 app-container promotion-report-page">
    <el-card shadow="hover">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>优惠明细与统计</h3>
            <p>统计口径：已领取人数按会员去重，领取次数含同一会员多次领取；总计行为服务端汇总，不受分页影响。</p>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="优惠统计" name="statistic" />
        <el-tab-pane label="会员优惠明细" name="member" />
        <el-tab-pane label="主播号优惠明细" name="streamer" />
        <el-tab-pane label="发放对账" name="reconcile" />
      </el-tabs>

      <!-- 发放对账（L12：发放单 / 钱包流水 / 稽核任务 三方对账） -->
      <template v-if="activeTab === 'reconcile'">
        <el-form inline class="query-bar">
          <el-form-item label="跑批日">
            <el-date-picker v-model="reconcileQuery.runDate" type="date" value-format="YYYY-MM-DD" placeholder="默认 T-1" style="width: 160px" />
          </el-form-item>
          <el-form-item label="差异类型">
            <el-select v-model="reconcileQuery.diffType" placeholder="全部" clearable style="width: 220px">
              <el-option v-for="item in diffTypes" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="处理状态">
            <el-select v-model="reconcileQuery.status" placeholder="全部" clearable style="width: 140px">
              <el-option label="待处理" :value="1" />
              <el-option label="已处理" :value="2" />
              <el-option label="已忽略" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="单号">
            <el-input v-model="reconcileQuery.orderNo" placeholder="请输入单号" clearable style="width: 200px" />
          </el-form-item>
          <el-form-item label="会员账号">
            <el-input v-model="reconcileQuery.account" placeholder="请输入会员账号" clearable style="width: 160px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="loadReconcile">搜索</el-button>
            <el-button icon="Refresh" @click="resetReconcile">重置</el-button>
            <el-button v-hasPermi="['promotion:report:export']" type="warning" :loading="reconcileRunning" @click="runReconcile">
              执行对账跑批
            </el-button>
          </el-form-item>
        </el-form>
        <el-alert
          type="info"
          :closable="false"
          show-icon
          class="stat-tip"
          title="对账锚点：发放单号 = 钱包 biz_no = 稽核 source_no；「钱包已到账但发放单未置已领取」可一键修复（不产生资金变动），其余类型需人工核对。"
        />
        <el-table v-loading="loading" border :data="reconcileRows">
          <el-table-column label="跑批日" prop="runDate" align="center" width="110" />
          <el-table-column label="差异类型" align="center" width="200">
            <template #default="{ row }">
              <el-tag :type="diffTag(row.diffType)">{{ diffText(row.diffType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="单号" prop="orderNo" align="center" min-width="190" show-overflow-tooltip />
          <el-table-column label="会员账号" prop="account" align="center" width="140" />
          <el-table-column label="优惠名称" prop="activityName" min-width="150" show-overflow-tooltip />
          <el-table-column label="奖励金额" align="right" width="130">
            <template #default="{ row }">{{ fmtMoney(row.rewardAmount) }}</template>
          </el-table-column>
          <el-table-column label="钱包流水" align="right" width="130">
            <template #default="{ row }">{{ fmtMoney(row.ledgerAmount) }}</template>
          </el-table-column>
          <el-table-column label="差异说明" prop="detail" min-width="220" show-overflow-tooltip />
          <el-table-column label="处理状态" align="center" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'warning' : row.status === 2 ? 'success' : 'info'">
                {{ row.status === 1 ? '待处理' : row.status === 2 ? '已处理' : '已忽略' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="处理人" prop="handler" align="center" width="120" />
          <el-table-column label="处理备注" prop="remark" min-width="180" show-overflow-tooltip />
          <el-table-column label="操作" align="center" width="220" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.diffType === 'LEDGER_WITHOUT_CLAIM' && row.status === 1"
                v-hasPermi="['promotion:grant:audit']"
                link
                type="primary"
                @click="repairReconcile(row as PromoGrantReconcileVO)"
              >
                一键修复
              </el-button>
              <el-button v-if="row.status === 1" v-hasPermi="['promotion:grant:audit']" link type="success" @click="handleReconcile(row as PromoGrantReconcileVO, 2)">
                标记已处理
              </el-button>
              <el-button v-if="row.status === 1" v-hasPermi="['promotion:grant:audit']" link type="info" @click="handleReconcile(row as PromoGrantReconcileVO, 3)">
                忽略
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="summary-bar">共 {{ total }} 条差异</div>
        <pagination
          v-show="total > 0"
          v-model:page="reconcileQuery.pageNum"
          v-model:limit="reconcileQuery.pageSize"
          :total="total"
          @pagination="loadReconcile"
        />
      </template>

      <el-form v-if="activeTab !== 'reconcile'" :model="query" inline class="query-bar">
        <el-form-item label="优惠ID">
          <el-input-number v-model="query.activityId" :min="0" :controls="false" placeholder="活动ID" style="width: 140px" />
        </el-form-item>
        <el-form-item label="优惠名称">
          <el-input v-model="query.activityName" placeholder="请输入优惠名称" clearable style="width: 180px" />
        </el-form-item>
        <el-form-item v-if="activeTab !== 'statistic'" label="会员账号">
          <el-input v-model="query.account" placeholder="请输入会员账号" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item v-if="activeTab !== 'statistic'" label="优惠来源">
          <el-select v-model="query.source" placeholder="全部来源" clearable style="width: 160px">
            <el-option v-for="item in sourceOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 380px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleSearch">搜索</el-button>
          <el-button icon="Refresh" @click="handleReset">重置</el-button>
          <el-button v-hasPermi="['promotion:report:export']" icon="Download" @click="handleExport">导出报表</el-button>
        </el-form-item>
      </el-form>

      <el-alert
        v-if="activeTab === 'statistic'"
        type="warning"
        :closable="false"
        show-icon
        class="stat-tip"
        title="已领取人数：已领取/派发到账总人数；可参与人数：符合活动条件的总人数；已领取金额：已领取/派发到账总金额；活动金额：活动设置总金额/派发/已领取总金额"
      />

      <!-- 优惠统计 -->
      <el-table v-if="activeTab === 'statistic'" v-loading="loading" border :data="statRows" show-summary :summary-method="statSummary">
        <el-table-column label="活动ID" prop="activityId" align="center" width="110" />
        <el-table-column label="活动名称" prop="activityName" min-width="200" show-overflow-tooltip />
        <el-table-column label="会员币种" prop="currency" align="center" width="110" />
        <el-table-column label="活动类型" prop="activityType" align="center" width="140" show-overflow-tooltip />
        <el-table-column label="已领取人数" prop="claimedUsers" align="right" width="120" />
        <el-table-column label="领取次数" prop="claimTimes" align="right" width="110" />
        <el-table-column label="可参与人数" prop="joinableUsers" align="right" width="120" />
        <el-table-column label="已领取金额" align="right" width="140">
          <template #default="{ row }">{{ fmtMoney(row.claimedAmount) }}</template>
        </el-table-column>
        <el-table-column label="活动金额" align="right" width="140">
          <template #default="{ row }">{{ fmtMoney(row.activityAmount) }}</template>
        </el-table-column>
      </el-table>

      <!-- 会员 / 主播号优惠明细 -->
      <el-table v-else v-loading="loading" border :data="detailRows">
        <el-table-column v-if="activeTab === 'streamer'" label="主播号ID" prop="streamerId" align="center" width="120" />
        <el-table-column v-if="activeTab === 'streamer'" label="主播号" prop="streamerName" align="center" width="140" />
        <el-table-column label="单号" prop="orderNo" align="center" min-width="190" show-overflow-tooltip />
        <el-table-column label="优惠ID" prop="activityId" align="center" width="100" />
        <el-table-column label="优惠名称" prop="activityName" min-width="180" show-overflow-tooltip />
        <el-table-column label="会员账号" prop="account" align="center" width="140" />
        <el-table-column label="优惠来源" prop="source" align="center" width="120" />
        <el-table-column label="奖励金额" align="right" width="130">
          <template #default="{ row }">{{ fmtMoney(row.rewardAmount) }}</template>
        </el-table-column>
        <el-table-column label="奖励说明" prop="rewardDesc" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="派发方式" prop="dispatchMode" align="center" width="130" />
        <el-table-column label="创建时间" prop="createdAt" align="center" width="170" />
      </el-table>

      <div class="summary-bar">
        本页小计：{{ activeTab === 'statistic' ? fmtMoney(statTotal.claimedAmount) : fmtMoney(detailSummary.totalAmount) }}
        （{{ activeTab === 'statistic' ? statTotal.claimedUsers : detailSummary.totalCount }} 条口径）
      </div>

      <pagination
        v-if="activeTab !== 'statistic'"
        v-show="total > 0"
        v-model:page="query.pageNum"
        v-model:limit="query.pageSize"
        :total="total"
        @pagination="loadRows"
      />
    </el-card>
  </div>
</template>

<script setup name="PromotionReport" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import {
  getPromoDetailSummary,
  getPromoStatistic,
  listPromoMemberDetail,
  listPromoSourceOptions,
  listPromoStreamerDetail,
  type PromoReportQuery
} from '@/api/promotion/report';
import {
  handlePromoGrantReconcile,
  listPromoGrantReconcile,
  repairPromoGrantReconcile,
  runPromoGrantReconcile
} from '@/api/promotion/grant';
import type { PromoGrantReconcileQuery, PromoGrantReconcileVO } from '@/api/promotion/grant/types';

/**
 * 优惠明细与统计页（需求文档 08、01 §3.4）。
 *
 * 为什么统计三个页签放一个页面：三者共享同一筛选栏与同一份「已领取」口径，
 * 拆成三个页面会让筛选条件与状态文案各写一份，出现"统计与明细对不上"的经典问题。
 */
type PageBody<T> = { rows?: T[]; total?: number };
type Row = Record<string, any>;

const { loading, withLoading } = useLoading();
const activeTab = ref('statistic');
const timeRange = ref<string[]>([]);
const sourceOptions = ref<string[]>([]);
const statRows = ref<Row[]>([]);
const detailRows = ref<Row[]>([]);
const total = ref(0);
const statTotal = reactive<Row>({ claimedUsers: 0, claimTimes: 0, joinableUsers: 0, claimedAmount: 0, activityAmount: 0 });
const detailSummary = reactive<Row>({ totalCount: 0, totalAmount: 0 });

/** 发放对账（L12） */
const reconcileRows = ref<PromoGrantReconcileVO[]>([]);
const reconcileRunning = ref(false);
const reconcileQuery = reactive<PromoGrantReconcileQuery & { pageNum: number; pageSize: number }>({ pageNum: 1, pageSize: 10 });
const diffTypes = [
  { label: '钱包已到账但发放单未置已领取', value: 'LEDGER_WITHOUT_CLAIM' },
  { label: '已置已领取但钱包无流水', value: 'CLAIM_WITHOUT_LEDGER' },
  { label: '流水金额与发放单不一致', value: 'LEDGER_AMOUNT_MISMATCH' },
  { label: '缺少打码稽核任务', value: 'CLAIM_WITHOUT_TURNOVER' },
  { label: '待领取已过期未流转', value: 'EXPIRED_NOT_MARKED' },
  { label: '派发失败重试已达上限', value: 'RETRY_EXHAUSTED' }
];

const diffText = (type?: string) => diffTypes.find((item) => item.value === type)?.label ?? type ?? '';

const diffTag = (type?: string) => (type === 'LEDGER_WITHOUT_CLAIM' ? 'danger' : type === 'CLAIM_WITHOUT_LEDGER' ? 'danger' : 'warning');

const query = reactive<PromoReportQuery & { pageNum: number; pageSize: number }>({
  pageNum: 1,
  pageSize: 10
});

const fmtMoney = (value?: number) => (value === undefined || value === null ? '-' : (Number(value) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 }));

const statusText = (status?: number) =>
  ({ 0: '待申请', 1: '待审核', 2: '待领取', 3: '已领取', 4: '被拒绝', 5: '已过期', 6: '不符合条件', 7: '派发失败' } as Record<number, string>)[status ?? -1] ?? '未知';

const statusTag = (status?: number) => {
  if (status === 3) return 'success';
  if (status === 1 || status === 2) return 'warning';
  if (status === 4 || status === 6) return 'danger';
  return 'info';
};

const statSummary = () => ['总计', '', '', '', statTotal.claimedUsers, statTotal.claimTimes, statTotal.joinableUsers, fmtMoney(statTotal.claimedAmount), fmtMoney(statTotal.activityAmount)];

const buildParams = (): PromoReportQuery & { pageNum: number; pageSize: number } => ({
  ...query,
  timeStart: timeRange.value?.[0],
  timeEnd: timeRange.value?.[1]
});

const loadRows = async () => {
  await withLoading(async () => {
    const params = buildParams();
    if (activeTab.value === 'statistic') {
      const res = (await getPromoStatistic(params)) as { data?: { rows?: Row[]; total?: Row } };
      statRows.value = res.data?.rows ?? [];
      Object.assign(statTotal, res.data?.total ?? {});
      return;
    }
    const fetcher = activeTab.value === 'member' ? listPromoMemberDetail : listPromoStreamerDetail;
    const res = (await fetcher(params)) as PageBody<Row>;
    detailRows.value = res.rows ?? [];
    total.value = res.total ?? 0;
    const summary = (await getPromoDetailSummary(params)) as { data?: Row };
    Object.assign(detailSummary, summary.data ?? {});
  });
};

const handleTabChange = () => {
  query.pageNum = 1;
  detailRows.value = [];
  total.value = 0;
  if (activeTab.value === 'reconcile') {
    reconcileQuery.pageNum = 1;
    loadReconcile();
    return;
  }
  loadRows();
};

/** 对账明细 */
const loadReconcile = async () => {
  await withLoading(async () => {
    const res = (await listPromoGrantReconcile(reconcileQuery)) as PageBody<PromoGrantReconcileVO>;
    reconcileRows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  });
};

/** 执行对账跑批（不选日期时后端按配置取 T-1；页面默认取当天便于立即核对） */
const runReconcile = async () => {
  reconcileRunning.value = true;
  try {
    const day = reconcileQuery.runDate ?? new Date().toISOString().slice(0, 10);
    const res = (await runPromoGrantReconcile(day)) as { data?: Row };
    modal.msgSuccess(`对账跑批完成（${res.data?.runDate ?? day}）：差异 ${res.data?.total ?? 0} 条`);
    reconcileQuery.runDate = String(res.data?.runDate ?? day);
    await loadReconcile();
  } finally {
    reconcileRunning.value = false;
  }
};

const resetReconcile = () => {
  Object.assign(reconcileQuery, { pageNum: 1, pageSize: 10, runDate: undefined, diffType: undefined, status: undefined, orderNo: undefined, account: undefined });
  loadReconcile();
};

/** 一键修复：仅「钱包已到账但未置已领取」，后端会先用钱包流水复核 */
const repairReconcile = async (row: PromoGrantReconcileVO) => {
  await modal.confirm(`确认按钱包流水修复单号 ${row.orderNo}（把发放单置为已领取，不产生资金变动）？`);
  const res = (await repairPromoGrantReconcile(row.id)) as { data?: Row };
  modal.msgSuccess(String(res.data?.message ?? '修复完成'));
  await loadReconcile();
};

const handleReconcile = async (row: PromoGrantReconcileVO, status: number) => {
  // modal.prompt 解析为 { value, action }（Element Plus MessageBoxData），取值必须用 .value
  const input = await modal.prompt(status === 2 ? '请输入处理说明' : '请输入忽略原因');
  const remark = String(input?.value ?? '');
  if (!remark) {
    modal.msgWarning('必须填写说明');
    return;
  }
  await handlePromoGrantReconcile(row.id, status, remark);
  modal.msgSuccess('处理完成');
  await loadReconcile();
};

const handleSearch = () => {
  query.pageNum = 1;
  loadRows();
};

const handleReset = () => {
  Object.assign(query, { pageNum: 1, pageSize: 10, activityId: undefined, activityName: undefined, account: undefined, source: undefined });
  timeRange.value = [];
  loadRows();
};

const handleExport = () => {
  // 导出与页面口径一致：直接复用当前查询条件，后端按同一 SQL 输出（本次落地为同条件拉取后本地下载）
  const rows = activeTab.value === 'statistic' ? statRows.value : detailRows.value;
  if (!rows.length) {
    modal.msgWarning('当前筛选无数据可导出');
    return;
  }
  const header = Object.keys(rows[0]);
  const csv = [header.join(','), ...rows.map((row) => header.map((key) => `"${row[key] ?? ''}"`).join(','))].join('\n');
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${activeTab.value}-report.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

onMounted(async () => {
  const res = (await listPromoSourceOptions()) as { data?: string[] };
  sourceOptions.value = res.data ?? [];
  await loadRows();
});
</script>

<style scoped>
.toolbar-shell {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.table-heading h3 {
  margin: 0 0 4px;
}

.table-heading p {
  margin: 0;
  color: #909399;
  font-size: 12px;
}

.query-bar {
  margin-top: 8px;
}

.stat-tip {
  margin: 8px 0;
}

.summary-bar {
  margin-top: 8px;
  color: #606266;
  font-size: 13px;
}
</style>
