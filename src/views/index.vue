<template>
  <div class="p-2 ops-dashboard">
    <div class="dash-topbar">
      <div class="command-brand">
        <h2 class="dash-title">运营指挥台</h2>
        <span class="command-status" :class="{ danger: snapshotStale || (health && !health.healthy) }">
          <span class="health-dot" />
          {{ snapshotStale ? '数据更新失败' : health ? (health.healthy ? '数据正常' : '') : '数据连接中' }}
        </span>
      </div>
      <div class="topbar-actions command-meta">
        <span>站点：{{ meta.site || '全部' }}</span>
        <span>币种：{{ meta.rawCurrency || meta.currency || '-' }}</span>
        <span>时区：{{ meta.timezone || '-' }}</span>
        <span class="command-clock font-mono">{{ dashboardClock }}</span>
        <el-button type="primary" plain icon="Refresh" :loading="refreshing" @click="refreshAll">刷新全部</el-button>
      </div>
    </div>

    <StateBox
      :loading="kpiLoading || realtimeLoading"
      :error="kpiError || realtimeError"
      :reload="loadSnapshot"
      class="command-state"
    >
      <div class="command-kpi-grid">
        <article v-for="item in commandKpis" :key="item.key" class="command-kpi">
          <div class="command-kpi-label">
            {{ item.label }}
            <el-tooltip v-if="item.tooltip" :content="item.tooltip" placement="top">
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
          <div class="command-kpi-value">{{ item.value }}</div>
          <div class="command-kpi-sub" :class="item.subTone">{{ item.sub }}</div>
        </article>
      </div>

      <div class="command-main-grid">
        <section class="panel command-trend-panel">
          <div class="command-panel-head">
            <div>
              <h3>今日 24 小时经营趋势</h3>
              <span>在线按小时峰值；金额与风险按小时汇总，当前小时实时补查</span>
            </div>
            <span v-if="realtimeStale || kpiStale" class="stale-text">更新失败，展示上次成功数据</span>
          </div>
          <CommandTrendChart
            v-if="commandTrendLabels.length"
            :labels="commandTrendLabels"
            :series="commandTrendSeries"
            :height="286"
          />
          <el-empty v-else description="暂无今日趋势数据" :image-size="52" />
        </section>

        <section class="panel command-action-panel">
          <div class="command-panel-head">
            <div>
              <h3>立即处理</h3>
              <span>当前需要运营介入的事项</span>
            </div>
          </div>
          <div class="command-action-list">
            <div v-for="item in commandActions" :key="item.key" class="command-action-item" :class="item.tone">
              <div>
                <span class="command-action-label">{{ item.label }}</span>
                <small>{{ item.hint }}</small>
              </div>
              <strong>{{ item.value }}</strong>
            </div>
          </div>
        </section>
      </div>

      <div class="command-bottom-grid">
        <section class="panel command-bottom-card">
          <div class="command-panel-head">
            <h3>资金流转</h3>
            <span>今日经营资金链路</span>
          </div>
          <div class="fund-flow">
            <template v-for="(item, index) in commandFunds" :key="item.key">
              <div class="fund-flow-item">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </div>
              <span v-if="index < commandFunds.length - 1" class="fund-arrow">→</span>
            </template>
          </div>
        </section>

        <section class="panel command-bottom-card command-games">
          <div class="command-panel-head">
            <h3>游戏健康</h3>
            <span>投注额 Top {{ commandGames.length || 6 }}</span>
          </div>
          <el-table v-if="commandGames.length" :data="commandGames" size="small" class="command-game-table">
            <el-table-column label="游戏 / 厂商" min-width="150">
              <template #default="{ row }">
                <div class="game-health-name">{{ row.gameName || row.gameCode }}</div>
                <small>{{ row.providerName || '未配置厂商' }}</small>
              </template>
            </el-table-column>
            <el-table-column label="投注" align="right" width="105">
              <template #default="{ row }">{{ formatMoney(row.betAmount) }}</template>
            </el-table-column>
            <el-table-column label="GGR" align="right" width="95">
              <template #default="{ row }">
                <span :class="{ negative: toNumber(row.ggr) < 0 }">{{ formatSigned(row.ggr) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="RTP" align="right" width="80">
              <template #default="{ row }">{{ Number(row.rtp ?? 0).toFixed(2) }}%</template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无游戏数据" :image-size="44" />
        </section>

        <section class="panel command-bottom-card">
          <div class="command-panel-head">
            <h3>用户质量</h3>
            <span>新增 → 活跃 → 付费 → 复充</span>
          </div>
          <div class="quality-flow">
            <template v-for="(item, index) in commandQuality" :key="item.key">
              <div class="quality-step">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
                <small>{{ item.hint }}</small>
              </div>
              <span v-if="index < commandQuality.length - 1" class="quality-arrow">→</span>
            </template>
          </div>
        </section>
      </div>
    </StateBox>

    <div class="detail-section-title">经营明细</div>

    <!-- 3. 今日排行榜 -->
    <el-card ref="rankingSection" shadow="hover" class="dash-card">
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
                <span class="user-name">{{ row.name || '-' }}</span>
                <span class="user-uid font-mono">{{ row.uid || '-' }}</span>
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
    <el-card ref="trendSection" shadow="hover" class="dash-card">
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
      <StateBox :loading="trendLoading" :error="trendError" :empty="!trendHasData" :reload="loadTrend">
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
    <el-card ref="overviewSection" shadow="hover" class="dash-card">
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
                :series-name="
                  rechargeMetric === 'amount' ? '充值金额' : rechargeMetric === 'users' ? '充值人数' : '充值次数'
                "
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
                :series-name="
                  withdrawMetric === 'amount' ? '提现金额' : withdrawMetric === 'users' ? '提现人数' : '提现次数'
                "
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
          <div class="chart-note muted small">有效投注按游戏有效投注配置比例折算。</div>
        </template>
      </StateBox>
    </el-card>

    <!-- 6. 风控态势（统一采集风控小时事实） -->
    <el-card ref="riskSection" shadow="hover" class="dash-card">
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
              <span class="risk-label">登录失败IP / 设备（日去重）</span>
              <span class="risk-value">
                {{ formatCount(riskToday.metrics.loginFailIp) }} /
                {{ formatCount(riskToday.metrics.loginFailDevice) }}
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
              <span class="risk-label">高风险用户（日去重）</span>
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
import { computed, defineAsyncComponent, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref } from 'vue';
import type { RiskMetrics, RiskTodayResult } from '@/api/report/dashboard/risk-types';
import type {
  CommandCenterResult,
  DashboardHealth,
  DashboardMeta,
  KpiItem,
  KpiResult,
  OverviewPeriod,
  OverviewResult,
  RankingResult,
  RankingType,
  RealtimeResult,
  TrendPoint,
  TrendResult
} from '@/api/report/dashboard/types';
import {
  getDashboardOverview,
  getDashboardRanking,
  getDashboardSnapshot,
  getDashboardTrend
} from '@/api/report/dashboard';
import { getDashboardRiskToday, getDashboardRiskTrend } from '@/api/report/dashboard/risk';
import CommandTrendChart from '@/components/Dashboard/CommandTrendChart.vue';
import DashboardStateBox from '@/components/Dashboard/StateBox.vue';

type TrendMetric = 'register' | 'online' | 'recharge';

const StateBox = DashboardStateBox;
const TrendChart = defineAsyncComponent(() => import('@/components/Dashboard/TrendChart.vue'));

/* ---------------- 基础格式化 ---------------- */
const toNumber = (value?: unknown) => Number(value ?? 0);

/* ---------------- 0. 口径、健康度与统一快照 ---------------- */
const meta = ref<DashboardMeta>({
  site: '',
  currency: 'VND',
  rawCurrency: 'VND',
  amountScale: 1,
  timezone: ''
});
const health = ref<DashboardHealth>();
const snapshotStale = ref(false);
const commandCenter = ref<CommandCenterResult>();
const dashboardClock = ref('');

const formatCount = (value?: unknown) =>
  value === null || value === undefined ? '—' : Math.round(toNumber(value)).toLocaleString('en-US');

const formatMoney = (value?: unknown) => {
  if (value === null || value === undefined || value === '') return '—';
  return toNumber(value).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
};

const formatSigned = (value?: unknown) => {
  if (value === null || value === undefined || value === '') return '—';
  const n = toNumber(value);
  const text = formatMoney(Math.abs(n));
  return (n >= 0 ? '+' : '-') + text;
};

const moneyValue = (value: number | null | undefined) => {
  if (value === null || value === undefined) return null;
  return Math.round(toNumber(value));
};

const fullTime = (value?: string | null) => (value ? value.slice(0, 19).replace('T', ' ') : '-');

const rateText = (rate?: number | null) => {
  if (rate === null || rate === undefined) return '—';
  const arrow = rate >= 0 ? '↑' : '↓';
  return `${arrow} ${Math.abs(rate).toFixed(2)}%`;
};

const rateClass = (item: KpiItem) => {
  const rate = item.changeRate;
  if (rate === null || rate === undefined || rate === 0) return 'neutral';
  const positiveWhenUp = new Set(['activeUsers', 'rechargeAmount', 'validBet', 'ggr', 'ngr', 'newMembers']);
  if (!positiveWhenUp.has(item.key)) return 'neutral';
  return rate > 0 ? 'good' : 'bad';
};

/* ---------------- 1. KPI / 实时运营统一快照 ---------------- */
const kpiData = ref<KpiResult>();
const kpiLoading = ref(false);
const kpiError = ref<string | boolean>(false);
const kpiStale = ref(false);
const realtime = ref<RealtimeResult>();
const realtimeLoading = ref(false);
const realtimeError = ref<string | boolean>(false);
const realtimeStale = ref(false);
let snapshotRequestSeq = 0;
let lastSnapshotSuccessAt = 0;
let snapshotInFlight: Promise<void> | null = null;

const finance = computed(() => realtime.value?.finance);

const pendingAgeText = computed(() => {
  const minutes = finance.value?.withdrawPendingOldestMinutes;
  if (minutes === null || minutes === undefined) return '—';
  if (minutes < 60) return `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}小时${rest}分` : `${hours}小时`;
});

const comparisonText = (item?: KpiItem) => {
  if (!item?.hasComparison) return '—';
  return `${rateText(item.changeRate)} 较昨日同期`;
};

const comparisonTone = (item?: KpiItem) => {
  const tone = item ? rateClass(item) : 'neutral';
  return tone === 'good' || tone === 'bad' ? tone : 'muted';
};

const percentText = (value?: number | null) =>
  value === null || value === undefined ? '—' : `${Number(value).toFixed(2)}%`;

const commandKpis = computed(() => {
  const items = kpiData.value?.items ?? [];
  const item = (key: string) => items.find(row => row.key === key);
  const activeItem = item('activeUsers');
  const rechargeItem = item('rechargeAmount');
  const validBetItem = item('validBet');
  const ggrItem = item('ggr');
  const quality = commandCenter.value?.quality;
  const activeUsers = toNumber(quality?.activeUsers ?? activeItem?.value ?? realtime.value?.online.todayActive);
  const paidUsers = toNumber(quality?.paidUsers ?? finance.value?.rechargeUsers);
  const pendingCount = toNumber(finance.value?.withdrawPendingCount);
  const pendingAmount = finance.value?.withdrawPendingAmount;

  return [
    {
      key: 'activeUsers',
      label: '活跃玩家',
      value: formatCount(activeUsers),
      sub: comparisonText(activeItem),
      subTone: comparisonTone(activeItem),
      tooltip: activeItem?.tooltip
    },
    {
      key: 'paidUsers',
      label: '付费玩家',
      value: `${formatCount(paidUsers)} / ${formatCount(activeUsers)}`,
      sub: `付费率 ${percentText(quality?.paidRate ?? (activeUsers > 0 ? (paidUsers * 100) / activeUsers : 0))}`,
      subTone: 'info',
      tooltip: '今日成功充值去重用户 / 今日活跃玩家'
    },
    {
      key: 'rechargeAmount',
      label: '充值成功',
      value: formatMoney(finance.value?.rechargeAmount ?? rechargeItem?.value),
      sub: comparisonText(rechargeItem),
      subTone: comparisonTone(rechargeItem),
      tooltip: '今日 payment_order.type=1 且 status=2 的到账金额'
    },
    {
      key: 'withdrawPending',
      label: '提现待处理',
      value: `${formatCount(pendingCount)} / ${formatMoney(pendingAmount)}`,
      sub: `最长等待 ${pendingAgeText.value}`,
      subTone: pendingCount > 0 ? 'warning' : 'muted',
      tooltip: '单数 / 金额；包含待审核和已审核待打款'
    },
    {
      key: 'validBet',
      label: '有效投注',
      value: formatMoney(validBetItem?.value),
      sub: comparisonText(validBetItem),
      subTone: comparisonTone(validBetItem),
      tooltip: validBetItem?.tooltip
    },
    {
      key: 'ggr',
      label: 'GGR',
      value: formatSigned(ggrItem?.value),
      sub: comparisonText(ggrItem),
      subTone: comparisonTone(ggrItem),
      tooltip: ggrItem?.tooltip
    }
  ];
});

const commandTrendLabels = computed(() => commandCenter.value?.trend24h?.map(point => point.hour) ?? []);
const commandTrendSeries = computed(() => {
  const points = commandCenter.value?.trend24h ?? [];
  return [
    {
      key: 'online',
      name: '在线',
      unit: 'count' as const,
      color: '#7c5cff',
      values: points.map(point => point.online)
    },
    {
      key: 'bet',
      name: '投注',
      unit: 'money' as const,
      color: '#4f7cff',
      values: points.map(point => point.betAmount)
    },
    {
      key: 'recharge',
      name: '充值',
      unit: 'money' as const,
      color: '#22b07d',
      values: points.map(point => point.rechargeAmount)
    },
    {
      key: 'withdraw',
      name: '提现',
      unit: 'money' as const,
      color: '#f59a3c',
      values: points.map(point => point.withdrawAmount)
    },
    {
      key: 'risk',
      name: '风险',
      unit: 'count' as const,
      color: '#d15454',
      values: points.map(point => point.riskCount)
    }
  ];
});

const commandActions = computed(() => {
  const actions = commandCenter.value?.actions;
  const actionValue = (value: number | undefined, unit: string) =>
    actions && value !== undefined ? `${formatCount(value)} ${unit}` : '—';
  return [
    {
      key: 'paymentFailed',
      label: '支付异常',
      hint: '今日充值失败状态',
      value: actionValue(actions?.paymentFailedCount, '笔'),
      tone: Number(actions?.paymentFailedCount ?? 0) > 0 ? 'danger' : 'ok'
    },
    {
      key: 'withdrawTimeout',
      label: '提现超时',
      hint: `待处理超过 ${actions?.withdrawTimeoutMinutes ?? 5} 分钟`,
      value: actionValue(actions?.withdrawTimeoutCount, '单'),
      tone: Number(actions?.withdrawTimeoutCount ?? 0) > 0 ? 'danger' : 'ok'
    },
    {
      key: 'withdrawRisk',
      label: '高风险提现',
      hint: '当前待处理风控单',
      value: actions
        ? `${formatCount(actions.withdrawRiskCount)} 单 / ${formatMoney(actions.withdrawRiskAmount)}`
        : '—',
      tone: Number(actions?.withdrawRiskCount ?? 0) > 0 ? 'danger' : 'ok'
    },
    {
      key: 'dataBroken',
      label: '数据断链',
      hint: '异常数据源',
      value: actionValue(actions?.dataBrokenCount, '个'),
      tone: Number(actions?.dataBrokenCount ?? 0) > 0 ? 'danger' : 'ok'
    }
  ];
});

const commandFunds = computed(() => {
  const funds = commandCenter.value?.funds;
  return [
    { key: 'recharge', label: '充值', value: formatMoney(funds?.rechargeAmount) },
    { key: 'bet', label: '投注', value: formatMoney(funds?.betAmount) },
    { key: 'payout', label: '派彩', value: formatMoney(funds?.payoutAmount) },
    { key: 'withdraw', label: '提现', value: formatMoney(funds?.withdrawAmount) }
  ];
});

const commandGames = computed(() => commandCenter.value?.games ?? []);

const commandQuality = computed(() => {
  const quality = commandCenter.value?.quality;
  return [
    { key: 'new', label: '新增', value: formatCount(quality?.newMembers), hint: '今日注册' },
    { key: 'active', label: '活跃', value: formatCount(quality?.activeUsers), hint: '去重真人' },
    {
      key: 'paid',
      label: '付费',
      value: formatCount(quality?.paidUsers),
      hint: `付费率 ${percentText(quality?.paidRate)}`
    },
    {
      key: 'repurchase',
      label: '复充',
      value: formatCount(quality?.repurchaseUsers),
      hint: `复充率 ${percentText(quality?.repurchaseRate)}`
    }
  ];
});

const loadSnapshot = async () => {
  if (snapshotInFlight) return snapshotInFlight;
  const requestId = ++snapshotRequestSeq;
  if (!kpiData.value) kpiLoading.value = true;
  if (!realtime.value) realtimeLoading.value = true;
  kpiError.value = false;
  realtimeError.value = false;

  snapshotInFlight = (async () => {
    try {
      const res = await getDashboardSnapshot();
      if (requestId !== snapshotRequestSeq) return;
      meta.value = res.data.meta;
      kpiData.value = res.data.kpi;
      realtime.value = res.data.realtime;
      riskToday.value = res.data.risk;
      riskLoading.value = false;
      health.value = res.data.health;
      commandCenter.value = res.data.commandCenter;
      kpiStale.value = false;
      realtimeStale.value = false;
      snapshotStale.value = false;
      lastSnapshotSuccessAt = Date.now();
    } catch (error) {
      if (requestId !== snapshotRequestSeq) return;
      snapshotStale.value = true;
      if (kpiData.value) {
        kpiStale.value = true;
      } else {
        kpiError.value = typeof error === 'string' ? error : '请求异常';
      }
      if (realtime.value) {
        realtimeStale.value = true;
      } else {
        realtimeError.value = typeof error === 'string' ? error : '请求异常';
      }
    } finally {
      if (requestId === snapshotRequestSeq) {
        kpiLoading.value = false;
        realtimeLoading.value = false;
        snapshotInFlight = null;
      }
    }
  })();
  return snapshotInFlight;
};

/* ---------------- 3. 排行榜 ---------------- */
const rankingType = ref<RankingType>('recharge');
const rankingData = ref<Partial<Record<RankingType, RankingResult>>>({});
const rankingLoading = ref(true);
const rankingError = ref<string | boolean>(false);
const rankingRequested = ref(false);
let rankingRequestSeq = 0;

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
  return rankingData.value[rankingType.value]?.items ?? [];
});

