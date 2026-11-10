<template>
  <el-table
    :data="rows"
    :row-key="rowKey"
    border
    size="small"
    :row-class-name="rowClassName"
    @row-dblclick="startEdit"
  >
    <el-table-column
      v-for="column in visibleColumns"
      :key="column.key"
      :label="column.label"
      :width="column.width"
      :min-width="column.width"
      align="center"
    >
      <template #default="{ row }">
        <template v-if="isEditing(row) && column.key !== 'actions'">
          <el-input-number
            v-if="column.type === 'number'"
            v-model="draft![column.key]"
            :min="0"
            controls-position="right"
            size="small"
          />
          <el-switch
            v-else-if="column.key === 'enabled'"
            v-model="draft!.enabled"
            :active-value="1"
            :inactive-value="0"
          />
          <el-input
            v-else
            v-model="draft![column.key]"
            size="small"
            clearable
          />
          <div v-if="column.key === 'clientCode'" class="edit-tip">整行编辑中</div>
        </template>
        <template v-else-if="column.key === 'actions'">
          <template v-if="isEditing(row)">
            <el-button link type="primary" @click.stop="confirmEdit">确认</el-button>
            <el-button link type="danger" @click.stop="cancelEdit">取消</el-button>
          </template>
          <template v-else>
            <el-button link type="primary" @click.stop="startEdit(row)">编辑</el-button>
          </template>
        </template>
        <template v-else-if="column.key === 'enabled'">
          <el-switch
            :model-value="row.enabled"
            :active-value="1"
            :inactive-value="0"
            @change="(value: any) => emitStatus(row, Number(value))"
          />
        </template>
        <span v-else-if="column.key === 'groupName'" class="group-tag">{{ row.groupName }}</span>
        <span v-else-if="column.key === 'clientCode'" class="code-text">{{ row.clientCode }}</span>
        <span v-else-if="column.key === 'providerChannelCode'" class="code-text">{{ row.providerChannelCode || '-' }}</span>
        <span v-else-if="column.display && column.key === 'denominations'" class="code-text">{{ row.display?.denominations || '-' }}</span>
        <span v-else-if="column.display" class="ellipsis" :title="String(rowValue(row, column.key) || '')">
          {{ rowValue(row, column.key) || '-' }}
        </span>
        <span v-else>{{ rowValue(row, column.key) ?? '-' }}</span>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { DepositChannelRowVO, DepositChannelRowForm } from '@/api/finance/channel/types';
import {
  CATEGORY_COLUMNS,
  categoryCodeFor,
  columnsFor,
  rowKey,
  valueOf
} from '../deposit-row-schema';

const props = defineProps<{
  rows: DepositChannelRowVO[];
  activeGroup: string;
}>();

const emit = defineEmits<{
  save: [row: DepositChannelRowForm];
  status: [row: DepositChannelRowVO, status: number];
}>();

const editingKey = ref('');
const draft = ref<Record<string, any> | null>(null);

const editingRow = computed(() => props.rows.find((row) => rowKey(row) === editingKey.value));
const visibleColumns = computed(() => {
  const group = editingRow.value?.groupCode
    || (props.activeGroup !== 'ALL' ? props.activeGroup : '');
  return columnsFor(group);
});

function isEditing(row: any) {
  return editingKey.value === rowKey(row);
}

function startEdit(row: any) {
  if (editingKey.value && editingKey.value !== rowKey(row)) return;
  editingKey.value = rowKey(row);
  draft.value = toDraft(row as DepositChannelRowVO);
}

function toDraft(row: DepositChannelRowVO) {
  const values: Record<string, any> = {
    routeId: row.routeId,
    matchKey: row.matchKey,
    expectedVersion: row.configVersion,
    merchantId: row.merchantId,
    providerCode: row.providerCode,
    providerName: row.providerName,
    adapterCode: row.adapterCode,
    providerChannelCode: row.providerChannelCode,
    providerPayType: row.providerPayType,
    bankCode: row.bankCode,
    bankName: row.bankName,
    currency: row.currency,
    amountUnit: row.amountUnit || row.currency,
    amountScale: row.amountScale || 0,
    amountMin: row.amountMin || 0,
    amountMax: row.amountMax || 0,
    feeRate: row.feeRate || 0,
    sortNo: row.sortNo || 0,
    enabled: row.enabled || 0,
    remark: row.remark || '',
    display: { ...row.display }
  };
  const categoryCode = categoryCodeFor(row.groupCode);
  for (const column of CATEGORY_COLUMNS[categoryCode as keyof typeof CATEGORY_COLUMNS] || []) {
    if (column.display || ['bankCode', 'bankName', 'receiptAccount', 'receiptName'].includes(column.key)) {
      values[column.key] = valueOf(row, column.key);
    }
  }
  values.clientCode = row.clientCode;
  values.clientName = row.clientName;
  values.groupName = row.groupName;
  return values;
}

function confirmEdit() {
  if (!draft.value) return;
  const displayKeys = Object.keys({
    ...editingRow.value?.display,
    ...draft.value
  }).filter((key) => ![
    'routeId', 'matchKey', 'expectedVersion', 'merchantId', 'providerCode',
    'providerName', 'adapterCode', 'providerChannelCode', 'providerPayType',
    'currency', 'amountUnit', 'amountScale', 'amountMin', 'amountMax',
    'feeRate', 'sortNo', 'enabled', 'remark', 'clientCode', 'clientName',
    'groupName'
  ].includes(key));
  const payload: DepositChannelRowForm = {
    routeId: draft.value.routeId,
    matchKey: draft.value.matchKey,
    expectedVersion: draft.value.expectedVersion,
    merchantId: draft.value.merchantId,
    providerCode: draft.value.providerCode,
    providerName: draft.value.providerName,
    adapterCode: draft.value.adapterCode,
    providerChannelCode: draft.value.providerChannelCode,
    providerPayType: draft.value.providerPayType,
    bankCode: draft.value.bankCode,
    bankName: draft.value.bankName,
    currency: draft.value.currency,
    amountUnit: draft.value.amountUnit,
    amountScale: Number(draft.value.amountScale || 0),
    amountMin: Number(draft.value.amountMin || 0),
    amountMax: Number(draft.value.amountMax || 0),
    feeRate: Number(draft.value.feeRate || 0),
    sortNo: Number(draft.value.sortNo || 0),
    enabled: Number(draft.value.enabled || 0),
    remark: draft.value.remark,
    display: displayKeys.reduce<Record<string, any>>((result, key) => {
      result[key] = draft.value![key];
      return result;
    }, {})
  };
  emit('save', payload);
  cancelEdit();
}

function cancelEdit() {
  editingKey.value = '';
  draft.value = null;
}

function rowClassName({ row }: { row: any }) {
  return row.enabled === 1 ? '' : 'disabled-row';
}

function rowValue(row: any, key: string) {
  return valueOf(row as DepositChannelRowVO, key);
}

function emitStatus(row: any, status: number) {
  emit('status', row as DepositChannelRowVO, status);
}
</script>

<style scoped>
.edit-tip { color: var(--el-color-primary); font-size: 10px; margin-top: 2px; }
.group-tag { display: inline-block; padding: 2px 7px; border-radius: 5px; background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.code-text { font-family: Consolas, monospace; font-size: 12px; }
.ellipsis { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
:deep(.disabled-row) { color: var(--el-text-color-placeholder); background: var(--el-fill-color-lighter); }
</style>
