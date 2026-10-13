<template>
  <div class="p-2 app-container report-rtp-page">
    <el-alert
      class="mb-3"
      type="info"
      :closable="false"
      show-icon
      title="综合理论 RTP = 基础 RTP + 奖池 RTP + 加码 RTP；目标区间 92%~98%"
      description="奖池“进入金额”不等于奖池返奖，奖池列按长期期望派彩计；实际 RTP 仅与理论值比对偏差，短周期波动不单独判定模型异常。"
    />

    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <el-tab-pane label="综合 RTP" name="daily" />
      <el-tab-pane label="奖池资金日报" name="jackpot" />
    </el-tabs>

    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" :model="query">
        <el-form-item label="统计日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            :clearable="false"
          />
        </el-form-item>
        <el-form-item label="游戏">
          <el-select v-model="query.gameId" placeholder="全部游戏" clearable style="width: 220px">
            <el-option v-for="g in theoryList" :key="g.gameId" :label="g.gameName" :value="g.gameId" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
        <el-form-item>
          <el-button
            v-hasPermi="['report:rtp:aggregate']"
            type="warning"
            icon="RefreshRight"
            :loading="aggregating"
            @click="handleAggregate"
          >
            重算日报
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <template v-if="activeTab === 'daily'">
      <!-- 管理层视图：区间注额加权汇总（先累加分子分母再算 RTP） -->
      <el-row :gutter="12" class="mb-3">
        <el-col :span="4">
          <el-card shadow="hover" class="kpi-card">
            <div class="kpi-label">综合理论 RTP</div>
            <div class="kpi-value">{{ pct(summary?.overall.totalTheoreticalRtp) }}</div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card shadow="hover" class="kpi-card">
            <div class="kpi-label">实际 RTP</div>
            <div class="kpi-value">{{ pct(summary?.overall.actualRtp) }}</div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card shadow="hover" class="kpi-card">
            <div class="kpi-label">RTP 偏差</div>
            <div class="kpi-value">{{ pp(summary?.overall.rtpDiffPp) }}</div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card shadow="hover" class="kpi-card">
            <div class="kpi-label">有效投注</div>
            <div class="kpi-value">{{ amount(summary?.overall.validBet) }}</div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card shadow="hover" class="kpi-card">
            <div class="kpi-label">奖池派发</div>
            <div class="kpi-value">{{ amount(summary?.overall.jackpotPayout) }}</div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card shadow="hover" class="kpi-card">
            <div class="kpi-label">游戏数（绿/橙/红）</div>
            <div class="kpi-value">
              {{ summary?.overall.gameCount ?? 0 }}
              <span class="text-green-500">（{{ summary?.overall.greenCount ?? 0 }}</span>
              <span class="text-orange-500">/{{ summary?.overall.orangeCount ?? 0 }}</span>
              <span class="text-red-500">/{{ summary?.overall.redCount ?? 0 }}）</span>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="hover">
        <template #header>
          <div class="table-heading">
            <h3>综合 RTP 日报</h3>
            <span class="text-gray-400 text-sm">
              理论列取自 game_rtp_theory_config；实际列取自 minigame_round_record（同源同过滤）
            </span>
          </div>
        </template>
        <el-table v-loading="loading" border :data="dailyRows">
          <el-table-column label="日期" prop="statDate" width="110" align="center" fixed="left" />
          <el-table-column label="游戏" min-width="180" fixed="left">
            <template #default="{ row }">
              <div>{{ row.gameName || row.gameId }}</div>
              <div class="text-gray-400 text-xs">
                {{ row.gameId }}
                <el-tooltip v-if="row.baseNote || row.bonusNote" placement="top">
                  <template #content>
                    <div>基础口径：{{ row.baseNote || '-' }}</div>
                    <div>加码口径：{{ row.bonusNote || '-' }}</div>
                  </template>
                  <el-icon class="ml-1 cursor-pointer"><QuestionFilled /></el-icon>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="有效投注" width="130" align="right">
            <template #default="{ row }">{{ amount(row.validBet) }}</template>
          </el-table-column>
          <el-table-column label="基础 RTP" width="100" align="right">
            <template #default="{ row }">{{ pct(row.baseTheoreticalRtp) }}</template>
          </el-table-column>
          <el-table-column label="奖池 RTP" width="100" align="right">
            <template #default="{ row }">{{ pct(row.jackpotTheoreticalRtp) }}</template>
          </el-table-column>
          <el-table-column label="加码 RTP" width="100" align="right">
            <template #default="{ row }">{{ pct(row.bonusTheoreticalRtp) }}</template>
          </el-table-column>
          <el-table-column label="综合理论" width="105" align="right">
            <template #default="{ row }">
              <b>{{ pct(row.totalTheoreticalRtp) }}</b>
            </template>
          </el-table-column>
          <el-table-column label="基础派彩" width="130" align="right">
            <template #default="{ row }">{{ amount(row.basePayout) }}</template>
          </el-table-column>
          <el-table-column label="奖池派彩" width="130" align="right">
            <template #default="{ row }">{{ amount(row.jackpotPayout) }}</template>
          </el-table-column>
          <el-table-column label="加码派彩" width="120" align="right">
            <template #default="{ row }">{{ amount(row.bonusPayout) }}</template>
          </el-table-column>
          <el-table-column label="实际 RTP" width="105" align="right">
            <template #default="{ row }">
              <b>{{ pct(row.actualRtp) }}</b>
            </template>
          </el-table-column>
          <el-table-column label="偏差(pp)" width="100" align="right">
            <template #default="{ row }">{{ pp(row.rtpDiff) }}</template>
          </el-table-column>
          <el-table-column label="理论判定" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="levelTag(row.theoryAlertLevel)">{{ levelText(row.theoryAlertLevel) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="实际判定" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="levelTag(row.actualAlertLevel)">{{ actualText(row.actualAlertLevel) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="综合预警" width="100" align="center" fixed="right">
            <template #default="{ row }">
              <el-tag :type="levelTag(row.alertLevel)">{{ levelText(row.alertLevel) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="数据状态" width="110" align="center" fixed="right">
            <template #default="{ row }">
              <el-tooltip placement="top" :content="statusTip(row.dataStatus)">
                <el-tag :type="statusTag(row.dataStatus)">{{ row.dataStatus }}</el-tag>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>

    <template v-else>
      <el-card shadow="hover">
        <template #header>
          <div class="table-heading">
            <h3>奖池资金日报</h3>
            <span class="text-gray-400 text-sm">
              期末 = 期初 + 玩家贡献 + 平台贡献 + 调整 − 派发；差额非 0 优先判数据异常
            </span>
          </div>
        </template>
        <el-table v-loading="loading" border :data="jackpotRows">
          <el-table-column label="日期" prop="statDate" width="110" align="center" />
          <el-table-column label="游戏" prop="gameId" min-width="140" />
          <el-table-column label="奖池ID" prop="jackpotId" width="90" align="center" />
          <el-table-column label="期初余额" width="140" align="right">
            <template #default="{ row }">{{ amount(row.openingBalance) }}</template>
          </el-table-column>
          <el-table-column label="玩家贡献" width="140" align="right">
            <template #default="{ row }">{{ amount(row.playerContribution) }}</template>
          </el-table-column>
          <el-table-column label="平台贡献" width="120" align="right">
            <template #default="{ row }">{{ amount(row.platformContribution) }}</template>
          </el-table-column>
          <el-table-column label="调整" width="110" align="right">
            <template #default="{ row }">{{ amount(row.adjustmentAmount) }}</template>
          </el-table-column>
          <el-table-column label="奖池派发" width="140" align="right">
            <template #default="{ row }">{{ amount(row.payoutAmount) }}</template>
          </el-table-column>
          <el-table-column label="期末余额" width="140" align="right">
            <template #default="{ row }">{{ amount(row.closingBalance) }}</template>
          </el-table-column>
          <el-table-column label="对账差额" width="120" align="right">
            <template #default="{ row }">
              <span :class="Number(row.reconDiff) === 0 ? '' : 'text-red-500'">{{ amount(row.reconDiff) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数据状态" width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="statusTag(row.dataStatus)">{{ row.dataStatus }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>
  </div>
</template>

<script setup name="ReportRtp" lang="ts">
import {
  aggregateRtpDaily,
  getRtpDaily,
  getRtpJackpotDaily,
  getRtpSummary,
  getRtpTheory
} from '@/api/report/rtp';
import type { RtpDailyRow, RtpJackpotDailyRow, RtpSummary, RtpTheoryConfig } from '@/api/report/rtp/types';
import { ElMessage, ElMessageBox } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';

const activeTab = ref<'daily' | 'jackpot'>('daily');
const loading = ref(false);
const aggregating = ref(false);
const dailyRows = ref<RtpDailyRow[]>([]);
const jackpotRows = ref<RtpJackpotDailyRow[]>([]);
const theoryList = ref<RtpTheoryConfig[]>([]);
const summary = ref<RtpSummary>();
const dateRange = ref<[string, string]>([today(-6), today(0)]);
const query = reactive<{ gameId?: string }>({ gameId: undefined });

/** yyyy-MM-dd（offsetDays 为负表示往前推）。 */
function today(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** 百分比展示（后端传小数，如 0.9722 → 97.22%）。 */
const pct = (value?: number | null) => `${((Number(value) || 0) * 100).toFixed(2)}%`;
/** 偏差展示（pp，带符号）。 */
const pp = (value?: number | null) => (value === null || value === undefined ? '-' : `${Number(value) >= 0 ? '+' : ''}${Number(value).toFixed(2)}pp`);
/** 金额千分位展示。 */
const amount = (value?: number | null) => Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const levelTag = (level?: string) => {
  if (level === 'RED' || level === 'ABNORMAL') return 'danger';
  if (level === 'ORANGE' || level === 'WATCH') return 'warning';
  return 'success';
};
const levelText = (level?: string) => (level === 'RED' ? '严重' : level === 'ORANGE' ? '预警' : '正常');
const actualText = (level?: string) => (level === 'ABNORMAL' ? '异常' : level === 'WATCH' ? '关注' : '正常');

const statusTag = (status?: string) => {
  switch (status) {
    case 'PARTIAL':
      return 'warning';
    case 'RECON_FAIL':
    case 'NO_THEORY':
      return 'danger';
    case 'NO_DATA':
      return 'info';
    default:
      return 'success';
  }
};
const statusTip = (status?: string) => {
  switch (status) {
    case 'PARTIAL':
      return '部分口径缺失：加码实付未单独落库（当前计 0），理论加码 RTP 已有配置';
    case 'NO_THEORY':
      return '该游戏有投注数据但缺少理论口径配置，请在 game_rtp_theory_config 补录';
    case 'RECON_FAIL':
      return '奖池资金对账不平，优先排查数据链路';
    case 'NO_DATA':
      return '当日无有效投注（空局不计入分母）';
    default:
      return '口径完整';
  }
};

async function loadData() {
  loading.value = true;
  try {
    const params = { startDate: dateRange.value[0], endDate: dateRange.value[1], gameId: query.gameId };
    if (activeTab.value === 'daily') {
      const [dailyRes, summaryRes] = await Promise.all([getRtpDaily(params), getRtpSummary(params)]);
      dailyRows.value = dailyRes.data ?? [];
      summary.value = summaryRes.data;
    } else {
      const res = await getRtpJackpotDaily(params);
      jackpotRows.value = res.data ?? [];
    }
  } finally {
    loading.value = false;
  }
}

async function loadTheory() {
  const res = await getRtpTheory();
  theoryList.value = res.data ?? [];
}

function handleQuery() {
  loadData();
}

function resetQuery() {
  dateRange.value = [today(-6), today(0)];
  query.gameId = undefined;
  loadData();
}

function onTabChange() {
  loadData();
}

/** 重算日报：幂等，缺省重算昨天（当天数据尚未收敛）。 */
async function handleAggregate() {
  await ElMessageBox.confirm(
    '将按 minigame_round_record 现有事实重算所选结束日的日报（同日期覆盖），是否继续？',
    '重算 RTP 日报',
    { type: 'warning' }
  );
  aggregating.value = true;
  try {
    const res = await aggregateRtpDaily(dateRange.value[1]);
    ElMessage.success(`重算完成，共写入 ${res.data ?? 0} 款游戏`);
    await loadData();
  } finally {
    aggregating.value = false;
  }
}

onMounted(async () => {
  await loadTheory();
  await loadData();
});
</script>

<style scoped lang="scss">
.report-rtp-page {
  .table-heading {
    display: flex;
    align-items: baseline;
    gap: 12px;

    h3 {
      margin: 0;
    }
  }

  .kpi-card {
    text-align: center;

    .kpi-label {
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }

    .kpi-value {
      margin-top: 6px;
      font-size: 18px;
      font-weight: 600;
    }
  }
}
</style>