const loadRanking = async () => {
  const requestId = ++rankingRequestSeq;
  const requestedType = rankingType.value;
  if (!rankingData.value[requestedType]) rankingLoading.value = true;
  rankingError.value = false;
  try {
    const res = await getDashboardRanking(requestedType);
    if (requestId !== rankingRequestSeq) return;
    rankingData.value = { ...rankingData.value, [requestedType]: res.data };
  } catch (error) {
    if (requestId !== rankingRequestSeq) return;
    rankingError.value = typeof error === 'string' ? error : '请求异常';
  } finally {
    if (requestId === rankingRequestSeq) rankingLoading.value = false;
  }
};

const ensureRanking = (force = false) => {
  if (rankingRequested.value && !force) return Promise.resolve();
  rankingRequested.value = true;
  return loadRanking();
};

/* ---------------- 4. 多日趋势 ---------------- */
const trend = ref<TrendResult>();
const trendLoading = ref(true);
const trendError = ref<string | boolean>(false);
const trendRequested = ref(false);
let trendRequestSeq = 0;
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
    trendMetric.value === 'recharge'
      ? moneyValue(p.amount)
      : p.value === null || p.value === undefined
        ? null
        : toNumber(p.value)
  )
);
const trendHasData = computed(() => trendChartValues.value.some(value => value !== null && value !== undefined));

