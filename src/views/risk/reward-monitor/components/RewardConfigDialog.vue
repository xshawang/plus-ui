<template>
  <el-dialog :model-value="modelValue" title="监测参数" width="720px" append-to-body @update:model-value="close">
    <el-tabs v-model="activePane" @tab-change="handlePaneChange">
      <el-tab-pane label="派奖监测设置" name="reward">
        <div class="pane-head">
          <span class="text-gray-500 text-sm">阈值按币种独立配置，保存后立刻对后续派奖事件生效</span>
          <el-select v-model="currency" style="width: 200px" @change="loadConfig">
            <el-option v-for="item in currencies" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
        <el-table v-loading="configLoading" border :data="CONFIG_ROWS">
          <el-table-column label="类型" width="220">
            <template #default="{ row }">
              <span>{{ row.label }}</span>
              <el-tooltip v-if="row.tip" :content="row.tip" placement="top">
                <el-icon class="ml-1"><QuestionFilled /></el-icon>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="参数设置">
            <template #default="{ row }">
              <div class="param-cell">
                <el-input-number
                  v-model="configValues[row.key]"
                  :min="0"
                  :precision="row.precision"
                  controls-position="right"
                  style="width: 200px"
                />
                <span class="unit">{{ row.unit }}</span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="风控提醒设置" name="alert">
        <el-table v-loading="alertLoading" border :data="ALERT_ROWS">
          <el-table-column label="风控提醒" width="220" prop="label" />
          <el-table-column label="提示开关">
            <template #default="{ row }">
              <el-checkbox v-if="row.key === 'enabled'" v-model="alertEnabled" />
              <div v-else class="param-cell">
                <el-input-number
                  v-model="alertInterval"
                  :min="1"
                  :precision="0"
                  controls-position="right"
                  style="width: 200px"
                />
                <span class="unit">秒</span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <div class="dialog-footer">
        <el-button type="primary" :loading="saving" @click="submit">确 认</el-button>
        <el-button @click="close">取 消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup name="RiskRewardConfigDialog" lang="ts">
import {
  getRewardAlertConfig,
  getRewardConfig,
  listRewardCurrencies,
  saveRewardAlertConfig,
  saveRewardConfig
} from '@/api/risk/reward-monitor';
import type { RiskCurrencyOption, RiskRewardConfigForm } from '@/api/risk/reward-monitor/types';
import modal from '@/plugins/modal';
import { reactive, ref, watch } from 'vue';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [boolean]; success: [] }>();

/**
 * 五项阈值（设计稿「派奖监测设置」页签）。
 *
 * 金额类阈值按设计稿以 VND 原值录入与展示（后端默认值即 15000 / 60000 / 30000），
 * 前端不做分/元换算，避免与后端判定口径不一致。
 */
const CONFIG_ROWS = [
  { key: 'highMultiple', label: '高倍爆奖', unit: '倍', precision: 2, tip: '单局派奖倍数达到该值即命中' },
  { key: 'highMultipleWinAmount', label: '高倍爆奖中奖金额', unit: 'VND', precision: 0 },
  { key: 'largeWinAmount', label: '大额中奖', unit: 'VND', precision: 0 },
  { key: 'profitRatio', label: '会员获利比', unit: '%', precision: 2 },
  { key: 'profitRatioValidBet', label: '获利比触发有效投注值', unit: 'VND', precision: 0 }
];

const ALERT_ROWS = [
  { key: 'enabled', label: '风控提示' },
  { key: 'intervalSeconds', label: '间隔时间(s)' }
];

const activePane = ref('reward');
const currencies = ref<RiskCurrencyOption[]>([]);
const currency = ref('');
const currencyLabel = ref('');
const configLoading = ref(false);
const alertLoading = ref(false);
const saving = ref(false);
const alertEnabled = ref(true);
const alertInterval = ref(60);

/** 用 Record 承载输入值：el-input-number 的 v-model 不接受联合类型字段，避免类型体操 */
const configValues = reactive<Record<string, number>>({
  highMultiple: 500,
  highMultipleWinAmount: 15000,
  largeWinAmount: 60000,
  profitRatio: 20,
  profitRatioValidBet: 30000
});

const loadConfig = async () => {
  configLoading.value = true;
  try {
    const res = await getRewardConfig(currency.value || undefined);
    const data = res.data || {};
    currency.value = data.currency || currency.value;
    currencyLabel.value = data.currencyLabel || '';
    configValues.highMultiple = Number(data.highMultiple ?? 0);
    configValues.highMultipleWinAmount = Number(data.highMultipleWinAmount ?? 0);
    configValues.largeWinAmount = Number(data.largeWinAmount ?? 0);
    configValues.profitRatio = Number(data.profitRatio ?? 0);
    configValues.profitRatioValidBet = Number(data.profitRatioValidBet ?? 0);
  } finally {
    configLoading.value = false;
  }
};

const loadAlert = async () => {
  alertLoading.value = true;
  try {
    const res = await getRewardAlertConfig();
    alertEnabled.value = res.data?.enabled ?? true;
    alertInterval.value = Number(res.data?.intervalSeconds ?? 60);
  } finally {
    alertLoading.value = false;
  }
};

const handlePaneChange = (pane: string | number) => {
  if (pane === 'alert') {
    loadAlert();
  } else {
    loadConfig();
  }
};

/**
 * 点「确认」只保存当前页签。
 *
 * 为什么不做「两个页签一起保存」：未展示的页签没有被修改，一起提交会写入
 * 打开弹窗时的旧快照，可能覆盖别人刚改的值。
 */
const submit = async () => {
  saving.value = true;
  try {
    if (activePane.value === 'alert') {
      const res = await saveRewardAlertConfig({
        enabled: alertEnabled.value,
        intervalSeconds: alertInterval.value
      });
      alertEnabled.value = res.data?.enabled ?? alertEnabled.value;
      alertInterval.value = Number(res.data?.intervalSeconds ?? alertInterval.value);
      modal.msgSuccess('风控提醒设置已保存');
    } else {
      const payload: RiskRewardConfigForm = {
        currency: currency.value,
        currencyLabel: currencyLabel.value,
        highMultiple: configValues.highMultiple,
        highMultipleWinAmount: configValues.highMultipleWinAmount,
        largeWinAmount: configValues.largeWinAmount,
        profitRatio: configValues.profitRatio,
        profitRatioValidBet: configValues.profitRatioValidBet
      };
      const res = await saveRewardConfig(payload);
      currency.value = res.data?.currency || currency.value;
      modal.msgSuccess('监测参数已保存');
    }
    emit('success');
  } finally {
    saving.value = false;
  }
};

const close = () => emit('update:modelValue', false);

/** 打开弹窗时初始化：币种列表只取一次，两个页签的数据都先回读一次 */
watch(
  () => props.modelValue,
  async visible => {
    if (!visible) return;
    if (currencies.value.length === 0) {
      const res = await listRewardCurrencies();
      currencies.value = res.data || [];
    }
    if (!currency.value) {
      currency.value = currencies.value[0]?.value || '';
    }
    await Promise.all([loadConfig(), loadAlert()]);
  }
);
</script>

<style scoped>
.pane-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.param-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.unit {
  color: var(--el-text-color-secondary);
}
</style>
