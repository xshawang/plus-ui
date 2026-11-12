<template>
  <el-dialog
    :model-value="modelValue"
    :title="initial?.matchKey ? '编辑提现匹配行' : '新增提现匹配行'"
    width="760px"
    append-to-body
    @update:model-value="(value: boolean) => emit('update:modelValue', value)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="112px">
      <el-row :gutter="14">
        <el-col :span="12">
          <el-form-item label="提现大类" prop="tabCode">
            <el-select
              v-model="form.tabCode"
              :disabled="Boolean(initial?.matchKey)"
              style="width: 100%"
              @change="handleTabChange"
            >
              <el-option v-for="tab in tabs" :key="tab.tabCode" :label="tab.displayName" :value="tab.tabCode" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="客户端编码" prop="clientCode">
            <el-input v-model="form.clientCode" placeholder="如 ACB、USDT、VIETTEL" />
          </el-form-item>
        </el-col>
        <el-col v-if="form.tabCode === 'CRYPTO'" :span="12">
          <el-form-item label="网络">
            <el-input v-model="form.clientSubCode" placeholder="如 TRC20、BEP20" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="客户端名称">
            <el-input v-model="form.channelName" placeholder="客户端展示名称" />
          </el-form-item>
        </el-col>

        <template v-if="supportsThirdParty">
          <el-col :span="24"><el-divider content-position="left">共享供应商账号</el-divider></el-col>
          <el-col :span="12">
            <el-form-item label="供应商账号">
              <el-select v-model="form.merchantId" filterable clearable style="width: 100%" @change="loadOptions">
                <el-option
                  v-for="account in providerAccounts"
                  :key="account.merchantId"
                  :label="`${account.providerName || account.providerCode} / ${account.merchantCode}`"
                  :value="account.merchantId"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="form.tabCode === 'BANK' ? '代付银行' : '供应商通道'">
              <el-select
                v-model="selectedOptionKey"
                filterable
                style="width: 100%"
                :placeholder="optionsLoading ? '加载中' : '请选择'"
                :loading="optionsLoading"
                @change="applyOption"
              >
                <el-option
                  v-for="(option, index) in matchOptions"
                  :key="optionKey(option, index)"
                  :label="optionLabel(option)"
                  :value="optionKey(option, index)"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </template>

        <template v-else>
          <el-col :span="24">
            <el-alert
              title="该大类当前只支持平台自营/人工通道，保存时自动使用 SELF。"
              type="info"
              :closable="false"
              show-icon
            />
          </el-col>
        </template>

        <el-col :span="24"><el-divider content-position="left">客户端展示</el-divider></el-col>
        <template v-if="form.tabCode === 'BANK'">
          <el-col :span="12"><el-form-item label="银行编码"><el-input v-model="form.bankCode" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="银行名称"><el-input v-model="form.bankName" /></el-form-item></el-col>
        </template>
        <template v-else-if="form.tabCode === 'CARD'">
          <el-col :span="12"><el-form-item label="卡品牌"><el-input v-model="form.display.cardBrand" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="卡片 Label"><el-input v-model="form.display.cardLabel" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="推荐面额"><el-input v-model="form.display.denominations" placeholder="20K,50K,100K" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="兑换率"><el-input-number v-model="form.display.rate" :min="0" :precision="4" style="width: 100%" /></el-form-item></el-col>
        </template>
        <template v-else-if="form.tabCode === 'CRYPTO'">
          <el-col :span="12"><el-form-item label="币种"><el-input v-model="form.display.coinName" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="网络"><el-input v-model="form.display.networkName" /></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="兑换价（VND/USDT）">
              <el-input-number v-model="form.display.clientPrice" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </template>
        <template v-else-if="form.tabCode === 'COIN12'">
          <el-col :span="12"><el-form-item label="兑换方式"><el-input v-model="form.display.exchangeMode" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="帮助入口"><el-input v-model="form.display.helpUrl" /></el-form-item></el-col>
        </template>
        <template v-else>
          <el-col :span="12"><el-form-item label="资产"><el-input v-model="form.display.asset" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="成交价"><el-input-number v-model="form.display.p2pPrice" :min="0" style="width: 100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="支付时限"><el-input-number v-model="form.display.timeout" :min="0" style="width: 100%" /></el-form-item></el-col>
        </template>

        <el-col :span="24"><el-divider content-position="left">运营参数</el-divider></el-col>
        <el-col :span="12"><el-form-item label="最低限额"><el-input-number v-model="form.amountMin" :min="0" style="width: 100%" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="最高限额"><el-input-number v-model="form.amountMax" :min="0" style="width: 100%" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="每日限额"><el-input-number v-model="form.dailyLimit" :min="0" style="width: 100%" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="排序"><el-input-number v-model="form.sortNo" :min="0" style="width: 100%" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="维护码"><el-input v-model="form.maintenanceCode" /></el-form-item></el-col>
        <el-col :span="12"><el-form-item label="维护开关"><el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" /></el-form-item></el-col>
        <el-col v-if="form.providerCode === 'DABAOPAY' && form.tabCode === 'CRYPTO'" :span="24">
          <el-form-item label="扩展参数">
            <el-input v-model="form.extraJson" type="textarea" :rows="2" placeholder='如 {"network":"TRC20"}，启用前必须按供应商要求确认' />
          </el-form-item>
        </el-col>
        <el-col :span="24"><el-form-item label="备注"><el-input v-model="form.remark" /></el-form-item></el-col>
      </el-row>
    </el-form>
    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts" name="WithdrawChannelRowDialog">
