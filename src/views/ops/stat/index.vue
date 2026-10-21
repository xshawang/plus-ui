<template>
  <div class="p-2 app-container ops-stat-page">
    <el-card shadow="hover">
      <el-tabs v-model="activeTab" @tab-change="loadCurrent">
        <el-tab-pane label="日运营报表" name="daily" />
        <el-tab-pane label="会员总报表" name="member" />
        <el-tab-pane label="周活跃图表" name="week" />
        <el-tab-pane label="日活跃图表" name="day" />
        <el-tab-pane label="用户留存报表" name="retention" />
        <el-tab-pane label="未登入会员分析" name="notLogin" />
        <el-tab-pane label="未充值会员分析" name="notRecharge" />
      </el-tabs>

      <el-form :inline="true" class="query-bar">
        <el-form-item v-if="activeTab === 'daily' || activeTab === 'member'" label="周期">
          <el-radio-group v-model="period" @change="loadCurrent">
            <el-radio-button value="week">周</el-radio-button>
            <el-radio-button value="month">月</el-radio-button>
          </el-radio-group>
          <span class="range-tip">{{ range.start }} ~ {{ range.end }}</span>
        </el-form-item>
        <el-form-item v-if="activeTab === 'week' || activeTab === 'day' || activeTab === 'retention'" label="日期">
          <el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD"
                          start-placeholder="开始日期" end-placeholder="结束日期" style="width: 250px"
                          @change="loadCurrent" />
        </el-form-item>
        <el-form-item v-if="activeTab === 'member'" label="会员">
          <el-select v-model="searchType" style="width: 100px">
            <el-option label="账号" value="account" />
            <el-option label="UID" value="uid" />
            <el-option label="上级代理" value="agent" />
          </el-select>
          <el-input v-model="keyword" clearable placeholder="请输入" style="width: 180px; margin-left: 6px"
                    @keyup.enter="loadCurrent" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="loadCurrent">搜索</el-button>
          <el-button icon="Refresh" @click="reset">重置</el-button>
          <el-button v-if="activeTab === 'daily' || activeTab === 'member'" type="success" plain
                     icon="Download" @click="exportCurrent">导出报表</el-button>
        </el-form-item>
      </el-form>

      <div class="source-tip">
        数据来源：go88-job 运营统计快照；金额为数据库原值（分），不做分/元换算；杀率=派发/投注（4位小数）。
      </div>

      <el-table v-if="activeTab === 'daily'" v-loading="loading" border :data="dailyRows" max-height="620">
        <el-table-column v-for="col in dailyColumns" :key="col.prop" :label="col.label" :prop="col.prop"
                         :min-width="col.width || 110" align="center" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="col.prop === 'chargeWithdrawDiff' || col.prop === 'profit'"
                  :class="Number(row[col.prop] || 0) > 0 ? 'v-red' : 'v-green'">
              {{ row[col.prop] }}
            </span>
            <span v-else-if="col.prop === 'killRate'">{{ Number(row[col.prop] || 0).toFixed(4) }}</span>
            <span v-else>{{ row[col.prop] }}</span>
          </template>
        </el-table-column>
      </el-table>

      <template v-else-if="activeTab === 'member'">
        <el-table v-loading="loading" border :data="memberRows" max-height="560">
          <el-table-column v-for="col in memberColumns" :key="col.prop" :label="col.label" :prop="col.prop"
                           :min-width="col.width || 110" align="center" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="col.prop === 'chargeWithdrawDiff' || col.prop === 'profit'"
                    :class="Number(row[col.prop] || 0) > 0 ? 'v-red' : 'v-green'">
                {{ row[col.prop] }}
              </span>
              <span v-else-if="col.prop === 'payoutRate'">{{ Number(row[col.prop] || 0).toFixed(4) }}</span>
              <span v-else-if="col.prop === 'parentAgent'">
                {{ row.parentAgent }}<span v-if="row.parentAgentUid">（{{ row.parentAgentUid }}）</span>
              </span>
              <span v-else>{{ row[col.prop] }}</span>
            </template>
          </el-table-column>
        </el-table>
        <el-table border :data="memberFooter ? [memberFooter] : []" class="footer-table">
          <el-table-column v-for="col in memberColumns" :key="'f-' + col.prop" :label="col.label" :prop="col.prop"
                           :min-width="col.width || 110" align="center">
            <template #default="{ row }">
              <span v-if="col.prop === 'account'">总计</span>
              <span v-else-if="col.prop === 'chargeWithdrawDiff' || col.prop === 'profit'"
                    :class="Number(row[col.prop] || 0) > 0 ? 'v-red' : 'v-green'">{{ row[col.prop] }}</span>
              <span v-else-if="col.prop === 'payoutRate'">{{ Number(row[col.prop] || 0).toFixed(4) }}</span>
              <span v-else>{{ row[col.prop] }}</span>
            </template>
          </el-table-column>
        </el-table>
        <pagination v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="memberTotal"
                    @pagination="loadMember" />
      </template>

      <el-table v-else-if="activeTab === 'week' || activeTab === 'day'" v-loading="loading" border
                :data="activeRows" max-height="620">
        <el-table-column v-for="col in activeColumns" :key="col.prop" :label="col.label" :prop="col.prop"
                         :min-width="col.width || 110" align="center" show-overflow-tooltip />
      </el-table>

      <el-table v-else-if="activeTab === 'retention'" v-loading="loading" border :data="retentionRows" max-height="620">
        <el-table-column v-for="col in retentionColumns" :key="col.prop" :label="col.label" :prop="col.prop"
                         :min-width="col.width || 110" align="center" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="col.ratio">{{ (Number(row[col.prop] || 0) * 100).toFixed(2) }}%</span>
            <span v-else>{{ row[col.prop] }}</span>
          </template>
        </el-table-column>
      </el-table>

      <el-table v-else v-loading="loading" border :data="statusRows" max-height="620">
        <el-table-column label="会员状态" prop="memberStatus" align="center" width="140" fixed />
        <el-table-column v-for="b in buckets" :key="b.key" :label="b.label" align="center" width="130">
          <template #default="{ row }">{{ row[b.key] ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="总计" prop="total" align="center" width="120" />
        <el-table-column label="任务名" prop="jobName" align="center" min-width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  exportStat,
  getActiveReport,
  getDailyOperate,
  getMemberReportPage,
  getMemberStatus,
  getRetentionReport
} from '@/api/ops/stat';