const loadTrend = async () => {
  const requestId = ++trendRequestSeq;
  if (!trend.value) trendLoading.value = true;
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
    if (requestId !== trendRequestSeq) return;
    trend.value = res.data;
  } catch (error) {
    if (requestId !== trendRequestSeq) return;
    trendError.value = typeof error === 'string' ? error : '请求异常';
  } finally {
    if (requestId === trendRequestSeq) trendLoading.value = false;
  }
};

const ensureTrend = (force = false) => {
  if (trendRequested.value && !force) return Promise.resolve();
  trendRequested.value = true;
  return loadTrend();
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
const overviewLoading = ref(true);
const overviewError = ref<string | boolean>(false);
const overviewRequested = ref(false);
let overviewRequestSeq = 0;
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
  if (value === null || value === undefined) return null;
  return ['amount', 'betAmount', 'validBet', 'pnl'].includes(key) ? moneyValue(toNumber(value)) : toNumber(value);
};

const overviewUserPoints = computed(() => overview.value?.trends.user ?? []);
const rechargePoints = computed(() => overview.value?.trends.recharge ?? []);
const withdrawPoints = computed(() => overview.value?.trends.withdraw ?? []);
const gamePoints = computed(() => overview.value?.trends.game ?? []);

const loadOverview = async () => {
  const requestId = ++overviewRequestSeq;
  if (!overview.value) overviewLoading.value = true;
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
    if (requestId !== overviewRequestSeq) return;
    overview.value = res.data;
  } catch (error) {
    if (requestId !== overviewRequestSeq) return;
    overviewError.value = typeof error === 'string' ? error : '请求异常';
  } finally {
    if (requestId === overviewRequestSeq) overviewLoading.value = false;
  }
};