import { computed, reactive, ref, watch } from 'vue';
import modal from '@/plugins/modal';
import { listWithdrawChannelMatchOptions } from '@/api/finance/withdraw-channel';
import type {
  WithdrawChannelMatchOptionVO,
  WithdrawChannelRowForm,
  WithdrawChannelRowVO,
  WithdrawTabVO
} from '@/api/finance/withdraw-channel/types';
import type { ProviderAccountVO } from '@/api/finance/payment-provider';
import { clientPriceFromChannel, defaultDisplay } from '../withdraw-row-schema';

const props = defineProps<{
  modelValue: boolean;
  initial?: WithdrawChannelRowVO;
  tabs: WithdrawTabVO[];
  accounts: ProviderAccountVO[];
  saving?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [payload: WithdrawChannelRowForm];
}>();

const formRef = ref();
const optionsLoading = ref(false);
const matchOptions = ref<WithdrawChannelMatchOptionVO[]>([]);
const selectedOptionKey = ref('');
const form = reactive<WithdrawChannelRowForm>(blankForm('BANK'));
const supportsThirdParty = computed(() => ['BANK', 'CRYPTO'].includes(form.tabCode));
const providerAccounts = computed(() => props.accounts.filter((account) =>
  Number(account.supportPayout) === 1
  && ['ASIAPAY', 'CLUB', 'XJPAY', 'DABAOPAY'].includes(String(account.providerCode || '').toUpperCase())
  && (form.tabCode !== 'CRYPTO' || String(account.providerCode || '').toUpperCase() === 'DABAOPAY')));
const rules = {
  tabCode: [{ required: true, message: '请选择提现大类', trigger: 'change' }],
  clientCode: [{ required: true, message: '请输入客户端编码', trigger: 'blur' }]
};

watch(
  [() => props.modelValue, () => props.initial],
  ([open, row]) => {
    if (open) fill(row);
  },
  { flush: 'post' }
);

function blankForm(tabCode: string): WithdrawChannelRowForm {
  return {
    tabCode,
    platform: 'go88',
    clientCode: '',
    clientSubCode: '',
    channelName: '',
    currency: 'VND',
    settlementCurrency: tabCode === 'CRYPTO' ? 'USDT' : 'VND',
    amountMin: 0,
    amountMax: 0,
    dailyLimit: 0,
    openTimeStart: '00:00',
    openTimeEnd: '23:59',
    feeRate: 0,
    sortNo: 1,
    enabled: 0,
    display: defaultDisplay(tabCode)
  };
}

function fill(row?: WithdrawChannelRowVO) {
  const tabCode = row?.tabCode || props.tabs[0]?.tabCode || 'BANK';
  resetForm(tabCode);
  matchOptions.value = [];
  selectedOptionKey.value = '';
  if (!row) {
    loadOptions();
    return;
  }
  Object.assign(form, {
    withdrawChannelId: row.withdrawChannelId,
    tabCode: row.tabCode,
    matchKey: row.matchKey,
    expectedVersion: row.configVersion,
    channelCode: row.channelCode,
    channelName: row.channelName,
    platform: row.platform,
    clientCode: row.clientCode,
    clientSubCode: row.clientSubCode,
    currency: row.currency,
    settlementCurrency: row.settlementCurrency,
    rateFrom: numberValue(row.rateFrom, 1),
    rateTo: numberValue(row.rateTo, 1),
    clientPrice: numberValue(row.clientPrice, 1),
    amountMin: numberValue(row.matchAmountMin ?? row.amountMin),
    amountMax: numberValue(row.matchAmountMax ?? row.amountMax),
    dailyLimit: numberValue(row.dailyLimit),
    maintenanceCode: row.maintenanceCode,
    openTimeStart: row.openTimeStart || '00:00',
    openTimeEnd: row.openTimeEnd || '23:59',
    feeRate: numberValue(row.feeRate),
    sortNo: row.sortNo ?? 1,
    enabled: row.enabled ?? 0,
    merchantId: row.merchantId,
    providerCode: row.providerCode,
    providerName: row.providerName,
    adapterCode: row.adapterCode,
    providerChannelCode: row.providerChannelCode,
    providerPayType: row.providerPayType,
    bankCode: row.bankCode,
    bankName: row.bankName,
    amountUnit: row.amountUnit || row.currency,
    amountScale: row.amountScale || 0,
    extraJson: row.extraJson || '',
    remark: row.remark,
    display: {
      ...defaultDisplay(row.tabCode),
      ...row.display,
      ...(row.tabCode === 'CRYPTO' ? { clientPrice: clientPriceFromChannel(row) } : {})
    }
  });
  loadOptions(row);
}