defineOptions({ name: 'OpsStat' });

const activeTab = ref('daily');
const loading = ref(false);
const period = ref<'week' | 'month'>('week');
const dateRange = ref<string[]>([]);
const keyword = ref('');
const searchType = ref('account');
const dailyRows = ref<any[]>([]);
const memberRows = ref<any[]>([]);
const memberFooter = ref<any>({});
const memberTotal = ref(0);
const activeRows = ref<any[]>([]);
const retentionRows = ref<any[]>([]);
const statusRows = ref<any[]>([]);
const query = reactive({ pageNum: 1, pageSize: 20 });

const fmt = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const today = new Date();
const range = computed(() => {
  if (period.value === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start: fmt(start), end: fmt(today) };
  }
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  return { start: fmt(start), end: fmt(today) };
});

const dailyColumns: Array<{ label: string; prop: string; width?: number }> = [
  { label: '日期', prop: 'statDate', width: 110 },
  { label: '注册人数', prop: 'registerCount' },
  { label: '登入人数', prop: 'loginCount' },
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
  { label: '派发金额', prop: 'winAmount', width: 130 },
  { label: '损益', prop: 'profit', width: 130 },
  { label: '杀率', prop: 'killRate' },
  { label: '未首充投注人数', prop: 'noRechargeBetUserCount', width: 150 },
  { label: '访问量', prop: 'visitorCount' },
  { label: '定时任务', prop: 'jobName', width: 170 }
];