const ensureOverview = (force = false) => {
  if (overviewRequested.value && !force) return Promise.resolve();
  overviewRequested.value = true;
  return loadOverview();
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
const riskLoading = ref(true);
const riskError = ref<string | boolean>(false);
const riskRequested = ref(false);
let riskRequestSeq = 0;
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
  const requestId = ++riskRequestSeq;
  if (!riskToday.value) riskLoading.value = true;
  riskError.value = false;
  try {
    const trendRes = await getDashboardRiskTrend({ days: 7 });
    const todayRes = riskToday.value ? null : await getDashboardRiskToday();
    if (requestId !== riskRequestSeq) return;
    if (todayRes) riskToday.value = todayRes.data;
    riskTrendRows.value = (trendRes.data?.rows ?? []) as Array<{ date: string; [key: string]: unknown }>;
  } catch (error) {
    if (requestId !== riskRequestSeq) return;
    riskError.value = typeof error === 'string' ? error : '请求异常';
  } finally {
    if (requestId === riskRequestSeq) riskLoading.value = false;
  }
};

const ensureRisk = (force = false) => {
  if (riskRequested.value && !force) return Promise.resolve();
  riskRequested.value = true;
  return loadRisk();
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
    await Promise.all([loadSnapshot(), ensureRanking(true), ensureTrend(true), ensureOverview(true), ensureRisk(true)]);
  } finally {
    refreshing.value = false;
  }
};

