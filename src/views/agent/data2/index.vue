<template>
  <div class="p-2 app-container">
    <el-card shadow="hover">
      <el-tabs v-model="tab">
        <el-tab-pane v-if="!isAgent" label="代理模式报表" name="mode" lazy>
          <AgentReportTable code="mode" :show-accounts="false" :columns="modeCols" show-line-type />
        </el-tab-pane>
        <el-tab-pane v-if="!isAgent" label="顶层代理报表" name="top" lazy>
          <AgentReportTable code="top" :columns="topCols" show-line-type />
        </el-tab-pane>
        <el-tab-pane label="代理数据报表" name="data" lazy>
          <AgentReportTable code="data" show-scope :columns="dataCols" show-line-type />
        </el-tab-pane>
        <el-tab-pane label="代理个人报表" name="personal" lazy>
          <AgentReportTable code="personal" :columns="personalCols" show-line-type />
        </el-tab-pane>
        <el-tab-pane label="下级投注" name="sub-bet" lazy>
          <AgentReportTable v-if="ready" code="sub-bet" show-scope :columns="pivotCols('validBet', 'betUsers', '有效投注', '人次')" show-line-type />
        </el-tab-pane>
        <el-tab-pane label="下级输赢" name="sub-winloss" lazy>
          <AgentReportTable v-if="ready" code="sub-winloss" show-scope :columns="pivotCols('winLoss', 'betCount', '输赢', '注单数')" show-line-type />
        </el-tab-pane>
        <el-tab-pane label="下级财务" name="sub-finance" lazy>
          <AgentReportTable code="sub-finance" show-scope :columns="financeCols" show-line-type />
        </el-tab-pane>
        <el-tab-pane label="下级领取" name="sub-claim" lazy>
          <AgentReportTable code="sub-claim" show-scope :columns="claimCols" show-line-type />
        </el-tab-pane>
        <el-tab-pane label="下级充值留存" name="retain-1" lazy>
          <AgentReportTable code="retain" date-label="批次日期" :params="{ retType: 1 }" :columns="retain" show-line-type />
        </el-tab-pane>
        <el-tab-pane label="下级投注留存" name="retain-2" lazy>
          <AgentReportTable code="retain" date-label="批次日期" :params="{ retType: 2 }" :columns="retain" show-line-type />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup name="AgentData2" lang="ts">
import { computed, onMounted, ref } from 'vue';
import AgentReportTable from '../components/AgentReportTable.vue';
import { getReportMeta } from '@/api/agent/refactor';
import {
  AGENT_COLS,
  CLAIM_ITEMS,
  COMM_COLS,
  CONVERT_COL,
  FIN_COLS,
  GAME_COLS,
  NEW_USERS,
  PERIOD_MAP,
  retainCols
} from '../components/reportColumns';
import type { ReportCol } from '../components/reportColumns';
import { useUserStore } from '@/store/modules/user';

/**
 * 代理数据2（方案 §12）：模式 / 顶层 / 代理数据 / 个人 / 下级投注·输赢（按返佣大类透视）/ 下级财务 / 下级领取（14 项归 6 类）/ 留存。
 * 区间内人数类指标为逐日相加的“人次”；留存为批次口径，留存任务（P2）上线前为空表。
 */
const userStore = useUserStore();
const isAgent = computed(() => Boolean(userStore.agentId));
const tab = ref(isAgent.value ? 'data' : 'mode');
const ready = ref(false);
const categories = ref<Array<{ categoryCode: number | string; categoryName: string }>>([]);

const modeCols: ReportCol[] = [
  { label: '代理模式', prop: 'modeName', kind: 'text' },
  { label: '结算周期', prop: 'settlePeriod', kind: 'map', map: PERIOD_MAP },
  { label: '总顶层', prop: 'topAgents', kind: 'num' },
  { label: '总代理', prop: 'totalAgents', kind: 'num' },
  { label: '新增代理', prop: 'newAgents', kind: 'num' },
  ...COMM_COLS,
  ...GAME_COLS,
  NEW_USERS,
  ...FIN_COLS,
  CONVERT_COL
];

const topCols: ReportCol[] = [
  ...AGENT_COLS,
  { label: '下级层数', prop: 'subLayerCount', kind: 'num', noSum: true },
  { label: '代理人数', prop: 'agentTotal', kind: 'num' },
  { label: '下级总数', prop: 'subTotal', kind: 'num' },
  { label: '新增代理', prop: 'newAgents', kind: 'num' },
  ...COMM_COLS,
  ...GAME_COLS,
  NEW_USERS,
  ...FIN_COLS,
  CONVERT_COL
];

const dataCols: ReportCol[] = [
  ...AGENT_COLS,
  { label: '等级', prop: 'levelNo', kind: 'text', width: 70 },
  { label: '直属人数', prop: 'directCnt', kind: 'num' },
  { label: '有效直属', prop: 'validDirectCnt', kind: 'num' },
  { label: '其他人数', prop: 'otherCnt', kind: 'num' },
  ...COMM_COLS,
  ...GAME_COLS,
  NEW_USERS,
  ...FIN_COLS
];

const personalCols: ReportCol[] = [...AGENT_COLS, ...GAME_COLS, ...FIN_COLS];

const financeCols: ReportCol[] = [...AGENT_COLS, NEW_USERS, ...FIN_COLS];

const claimCols: ReportCol[] = [
  ...AGENT_COLS,
  { label: '领取总额', prop: 'claimAmount', kind: 'money', sortable: true },
  { label: '领取次数', prop: 'claimCount', kind: 'num' },
  ...Object.entries(CLAIM_ITEMS).map(
    ([k, name]) =>
      ({
        label: name,
        prop: `claims.${k}.amount`,
        kind: 'text',
        noSum: true,
        format: (r: any) => {
          const c = r.claims?.[k];
          return c ? `${(Number(c.amount) / 100).toFixed(2)}（${c.count}）` : '0.00（0）';
        }
      }) as ReportCol
  )
];

const retain = retainCols();

/** 大类透视列：总数 + 每个大类“指标(次数)” */
const pivotCols = (metric: string, count: string, metricName: string, countName: string): ReportCol[] => [
  ...AGENT_COLS,
  { label: `总${metricName}`, prop: metric, kind: 'money', sortable: true, platformWin: metric === 'winLoss' },
  { label: `总${countName}`, prop: count, kind: 'num' },
  ...categories.value.map(
    (c) =>
      ({
        label: c.categoryName,
        prop: `${metric}${c.categoryCode}`,
        kind: 'text',
        noSum: true,
        format: (r: any) => `${(Number(r[`${metric}${c.categoryCode}`] ?? 0) / 100).toFixed(2)}（${r[`${count}${c.categoryCode}`] ?? 0}）`
      }) as ReportCol
  )
];

onMounted(async () => {
  try {
    const res: any = await getReportMeta();
    categories.value = res?.data?.categories ?? [];
  } catch {
    categories.value = [];
  } finally {
    ready.value = true;
  }
});
</script>