const memberColumns: Array<{ label: string; prop: string; width?: number }> = [
  { label: '日期区间', prop: 'rangeLabel', width: 180 },
  { label: '币种', prop: 'currency', width: 80 },
  { label: '会员账号', prop: 'account', width: 130 },
  { label: '会员ID', prop: 'uid', width: 120 },
  { label: '上级代理', prop: 'parentAgent', width: 150 },
  { label: '会员层级', prop: 'clubLevel' },
  { label: 'VIP等级', prop: 'vipLevel', width: 90 },
  { label: '姓名', prop: 'nickName', width: 110 },
  { label: '注册来源(aff_id)', prop: 'registerSource', width: 140 },
  { label: '登录次数', prop: 'loginCount' },
  { label: '充值次数', prop: 'rechargeCount' },
  { label: '充值天数', prop: 'rechargeDays' },
  { label: '充值金额', prop: 'rechargeAmount', width: 130 },
  { label: '提现次数', prop: 'withdrawCount' },
  { label: '提现金额', prop: 'withdrawAmount', width: 130 },
  { label: '充提差额', prop: 'chargeWithdrawDiff', width: 130 },
  { label: '手动加款', prop: 'manualCredit', width: 120 },
  { label: '手动扣除', prop: 'manualDebit', width: 120 },
  { label: '注单数量', prop: 'betCount' },
  { label: '投注金额', prop: 'betAmount', width: 130 },
  { label: '派发金额', prop: 'payoutAmount', width: 130 },
  { label: '损益', prop: 'profit', width: 130 },
  { label: '杀率', prop: 'payoutRate' },
  { label: '奖励', prop: 'rewardAmount', width: 120 },
  { label: '打赏', prop: 'tipAmount', width: 110 },
  { label: '代理转账', prop: 'agentTransferAmount', width: 120 },
  { label: '客服转账', prop: 'csTransferAmount', width: 120 },
  { label: '定时任务', prop: 'jobName', width: 170 }
];

const activeColumns: Array<{ label: string; prop: string; width?: number }> = [
  { label: '周期', prop: 'statDate', width: 150 },
  { label: '新注册人数', prop: 'newRegisterCount' },
  { label: '登录用户数', prop: 'loginUserCount' },
  { label: 'DAU', prop: 'dau' },
  { label: 'WAU', prop: 'wau' },
  { label: 'MAU', prop: 'mau' },
  { label: '首次登录用户数', prop: 'firstLoginUserCount' },
  { label: '回流用户数', prop: 'returnUserCount' },
  { label: '连续活跃人数', prop: 'consecutiveActiveUserCount' },
  { label: '人均登录次数', prop: 'avgLoginCount' },
  { label: '人均在线时长(秒)', prop: 'avgOnlineSeconds', width: 150 },
  { label: '人均游戏局数', prop: 'avgRoundCount' },
  { label: '真人活跃', prop: 'humanActiveUserCount' },
  { label: '机器人活跃', prop: 'robotActiveUserCount' },
  { label: '定时任务', prop: 'jobName', width: 170 }
];

const retentionColumns: Array<{ label: string; prop: string; width?: number; ratio?: boolean }> = [
  { label: '统计日期', prop: 'statDate', width: 120 },
  { label: '首充金额', prop: 'firstRechargeAmount' },
  { label: '首充比例', prop: 'firstRechargeRatio', ratio: true },
  { label: '首充人数', prop: 'firstRechargeUsers' },
  { label: '注册且首充', prop: 'registerFirstRechargeUsers' },
  { label: '二充人数', prop: 'secondRechargeUsers' },
  { label: '二充比例', prop: 'secondRechargeRatio', ratio: true },
  { label: '复充金额', prop: 'repeatRechargeAmount' },
  { label: '复充比例', prop: 'repeatRechargeRatio', ratio: true },
  { label: '复充人数', prop: 'repeatRechargeUsers' },
  { label: '次日留存', prop: 'd1', ratio: true },
  { label: '3日留存', prop: 'd3', ratio: true },
  { label: '7日留存', prop: 'd7', ratio: true },
  { label: '14日留存', prop: 'd14', ratio: true },
  { label: '30日留存', prop: 'd30', ratio: true },
  { label: '沉默用户数', prop: 'silentUserCount' },
  { label: '回流用户数', prop: 'returnUserCount' },
  { label: '回流率', prop: 'returnRate', ratio: true },
  { label: '定时任务', prop: 'jobName', width: 170 }
];

