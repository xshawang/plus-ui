<template>
  <section class="metric-grid">
    <article v-for="item in cards" :key="item.key" class="metric-card" :class="item.tone">
      <div class="metric-head">
        <span>{{ item.label }}</span>
        <el-tooltip v-if="item.tooltip" :content="item.tooltip" placement="top">
          <el-icon><QuestionFilled /></el-icon>
        </el-tooltip>
      </div>
      <strong class="metric-value">{{ item.value }}</strong>
      <div class="metric-foot">
        <span>{{ item.sub }}</span>
        <span v-if="item.rate !== undefined" class="rate" :class="rateClass(item.rate, item.positiveWhenDown)">
          {{ rateText(item.rate) }}
        </span>
      </div>
    </article>
  </section>
</template>

<script setup name="AgentMetricGrid" lang="ts">
import { computed } from 'vue';
import { formatMoney } from '@/utils/money';
import type { AgentHomeSnapshot } from '@/api/agent/home/types';

const props = defineProps<{
  snapshot: AgentHomeSnapshot;
  peopleUnit: string;
}>();

const formatCount = (value: unknown) => Number(value ?? 0).toLocaleString('en-US');
const formatSigned = (value: unknown) => {
  const number = Number(value ?? 0);
  return `${number >= 0 ? '+' : '-'}${formatMoney(Math.abs(number))}`;
};
const rateText = (rate?: number | null) =>
  rate === null || rate === undefined ? '无环比' : `${rate >= 0 ? '↑' : '↓'} ${Math.abs(rate).toFixed(2)}%`;
const rateClass = (rate?: number | null, positiveWhenDown = false) => {
  if (rate === null || rate === undefined || rate === 0) return 'neutral';
  const good = positiveWhenDown ? rate < 0 : rate > 0;
  return good ? 'good' : 'bad';
};

const cards = computed(() => {
  const summary = props.snapshot.summary;
  const comparison = props.snapshot.comparison;
  return [
    {
      key: 'teamUsers',
      label: '团队会员',
      value: formatCount(summary.teamUsers),
      sub: `直属 ${formatCount(summary.directUsers)} · 其他 ${formatCount(summary.otherUsers)}`,
      tooltip: '当前代理授权树内全部会员，按最近一次关系快照统计。'
    },
    {
      key: 'newUsers',
      label: '新增会员',
      value: formatCount(summary.newUsers),
      sub: '本周期新增',
      rate: comparison.newUsersRate,
      tooltip: '所选周期内新增会员数。'
    },
    {
      key: 'active',
      label: `活跃${props.peopleUnit}`,
      value: formatCount(summary.activeUserVisits),
      sub: '登录或游戏行为去重后汇总',
      rate: comparison.activeUserVisitsRate,
      tooltip: '昨日为去重人数；近 7 天、近 30 天为逐日去重后的期间人次。'
    },
    {
      key: 'recharge',
      label: '充值金额',
      value: formatMoney(summary.rechargeAmount),
      sub: `充值${props.peopleUnit} ${formatCount(summary.rechargeUsers)}`,
      rate: comparison.rechargeAmountRate
    },
    {
      key: 'firstDeposit',
      label: '首充人数',
      value: formatCount(summary.firstDepositUsers),
      sub: `首充金额 ${formatMoney(summary.firstDepositAmount)}`,
      rate: comparison.firstDepositUsersRate,
      tooltip: `其中当天注册首充 ${formatCount(summary.registeredFirstDepositUsers)} 人。`
    },
    {
      key: 'validBet',
      label: '有效投注',
      value: formatMoney(summary.validBet),
      sub: '按游戏有效投注比例折算',
      rate: comparison.validBetRate
    },
    {
      key: 'winLoss',
      label: '团队输赢',
      value: formatSigned(summary.winLoss),
      sub: '会员视角，负数表示平台盈利',
      rate: comparison.winLossRate,
      positiveWhenDown: true,
      tone: summary.winLoss < 0 ? 'warning' : ''
    },
    {
      key: 'commission',
      label: '本期佣金',
      value: formatMoney(summary.periodCommission),
      sub: `待领取 ${formatMoney(summary.pendingCommission)}`,
      rate: comparison.periodCommissionRate,
      tooltip: '按佣金单结算日期统计，金额沿用代理报表原值。'
    }
  ];
});
</script>

<style scoped lang="scss">
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.metric-card {
  min-height: 132px;
  padding: 18px;
  border: 1px solid #e7ebf3;
  border-radius: 14px;
  background:
    radial-gradient(circle at 100% 0, rgba(68, 113, 255, 0.1), transparent 42%),
    #fff;
  box-shadow: 0 8px 24px rgba(36, 51, 85, 0.06);

  &.warning {
    background:
      radial-gradient(circle at 100% 0, rgba(231, 145, 48, 0.14), transparent 42%),
      #fff;
  }
}

.metric-head,
.metric-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.metric-head {
  color: #64708a;
  font-size: 13px;
}

.metric-value {
  display: block;
  margin: 16px 0 12px;
  color: #17223b;
  font-size: clamp(24px, 2.1vw, 34px);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.metric-foot {
  color: #8791a8;
  font-size: 12px;
}

.rate {
  flex: none;
  font-weight: 600;

  &.good {
    color: #159c69;
  }

  &.bad {
    color: #d6534b;
  }

  &.neutral {
    color: #8791a8;
  }
}

@media (max-width: 1100px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
