<template>
  <div class="p-2 app-container member-bet-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="时间">
          <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD"
                          range-separator="-" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 280px" />
        </el-form-item>
        <el-form-item label="会员">
          <el-select v-model="query.accountField" style="width: 120px">
            <el-option label="会员账号" value="LOGIN_NAME" />
            <el-option label="会员ID" value="UID" />
          </el-select>
          <el-input v-model="query.accountValue" placeholder="账号或UID" clearable style="width: 190px" @keyup.enter="getList" />
        </el-form-item>
        <el-form-item label="游戏">
          <el-select v-model="query.gameCode" placeholder="全部" clearable filterable style="width: 160px">
            <el-option v-for="g in gameOptions" :key="g.value" :label="g.label" :value="g.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="getList">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          <el-button plain @click="toggleCumulative">{{ showCumulative ? '隐藏累计' : '显示累计' }}</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="showCumulative" shadow="hover" class="summary-panel">
      <div class="cumulative">
        <span>累计投注：<b>{{ fmt(cumulative.betAmount) }}</b></span>
        <span>累计派发：<b>{{ fmt(cumulative.payoutAmount) }}</b></span>
        <span>累计差额：<b :class="diffClass(cumulative.netWinLoss)">{{ fmt(cumulative.netWinLoss) }}</b></span>
      </div>
    </el-card>

    <el-card shadow="hover" class="summary-panel">
      <template #header><div class="table-heading"><h3>按游戏汇总</h3></div></template>
      <el-table :data="gameSummary" border size="small">
        <el-table-column label="游戏编码" prop="gameCode" width="140" />
        <el-table-column label="游戏名称" prop="gameName" min-width="180" show-overflow-tooltip />
        <el-table-column label="投注金额" align="right" width="150">
          <template #default="{ row }">{{ fmt(row.betAmount) }}</template>
        </el-table-column>
        <el-table-column label="派发金额" align="right" width="150">
          <template #default="{ row }">{{ fmt(row.payoutAmount) }}</template>
        </el-table-column>
        <el-table-column label="有效投注" align="right" width="150">
          <template #default="{ row }">{{ fmt(row.validBetAmount) }}</template>
        </el-table-column>
        <el-table-column label="盈亏金额" align="right" width="150">
          <template #default="{ row }">
            <span :class="diffClass(row.netWinLoss)">{{ fmt(row.netWinLoss) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="table-heading">
          <h3>会员投注细目</h3>
          <span class="tip">数据源：user_game_daily_summary（T+1，GMT+8）；盈亏 = 派发 - 投注</span>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="会员账号(ID)" align="center" width="190">
          <template #default="{ row }">
            <div>{{ row.loginName || '—' }}</div>
            <div class="sub">({{ row.uid }})</div>
          </template>
        </el-table-column>
        <el-table-column label="会员层级" align="center" prop="levelName" width="120" />
        <el-table-column label="游戏编码" align="center" prop="gameCode" width="130" />
        <el-table-column label="游戏名称" align="center" prop="gameName" min-width="160" show-overflow-tooltip />
        <el-table-column label="注单数量" align="center" prop="betCount" width="110" sortable />
        <el-table-column label="投注金额" align="right" width="150">
          <template #default="{ row }">{{ fmt(row.betAmount) }}</template>
        </el-table-column>
        <el-table-column label="有效投注" align="right" width="150">
          <template #default="{ row }">{{ fmt(row.validBetAmount) }}</template>
        </el-table-column>
        <el-table-column label="派发金额" align="right" width="150">
          <template #default="{ row }">{{ fmt(row.payoutAmount) }}</template>
        </el-table-column>
        <el-table-column label="盈亏金额" align="right" width="150" sortable>
          <template #default="{ row }">
            <span :class="diffClass(row.netWinLoss)">{{ fmt(row.netWinLoss) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="杀率" align="center" width="100">
          <template #default="{ row }">{{ Number(row.killRate ?? 0).toFixed(2) }}%</template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="110" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openWinLoss(row)">输赢分析</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="analysis.visible" :title="`输赢分析 - ${analysis.loginName}`" width="800px" append-to-body>
      <el-tabs v-model="analysis.granularity" @tab-change="loadAnalysis">
        <el-tab-pane label="日" name="DAY" />
        <el-tab-pane label="周" name="WEEK" />
        <el-tab-pane label="月" name="MONTH" />
      </el-tabs>
      <el-table :data="analysis.rows" height="360">
        <el-table-column label="周期" align="center" prop="statDate" width="130" />
        <el-table-column label="注单数" align="center" prop="betCount" width="100" />
        <el-table-column label="投注金额" align="right" width="140">
          <template #default="{ row }">{{ fmt(row.betAmount) }}</template>
        </el-table-column>
        <el-table-column label="有效投注" align="right" width="140">
          <template #default="{ row }">{{ fmt(row.validBetAmount) }}</template>
        </el-table-column>
        <el-table-column label="派发金额" align="right" width="140">
          <template #default="{ row }">{{ fmt(row.payoutAmount) }}</template>
        </el-table-column>
        <el-table-column label="盈亏" align="right">
          <template #default="{ row }"><span :class="diffClass(row.netWinLoss)">{{ fmt(row.netWinLoss) }}</span></template>
        </el-table-column>
        <el-table-column label="杀率" align="center" width="90">
          <template #default="{ row }">{{ Number(row.killRate ?? 0).toFixed(2) }}%</template>
        </el-table-column>
      </el-table>
      <template #footer><el-button @click="analysis.visible = false">关 闭</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup name="MemberBetDetail" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  getMemberBetCumulative,
  listMemberBetDetail,
  listMemberBetGameCodes,
  listMemberBetSummary,
  listMemberWinLoss
} from '@/api/member/bet';

defineOptions({ name: 'MemberBetDetail' });

const loading = ref(false);
const rows = ref<any[]>([]);
const total = ref(0);
const dateRange = ref<string[]>([]);
const gameOptions = ref<Array<{ value: string; label: string }>>([]);
const gameSummary = ref<any[]>([]);
const cumulative = ref<any>({ betAmount: 0, payoutAmount: 0, netWinLoss: 0 });
const showCumulative = ref(false);
const query = reactive<any>({ pageNum: 1, pageSize: 10, accountField: 'LOGIN_NAME', accountValue: undefined, gameCode: undefined });
const analysis = reactive<any>({ visible: false, loginName: '', granularity: 'DAY', uid: undefined, rows: [] });

const fmt = (value: any) => Number(value ?? 0).toLocaleString('en-US');
/** 盈利红色、亏损绿色（运营口径）。 */
const diffClass = (value: any) => (Number(value ?? 0) > 0 ? 'text-red' : Number(value ?? 0) < 0 ? 'text-green' : '');

const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const buildQuery = () => {
  const q: any = { pageNum: query.pageNum, pageSize: query.pageSize, gameCode: query.gameCode };
  if (query.accountField === 'UID') {
    q.uid = query.accountValue;
  } else {
    q.loginName = query.accountValue;
  }
  q.startDate = dateRange.value?.[0];
  q.endDate = dateRange.value?.[1];
  return q;
};

async function getList() {
  loading.value = true;
  try {
    const res: any = await listMemberBetDetail(buildQuery());
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
    const summaryRes: any = await listMemberBetSummary(buildQuery());
    gameSummary.value = summaryRes.data ?? [];
    if (showCumulative.value) {
      await loadCumulative();
    }
  } finally {
    loading.value = false;
  }
}

async function loadCumulative() {
  const res: any = await getMemberBetCumulative(buildQuery());
  cumulative.value = res.data ?? { betAmount: 0, payoutAmount: 0, netWinLoss: 0 };
}

async function toggleCumulative() {
  showCumulative.value = !showCumulative.value;
  if (showCumulative.value) {
    await loadCumulative();
    ElMessage.success('已加载累计统计');
  }
}

function resetQuery() {
  query.pageNum = 1;
  query.accountField = 'LOGIN_NAME';
  query.accountValue = undefined;
  query.gameCode = undefined;
  dateRange.value = [yesterday(), yesterday()];
  getList();
}

async function openWinLoss(row: any) {
  analysis.uid = row.uid;
  analysis.loginName = row.loginName || String(row.uid);
  analysis.granularity = 'DAY';
  analysis.visible = true;
  await loadAnalysis();
}

async function loadAnalysis() {
  const res: any = await listMemberWinLoss(
    analysis.uid,
    dateRange.value?.[0],
    dateRange.value?.[1],
    analysis.granularity
  );
  analysis.rows = res.data ?? [];
}

onMounted(async () => {
  dateRange.value = [yesterday(), yesterday()];
  const res: any = await listMemberBetGameCodes();
  gameOptions.value = (res.data ?? []).map((code: string) => ({ value: code, label: code }));
  getList();
});
</script>

<style scoped>
.table-heading h3 { margin: 0 0 4px; font-size: 15px; }
.tip { color: #909399; font-size: 12px; }
.sub { color: #909399; font-size: 12px; }
.text-red { color: #f56c6c; font-weight: 600; }
.text-green { color: #67c23a; font-weight: 600; }
.summary-panel { margin-bottom: 12px; }
.cumulative { display: flex; gap: 32px; font-size: 14px; }
.cumulative b { font-size: 16px; }
</style>
