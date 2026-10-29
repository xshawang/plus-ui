<template>
  <div v-loading="loading" class="ops-panel">
    <PanelToolbar
      v-model:auto-refresh="autoRefresh"
      :loading="loading"
      :updated-at="refreshedAt"
      @refresh="refresh"
    />

    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="只读分析：先看口径，再看盈亏"
      description="P2P 不使用传统 RTP，重点看每局净 EV、每单位下注净 EV、净收益率及 95% 置信区间；庄家型另看实际 RTP、投注结构加权目标 RTP 和配置覆盖率。"
      class="mb-3"
    />

    <div class="filter-row">
      <el-select v-model="gameType" style="width: 150px">
        <el-option label="全部类型" value="" />
        <el-option label="P2P" value="P2P" />
        <el-option label="庄家型" value="DEALER" />
      </el-select>
      <el-select v-model="gameCode" clearable placeholder="选择游戏名 / game_code" style="width: 280px">
        <el-option
          v-for="game in ROBOT_GAME_OPTIONS"
          :key="game.code"
          :label="gameOptionLabel(game)"
          :value="game.code"
        />
      </el-select>
      <span class="range-text">{{ props.range?.[0] || '今日' }} 至 {{ props.range?.[1] || '今日' }}</span>
    </div>

    <el-card shadow="never" class="decision-card">
      <template #header>
        <div class="decision-header">
          <div>
            <div class="card-title">运营决策门禁</div>
            <div class="sub-text">所有门禁同时满足才标记“可决策”；缺失生产权重或审批时禁止据此发布策略</div>
          </div>
          <el-tag :type="(decisionSummary.ready || 0) > 0 ? 'success' : 'info'" size="large">
            {{ integerValue(decisionSummary.ready) }} / {{ integerValue(decisionSummary.total) }} 可决策
          </el-tag>
        </div>
      </template>
      <el-table :data="filteredDecisions" border size="small">
        <el-table-column label="游戏" min-width="175">
          <template #default="{ row }">
            <div class="game-name">{{ row.gameName }}</div>
            <div class="game-code">{{ row.gameCode }} · {{ row.gameType }}</div>
          </template>
        </el-table-column>
        <el-table-column label="综合结论" width="105">
          <template #default="{ row }">
            <el-tag :type="decisionStatusType(row.status)">{{ decisionStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="实际结构" width="105" align="center">
          <template #default="{ row }">
            <el-tooltip :content="decisionCheck(row, 'ACTUAL_STRUCTURE').evidence" placement="top">
              <el-tag size="small" :type="checkType(row, 'ACTUAL_STRUCTURE')">
                {{ checkLabel(row, 'ACTUAL_STRUCTURE') }}
              </el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="实际投注" width="105" align="center">
          <template #default="{ row }">
            <el-tooltip :content="decisionCheck(row, 'ACTUAL_OUTCOME').evidence" placement="top">
              <el-tag size="small" :type="checkType(row, 'ACTUAL_OUTCOME')">
                {{ checkLabel(row, 'ACTUAL_OUTCOME') }}
              </el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="EV/RTP CI" width="105" align="center">
          <template #default="{ row }">
            <el-tooltip :content="decisionCheck(row, 'ECONOMICS_CI').evidence" placement="top">
              <el-tag size="small" :type="checkType(row, 'ECONOMICS_CI')">
                {{ checkLabel(row, 'ECONOMICS_CI') }}
              </el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="生产权重 EV/RTP" min-width="205" align="right">
          <template #default="{ row }">
            <div>{{ productionMetricPoint(row) }}</div>
            <div class="sub-text">{{ productionMetricCi(row) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="对手分组" width="105" align="center">
          <template #default="{ row }">
            <el-tooltip :content="decisionCheck(row, 'OPPONENT_GROUPS').evidence" placement="top">
              <el-tag size="small" :type="checkType(row, 'OPPONENT_GROUPS')">
                {{ checkLabel(row, 'OPPONENT_GROUPS') }}
              </el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="预算尾部" width="105" align="center">
          <template #default="{ row }">
            <el-tooltip :content="decisionCheck(row, 'BUDGET_TAIL').evidence" placement="top">
              <el-tag size="small" :type="checkType(row, 'BUDGET_TAIL')">
                {{ checkLabel(row, 'BUDGET_TAIL') }}
              </el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="生产权重" width="105" align="center">
          <template #default="{ row }">
            <el-tooltip :content="decisionCheck(row, 'PRODUCTION_WEIGHT').evidence" placement="top">
              <el-tag size="small" :type="checkType(row, 'PRODUCTION_WEIGHT')">
                {{ checkLabel(row, 'PRODUCTION_WEIGHT') }}
              </el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="版本审批" width="105" align="center">
          <template #default="{ row }">
            <el-tooltip :content="decisionCheck(row, 'STRATEGY_APPROVAL').evidence" placement="top">
              <el-tag size="small" :type="checkType(row, 'STRATEGY_APPROVAL')">
                {{ checkLabel(row, 'STRATEGY_APPROVAL') }}
              </el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="阻塞原因" min-width="310" show-overflow-tooltip>
          <template #default="{ row }">{{ row.blockers?.join('；') || '—' }}</template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="never">
      <el-table :data="filteredRows" border stripe>
        <el-table-column label="游戏" min-width="190">
          <template #default="{ row }">
            <div class="game-name">{{ row.gameName }}</div>
            <div class="game-code">{{ row.gameCode }} · {{ row.gameType }}</div>
          </template>
        </el-table-column>
        <el-table-column label="有效样本" width="115" align="right">
          <template #default="{ row }">
            <div>{{ integerValue(row.hands) }}</div>
            <el-tag size="small" :type="sampleType(row.sampleState)" effect="plain">
              {{ sampleLabel(row.sampleState) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="机器人座位手" width="120" align="right">
          <template #default="{ row }">{{ integerValue(row.robotSeatHands) }}</template>
        </el-table-column>
        <el-table-column label="投注额" width="135" align="right">
          <template #default="{ row }">{{ moneyFen(row.robotBetFen) }}</template>
        </el-table-column>
        <el-table-column label="中奖/派彩" width="135" align="right">
          <template #default="{ row }">{{ moneyFen(row.robotWinFen) }}</template>
        </el-table-column>
        <el-table-column label="机器人净盈亏" width="140" align="right">
          <template #default="{ row }">
            <span :class="Number(row.robotNetFen) >= 0 ? 'positive' : 'negative'">{{ moneyFen(row.robotNetFen) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="最大单局亏损" width="145" align="right">
          <template #default="{ row }">
            <span class="negative">{{ moneyFen(row.worstHandNetFen) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="每局净 EV" width="155" align="right">
          <template #default="{ row }">
            <div>{{ moneyFen(row.netPerHandFen) }}</div>
            <div class="sub-text">{{ ciMoney(row.netPerHandCiLowFen, row.netPerHandCiHighFen) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="每单位下注净 EV" width="190" align="right">
          <template #default="{ row }">
            <div>{{ numberValue(row.netPerBet, 4) }}</div>
            <div class="sub-text">{{ ciNumber(row.netPerBetCiLow, row.netPerBetCiHigh, 4) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="净收益率" width="175" align="right">
          <template #default="{ row }">
            <div>{{ percent(row.returnRate) }}</div>
            <div class="sub-text">{{ ciPercent(row.returnRateCiLow, row.returnRateCiHigh) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="P2P EV / 庄家 RTP" width="205" align="right">
          <template #default="{ row }">
            <span v-if="row.gameType === 'P2P'">{{ numberValue(row.evB, 4) }}b</span>
            <span v-else>
              <div>{{ percent(row.actualRtp) }}</div>
              <div class="sub-text">{{ ciPercent(row.actualRtpCiLow, row.actualRtpCiHigh) }}</div>
              <div class="sub-text">
                目标 {{ row.expectedRtp == null ? '未配置' : percent(row.expectedRtp) }}
                · 覆盖 {{ percent(row.rtpCoverageRate) }}
              </div>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="统计证据" width="165">
          <template #default="{ row }">
            <el-tooltip :content="decisionReason(row)" placement="top">
              <el-tag :type="decision(row).type">{{ decision(row).text }}</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <div class="analysis-grid">
      <el-card shadow="never">
        <template #header>
          <div class="card-title">
            <span>对手组合</span>
            <el-tooltip content="座位数/机器人数分组用于识别机器人是否只在一类桌型上盈利" placement="top">
              <el-icon><InfoFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-table :data="opponentGroups" size="small" border max-height="360">
          <el-table-column label="游戏" width="105" prop="gameCode" />
          <el-table-column label="真人/机器人" width="125">
            <template #default="{ row }">{{ integerValue(row.humans) }} / {{ integerValue(row.robots) }}</template>
          </el-table-column>
          <el-table-column label="手数" width="105" align="right">
            <template #default="{ row }">
              <div>{{ integerValue(row.hands) }}</div>
              <el-tag size="small" :type="sampleType(row.sampleState)" effect="plain">
                {{ sampleLabel(row.sampleState) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="机器人投注" width="125" align="right">
            <template #default="{ row }">{{ moneyFen(row.robotBetFen) }}</template>
          </el-table-column>
          <el-table-column label="机器人净额" min-width="125" align="right">
            <template #default="{ row }">{{ moneyFen(row.robotNetFen) }}</template>
          </el-table-column>
          <el-table-column label="每单位下注净 EV（95% CI）" min-width="225" align="right">
            <template #default="{ row }">
              <div>{{ numberValue(row.netPerBet, 4) }}</div>
              <div class="sub-text">{{ ciNumber(row.netPerBetCiLow, row.netPerBetCiHigh, 4) }}</div>
            </template>
          </el-table-column>
          <el-table-column label="净收益率（95% CI）" min-width="190" align="right">
            <template #default="{ row }">
              <div>{{ percent(row.returnRate) }}</div>
              <div class="sub-text">{{ ciPercent(row.returnRateCiLow, row.returnRateCiHigh) }}</div>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!opponentGroups.length" description="当前窗口没有 P2P 对手组合数据" :image-size="64" />
      </el-card>

      <el-card shadow="never">
        <template #header>
          <div class="card-title">
            <span>策略执行审计</span>
            <el-tooltip content="审计为采样数据，仅用于核验策略版本与拒绝率，不是完整牌局流水" placement="top">
              <el-icon><InfoFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-table :data="strategyDecisions" size="small" border max-height="360">
          <el-table-column label="游戏" width="105" prop="gameCode" />
          <el-table-column label="档位" width="80" prop="skillTier" />
          <el-table-column label="策略" min-width="150">
            <template #default="{ row }">{{ row.strategyCode }} v{{ row.strategyVersion }}</template>
          </el-table-column>
          <el-table-column label="采样" width="80" align="right">
            <template #default="{ row }">{{ integerValue(row.decisions) }}</template>
          </el-table-column>
          <el-table-column label="拒绝" width="80" align="right">
            <template #default="{ row }">{{ integerValue(row.rejected) }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!strategyDecisions.length" description="当前窗口没有策略审计采样" :image-size="64" />
      </el-card>
    </div>

    <el-card shadow="never" class="tier-card">
      <template #header>
        <div class="card-title">
          <span>策略版本与审批记录</span>
          <el-tooltip content="审批记录来自 robot_strategy_version；DRAFT 或未填写审批人的版本不能作为生产决策依据" placement="top">
            <el-icon><InfoFilled /></el-icon>
          </el-tooltip>
        </div>
      </template>
      <el-table :data="strategyVersions" border size="small">
        <el-table-column label="游戏" width="120" prop="gameCode" />
        <el-table-column label="策略" min-width="170">
          <template #default="{ row }">{{ row.strategyCode }} v{{ row.version }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="versionStatusType(row.status)">{{ row.status || 'UNKNOWN' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="仿真手数" width="120" align="right">
          <template #default="{ row }">{{ integerValue(row.simulationHands) }}</template>
        </el-table-column>
        <el-table-column label="仿真 RTP" width="110" align="right">
          <template #default="{ row }">{{ row.simulationRtp == null ? '未登记' : percent(row.simulationRtp) }}</template>
        </el-table-column>
        <el-table-column label="审批人" width="130">
          <template #default="{ row }">{{ row.approvedBy || '未审批' }}</template>
        </el-table-column>
        <el-table-column label="审批时间" width="180">
          <template #default="{ row }">{{ row.approvedAt ? timeText(row.approvedAt) : '—' }}</template>
        </el-table-column>
        <el-table-column label="仿真报告" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">{{ row.simulationReport || '—' }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!strategyVersions.length" description="当前筛选没有策略版本记录" :image-size="64" />
    </el-card>

    <StrategyGovernancePanel
      :game-code="gameCode"
      :versions="strategyVersions"
      :refresh-token="refreshedAt"
      @changed="refresh"
    />

    <el-card shadow="never" class="tier-card">
      <template #header>档位账号结构</template>
      <el-table :data="tierDistribution" border size="small">
        <el-table-column label="游戏" width="130" prop="gameCode" />
        <el-table-column label="档位" width="100" prop="skillTier" />
        <el-table-column label="账号数" width="110" align="right">
          <template #default="{ row }">{{ integerValue(row.robots) }}</template>
        </el-table-column>
        <el-table-column label="在座数" width="110" align="right">
          <template #default="{ row }">{{ integerValue(row.sitting) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { InfoFilled } from '@element-plus/icons-vue';
import { robotOpsAnalytics } from '@/api/robot/ops';
import { integerValue, moneyFen, numberValue, percent, timeText } from '../format';
import { gameOptionLabel, ROBOT_GAME_OPTIONS } from '../gameOptions';
import { usePanelAutoRefresh } from '../usePanelAutoRefresh';
import PanelToolbar from './PanelToolbar.vue';
import StrategyGovernancePanel from './StrategyGovernancePanel.vue';

const props = defineProps<{ range: string[] }>();
const rows = ref<any[]>([]);
const decisionRows = ref<any[]>([]);
const decisionSummary = ref<any>({});
const opponentGroups = ref<any[]>([]);
const strategyDecisions = ref<any[]>([]);
const strategyVersions = ref<any[]>([]);
const tierDistribution = ref<any[]>([]);
const gameType = ref('');
const gameCode = ref('');

const filteredRows = computed(() => rows.value.filter(row => !gameType.value || row.gameType === gameType.value));
const filteredDecisions = computed(() =>
  decisionRows.value.filter(row => !gameType.value || row.gameType === gameType.value));

function sampleType(state: string) {
  if (state === 'DECISION_READY') return 'success';
  if (state === 'OBSERVE') return 'warning';
  return 'info';
}
function sampleLabel(state: string) {
  if (state === 'DECISION_READY') return '可决策';
  if (state === 'OBSERVE') return '观察中';
  return '样本不足';
}
function decisionStatusType(status: string) {
  if (status === 'READY') return 'success';
  if (status === 'PARTIAL') return 'warning';
  return 'danger';
}
function decisionStatusLabel(status: string) {
  if (status === 'READY') return '可决策';
  if (status === 'PARTIAL') return '证据待补';
  return '阻塞';
}
function decisionCheck(row: any, key: string) {
  return row.checks?.find((item: any) => item.key === key) || { status: 'BLOCKED', evidence: '门禁结果缺失' };
}
function checkType(row: any, key: string) {
  return decisionStatusType(decisionCheck(row, key).status);
}
function checkLabel(row: any, key: string) {
  const status = decisionCheck(row, key).status;
  if (status === 'PASS') return '通过';
  if (status === 'PARTIAL') return '待补';
  return '阻塞';
}
function productionMetricPoint(row: any) {
  const metrics = row.productionMetrics;
  if (!metrics?.ready) return '未登记';
  return metrics.metricType === 'EV_B'
    ? `${numberValue(metrics.estimate, 4)}b`
    : percent(metrics.estimate);
}
function productionMetricCi(row: any) {
  const metrics = row.productionMetrics;
  if (!metrics?.ready) return '99% CI 样本不足';
  return metrics.metricType === 'EV_B'
    ? `99% CI ${numberValue(metrics.ci99Low, 4)}b ~ ${numberValue(metrics.ci99High, 4)}b`
    : `99% CI ${percent(metrics.ci99Low)} ~ ${percent(metrics.ci99High)}`;
}
function versionStatusType(status: string) {
  if (status === 'ACTIVE') return 'success';
  if (status === 'CANARY') return 'warning';
  if (status === 'PAUSED' || status === 'DISABLED') return 'danger';
  return 'info';
}
function ciNumber(low: unknown, high: unknown, digits = 4) {
  if (!Number.isFinite(Number(low)) || !Number.isFinite(Number(high))) return '95% CI 样本不足';
  return `95% CI ${numberValue(low, digits)} ~ ${numberValue(high, digits)}`;
}
function ciPercent(low: unknown, high: unknown) {
  if (!Number.isFinite(Number(low)) || !Number.isFinite(Number(high))) return '95% CI 样本不足';
  return `95% CI ${percent(low)} ~ ${percent(high)}`;
}
function ciMoney(low: unknown, high: unknown) {
  if (!Number.isFinite(Number(low)) || !Number.isFinite(Number(high))) return '95% CI 样本不足';
  return `95% CI ${moneyFen(low)} ~ ${moneyFen(high)}`;
}
function decision(row: any) {
  if (!row.hands) return { type: 'info' as const, text: '无样本' };
  if (row.sampleState === 'INSUFFICIENT') return { type: 'warning' as const, text: '样本不足' };
  if (row.gameType === 'P2P') {
    if (row.ci95ExcludesZeroNetPerBet !== true) return { type: 'warning' as const, text: 'CI 跨零' };
    return Number(row.netPerBet) > 0
      ? { type: 'success' as const, text: '正 EV 成立' }
      : { type: 'danger' as const, text: '负 EV 成立' };
  }
  if (row.expectedRtp == null) return { type: 'warning' as const, text: '目标未配置' };
  if (!Number.isFinite(Number(row.actualRtpCiLow)) || !Number.isFinite(Number(row.actualRtpCiHigh))) {
    return { type: 'warning' as const, text: 'RTP 待观察' };
  }
  if (Number(row.actualRtpCiLow) > Number(row.expectedRtp)) {
    return { type: 'danger' as const, text: '高于目标' };
  }
  if (Number(row.actualRtpCiHigh) < Number(row.expectedRtp)) {
    return { type: 'warning' as const, text: '低于目标' };
  }
  return { type: 'success' as const, text: '与目标一致' };
}
function decisionReason(row: any) {
  if (row.gameType === 'P2P') {
    return 'P2P 以净额/投注的 95% CI 是否跨零判断方向；样本达到 10,000 手才标记可决策。';
  }
  return `目标 RTP 按投注项和实际投注结构加权；配置覆盖率 ${percent(row.rtpCoverageRate)}。`;
}
async function load(forceRefresh = false) {
  const res: any = await robotOpsAnalytics({
    gameCode: gameCode.value || undefined,
    startDate: props.range?.[0],
    endDate: props.range?.[1],
    forceRefresh: forceRefresh || undefined
  });
  const data = res?.data || {};
  rows.value = data.rows || [];
  decisionRows.value = data.decisionReadiness || [];
  decisionSummary.value = data.decisionSummary || {};
  opponentGroups.value = data.opponentGroups || [];
  strategyDecisions.value = data.strategyDecisions || [];
  strategyVersions.value = data.strategyVersions || [];
  tierDistribution.value = data.tierDistribution || [];
}
const { loading, autoRefresh, refreshedAt, refresh } = usePanelAutoRefresh(load);
watch(() => [props.range?.[0], props.range?.[1], gameCode.value], () => refresh(false));
</script>

<style scoped>
.filter-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 12px; }
.range-text { color: var(--el-text-color-secondary); font-size: 12px; }
.game-name { font-weight: 600; }
.game-code { margin-top: 3px; color: var(--el-text-color-secondary); font-size: 12px; }
.positive { color: #16a34a; font-weight: 600; }
.negative { color: #dc2626; font-weight: 600; }
.sub-text { color: var(--el-text-color-secondary); font-size: 11px; }
.decision-card { margin-bottom: 16px; }
.decision-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.analysis-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(430px, 1fr)); gap: 16px; margin-top: 16px; }
.card-title { display: flex; align-items: center; gap: 6px; }
.tier-card { margin-top: 16px; }
.mb-3 { margin-bottom: 16px; }
</style>