const buckets = [
  { key: 'd0_7', label: '0-7天' }, { key: 'd7_14', label: '7-14天' },
  { key: 'd14_30', label: '14-30天' }, { key: 'd30_90', label: '30-90天' },
  { key: 'd90_180', label: '90-180天' }, { key: 'd180', label: '>180天' },
  { key: 'never', label: '从未登录/未充值' }
];

const rangeParams = () => ({ startDate: range.value.start, endDate: range.value.end });

async function loadCurrent() {
  loading.value = true;
  try {
    if (activeTab.value === 'daily') {
      const res: any = await getDailyOperate({ ...rangeParams(), pageNum: 1, pageSize: 100 });
      dailyRows.value = res.data?.rows ?? res.rows ?? [];
    } else if (activeTab.value === 'member') {
      query.pageNum = 1;
      await loadMember();
    } else if (activeTab.value === 'week' || activeTab.value === 'day') {
      const res: any = await getActiveReport({
        ...dateParams(),
        granularity: activeTab.value === 'week' ? 'week' : 'day'
      });
      activeRows.value = (res.data ?? []).map((r: any) => ({
        ...r,
        statDate: r.statDate ?? r.label
      }));
    } else if (activeTab.value === 'retention') {
      const res: any = await getRetentionReport(dateParams());
      retentionRows.value = res.data ?? [];
    } else {
      const type = activeTab.value === 'notLogin' ? 'not_login' : 'not_recharge';
      const res: any = await getMemberStatus({ analysisType: type });
      statusRows.value = pivotStatus(res.data ?? []);
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '查询失败');
  } finally {
    loading.value = false;
  }
}

async function loadMember() {
  loading.value = true;
  try {
    const res: any = await getMemberReportPage({
      ...rangeParams(), searchType: searchType.value, keyword: keyword.value,
      pageNum: query.pageNum, pageSize: query.pageSize
    });
    const data = res.data ?? {};
    memberRows.value = (data.rows ?? []).map((r: any) => ({
      ...r,
      rangeLabel: `${range.value.start} ~ ${range.value.end}`
    }));
    memberFooter.value = Object.assign({}, data.footer, { rangeLabel: '总计' });
    memberTotal.value = data.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function dateParams() {
  return {
    startDate: dateRange.value?.[0] || range.value.start,
    endDate: dateRange.value?.[1] || range.value.end
  };
}

function pivotStatus(rows: any[]) {
  const map = new Map<string, any>();
  for (const row of rows) {
    const status = row.memberStatus ?? '其他';
    const line = map.get(status) ?? { memberStatus: status, total: 0, jobName: row.jobName };
    line[row.bucket] = (line[row.bucket] ?? 0) + Number(row.memberCount ?? 0);
    line.total += Number(row.memberCount ?? 0);
    map.set(status, line);
  }
  return [...map.values()];
}

async function exportCurrent() {
  try {
    await exportStat({
      bizType: activeTab.value === 'daily' ? 'stat_daily' : 'member_total',
      startDate: range.value.start,
      endDate: range.value.end
    });
    ElMessage.success('导出任务已创建，请在「报表 → 导出下载」查看');
  } catch (e: any) {
    ElMessage.error(e?.message || '导出失败');
  }
}

function reset() {
  period.value = 'week';
  dateRange.value = [];
  keyword.value = '';
  query.pageNum = 1;
  loadCurrent();
}

onMounted(loadCurrent);
</script>

<style scoped>
.query-bar { margin-top: 4px; }
.range-tip { margin-left: 10px; color: #909399; font-size: 12px; }
.source-tip { margin: 4px 0 10px; color: #909399; font-size: 12px; }
.v-red { color: #f56c6c; font-weight: 600; }
.v-green { color: #67c23a; font-weight: 600; }
.footer-table { margin-top: -1px; font-weight: 600; }
</style>