type SectionRef = { $el?: HTMLElement };

const rankingSection = ref<SectionRef>();
const trendSection = ref<SectionRef>();
const overviewSection = ref<SectionRef>();
const riskSection = ref<SectionRef>();
const sectionObservers: IntersectionObserver[] = [];

const loadWhenVisible = (element: HTMLElement | undefined, load: () => Promise<unknown>) => {
  if (!element) return;
  if (typeof IntersectionObserver === 'undefined') {
    void load();
    return;
  }
  const observer = new IntersectionObserver(
    entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      const observerIndex = sectionObservers.indexOf(observer);
      if (observerIndex >= 0) sectionObservers.splice(observerIndex, 1);
      void load();
    },
    { rootMargin: '240px 0px' }
  );
  sectionObservers.push(observer);
  observer.observe(element);
};

let snapshotTimer: number | undefined;
let clockTimer: number | undefined;
let pollingActive = false;
let pageActive = false;

const updateDashboardClock = () => {
  dashboardClock.value = new Date().toLocaleTimeString('zh-CN', { hour12: false });
};

const startClock = () => {
  updateDashboardClock();
  if (clockTimer) return;
  clockTimer = window.setInterval(updateDashboardClock, 1000);
};

const stopClock = () => {
  if (clockTimer) window.clearInterval(clockTimer);
  clockTimer = undefined;
};

