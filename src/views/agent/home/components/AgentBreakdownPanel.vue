<template>
  <section class="breakdown-grid">
    <div class="panel split-panel">
      <div class="panel-head">
        <div>
          <h3>直属与其他经营</h3>
          <span>同一授权树下按关系深度拆分</span>
        </div>
      </div>
      <el-table :data="rows" size="small" class="split-table">
        <el-table-column prop="name" label="范围" fixed width="86" />
        <el-table-column prop="newUserText" label="新增" align="right" min-width="72" />
        <el-table-column prop="activeText" :label="`活跃${peopleUnit}`" align="right" min-width="92" />
        <el-table-column prop="rechargeText" label="充值" align="right" min-width="110" />
        <el-table-column prop="firstDepositText" label="首充人数" align="right" min-width="92" />
        <el-table-column prop="validBetText" label="有效投注" align="right" min-width="120" />
        <el-table-column prop="winLossText" label="团队输赢" align="right" min-width="120">
          <template #default="{ row }">
            <span :class="{ negative: row.winLoss < 0 }">{{ row.winLossText }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="commissionText" label="佣金" align="right" min-width="110" />
      </el-table>
    </div>

    <div class="right-stack">
      <div class="panel commission-panel">
        <div class="panel-head">
          <div>
            <h3>佣金摘要</h3>
            <span>按结算日期统计</span>
          </div>
        </div>
        <div class="commission-grid">
          <div v-for="item in commissionRows" :key="item.label">
            <span>{{ item.label }}</span>
            <strong :class="{ negative: item.negative }">{{ item.value }}</strong>
          </div>
        </div>
      </div>

      <div class="panel quick-panel">
        <div class="panel-head">
          <h3>快捷入口</h3>
        </div>
        <div class="quick-links">
          <button v-for="item in links" :key="item.path" type="button" @click="router.push(item.path)">
            <span>{{ item.label }}</span>
            <small>{{ item.hint }}</small>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup name="AgentBreakdownPanel" lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { formatMoney } from '@/utils/money';
import type { AgentHomeCommission, AgentHomeSegment, AgentHomeSplit } from '@/api/agent/home/types';

const props = defineProps<{
  split: AgentHomeSplit;
  commission: AgentHomeCommission;
  peopleUnit: string;
}>();

const router = useRouter();
const numberText = (value: unknown) => Number(value ?? 0).toLocaleString('en-US');
const signedMoney = (value: unknown) => {
  const number = Number(value ?? 0);
  return `${number >= 0 ? '+' : '-'}${formatMoney(Math.abs(number))}`;
};

const toRow = (name: string, segment?: AgentHomeSegment | null) => ({
  name,
  newUsers: segment?.newUsers ?? 0,
  newUserText: numberText(segment?.newUsers),
  activeText: numberText(segment?.activeUserVisits),
  rechargeText: formatMoney(segment?.rechargeAmount),
  firstDepositText: numberText(segment?.firstDepositUsers),
  validBetText: formatMoney(segment?.validBet),
  winLoss: segment?.winLoss ?? 0,
  winLossText: signedMoney(segment?.winLoss),
  commissionText: formatMoney(segment?.commission)
});

const rows = computed(() => {
  const out = [toRow('直属', props.split.direct)];
  if (props.split.other) out.push(toRow('其他', props.split.other));
  return out;
});

const commissionRows = computed(() => [
  { label: '结算佣金', value: formatMoney(props.commission.settleCommission) },
  { label: '实发佣金', value: formatMoney(props.commission.actualCommission) },
  { label: '待领取', value: formatMoney(props.commission.pendingCommission) },
  { label: '已领取', value: formatMoney(props.commission.claimedCommission) }
]);

const links = [
  { label: '我的团队', hint: '查看代理组织', path: '/agent/index' },
  { label: '代理数据1', hint: '日度经营明细', path: '/agent/data1' },
  { label: '代理数据2', hint: '多维报表分析', path: '/agent/data2' },
  { label: '代理会员', hint: '查看归属会员', path: '/agent/member' }
];
</script>

<style scoped lang="scss">
.breakdown-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(320px, 0.8fr);
  gap: 16px;
}

.panel {
  min-width: 0;
  padding: 18px;
  border: 1px solid #e7ebf3;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(36, 51, 85, 0.05);
}

.panel-head {
  margin-bottom: 14px;

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

.split-table {
  width: 100%;
}

.right-stack {
  display: grid;
  gap: 16px;
}

.commission-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  div {
    padding: 13px;
    border-radius: 10px;
    background: #f7f9fd;
  }

  span {
    display: block;
    color: #7f8aa3;
    font-size: 12px;
  }

  strong {
    display: block;
    margin-top: 8px;
    color: #17223b;
    font-size: 18px;
    font-variant-numeric: tabular-nums;
  }
}

.quick-links {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  button {
    padding: 12px;
    border: 1px solid #e1e7f2;
    border-radius: 10px;
    background: #fff;
    color: #2d3b5c;
    text-align: left;
    cursor: pointer;
    transition: 0.2s ease;

    &:hover {
      border-color: #7d9cff;
      background: #f5f8ff;
      transform: translateY(-1px);
    }
  }

  span,
  small {
    display: block;
  }

  span {
    font-weight: 600;
  }

  small {
    margin-top: 4px;
    color: #8a94a9;
  }
}

.negative {
  color: #d6534b;
}

@media (max-width: 1100px) {
  .breakdown-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .commission-grid,
  .quick-links {
    grid-template-columns: 1fr;
  }
}
</style>
