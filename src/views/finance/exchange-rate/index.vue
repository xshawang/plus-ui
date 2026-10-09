<template>
  <div class="p-2 app-container finance-exchange-page">
    <el-card shadow="hover" class="table-panel">
      <el-tabs v-model="activeTab">
        <!-- 一、充提汇率配置 -->
        <el-tab-pane label="汇率配置" name="rate">
          <el-form :inline="true" class="query-form">
            <el-form-item label="币种">
              <el-input v-model="rateQuery.keyword" placeholder="代码/名称" clearable style="width: 180px" @keyup.enter="loadRates" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="rateQuery.status" placeholder="全部" clearable style="width: 120px">
                <el-option label="启用" :value="1" />
                <el-option label="停用" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="loadRates">搜索</el-button>
              <el-button icon="Refresh" @click="resetRateQuery">重置</el-button>
              <el-button v-hasPermi="['finance:exchange-rate:edit']" type="primary" icon="Plus" @click="handleAddRate">新增汇率</el-button>
            </el-form-item>
          </el-form>
          <div class="text-gray-400 text-sm mb-2">
            汇率差未填时按 (充值汇率 − 提现汇率) ÷ 提现汇率 × 100% 自动推算；设为生效时同币种其它行自动置为未生效。
          </div>
          <el-table v-loading="rateLoading" border :data="rates">
            <el-table-column label="币种代码" prop="currencyCode" align="center" width="110" />
            <el-table-column label="币种名称" prop="currencyName" align="left" min-width="120" />
            <el-table-column label="基准币" prop="baseCurrency" align="center" width="90" />
            <el-table-column label="充值汇率" prop="rechargeRate" align="right" width="130" />
            <el-table-column label="提现汇率" prop="withdrawRate" align="right" width="130" />
            <el-table-column label="汇率差(%)" prop="rateDiff" align="right" width="120" />
            <el-table-column label="生效汇率展示" prop="displayRate" align="center" width="150" />
            <el-table-column label="生效" align="center" width="90">
              <template #default="{ row }">
                <el-tag :type="row.effective === 1 ? 'success' : 'info'">{{ row.effective === 1 ? '生效' : '未生效' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" align="center" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="备注" prop="remark" align="left" min-width="140" show-overflow-tooltip />
            <el-table-column label="操作" align="center" fixed="right" width="220">
              <template #default="{ row }">
                <el-button v-hasPermi="['finance:exchange-rate:edit']" link type="primary" @click="handleEditRate(row as FinanceExchangeRateVO)">修改</el-button>
                <el-button v-hasPermi="['finance:exchange-rate:edit']" link type="primary" @click="handleEffective(row as FinanceExchangeRateVO)">设为生效</el-button>
                <el-button v-hasPermi="['finance:exchange-rate:edit']" link type="primary" @click="handleToggleRate(row as FinanceExchangeRateVO)">
                  {{ row.status === 1 ? '停用' : '启用' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 二、银行管理 -->
        <el-tab-pane label="银行管理" name="bank">
          <el-form :inline="true" class="query-form">
            <el-form-item label="银行/通道">
              <el-input v-model="bankQuery.keyword" placeholder="名称/编码" clearable style="width: 180px" @keyup.enter="loadBanks" />
            </el-form-item>
            <el-form-item label="业务类型">
              <el-select v-model="bankQuery.bizType" placeholder="全部" clearable style="width: 160px">
                <el-option label="充值银行" :value="1" />
                <el-option label="提现银行" :value="2" />
                <el-option label="支付通道" :value="3" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="bankQuery.status" placeholder="全部" clearable style="width: 120px">
                <el-option label="启用" :value="1" />
                <el-option label="停用" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="loadBanks">搜索</el-button>
              <el-button icon="Refresh" @click="resetBankQuery">重置</el-button>
            </el-form-item>
          </el-form>
          <div class="text-gray-400 text-sm mb-2">
            数据源为 bank_config（玩家端充提通道共用），后台只做排序权重与启停，不改结构；金额单位：分。
          </div>
          <el-table v-loading="bankLoading" border :data="banks">
            <el-table-column label="编码" prop="bankCode" align="center" width="140" />
            <el-table-column label="名称" prop="bankName" align="left" min-width="180" show-overflow-tooltip />
            <el-table-column label="业务类型" align="center" width="120">
              <template #default="{ row }">{{ bizText(row.bizType) }}</template>
            </el-table-column>
            <el-table-column label="渠道类型" prop="channelType" align="center" width="110" />
            <el-table-column label="收款账号" prop="receiveNumber" align="center" width="150" show-overflow-tooltip />
            <el-table-column label="单笔限额" align="right" width="180">
              <template #default="{ row }">{{ formatMoneyRange(row.minAmount ?? 0, row.maxAmount ?? 0) }}</template>
            </el-table-column>
            <el-table-column label="赠送" prop="bonusAmount" align="right" width="120" :formatter="moneyColumnFormatter" />
            <el-table-column label="排序权重" prop="orderNavigate" align="center" width="100" />
            <el-table-column label="状态" align="center" width="100">
              <template #default="{ row }">
                <el-switch
                  :model-value="row.status"
                  :active-value="1"
                  :inactive-value="0"
                  @change="(val: number) => handleBankStatus(row as FinanceBankVO, val)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" fixed="right" width="120">
              <template #default="{ row }">
                <el-button v-hasPermi="['finance:exchange-rate:edit']" link type="primary" @click="handleSortBank(row as FinanceBankVO)">调整排序</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="rateDialog" :title="rateForm.rateId ? '修改汇率' : '新增汇率'" width="640px" append-to-body>
      <el-form ref="rateFormRef" :model="rateForm" :rules="rateRules" label-width="140px">
        <el-form-item label="币种代码" prop="currencyCode">
          <el-input v-model="rateForm.currencyCode" placeholder="如 VND / USDT / CNY" />
        </el-form-item>
        <el-form-item label="币种名称">
          <el-input v-model="rateForm.currencyName" placeholder="如 越南盾" />
        </el-form-item>
        <el-form-item label="基准币">
          <el-input v-model="rateForm.baseCurrency" placeholder="VND" />
        </el-form-item>
        <el-form-item label="充值汇率" prop="rechargeRate">
          <el-input-number v-model="rateForm.rechargeRate" :min="0" :precision="6" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="提现汇率" prop="withdrawRate">
          <el-input-number v-model="rateForm.withdrawRate" :min="0" :precision="6" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="汇率差(%)">
          <el-input-number v-model="rateForm.rateDiff" :min="0" :precision="6" controls-position="right" style="width: 100%" />
          <span class="ml-2 text-gray-400 text-sm">留空自动推算</span>
        </el-form-item>
        <el-form-item label="生效汇率展示">
          <el-input v-model="rateForm.displayRate" placeholder="如 VND1000:1" />
        </el-form-item>
        <el-form-item label="自动同步">
          <el-switch v-model="rateForm.autoSync" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="同步来源">
          <el-input v-model="rateForm.syncSource" placeholder="手工 / 第三方API" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="rateForm.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="排序号">
          <el-input-number v-model="rateForm.sortNo" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="rateForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRate">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="FinanceExchangeRate" lang="ts">
import { reactive, ref } from 'vue';
import { formatMoneyRange, moneyColumnFormatter } from '@/utils/money';
import { ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import modal from '@/plugins/modal';
import {
  changeBankStatus,
  changeExchangeRateStatus,
  listBank,
  listExchangeRate,
  makeExchangeRateEffective,
  saveExchangeRate,
  sortBank
} from '@/api/finance/exchange';
import type {
  FinanceBankVO,
  FinanceExchangeRateForm,
  FinanceExchangeRateQuery,
  FinanceExchangeRateVO
} from '@/api/finance/exchange/types';

/**
 * 汇率与银行管理页（需求文档 2_财务/14）。
 *
 * 两个页签：汇率配置（新增/修改/启停/设为生效）与银行管理（排序权重、提现开关）。
 */
const activeTab = ref('rate');
const rateLoading = ref(false);
const bankLoading = ref(false);
const submitting = ref(false);
const rates = ref<FinanceExchangeRateVO[]>([]);
const banks = ref<FinanceBankVO[]>([]);
const rateDialog = ref(false);
const rateFormRef = ref<FormInstance>();

const rateQuery = reactive<FinanceExchangeRateQuery>({ keyword: '', status: undefined, effective: undefined });
const bankQuery = reactive<{ keyword?: string; bizType?: number; status?: number }>({
  keyword: '',
  bizType: undefined,
  status: undefined
});

const rateForm = reactive<FinanceExchangeRateForm>({
  rateId: undefined,
  currencyCode: '',
  currencyName: '',
  baseCurrency: 'VND',
  rechargeRate: 1,
  withdrawRate: 1,
  rateDiff: undefined,
  displayRate: '',
  autoSync: 0,
  syncSource: '手工',
  status: 1,
  sortNo: 0,
  remark: ''
});

const rateRules: FormRules = {
  currencyCode: [{ required: true, message: '币种代码不能为空', trigger: 'blur' }],
  rechargeRate: [{ required: true, message: '充值汇率不能为空', trigger: 'blur' }],
  withdrawRate: [{ required: true, message: '提现汇率不能为空', trigger: 'blur' }]
};

const bizText = (bizType?: number) => (bizType === 1 ? '充值银行' : bizType === 2 ? '提现银行' : '支付通道');

const loadRates = async () => {
  rateLoading.value = true;
  try {
    const res = await listExchangeRate(rateQuery);
    rates.value = res.data ?? [];
  } finally {
    rateLoading.value = false;
  }
};

const resetRateQuery = () => {
  rateQuery.keyword = '';
  rateQuery.status = undefined;
  loadRates();
};

const loadBanks = async () => {
  bankLoading.value = true;
  try {
    const res = await listBank(bankQuery);
    banks.value = res.data ?? [];
  } finally {
    bankLoading.value = false;
  }
};

const resetBankQuery = () => {
  bankQuery.keyword = '';
  bankQuery.bizType = undefined;
  bankQuery.status = undefined;
  loadBanks();
};

const handleAddRate = () => {
  Object.assign(rateForm, {
    rateId: undefined,
    currencyCode: '',
    currencyName: '',
    baseCurrency: 'VND',
    rechargeRate: 1,
    withdrawRate: 1,
    rateDiff: undefined,
    displayRate: '',
    autoSync: 0,
    syncSource: '手工',
    status: 1,
    sortNo: 0,
    remark: ''
  });
  rateDialog.value = true;
};

const handleEditRate = (row: FinanceExchangeRateVO) => {
  Object.assign(rateForm, {
    rateId: row.rateId,
    currencyCode: row.currencyCode,
    currencyName: row.currencyName ?? '',
    baseCurrency: row.baseCurrency ?? 'VND',
    rechargeRate: row.rechargeRate ?? 1,
    withdrawRate: row.withdrawRate ?? 1,
    rateDiff: row.rateDiff,
    displayRate: row.displayRate ?? '',
    autoSync: row.autoSync ?? 0,
    syncSource: row.syncSource ?? '手工',
    status: row.status ?? 1,
    sortNo: row.sortNo ?? 0,
    remark: row.remark ?? ''
  });
  rateDialog.value = true;
};

const submitRate = async () => {
  const valid = await rateFormRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  submitting.value = true;
  try {
    await saveExchangeRate({ ...rateForm });
    modal.msgSuccess('保存成功');
    rateDialog.value = false;
    loadRates();
  } finally {
    submitting.value = false;
  }
};

const handleToggleRate = async (row: FinanceExchangeRateVO) => {
  const next = row.status === 1 ? 0 : 1;
  await modal.confirm(`确认${next === 1 ? '启用' : '停用'}「${row.currencyCode}」汇率？停用会同时取消生效。`);
  await changeExchangeRateStatus(row.rateId, next);
  modal.msgSuccess('操作成功');
  loadRates();
};

const handleEffective = async (row: FinanceExchangeRateVO) => {
  await modal.confirm(`确认将「${row.currencyCode}/${row.baseCurrency}」设为生效汇率？同币种其它行会自动置为未生效。`);
  await makeExchangeRateEffective(row.rateId);
  modal.msgSuccess('已设为生效');
  loadRates();
};

const handleBankStatus = async (row: FinanceBankVO, val: number) => {
  await changeBankStatus(row.id, val);
  modal.msgSuccess('已更新');
  loadBanks();
};

const handleSortBank = async (row: FinanceBankVO) => {
  const result = await ElMessageBox.prompt('请输入新的排序权重（越小越前）', '调整排序', {
    inputValue: String(row.orderNavigate ?? 0),
    inputPattern: /^\d+$/,
    inputErrorMessage: '请输入非负整数'
  });
  await sortBank(row.id, Number(result.value));
  modal.msgSuccess('排序已更新');
  loadBanks();
};

loadRates();
loadBanks();
</script>