const stopPolling = () => {
  pollingActive = false;
  if (snapshotTimer) window.clearInterval(snapshotTimer);
  snapshotTimer = undefined;
};

const refreshVisibleDataIfStale = () => {
  if (!pageActive || document.visibilityState === 'hidden') return;
  const now = Date.now();
  if (!lastSnapshotSuccessAt || now - lastSnapshotSuccessAt >= 30_000) void loadSnapshot();
};

const startPolling = () => {
  if (pollingActive) return;
  pollingActive = true;
  snapshotTimer = window.setInterval(() => {
    if (pageActive && document.visibilityState !== 'hidden') void loadSnapshot();
  }, 30_000);
};

onMounted(() => {
  pageActive = true;
  startClock();
  void loadSnapshot();
  loadWhenVisible(rankingSection.value?.$el, ensureRanking);
  loadWhenVisible(trendSection.value?.$el, ensureTrend);
  loadWhenVisible(overviewSection.value?.$el, ensureOverview);
  loadWhenVisible(riskSection.value?.$el, ensureRisk);
  document.addEventListener('visibilitychange', refreshVisibleDataIfStale);
  startPolling();
});

onActivated(() => {
  pageActive = true;
  startClock();
  startPolling();
  refreshVisibleDataIfStale();
});

onDeactivated(() => {
  pageActive = false;
  stopClock();
  stopPolling();
});

