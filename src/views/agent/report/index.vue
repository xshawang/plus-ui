<template>
  <div class="p-2 app-container">
    <el-card shadow="hover">
      <el-tabs v-model="tab">
        <el-tab-pane v-if="!isAgent" label="代理总结算" name="settle" lazy>
          <AgentReportTable code="settle" date-label="结算日期" :show-accounts="false" :columns="settleCols" />
        </el-tab-pane>
        <el-tab-pane label="代理总明细" name="detail" lazy>
          <AgentReportTable code="detail" date-label="结算日期" drill="orderNo" :columns="detailCols" show-line-type @drill="openOrder" />
        </el-tab-pane>
        <el-tab-pane label="会员直属明细" name="member-direct" lazy>
          <AgentReportTable code="member-direct" date-label="结算日期" :columns="memberCols(false)" show-line-type />
        </el-tab-pane>
        <el-tab-pane v-if="!isHumanLower" label="会员其他明细" name="member-other" lazy>
          <AgentReportTable code="member-other" date-label="结算日期" :columns="memberCols(true)" show-line-type />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 佣金单大类业绩下钻（截图：直属/其他业绩按大类弹窗） -->
    <el-dialog v-model="orderVisible" :title="`佣金单 ${orderNo} · 按大类业绩`" width="760px" append-to-body>
      <el-table v-loading="orderLoading" :data="orderRows" border size="small" empty-text="暂无明细">
        <el-table-column label="返佣大类" prop="categoryName" align="center" />
        <el-table-column label="直属业绩" align="center"><template #default="{ row }">{{ money(row.directPerf) }}</template></el-table-column>
        <el-table-column label="其他业绩" align="center"><template #default="{ row }">{{ money(row.otherPerf) }}</template></el-table-column>
        <el-table-column label="直属佣金" align="center">
          <template #default="{ row }">{{ money(row.directCommission) }}</template>
        </el-table-column>
        <el-table-column label="其他佣金" align="center">
          <template #default="{ row }">{{ money(row.otherCommission) }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup name="AgentReport" lang="ts">
import { computed, ref } from 'vue';
import AgentReportTable from '../components/AgentReportTable.vue';
import { listReport } from '@/api/agent/refactor';
import { BATCH_STATUS_MAP, LINE_MAP, ORDER_STATUS_MAP, PERIOD_MAP } from '../components/reportColumns';
import type { ReportCol } from '../components/reportColumns';
import { useUserStore } from '@/store/modules/user';

/**
 * 代理报表（方案 §12）：总结算（结算日×模式×周期）、总明细（结算日×代理，订单下钻到大类业绩）、
 * 会员直属/其他明细（结算日×会员×受益代理，来源 = 佣金明细）。
 */
const userStore = useUserStore();
const isAgent = computed(() => Boolean(userStore.agentId));
const isHumanLower = computed(
  () => isAgent.value && !userStore.agentTop && Number(userStore.agentType) === 1
);
const tab = ref(isAgent.value ? 'detail' : 'settle');
const orderVisible = ref(false);
const orderLoading = ref(false);
const orderNo = ref('');
const orderRows = ref<any[]>([]);

const money = (v: any) => (Number(v ?? 0) / 100).toFixed(2);

const settleCols: ReportCol[] = [
  { label: '结算日期', prop: 'settleDate', kind: 'text' },
  { label: '周期起', prop: 'periodStart', kind: 'text' },
  { label: '代理模式', prop: 'modeName', kind: 'text' },
  { label: '结算周期', prop: 'settlePeriod', kind: 'map', map: PERIOD_MAP },
  { label: '批次状态', prop: 'status', kind: 'map', map: BATCH_STATUS_MAP },
  { label: '结算时间', prop: 'settleTime', kind: 'text', width: 170 },
  { label: '代理人数', prop: 'agentCount', kind: 'num' },
  { label: '结算佣金', prop: 'settleCommission', kind: 'money', sortable: true },
  { label: '实发佣金', prop: 'actualCommission', kind: 'money' },
  { label: '已领取', prop: 'claimedCommission', kind: 'money' },
  { label: '批次号', prop: 'batchNo', kind: 'text', width: 200 }
];

const detailCols: ReportCol[] = [
  { label: '结算日期', prop: 'settleDate', kind: 'text' },
  { label: '佣金单号', prop: 'orderNo', kind: 'text', width: 190 },
  { label: '代理账号', prop: 'loginName', kind: 'text' },
  { label: '代理类型', prop: 'agentType', kind: 'map', map: LINE_MAP },
  { label: '等级', prop: 'levelNo', kind: 'text', width: 70 },
  { label: '代理模式', prop: 'modeName', kind: 'text' },
  { label: '周期', prop: 'settlePeriod', kind: 'map', map: PERIOD_MAP },
  { label: '直属贡献数', prop: 'directContribCnt', kind: 'num' },
  { label: '其他贡献数', prop: 'otherContribCnt', kind: 'num' },
  { label: '本期业绩', prop: 'totalPerf', kind: 'money' },
  { label: '上期结余', prop: 'lastBalance', kind: 'money' },
  { label: '直属业绩', prop: 'directPerf', kind: 'money' },
  { label: '其他业绩', prop: 'otherPerf', kind: 'money' },
  { label: '直属佣金', prop: 'directCommission', kind: 'money' },
  { label: '其他佣金', prop: 'otherCommission', kind: 'money' },
  { label: '奖励佣金', prop: 'bonusCommission', kind: 'money' },
  { label: '上限截断', prop: 'capCut', kind: 'money' },
  { label: '结算(应发)', prop: 'settleCommission', kind: 'money', sortable: true },
  { label: '实发', prop: 'actualCommission', kind: 'money' },
  { label: '状态', prop: 'status', kind: 'map', map: ORDER_STATUS_MAP }
];

const memberCols = (other: boolean): ReportCol[] => [
  { label: '结算日期', prop: 'settleDate', kind: 'text' },
  { label: '会员ID', prop: 'uid', kind: 'text', width: 150 },
  { label: '受益代理', prop: 'loginName', kind: 'text' },
  { label: '代理模式', prop: 'modeName', kind: 'text' },
  { label: '周期', prop: 'settlePeriod', kind: 'map', map: PERIOD_MAP },
  { label: '关系层数', prop: 'relationDepth', kind: 'text', format: (r) => (Number(r.relationDepth) <= 1 ? '直属' : `第 ${r.relationDepth} 层`) },
  ...(other ? [{ label: '最近受益代理', prop: 'nearestLoginName', kind: 'text' } as ReportCol] : []),
  { label: '贡献业绩', prop: 'contribPerf', kind: 'money', sortable: true },
  { label: '充值', prop: 'rechargeAmount', kind: 'money' },
  { label: '提现', prop: 'withdrawAmount', kind: 'money' },
  { label: '使用比例', prop: 'selfRate', kind: 'rate', noSum: true },
  ...(other ? [{ label: '扣减下方比例', prop: 'lowerUsedRate', kind: 'rate', noSum: true } as ReportCol] : []),
  { label: other ? '极差佣金' : '直属佣金', prop: 'commission', kind: 'money', sortable: true }
];

const openOrder = async (row: any) => {
  orderNo.value = row.orderNo;
  orderVisible.value = true;
  orderLoading.value = true;
  try {
    const res: any = await listReport('order-category', { orderNo: row.orderNo, pageSize: 100 });
    orderRows.value = res?.rows ?? [];
  } catch {
    orderRows.value = [];
  } finally {
    orderLoading.value = false;
  }
};
</script>
