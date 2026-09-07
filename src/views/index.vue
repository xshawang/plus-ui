<template>
  <div class="p-2 ops-dashboard">
    <div class="dash-topbar">
      <div class="topbar-copy">
        <h2 class="dash-title">运营数据看板</h2>
        <p class="dash-subtitle">核心经营指标 · 今日实时运营 · 今日排行榜 · 多日趋势 · 运营总览</p>
      </div>
      <div class="topbar-actions">
        <span class="muted small">金额单位：VND</span>
        <el-button type="primary" plain icon="Refresh" :loading="refreshing" @click="refreshAll">
          刷新全部
        </el-button>
      </div>
    </div>

    <!-- 1. 核心经营指标 -->
    <el-card shadow="hover" class="dash-card">
      <template #header>
        <div class="card-head">
          <h3>核心经营指标</h3>
          <span v-if="kpiData" class="updated-text">最后更新时间：{{ shortTime(kpiData.snapshotAt) }}</span>
        </div>
      </template>
      <StateBox :loading="kpiLoading" :error="kpiError" :empty="!kpiItems.length" :reload="loadKpi">
        <div class="kpi-grid">
          <div v-for="item in kpiItems" :key="item.key" class="kpi-panel panel">
            <div class="kpi-label-row">
              <span class="kpi-label">{{ item.label }}</span>
              <el-tooltip v-if="item.tooltip" :content="item.tooltip" placement="top">
                <el-icon class="kpi-hint"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
            <div class="kpi-value" :class="{ negative: item.value < 0 }">{{ formatKpiValue(item) }}</div>
            <div class="kpi-compare">
              <span v-if="item.hasComparison" class="compare-rate" :class="rateClass(item.changeRate)">
                {{ rateText(item.changeRate) }}
              </span>
              <span v-else-if="item.key === 'totalMembers'" class="compare-rate muted">累计</span>
              <span v-else class="compare-rate muted">—</span>
              <span v-if="item.hasComparison" class="compare-base">较昨日同期</span>
            </div>
          </div>
        </div>
      </StateBox>
    </el-card>

    <!-- 2. 今日实时运营 -->
    <el-card shadow="hover" class="dash-card">
      <template #header>
        <div class="card-head">
          <h3>今日实时运营</h3>
          <div class="live-badge">
            <span class="live-dot" />
            实时更新 · 最后更新时间：{{ lastRealtimeTime }}
          </div>
        </div>
      </template>
      <StateBox :loading="realtimeLoading" :error="realtimeError" :reload="loadRealtime">
        <div class="realtime-grid">
          <div class="panel rt-user">
            <div class="panel-title">用户实时状态</div>
            <el-alert
              v-if="realtime && !realtime.online.supported"
              class="mb-2"
              type="warning"
              :closable="false"
              show-icon
              :title="realtime.online.message || '当前在线数据暂不可用'"
            />
            <div class="big-stat">
              <div class="big-number">{{ formatCount(realtime?.online.currentUsers) }}</div>
              <div class="big-label">当前在线（真人去重）</div>
            </div>
            <div class="mini-stat-grid">
              <div class="mini-stat">
                <span class="mini-value">{{ formatCount(realtime?.online.todayActive) }}</span>
                <span class="mini-label">今日活跃</span>
              </div>
              <div class="mini-stat">
                <span class="mini-value">{{ formatCount(realtime?.online.todayNew) }}</span>
                <span class="mini-label">今日新增</span>
              </div>
              <div class="mini-stat">
                <span class="mini-value">
                  {{ formatCount(realtime?.online.todayPeak) }}
                  <span v-if="realtime?.online.peakAt" class="peak-at">@{{ realtime.online.peakAt }}</span>
                </span>
                <span class="mini-label">今日在线峰值</span>
              </div>
            </div>
            <div v-if="onlineSpark.length" class="spark-block">
              <div class="spark-title">在线趋势（分钟采样）</div>
              <TrendChart
                :labels="onlineSpark.map(p => p.t)"
                :values="onlineSpark.map(p => p.v)"
                unit="count"
                series-name="在线用户"
                :height="110"
                color="#22b07d"
              />
            </div>
            <el-empty v-else-if="realtime?.online.supported" description="暂无在线采样数据" :image-size="56" />
          </div>

          <div class="panel rt-fund">
            <div class="panel-title">今日资金状态</div>
            <div class="fund-grid">
              <div class="fund-item">
                <span class="fund-label">充值金额</span>
                <span class="fund-value success">{{ formatMoney(finance?.rechargeAmount) }}</span>
              </div>
              <div class="fund-item">
                <span class="fund-label">提现金额</span>
                <span class="fund-value warning">{{ formatMoney(finance?.withdrawAmount) }}</span>
              </div>
              <div class="fund-item fund-diff">
                <span class="fund-label">充提差额</span>
                <span class="fund-value signed" :class="{ negative: (finance?.diff ?? 0) < 0 }">
                  {{ formatSigned(finance?.diff) }}
                </span>
              </div>
              <div class="fund-item">
                <span class="fund-label">充值人数</span>
                <span class="fund-value">{{ formatCount(finance?.rechargeUsers) }}</span>
              </div>
              <div class="fund-item">
                <span class="fund-label">提现人数</span>
                <span class="fund-value">{{ formatCount(finance?.withdrawUsers) }}</span>
              </div>
              <div class="fund-item">
                <span class="fund-label">充值次数</span>
                <span class="fund-value">{{ formatCount(finance?.rechargeCount) }}</span>
              </div>
              <div class="fund-item">
                <span class="fund-label">提现次数</span>
                <span class="fund-value">{{ formatCount(finance?.withdrawCount) }}</span>
              </div>
            </div>
          </div>
        </div>
      </StateBox>
    </el-card>

    <!-- 3. 今日排行榜 -->
    <el-card shadow="hover" class="dash-card">
      <template #header>
        <div class="card-head">
          <h3>今日排行榜</h3>
          <span class="muted small">Top 10 · 默认展示充值排行，切换 Tab 按类别加载</span>
        </div>
      </template>
      <el-tabs v-model="rankingType" class="rank-tabs" @tab-change="loadRanking">
        <el-tab-pane v-for="meta in rankingTabs" :key="meta.type" :label="meta.label" :name="meta.type" />
      </el-tabs>
      <StateBox
        :loading="rankingLoading"
        :error="rankingError"
        :empty="!rankingItems.length"
        empty-text="今日暂无排行数据"
        :reload="() => loadRanking()"
      >
        <el-table v-loading="rankingLoading" border class="data-table" :data="rankingItems" size="default">
          <el-table-column label="排名" align="center" width="76">
            <template #default="{ row }">
              <span class="rank-badge" :class="'rank-' + row.rank">{{ row.rank }}</span>
            </template>
          </el-table-column>
          <el-table-column label="用户" align="left" min-width="180">
            <template #default="{ row }">
              <div class="user-cell">
                <span class="user-name">{{ row.name }}</span>
                <span class="user-uid font-mono">{{ row.uid }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="rankingMeta[rankingType].amountLabel" align="right" min-width="150">
            <template #default="{ row }">
              <span class="font-mono" :class="{ negative: rankingMeta[rankingType].signed && row.amount < 0 }">
                {{ rankingMeta[rankingType].signed ? formatSigned(row.amount) : formatMoney(row.amount) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="次数" align="right" width="100">
            <template #default="{ row }">{{ formatCount(row.count) }}</template>
          </el-table-column>
          <el-table-column label="时间" align="center" min-width="170">
            <template #default="{ row }">
              <span class="font-mono">{{ fullTime(row.lastAt) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </StateBox>
    </el-card>

    <!-- 4. 多日数据对比 -->
    <el-card shadow="hover" class="dash-card">
      <template #header>
        <div class="card-head">
          <h3>多日数据对比</h3>
          <div class="head-controls">
            <el-radio-group v-model="trendRangeKind" size="small" @change="handleTrendRangeChange">
              <el-radio-button :value="7">近7天</el-radio-button>
              <el-radio-button :value="30">近30天</el-radio-button>
              <el-radio-button :value="90">近90天</el-radio-button>
              <el-radio-button value="custom">自定义</el-radio-button>
            </el-radio-group>
            <template v-if="trendRangeKind === 'custom'">
              <el-date-picker
                v-model="trendCustomRange"
                class="mx-1"
                type="daterange"
                range-separator="-"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                :clearable="false"
                size="small"
              />
              <el-button size="small" type="primary" plain @click="loadTrend">查询</el-button>
            </template>
          </div>
        </div>
      </template>
      <div class="metric-tabs">
        <el-radio-group v-model="trendMetric" size="small">
          <el-radio-button value="register">每日注册</el-radio-button>
          <el-radio-button value="online">在线趋势</el-radio-button>
          <el-radio-button value="recharge">充值金额</el-radio-button>
        </el-radio-group>
      </div>
      <StateBox
        :loading="trendLoading"
        :error="trendError"
        :empty="!trendHasData"
        :reload="loadTrend"
      >
        <TrendChart
          v-if="trendHasData"
          :labels="trendChartLabels"
          :values="trendChartValues"
          :unit="trendMetric === 'register' || trendMetric === 'online' ? 'count' : 'money'"
          :series-name="trendMetric === 'recharge' ? '充值金额' : trendMetric === 'online' ? '在线用户' : '新增会员'"
          :height="320"
          :color="trendMetric === 'register' ? '#4f7cff' : trendMetric === 'online' ? '#22b07d' : '#f59a3c'"
        />
      </StateBox>
      <div class="chart-note muted small">
        <template v-if="trendMetric === 'online'">
          在线趋势取“每日有登录/在线连接的去重真人用户”（user_activity_daily）；今日为 T+1 前暂无数据，不伪造历史。
        </template>
        <template v-else>历史日取自日汇总事实表，今日按实时明细现算。</template>
      </div>
    </el-card>

    <!-- 5. 运营总览 -->
    <el-card shadow="hover" class="dash-card">
      <template #header>
        <div class="card-head">
          <h3>运营总览</h3>
          <div class="head-controls">
            <el-radio-group v-model="overviewPeriod" size="small" @change="handleOverviewPeriodChange">
              <el-radio-button value="today">今日</el-radio-button>
              <el-radio-button value="yesterday">昨日</el-radio-button>
              <el-radio-button value="thisWeek">本周</el-radio-button>
              <el-radio-button value="thisMonth">本月</el-radio-button>
              <el-radio-button value="last7">近7天</el-radio-button>
              <el-radio-button value="last30">近30天</el-radio-button>
              <el-radio-button value="custom">自定义</el-radio-button>
            </el-radio-group>
            <template v-if="overviewPeriod === 'custom'">
              <el-date-picker
                v-model="overviewCustomRange"
                class="mx-1"
                type="daterange"
                range-separator="-"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                :clearable="false"
                size="small"
              />
              <el-button size="small" type="primary" plain @click="loadOverview">查询</el-button>
            </template>
          </div>
        </div>
      </template>
      <StateBox :loading="overviewLoading" :error="overviewError" :reload="loadOverview">
        <template v-if="overview">
          <div class="summary-strip">
            <div class="summary-item">
              <span class="summary-label">新增会员</span>
              <span class="summary-value">{{ formatCount(overview.summary.newMembers) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">充值总额</span>
              <span class="summary-value success">{{ formatMoney(overview.summary.rechargeAmount) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">提现总额</span>
              <span class="summary-value warning">{{ formatMoney(overview.summary.withdrawAmount) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">投注总额</span>
              <span class="summary-value">{{ formatMoney(overview.summary.betAmount) }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">平台损益</span>
              <span class="summary-value signed" :class="{ negative: overview.summary.pnl < 0 }">
                {{ formatSigned(overview.summary.pnl) }}
              </span>
            </div>
          </div>

          <div class="overview-grid">
            <div class="panel overview-panel">
              <div class="panel-title">用户趋势</div>
              <TrendChart
                v-if="overviewUserPoints.length"
                :labels="overviewUserPoints.map(p => p.date)"
                :values="overviewUserPoints.map(p => p.newMembers)"
                unit="count"
                series-name="新增会员"
                :height="220"
                color="#4f7cff"
              />
              <el-empty v-else description="暂无数据" :image-size="56" />
            </div>

            <div class="panel overview-panel">
              <div class="panel-title-row">
                <span class="panel-title">充值趋势</span>
                <el-radio-group v-model="rechargeMetric" size="small">
                  <el-radio-button value="amount">金额</el-radio-button>
                  <el-radio-button value="users">人数</el-radio-button>
                  <el-radio-button value="count">次数</el-radio-button>
                </el-radio-group>
              </div>
              <TrendChart
                v-if="rechargePoints.length"
                :labels="rechargePoints.map(p => p.date)"
                :values="rechargePoints.map(p => pickMetric(p, rechargeMetric))"
                :unit="rechargeMetric === 'amount' ? 'money' : 'count'"
                :series-name="rechargeMetric === 'amount' ? '充值金额' : rechargeMetric === 'users' ? '充值人数' : '充值次数'"
                :height="220"
                color="#22b07d"
              />
              <el-empty v-else description="暂无数据" :image-size="56" />
            </div>

            <div class="panel overview-panel">
              <div class="panel-title-row">
                <span class="panel-title">提现趋势</span>
                <el-radio-group v-model="withdrawMetric" size="small">
                  <el-radio-button value="amount">金额</el-radio-button>
                  <el-radio-button value="users">人数</el-radio-button>
                  <el-radio-button value="count">次数</el-radio-button>
                </el-radio-group>
              </div>
              <TrendChart
                v-if="withdrawPoints.length"
                :labels="withdrawPoints.map(p => p.date)"
                :values="withdrawPoints.map(p => pickMetric(p, withdrawMetric))"
                :unit="withdrawMetric === 'amount' ? 'money' : 'count'"
                :series-name="withdrawMetric === 'amount' ? '提现金额' : withdrawMetric === 'users' ? '提现人数' : '提现次数'"
                :height="220"
                color="#f59a3c"
              />
              <el-empty v-else description="暂无数据" :image-size="56" />
            </div>

            <div class="panel overview-panel">
              <div class="panel-title-row">
                <span class="panel-title">游戏经营</span>
                <el-radio-group v-model="gameMetric" size="small">
                  <el-radio-button value="betAmount">投注总额</el-radio-button>
                  <el-radio-button value="validBet">有效投注</el-radio-button>
                  <el-radio-button value="betUsers">投注人数</el-radio-button>
                  <el-radio-button value="pnl">损益</el-radio-button>
                </el-radio-group>
              </div>
              <TrendChart
                v-if="gamePoints.length"
                :labels="gamePoints.map(p => p.date)"
                :values="gamePoints.map(p => pickMetric(p, gameMetric))"
                :unit="gameMetric === 'betUsers' ? 'count' : gameMetric === 'pnl' ? 'signed' : 'money'"
                :series-name="gameMetricLabel"
                :height="220"
                color="#7c5cff"
              />
              <el-empty v-else description="暂无数据" :image-size="56" />
            </div>
          </div>
        </template>
      </StateBox>
    </el-card>

    <!-- 6. 风控态势（统一采集风控小时事实） -->
    <el-card shadow="hover" class="dash-card">
      <template #header>
        <div class="card-head">
          <h3>风控态势</h3>
          <span v-if="riskToday" class="updated-text">截止：{{ fullTime(riskToday.snapshotAt) }}</span>
        </div>
      </template>
      <StateBox :loading="riskLoading" :error="riskError" :reload="loadRisk">
        <template v-if="riskToday">
          <div class="risk-summary">
            <div class="risk-item">
              <span class="risk-label">登录失败</span>
              <span class="risk-value danger">{{ formatCount(riskToday.metrics.loginFailCount) }}</span>
            </div>
            <div class="risk-item">
              <span class="risk-label">去重 IP / 设备</span>
              <span class="risk-value">
                {{ formatCount(riskToday.metrics.loginFailIp) }} / {{ formatCount(riskToday.metrics.loginFailDevice) }}
              </span>
            </div>
            <div class="risk-item">
              <span class="risk-label">新增封禁</span>
              <span class="risk-value danger">{{ formatCount(riskToday.metrics.banCount) }}</span>
            </div>
            <div class="risk-item">
              <span class="risk-label">风控命中</span>
              <span class="risk-value warning">{{ formatCount(riskToday.metrics.riskControlCount) }}</span>
            </div>
            <div class="risk-item">
              <span class="risk-label">风控事件</span>
              <span class="risk-value warning">{{ formatCount(riskToday.metrics.riskEventCount) }}</span>
            </div>
            <div class="risk-item">
              <span class="risk-label">提现风险单</span>
              <span class="risk-value warning">{{ formatCount(riskToday.metrics.withdrawRiskFlagCount) }}</span>
            </div>
            <div class="risk-item">
              <span class="risk-label">高风险用户</span>
              <span class="risk-value">{{ formatCount(riskToday.metrics.highRiskUserCount) }}</span>
            </div>
            <div class="risk-item">
              <span class="risk-label">人工调账</span>
              <span class="risk-value">{{ formatCount(riskToday.metrics.manualAdjustCount) }}</span>
            </div>
          </div>
          <div class="metric-tabs">
            <el-radio-group v-model="riskMetric" size="small">
              <el-radio-button value="loginFailCount">登录失败</el-radio-button>
              <el-radio-button value="banCount">封禁</el-radio-button>
              <el-radio-button value="riskControlCount">风控命中</el-radio-button>
              <el-radio-button value="withdrawRiskFlagCount">提现风险单</el-radio-button>
            </el-radio-group>
            <span class="chart-note muted small">近 7 天每日风控趋势（事实表小时聚合）</span>
          </div>
          <TrendChart
            v-if="riskTrendPoints.length"
            :labels="riskTrendLabels"
            :values="riskTrendPoints"
            unit="count"
            :series-name="riskMetricLabel"
            :height="240"
            color="#d15454"
          />
          <el-empty v-else description="暂无风控趋势数据" :image-size="56" />
        </template>
      </StateBox>
    </el-card>
  </div>
</template>

<script setup name="Index" lang="ts">
import DashboardStateBox from '@/components/Dashboard/StateBox.vue';
import DashboardTrendChart from '@/components/Dashboard/TrendChart.vue';
import {
  getDashboardKpi,
  getDashboardOverview,
  getDashboardRanking,
  getDashboardRealtime,
  getDashboardTrend
} from '@/api/report/dashboard';
import { getDashboardRiskToday, getDashboardRiskTrend } from '@/api/report/dashboard/risk';
import type { RiskMetrics, RiskTodayResult } from '@/api/report/dashboard/risk-types';
import type {
  KpiItem,
  KpiResult,
  OverviewPeriod,
  OverviewResult,
  RankingType,
  RealtimeResult,
  TrendPoint,
  TrendResult
} from '@/api/report/dashboard/types';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

type TrendMetric = 'register' | 'online' | 'recharge';

const StateBox = DashboardStateBox;
const TrendChart = DashboardTrendChart;

/* ---------------- 基础格式化 ---------------- */
const toNumber = (value?: unknown) => Number(value ?? 0);

const formatCount = (value?: unknown) => Math.round(toNumber(value)).toLocaleString('en-US');

const formatMoney = (value?: unknown) =>
  toNumber(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatSigned = (value?: unknown) => {
  const n = toNumber(value);
  const text = formatMoney(Math.abs(n));
  return (n >= 0 ? '+' : '-') + text;
};

const formatKpiValue = (item: KpiItem) => {
  if (item.kind === 'count') return formatCount(item.value);
  if (item.kind === 'signed') return formatSigned(item.value);
  return formatMoney(item.value);
};

const shortTime = (value?: string) => (value ? value.slice(11, 19) : '--');
const fullTime = (value?: string | null) => (value ? value.slice(0, 19).replace('T', ' ') : '-');

const rateText = (rate?: number | null) => {
  if (rate === null || rate === undefined) return '—';
  const arrow = rate >= 0 ? '↑' : '↓';
  return `${arrow} ${Math.abs(rate).toFixed(2)}%`;
};

const rateClass = (rate?: number | null) => (rate !== null && rate !== undefined && rate < 0 ? 'down' : 'up');

/* ---------------- 1. KPI ---------------- */
const kpiData = ref<KpiResult>();
const kpiLoading = ref(false);
const kpiError = ref<string | boolean>(false);

const kpiItems = computed(() => kpiData.value?.items ?? []);

const loadKpi = async () => {
  kpiLoading.value = true;
  kpiError.value = false;
  try {
    const res = await getDashboardKpi();
    kpiData.value = res.data;
  } catch (error) {
    kpiError.value = typeof error === 'string' ? error : '请求异常';
  } finally {
    kpiLoading.value = false;
  }
};

/* ---------------- 2. 实时运营 ---------------- */
const realtime = ref<RealtimeResult>();
const realtimeLoading = ref(false);
const realtimeError = ref<string | boolean>(false);

const finance = computed(() => realtime.value?.finance);
const lastRealtimeTime = computed(() =>
  realtime.value ? shortTime(realtime.value.online.updatedAt || realtime.value.snapshotAt) : '--'
);
const onlineSpark = computed(() => {
  const trend = realtime.value?.online.trend ?? [];
  return trend.slice(-90);
});

const loadRealtime = async () => {
  realtimeLoading.value = true;
  realtimeError.value = false;
  try {
    const res = await getDashboardRealtime();
    realtime.value = res.data;
  } catch (error) {
    realtimeError.value = typeof error === 'string' ? error : '请求异常';
  } finally {
    realtimeLoading.value = false;
  }
};

/* ---------------- 3. 排行榜 ---------------- */
const rankingType = ref<RankingType>('recharge');
const rankingData = ref<Partial<Record<RankingType, unknown>>>({});
const rankingLoading = ref(false);
const rankingError = ref<string | boolean>(false);

const rankingTabs: Array<{ type: RankingType; label: string }> = [
  { type: 'recharge', label: '充值排行' },
  { type: 'abandonRecharge', label: '放弃充值' },
  { type: 'withdraw', label: '提现排行' },
  { type: 'bet', label: '投注排行' },
  { type: 'profit', label: '盈利排行' }
];

const rankingMeta: Record<RankingType, { label: string; amountLabel: string; signed: boolean }> = {
  recharge: { label: '充值排行', amountLabel: '充值金额', signed: false },
  abandonRecharge: { label: '放弃充值', amountLabel: '尝试金额', signed: false },
  withdraw: { label: '提现排行', amountLabel: '提现金额', signed: false },
  bet: { label: '投注排行', amountLabel: '投注金额', signed: false },
  profit: { label: '盈利排行', amountLabel: '盈利金额', signed: true }
};

const rankingItems = computed(() => {
  const result = rankingData.value[rankingType.value] as { items?: Array<{ rank: number }> } | undefined;
  return result?.items ?? [];
});

const loadRanking = async () => {
  rankingLoading.value = true;
  rankingError.value = false;
  try {
    const res = await getDashboardRanking(rankingType.value);
    rankingData.value = { ...rankingData.value, [rankingType.value]: res.data };
  } catch (error) {
    rankingError.value = typeof error === 'string' ? error : '请求异常';
  } finally {
    rankingLoading.value = false;
  }
};

/* ---------------- 4. 多日趋势 ---------------- */
const trend = ref<TrendResult>();
const trendLoading = ref(false);
const trendError = ref<string | boolean>(false);
const trendRangeKind = ref<number | 'custom'>(7);
const trendCustomRange = ref<[string, string] | null>(null);
const trendMetric = ref<TrendMetric>('register');

const trendRows = computed(() => {
  const series = trend.value?.series;
  if (!series) return [];
  if (trendMetric.value === 'register') return series.register;
  if (trendMetric.value === 'online') return series.online;
  return series.recharge;
});

const trendChartPoints = computed(() => trendRows.value ?? []);
const trendChartLabels = computed(() => trendChartPoints.value.map(p => p.date));
const trendChartValues = computed(() =>
  trendChartPoints.value.map(p =>
    trendMetric.value === 'recharge' ? toNumber(p.amount) : p.value === null || p.value === undefined ? null : toNumber(p.value)
  )
);
const trendHasData = computed(() =>
  trendChartValues.value.some(value => value !== null && value !== undefined)
);

const loadTrend = async () => {
  trendLoading.value = true;
  trendError.value = false;
  try {
    const params: { days?: number; startDate?: string; endDate?: string } = {};
    if (trendRangeKind.value === 'custom') {
      if (!trendCustomRange.value?.length) {
        const today = new Date();
        const start = new Date(today.getTime() - 6 * 24 * 3600 * 1000);
        trendCustomRange.value = [toDateStr(start), toDateStr(today)];
      }
      params.startDate = trendCustomRange.value[0];
      params.endDate = trendCustomRange.value[1];
    } else {
      params.days = trendRangeKind.value as number;
    }
    const res = await getDashboardTrend(params);
    trend.value = res.data;
  } catch (error) {
    trendError.value = typeof error === 'string' ? error : '请求异常';
  } finally {
    trendLoading.value = false;
  }
};

const handleTrendRangeChange = () => {
  if (trendRangeKind.value === 'custom' && !trendCustomRange.value?.length) {
    const today = new Date();
    const start = new Date(today.getTime() - 6 * 24 * 3600 * 1000);
    trendCustomRange.value = [toDateStr(start), toDateStr(today)];
  }
  void loadTrend();
};

/* ---------------- 5. 运营总览 ---------------- */
const overview = ref<OverviewResult>();
const overviewLoading = ref(false);
const overviewError = ref<string | boolean>(false);
const overviewPeriod = ref<OverviewPeriod>('today');
const overviewCustomRange = ref<[string, string] | null>(null);

const rechargeMetric = ref<'amount' | 'users' | 'count'>('amount');
const withdrawMetric = ref<'amount' | 'users' | 'count'>('amount');
const gameMetric = ref<'betAmount' | 'validBet' | 'betUsers' | 'pnl'>('betAmount');

const gameMetricLabel = computed(() => {
  const map: Record<string, string> = {
    betAmount: '投注总额',
    validBet: '有效投注',
    betUsers: '投注人数',
    pnl: '损益'
  };
  return map[gameMetric.value] ?? '数值';
});

const pickMetric = (row: TrendPoint, key: string) => {
  const value = (row as unknown as Record<string, unknown>)[key];
  return value === null || value === undefined ? null : toNumber(value);
};

const overviewUserPoints = computed(() => overview.value?.trends.user ?? []);
const rechargePoints = computed(() => overview.value?.trends.recharge ?? []);
const withdrawPoints = computed(() => overview.value?.trends.withdraw ?? []);
const gamePoints = computed(() => overview.value?.trends.game ?? []);

const loadOverview = async () => {
  overviewLoading.value = true;
  overviewError.value = false;
  try {
    let startDate: string | undefined;
    let endDate: string | undefined;
    if (overviewPeriod.value === 'custom') {
      if (!overviewCustomRange.value?.length) {
        const today = new Date();
        const start = new Date(today.getTime() - 6 * 24 * 3600 * 1000);
        overviewCustomRange.value = [toDateStr(start), toDateStr(today)];
      }
      startDate = overviewCustomRange.value[0];
      endDate = overviewCustomRange.value[1];
    }
    const res = await getDashboardOverview(overviewPeriod.value, startDate, endDate);
    overview.value = res.data;
  } catch (error) {
    overviewError.value = typeof error === 'string' ? error : '请求异常';
  } finally {
    overviewLoading.value = false;
  }
};

const handleOverviewPeriodChange = () => {
  if (overviewPeriod.value === 'custom' && !overviewCustomRange.value?.length) {
    const today = new Date();
    const start = new Date(today.getTime() - 6 * 24 * 3600 * 1000);
    overviewCustomRange.value = [toDateStr(start), toDateStr(today)];
  }
  void loadOverview();
};

/* ---------------- 6. 风控态势 ---------------- */
const riskToday = ref<RiskTodayResult>();
const riskLoading = ref(false);
const riskError = ref<string | boolean>(false);
const riskMetric = ref<keyof RiskMetrics>('loginFailCount');
const riskTrendRows = ref<Array<{ date: string; [key: string]: unknown }>>([]);

const riskMetricLabel = computed(() => {
  const map: Record<string, string> = {
    loginFailCount: '登录失败',
    banCount: '封禁',
    riskControlCount: '风控命中',
    withdrawRiskFlagCount: '提现风险单'
  };
  return map[riskMetric.value] ?? '数值';
});

const riskTrendPoints = computed(() =>
  riskTrendRows.value.map(row => {
    const value = row[riskMetric.value];
    return value === null || value === undefined ? null : toNumber(value);
  })
);
const riskTrendLabels = computed(() => riskTrendRows.value.map(row => row.date as string));

const loadRisk = async () => {
  riskLoading.value = true;
  riskError.value = false;
  try {
    const [todayRes, trendRes] = await Promise.all([
      getDashboardRiskToday(),
      getDashboardRiskTrend({ days: 7 })
    ]);
    riskToday.value = todayRes.data;
    riskTrendRows.value = (trendRes.data?.rows ?? []) as Array<{ date: string; [key: string]: unknown }>;
  } catch (error) {
    riskError.value = typeof error === 'string' ? error : '请求异常';
  } finally {
    riskLoading.value = false;
  }
};

/* ---------------- 生命周期与刷新 ---------------- */
const toDateStr = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const refreshing = ref(false);
const refreshAll = async () => {
  refreshing.value = true;
  try {
    await Promise.all([loadKpi(), loadRealtime(), loadRanking(), loadTrend(), loadOverview(), loadRisk()]);
  } finally {
    refreshing.value = false;
  }
};

let realtimeTimer: number | undefined;
let kpiTimer: number | undefined;

onMounted(() => {
  void loadKpi();
  void loadRealtime();
  void loadRanking();
  void loadTrend();
  void loadOverview();
  void loadRisk();
  realtimeTimer = window.setInterval(() => {
    if (!realtimeError.value) void loadRealtime();
  }, 30_000);
  kpiTimer = window.setInterval(() => {
    if (!kpiError.value) void loadKpi();
  }, 60_000);
});

onBeforeUnmount(() => {
  if (realtimeTimer) window.clearInterval(realtimeTimer);
  if (kpiTimer) window.clearInterval(kpiTimer);
});
</script>

<style scoped lang="scss">
.ops-dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dash-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.dash-title {
  margin: 0;
  font-size: 22px;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

.dash-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.muted {
  color: var(--el-text-color-secondary);
}

.small {
  font-size: 12px;
}

.dash-card {
  border-radius: 10px;

  :deep(.el-card__header) {
    padding: 12px 16px;
  }
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;

  h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }
}

.head-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.updated-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.panel {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 12px;
  background: var(--el-fill-color-blank);
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.panel-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
  gap: 8px;
  flex-wrap: wrap;
}

/* KPI */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 12px;
}

.kpi-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 118px;
}

.kpi-label-row {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.kpi-hint {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

.kpi-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.15;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.kpi-value.negative {
  color: var(--el-color-danger);
}

.kpi-compare {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.compare-rate {
  font-weight: 600;
}

.compare-rate.up {
  color: var(--el-color-danger);
}

.compare-rate.down {
  color: var(--el-color-success);
}

.compare-rate.muted {
  color: var(--el-text-color-secondary);
}

.compare-base {
  color: var(--el-text-color-secondary);
}

/* 实时 */
.realtime-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 12px;
}

.rt-user {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rt-fund {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-success);
  animation: dash-live 1.6s ease-in-out infinite;
}

@keyframes dash-live {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

.big-stat {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding: 4px 0 10px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.big-number {
  font-size: 34px;
  font-weight: 700;
  color: var(--el-color-primary);
  font-variant-numeric: tabular-nums;
}

.big-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.mini-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.mini-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.mini-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.peak-at {
  font-size: 11px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}

.mini-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.spark-block {
  margin-top: 4px;
}

.spark-title {
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.fund-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.fund-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}

.fund-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.fund-value {
  font-size: 17px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}

.fund-value.success {
  color: var(--el-color-success);
}

.fund-value.warning {
  color: var(--el-color-warning);
}

.signed {
  color: var(--el-color-success);
}

.signed.negative {
  color: var(--el-color-danger);
}

/* 排行榜 */
.rank-tabs {
  margin-top: -8px;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
}

.rank-badge.rank-1 {
  background: #fdf0dc;
  color: #d48806;
}

.rank-badge.rank-2 {
  background: #eef1f6;
  color: #5f6b7a;
}

.rank-badge.rank-3 {
  background: #f9e8dd;
  color: #c05b1f;
}

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.user-uid {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 趋势 */
.metric-tabs {
  margin-bottom: 12px;
}

.risk-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.risk-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.risk-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.risk-value {
  font-size: 18px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}

.risk-value.danger {
  color: var(--el-color-danger);
}

.risk-value.warning {
  color: var(--el-color-warning);
}

.chart-note {
  margin-top: 8px;
  line-height: 1.6;
}

/* 总览 */
.summary-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

.summary-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.summary-value {
  font-size: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}

.summary-value.success {
  color: var(--el-color-success);
}

.summary-value.warning {
  color: var(--el-color-warning);
}

.summary-value.signed.negative {
  color: var(--el-color-danger);
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.overview-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.negative {
  color: var(--el-color-danger) !important;
}

@media (max-width: 1400px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1100px) {
  .realtime-grid {
    grid-template-columns: 1fr;
  }

  .fund-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