onBeforeUnmount(() => {
  pageActive = false;
  stopClock();
  stopPolling();
  sectionObservers.splice(0).forEach(observer => observer.disconnect());
  document.removeEventListener('visibilitychange', refreshVisibleDataIfStale);
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

.data-health {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 6px;
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
  font-size: 12px;
}

.health-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--el-color-success);
}

.alert-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.alert-chip {
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  border: 1px solid var(--el-border-color-lighter);
}

.alert-chip.warning {
  color: var(--el-color-warning-dark-2);
  background: var(--el-color-warning-light-9);
}

.alert-chip.danger {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
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

.stale-text {
  color: var(--el-color-warning);
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

.compare-rate.good {
  color: var(--el-color-success);
}

.compare-rate.bad {
  color: var(--el-color-danger);
}

.compare-rate.neutral,
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

.live-badge.stale {
  color: var(--el-color-warning);
}

.live-badge.stale .live-dot {
  background: var(--el-color-warning);
  animation: none;
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

.fund-value small {
  margin-left: 4px;
  font-size: 11px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
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

/* 运营指挥台首屏 */
.command-state {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.command-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.command-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid rgba(34, 176, 125, 0.2);
  border-radius: 999px;
  color: var(--el-color-success);
  background: rgba(34, 176, 125, 0.08);
  font-size: 12px;
  font-weight: 600;
}

.command-status.danger {
  border-color: rgba(225, 92, 92, 0.25);
  color: var(--el-color-danger);
  background: rgba(225, 92, 92, 0.08);
}

.command-meta {
  gap: 18px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.command-clock {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 700;
}

.command-kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.command-kpi {
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color);
}

.command-kpi-label {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.command-kpi-value {
  overflow: hidden;
  margin-top: 7px;
  color: var(--el-text-color-primary);
  font-size: clamp(20px, 2vw, 28px);
  font-weight: 750;
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.command-kpi-sub {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  white-space: nowrap;
}

.command-kpi-sub.good {
  color: var(--el-color-success);
}

.command-kpi-sub.bad,
.command-kpi-sub.warning {
  color: var(--el-color-danger);
}

.command-kpi-sub.info {
  color: var(--el-color-primary);
}

.command-main-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(300px, 0.8fr);
  gap: 12px;
}

.command-trend-panel,
.command-action-panel,
.command-bottom-card {
  min-width: 0;
  padding: 14px 16px;
}

.command-panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.command-panel-head h3 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.command-panel-head span {
  display: block;
  margin-top: 3px;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.command-action-list {
  display: flex;
  flex-direction: column;
}

.command-action-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 52px;
  padding: 6px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.command-action-item:last-child {
  border-bottom: 0;
}

.command-action-item > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.command-action-label {
  color: var(--el-text-color-primary);
  font-size: 13px;
}

.command-action-item small {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.command-action-item strong {
  color: var(--el-color-success);
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.command-action-item.danger strong {
  color: var(--el-color-danger);
}

.command-bottom-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.fund-flow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  min-height: 108px;
}

.fund-flow-item,
.quality-step {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.fund-flow-item span,
.quality-step span {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.fund-flow-item strong,
.quality-step strong {
  overflow: hidden;
  max-width: 100%;
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fund-arrow,
.quality-arrow {
  color: var(--el-color-primary);
  font-size: 16px;
}

.command-game-table {
  --el-table-header-bg-color: transparent;
  --el-table-row-hover-bg-color: var(--el-fill-color-lighter);
}

.game-health-name {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.command-games small {
  color: var(--el-text-color-secondary);
  font-size: 10px;
}

.quality-flow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 5px;
  min-height: 108px;
}

.quality-step small {
  color: var(--el-text-color-secondary);
  font-size: 10px;
  text-align: center;
}

.detail-section-title {
  margin-top: 2px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 700;
}

@media (max-width: 1400px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }

  .command-kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .command-bottom-grid {
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

  .command-main-grid {
    grid-template-columns: 1fr;
  }

  .command-meta {
    flex-wrap: wrap;
  }
}
</style>
