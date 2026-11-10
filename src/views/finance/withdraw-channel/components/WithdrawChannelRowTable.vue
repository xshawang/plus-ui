<template>
  <el-table
    :data="rows"
    :row-key="rowKey"
    border
    size="small"
    :row-class-name="rowClassName"
    @row-dblclick="requestEdit"
  >
    <el-table-column
      v-for="column in columns"
      :key="column.key"
      :label="column.label"
      :min-width="column.minWidth"
      :align="column.align || 'left'"
    >
      <template #default="{ row }">
        <template v-if="column.key === 'tabCode'">
          <el-tag size="small" effect="plain">{{ tabShort(row.tabCode) }}</el-tag>
        </template>
        <template v-else-if="column.key === 'client'">
          <div class="channel-identity">
            <span class="brand-mark" :class="brandClass(row.providerCode)">
              {{ clientMark(row) }}
            </span>
            <div class="identity-text">
              <div class="cell-main">{{ row.clientCode || '-' }}<span v-if="row.clientSubCode"> / {{ row.clientSubCode }}</span></div>
              <div class="cell-sub">{{ row.channelName || row.channelCode }}</div>
            </div>
          </div>
        </template>
        <template v-else-if="column.key === 'provider'">
          <div class="cell-main">{{ row.providerName || row.providerCode || '未配置' }}</div>
          <div class="cell-sub">
            {{ row.merchantCode || '-' }}<span v-if="row.adapterCode"> · {{ row.adapterCode }}</span>
          </div>
        </template>
        <template v-else-if="column.key === 'providerChannelCode'">
          <code>{{ row.providerChannelCode || '-' }}</code>
        </template>
        <template v-else-if="column.key === 'amount'">
          <div class="money">{{ formatMoney(row.matchAmountMin ?? row.amountMin) }}</div>
          <div class="cell-sub">至 {{ row.matchAmountMax || row.amountMax ? formatMoney(row.matchAmountMax ?? row.amountMax) : '不限' }}</div>
        </template>
        <template v-else-if="column.key === 'dailyLimit'">
          <span class="money">{{ row.dailyLimit ? formatMoney(row.dailyLimit) : '不限' }}</span>
        </template>
        <template v-else-if="column.key === 'clientPrice'">
          <span class="money">{{ formatMoney(clientPriceFromChannel(row as WithdrawChannelRowVO)) }} VND</span>
        </template>
        <template v-else-if="column.key === 'cardRate'">
          {{ Number(row.display?.rate ?? row.display?.exchangeRate ?? 1).toFixed(2) }}
        </template>
        <template v-else-if="column.key === 'p2pPrice'">
          {{ formatMoney(row.display?.p2pPrice || row.display?.price) }}
        </template>
        <template v-else-if="column.key === 'sortNo'">
          {{ row.sortNo ?? 0 }}
        </template>
        <template v-else-if="column.key === 'enabled'">
          <el-switch
            :model-value="row.enabled"
            :active-value="1"
            :inactive-value="0"
            @change="(value: any) => requestStatus(row, value)"
          />
        </template>
        <template v-else-if="column.key === 'actions'">
          <el-button link type="primary" @click.stop="requestEdit(row)">编辑</el-button>
        </template>
        <template v-else>
          <span :class="{ money: column.align === 'right' }">{{ displayValue(row, column.key) }}</span>
        </template>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts" name="WithdrawChannelRowTable">
import { computed } from 'vue';
import type { WithdrawChannelRowVO } from '@/api/finance/withdraw-channel/types';
import { clientPriceFromChannel, columnsFor, rowKey, rowValue } from '../withdraw-row-schema';

const props = defineProps<{
  rows: WithdrawChannelRowVO[];
  tabCode: string;
}>();

const emit = defineEmits<{
  edit: [row: WithdrawChannelRowVO];
  status: [row: WithdrawChannelRowVO, status: number];
}>();

const columns = computed(() => columnsFor(props.tabCode));

function displayValue(row: any, key: string) {
  const value = rowValue(row as WithdrawChannelRowVO, key);
  if (key === 'timeout' && value) return `${value} 分钟`;
  if ((key === 'clientPrice' || key === 'dailyLimit' || key === 'p2pPrice') && value) {
    return formatMoney(value);
  }
  return value || '-';
}

function clientMark(row: any) {
  const value = String(row.clientCode || row.channelName || '?');
  return value.slice(0, 2).toUpperCase();
}

function brandClass(providerCode?: string) {
  return `is-${String(providerCode || 'self').toLowerCase()}`;
}

function tabShort(tab: string) {
  return ({ BANK: '银行', CARD: '充值卡', CRYPTO: '虚拟币', COIN12: 'Coin12', P2P: 'P2P' } as Record<string, string>)[tab] || tab;
}

function requestEdit(row: any) {
  emit('edit', row as WithdrawChannelRowVO);
}

function requestStatus(row: any, value: any) {
  emit('status', row as WithdrawChannelRowVO, Number(value));
}

function rowClassName({ row }: { row: any }) {
  return row.enabled === 1 ? '' : 'disabled-row';
}

function formatMoney(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? new Intl.NumberFormat('vi-VN').format(numeric) : '-';
}
</script>

<style scoped>
.channel-identity { display: flex; align-items: center; gap: 8px; min-width: 0; }
.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-size: 10px;
  font-weight: 700;
}
.brand-mark.is-asiapay { background: #eef4ff; color: #3672d9; }
.brand-mark.is-club { background: #f3edff; color: #8b5cf6; }
.brand-mark.is-xjpay { background: #fff2e8; color: #ea7a28; }
.brand-mark.is-dabaopay { background: #e7f8fb; color: #0891b2; }
.identity-text { min-width: 0; line-height: 1.45; }
.cell-main { overflow: hidden; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.cell-sub { overflow: hidden; color: var(--el-text-color-secondary); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.money { font-variant-numeric: tabular-nums; white-space: nowrap; }
code { font-family: Consolas, monospace; font-size: 12px; }
:deep(.disabled-row) { color: var(--el-text-color-placeholder); background: var(--el-fill-color-lighter); }
</style>
