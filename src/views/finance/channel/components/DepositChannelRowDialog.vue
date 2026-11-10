<template>
  <el-dialog
    :model-value="modelValue"
    :title="initial?.matchKey ? '编辑匹配行' : '新增匹配行'"
    width="760px"
    append-to-body
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <el-form ref="formRef" :model="form" label-width="112px">
      <el-row :gutter="14">
        <el-col :span="12">
          <el-form-item label="大类">
            <el-select v-model="form.groupId" style="width: 100%" @change="onGroupChange">
              <el-option v-for="group in groups" :key="group.groupId" :label="group.groupName" :value="group.groupId" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="客户端通道">
            <el-select v-model="form.routeId" style="width: 100%" filterable @change="onRouteChange">
              <el-option
                v-for="route in routesForGroup"
                :key="route.routeId"
                :label="`${route.clientCode || route.routeCode} · ${route.channelName || route.routeCode}`"
                :value="route.routeId"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商户账号">
            <el-select v-model="form.merchantId" clearable filterable style="width: 100%" @change="onAccountChange">
              <el-option
                v-for="account in accounts"
                :key="account.merchantId"
                :label="`${account.providerCode || ''} / ${account.merchantCode} / ${account.merchantName}`"
                :value="account.merchantId"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="供应商通道编码">
            <el-input v-model="form.providerChannelCode" placeholder="如 usdt / bank_qr" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="支付类型">
            <el-input v-model="form.providerPayType" placeholder="如 BANK_QR" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="目标币种">
            <el-input v-model="form.currency" />
          </el-form-item>
        </el-col>
        <el-col v-for="column in categoryColumns" :key="column.key" :span="columnSpan(column.key)">
          <el-form-item :label="column.label">
            <el-input-number
              v-if="column.type === 'number'"
              v-model="fieldValues[column.key]"
              :min="0"
              controls-position="right"
              style="width: 100%"
            />
            <el-input
              v-else
              v-model="fieldValues[column.key]"
              :type="longField(column.key) ? 'textarea' : 'text'"
              :rows="longField(column.key) ? 2 : undefined"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="最低限额">
            <el-input-number v-model="form.amountMin" :min="0" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="最高限额">
            <el-input-number v-model="form.amountMax" :min="0" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="备注（费率）">
            <el-input v-model="form.remark" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排序">
            <el-input-number v-model="form.sortNo" :min="0" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="金额单位">
            <el-input v-model="form.amountUnit" placeholder="VND / YUAN" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="金额小数位">
            <el-input-number v-model="form.amountScale" :min="0" :max="4" controls-position="right" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="维护开关">
            <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type {
  DepositChannelRowForm,
  DepositChannelRowVO,
  FinanceChannelGroupVO,
  FinanceChannelRouteVO
} from '@/api/finance/channel/types';
import type { ProviderAccountVO } from '@/api/finance/payment-provider';
import { CATEGORY_COLUMNS, categoryCodeFor, valueOf } from '../deposit-row-schema';

const props = defineProps<{
  modelValue: boolean;
  initial?: DepositChannelRowVO;
  groups: FinanceChannelGroupVO[];
  routes: FinanceChannelRouteVO[];
  accounts: ProviderAccountVO[];
  saving?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [payload: DepositChannelRowForm];
}>();

const formRef = ref();
const form = reactive<DepositChannelRowForm>(blankForm());
const fieldValues = reactive<Record<string, any>>({});

const routesForGroup = computed(() => props.routes.filter((route) => route.groupId === form.groupId));
const selectedRoute = computed(() => props.routes.find((route) => route.routeId === form.routeId));
const groupCode = computed(() => props.groups.find((group) => group.groupId === form.groupId)?.groupCode || '');
const categoryColumns = computed(() => {
  const code = categoryCodeFor(groupCode.value) as keyof typeof CATEGORY_COLUMNS;
  return CATEGORY_COLUMNS[code] || [];
});

watch(() => props.modelValue, (open) => {
  if (open) fill(props.initial);
});

function blankForm(): DepositChannelRowForm {
  return {
    direction: 1,
    groupId: undefined,
    routeId: undefined,
    merchantId: undefined,
    providerChannelCode: '',
    providerPayType: '',
    currency: 'VND',
    amountUnit: 'VND',
    amountScale: 0,
    amountMin: 0,
    amountMax: 0,
    feeRate: 0,
    sortNo: 1,
    enabled: 1,
    remark: '',
    display: {}
  };
}

function fill(row?: DepositChannelRowVO) {
  Object.assign(form, blankForm());
  Object.keys(fieldValues).forEach((key) => delete fieldValues[key]);
  if (row) {
    Object.assign(form, {
      routeId: row.routeId,
      matchKey: row.matchKey,
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
      expectedVersion: row.configVersion,
      display: { ...row.display }
    });
    form.groupId = row.groupId;
    const categoryCode = categoryCodeFor(row.groupCode);
    for (const column of CATEGORY_COLUMNS[categoryCode as keyof typeof CATEGORY_COLUMNS] || []) {
      fieldValues[column.key] = valueOf(row, column.key);
    }
  } else if (props.groups.length) {
    form.groupId = props.groups[0].groupId;
    onGroupChange();
  }
}

function onGroupChange() {
  const route = routesForGroup.value[0];
  form.routeId = route?.routeId;
  form.currency = route?.currency || 'VND';
  form.amountMin = route?.amountMin || 0;
  form.amountMax = route?.amountMax || 0;
}

function onRouteChange() {
  const route = selectedRoute.value;
  form.currency = route?.currency || form.currency;
  form.amountMin = route?.amountMin || 0;
  form.amountMax = route?.amountMax || 0;
}

function onAccountChange() {
  const account = props.accounts.find((item) => String(item.merchantId) === String(form.merchantId));
  if (!account) return;
  form.providerCode = account.providerCode;
  form.providerName = account.providerName;
  form.adapterCode = account.adapterCode;
  form.currency = account.currency || form.currency;
  form.amountUnit = account.currency || form.amountUnit;
}

function columnSpan(key: string) {
  return ['address', 'qr', 'content', 'recommendAmounts', 'jumpUrl', 'description'].includes(key) ? 24 : 12;
}

function longField(key: string) {
  return ['address', 'qr', 'content', 'description'].includes(key);
}

function submit() {
  if (!form.routeId) return;
  const display: Record<string, any> = { ...form.display };
  for (const column of categoryColumns.value) {
    if (!['bankCode', 'bankName', 'receiptAccount', 'receiptName'].includes(column.key)) {
      display[column.key] = fieldValues[column.key];
    } else {
      display[column.key] = fieldValues[column.key];
    }
  }
  const payload: DepositChannelRowForm = {
    ...form,
    display
  };
  emit('submit', payload);
}
</script>