function resetForm(tabCode: string) {
  const mutable = form as unknown as Record<string, unknown>;
  Object.keys(mutable).forEach((key) => delete mutable[key]);
  Object.assign(mutable, blankForm(tabCode));
}

async function loadOptions(row?: WithdrawChannelRowVO) {
  matchOptions.value = [];
  selectedOptionKey.value = '';
  if (!supportsThirdParty.value) {
    applySelfOption();
    return;
  }
  if (!form.merchantId) {
    form.providerCode = '';
    form.providerChannelCode = '';
    return;
  }
  optionsLoading.value = true;
  try {
    const response = await listWithdrawChannelMatchOptions({
      tabCode: form.tabCode,
      merchantId: form.merchantId,
      currency: form.tabCode === 'CRYPTO' ? 'USDT' : 'VND'
    });
    matchOptions.value = response.data || [];
    const target = form.tabCode === 'BANK'
      ? matchOptions.value.find((option) => row?.bankCode && option.bankCode === row.bankCode)
      : matchOptions.value.find((option) =>
        row?.providerChannelCode && option.providerChannelCode === row.providerChannelCode);
    if (target) {
      selectedOptionKey.value = optionKey(target, matchOptions.value.indexOf(target));
      applyOption(selectedOptionKey.value);
    } else if (matchOptions.value.length === 1) {
      selectedOptionKey.value = optionKey(matchOptions.value[0], 0);
      applyOption(selectedOptionKey.value);
    }
  } finally {
    optionsLoading.value = false;
  }
}

function optionKey(option: WithdrawChannelMatchOptionVO, index: number) {
  return `${option.providerChannelCode}:${option.bankCode}:${index}`;
}

function optionLabel(option: WithdrawChannelMatchOptionVO) {
  return form.tabCode === 'BANK'
    ? `${option.bankCode} · ${option.bankName} · ${option.providerChannelCode}`
    : `${option.providerChannelCode} · ${option.currency}`;
}

function applyOption(key: string) {
  const index = Number(key.split(':').at(-1));
  const option = matchOptions.value[index];
  if (!option) return;
  form.providerCode = option.providerCode;
  form.providerName = option.providerName;
  form.adapterCode = option.adapterCode;
  form.providerChannelCode = option.providerChannelCode;
  form.providerPayType = option.providerPayType;
  form.bankCode = option.bankCode;
  form.bankName = option.bankName;
  form.amountUnit = option.amountUnit || form.currency;
  form.amountScale = option.amountScale || 0;
  form.extraJson = option.extraJson || form.extraJson || '';
  if (form.tabCode === 'BANK') {
    form.clientCode = option.bankCode || form.clientCode;
    form.channelName = option.bankName || form.channelName;
  }
  if (form.tabCode === 'CRYPTO') {
    form.clientCode = 'USDT';
    form.clientSubCode = form.clientSubCode || 'TRC20';
    form.settlementCurrency = 'USDT';
  }
}

function applySelfOption() {
  form.merchantId = undefined;
  form.providerCode = 'SELF';
  form.providerName = '平台自营';
  form.adapterCode = 'SELF';
  form.providerChannelCode = form.tabCode === 'COIN12' ? 'COIN_EXCHANGE' : form.tabCode;
  form.providerPayType = 'MANUAL';
  form.amountUnit = form.currency;
  form.amountScale = 0;
}

function handleTabChange(tabCode: string) {
  const clientCode = form.clientCode;
  const channelName = form.channelName;
  resetForm(tabCode);
  Object.assign(form, {
    clientCode: tabCode === 'BANK' ? '' : clientCode,
    channelName: tabCode === 'BANK' ? '' : channelName
  });
  loadOptions();
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (supportsThirdParty.value && !form.merchantId) {
    modal.msgWarning('请选择共享供应商账号');
    return;
  }
  if (supportsThirdParty.value && !form.providerChannelCode) {
    modal.msgWarning(form.tabCode === 'BANK' ? '请选择代付银行' : '请选择供应商通道');
    return;
  }
  if (form.tabCode === 'BANK') {
    form.display.bankCode = form.bankCode || form.clientCode;
    form.display.bankName = form.bankName || form.clientCode;
  }
  if (form.tabCode === 'CRYPTO') {
    form.display.coinName = form.clientCode;
    form.display.networkName = form.clientSubCode;
  }
  const clientPrice = numberValue(form.display.clientPrice, numberValue(form.clientPrice, 1));
  if (form.tabCode === 'CRYPTO' && clientPrice <= 0) {
    modal.msgWarning('客户端兑换价必须大于 0');
    return;
  }
  form.clientPrice = clientPrice;
  form.rateFrom = form.tabCode === 'CRYPTO' ? clientPrice : 1;
  form.rateTo = 1;
  form.settlementCurrency = form.tabCode === 'CRYPTO' ? 'USDT' : 'VND';
  form.currency = 'VND';
  if (!props.initial?.matchKey) {
    form.withdrawChannelId = undefined;
    form.matchKey = undefined;
    form.expectedVersion = undefined;
    form.channelCode = undefined;
  }
  emit('submit', { ...form, display: { ...form.display } });
}

function numberValue(value: unknown, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}
</script>
