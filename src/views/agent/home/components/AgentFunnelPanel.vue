<template>
  <section class="panel funnel-panel">
    <div class="panel-head">
      <h3>增长漏斗</h3>
      <span>所选周期内经营转化</span>
    </div>
    <div class="funnel-list">
      <template v-for="(item, index) in steps" :key="item.key">
        <div class="funnel-step">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <small>{{ item.hint }}</small>
        </div>
        <div v-if="index < steps.length - 1" class="funnel-arrow">
          <span>{{ item.nextRate }}</span>
          <b>→</b>
        </div>
      </template>
    </div>
    <div class="funnel-note">
      注册首充转化率
      <strong>{{ registeredConversion }}</strong>
      <span>当天注册并完成首充人数 ÷ 新增会员</span>
    </div>
  </section>
</template>

<script setup name="AgentFunnelPanel" lang="ts">
import { computed } from 'vue';
import type { AgentHomeSummary } from '@/api/agent/home/types';

const props = defineProps<{
  summary: AgentHomeSummary;
  peopleUnit: string;
}>();

const count = (value: number) => Number(value ?? 0).toLocaleString('en-US');
const ratio = (value: number, base: number) =>
  base > 0 ? `${((Number(value ?? 0) / base) * 100).toFixed(2)}%` : '—';

const registeredConversion = computed(() =>
  ratio(props.summary.registeredFirstDepositUsers, props.summary.newUsers)
);

const steps = computed(() => {
  const rows = [
    { key: 'new', label: '新增会员', value: props.summary.newUsers, hint: '周期注册' },
    {
      key: 'active',
      label: `活跃${props.peopleUnit}`,
      value: props.summary.activeUserVisits,
      hint: '去重后逐日汇总'
    },
    { key: 'first', label: '首充人数', value: props.summary.firstDepositUsers, hint: '完成首充' },
    {
      key: 'recharge',
      label: `充值${props.peopleUnit}`,
      value: props.summary.rechargeUsers,
      hint: '产生有效充值'
    }
  ];
  return rows.map((row, index) => ({
    ...row,
    value: count(row.value),
    nextRate: index + 1 < rows.length ? ratio(rows[index + 1].value, row.value) : ''
  }));
});
</script>

<style scoped lang="scss">
.panel {
  padding: 18px;
  border: 1px solid #e7ebf3;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(36, 51, 85, 0.05);
}

.panel-head {
  h3 {
    margin: 0;
    color: #17223b;
    font-size: 16px;
  }

  span {
    display: block;
    margin-top: 5px;
    color: #8a94a9;
    font-size: 12px;
  }
}

.funnel-list {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.funnel-step {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 14px;
  border-radius: 10px;
  background: linear-gradient(90deg, #f4f7ff, #fafbff);

  span {
    color: #5f6b84;
    font-size: 13px;
  }

  strong {
    color: #17223b;
    font-size: 22px;
    font-variant-numeric: tabular-nums;
  }

  small {
    color: #99a2b5;
  }
}

.funnel-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #7f8aa3;
  font-size: 12px;

  b {
    color: #4f7cff;
    font-size: 18px;
  }
}

.funnel-note {
  display: grid;
  gap: 4px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px dashed #e3e8f0;
  color: #7f8aa3;
  font-size: 12px;

  strong {
    color: #17223b;
    font-size: 24px;
  }
}
</style>
