<template>
  <div class="p-2 app-container finance-merchant-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="商户">
          <el-input v-model="queryParams.keyword" placeholder="名称/编码" clearable style="width: 200px" @keyup.enter="getList" />
        </el-form-item>
        <el-form-item label="商户类型">
          <el-select v-model="queryParams.merchantType" placeholder="全部" clearable style="width: 150px">
            <el-option label="三方支付(收单)" :value="1" />
            <el-option label="三方代付(出款)" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="跑路风险">
          <el-select v-model="queryParams.riskLevel" placeholder="全部" clearable style="width: 130px">
            <el-option label="高风险" :value="1" />
            <el-option label="中风险" :value="2" />
            <el-option label="低风险" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="getList">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>第三方支付 / 三方代付商户</h3>
            <p>共 {{ total }} 条 · 费率与限额单位：分；密钥仅保存掩码展示</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['finance:merchant:edit']" type="primary" icon="Plus" @click="handleAdd">新增商户</el-button>
            <el-button icon="Refresh" @click="getList">刷新</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="商户编码" prop="merchantCode" align="center" width="150" show-overflow-tooltip />
        <el-table-column label="商户名称" prop="merchantName" align="left" min-width="190" show-overflow-tooltip />
        <el-table-column label="类型" align="center" width="120">
          <template #default="{ row }">
            <el-tag :type="row.merchantType === 2 ? 'warning' : 'success'">
              {{ row.merchantType === 2 ? '三方代付' : '三方支付' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="通道代码" prop="providerCode" align="center" width="120" show-overflow-tooltip />
        <el-table-column label="币种" prop="currency" align="center" width="90" />
        <el-table-column label="费率(%)" prop="feeRate" align="right" width="100" />
        <el-table-column label="单笔限额" align="right" width="200">
          <template #default="{ row }">{{ formatMoneyRange(row.amountMin ?? 0, row.amountMax ?? 0) }}</template>
        </el-table-column>
        <el-table-column label="优先级" prop="priorityNo" align="center" width="90" />
        <el-table-column label="跑路风险" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="riskType(row.riskLevel)">{{ riskText(row.riskLevel) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="密钥" prop="apiSecretMask" align="center" width="130" show-overflow-tooltip />
        <el-table-column label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" fixed="right" width="210">
          <template #default="{ row }">
            <el-button v-hasPermi="['finance:merchant:edit']" link type="primary" @click="handleEdit(row as FinanceMerchantVO)">修改</el-button>
            <el-button v-hasPermi="['finance:merchant:edit']" link type="primary" @click="handleToggle(row as FinanceMerchantVO)">
              {{ row.status === 1 ? '停用' : '启用' }}
            </el-button>
            <el-button v-hasPermi="['finance:merchant:edit']" link type="danger" @click="handleDelete(row as FinanceMerchantVO)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="form.merchantId ? '修改商户' : '新增商户'" width="720px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="140px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="商户编码" prop="merchantCode">
              <el-input v-model="form.merchantCode" placeholder="字母/数字/下划线，2~32 位" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商户名称" prop="merchantName">
              <el-input v-model="form.merchantName" placeholder="如 OceanPay&大洋支付(VND)" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商户类型" prop="merchantType">
              <el-select v-model="form.merchantType" style="width: 100%">
                <el-option label="三方支付(收单)" :value="1" />
                <el-option label="三方代付(出款)" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="通道代码">
              <el-input v-model="form.providerCode" placeholder="如 OceanPay / AsiaPay / XJPay" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结算币种">
              <el-input v-model="form.currency" placeholder="VND" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="费率(%)">
              <el-input-number v-model="form.feeRate" :min="0" :max="100" :precision="4" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单笔最低">
              <el-input-number v-model="form.amountMin" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单笔最高">
              <el-input-number v-model="form.amountMax" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="日限额(0=不限)">
              <el-input-number v-model="form.dailyLimit" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="路由优先级">
              <el-input-number v-model="form.priorityNo" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="跑路风险">
              <el-select v-model="form.riskLevel" style="width: 100%">
                <el-option label="高风险" :value="1" />
                <el-option label="中风险" :value="2" />
                <el-option label="低风险" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="对接地址">
              <el-input v-model="form.apiUrl" placeholder="https://..." />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商户号/AppId">
              <el-input v-model="form.apiKey" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="密钥">
              <el-input v-model="form.apiSecret" :placeholder="form.merchantId ? '不修改请留空' : '请输入密钥'" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="FinanceMerchant" lang="ts">
import { reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import modal from '@/plugins/modal';
import { changeMerchantStatus, deleteMerchant, listMerchant, saveMerchant } from '@/api/finance/merchant';
import type { FinanceMerchantForm, FinanceMerchantQuery, FinanceMerchantVO } from '@/api/finance/merchant/types';
import { formatMoneyRange } from '@/utils/money';

/**
 * 第三方支付/代付商户管理页（需求文档 2_财务/03、08）。
 *
 * 说明：密钥只保存与展示掩码（后端 apiSecretMask），修改时留空表示保持原值。
 */
const loading = ref(false);
const submitting = ref(false);
const rows = ref<FinanceMerchantVO[]>([]);
const total = ref(0);
const dialogVisible = ref(false);
const formRef = ref<FormInstance>();

const queryParams = reactive<FinanceMerchantQuery>({
  keyword: '',
  merchantType: undefined,
  riskLevel: undefined,
  status: undefined,
  pageNum: 1,
  pageSize: 10
});

const form = reactive<FinanceMerchantForm>({
  merchantId: undefined,
  merchantCode: '',
  merchantName: '',
  merchantType: 1,
  providerCode: '',
  platform: 'go88',
  currency: 'VND',
  apiUrl: '',
  apiKey: '',
  apiSecret: '',
  notifyUrl: '',
  extParams: '',
  feeRate: 0,
  amountMin: 0,
  amountMax: 0,
  dailyLimit: 0,
  priorityNo: 0,
  riskLevel: 3,
  status: 1,
  remark: ''
});

const rules: FormRules = {
  merchantCode: [{ required: true, message: '商户编码不能为空', trigger: 'blur' }],
  merchantName: [{ required: true, message: '商户名称不能为空', trigger: 'blur' }],
  merchantType: [{ required: true, message: '商户类型不能为空', trigger: 'change' }]
};

const riskText = (level?: number) => (level === 1 ? '高' : level === 2 ? '中' : '低');
const riskType = (level?: number) => (level === 1 ? 'danger' : level === 2 ? 'warning' : 'success');

const getList = async () => {
  loading.value = true;
  try {
    const res = await listMerchant(queryParams);
    rows.value = res.data?.rows ?? [];
    total.value = res.data?.total ?? 0;
  } finally {
    loading.value = false;
  }
};

const resetQuery = () => {
  queryParams.keyword = '';
  queryParams.merchantType = undefined;
  queryParams.riskLevel = undefined;
  queryParams.status = undefined;
  queryParams.pageNum = 1;
  getList();
};

const resetForm = () => {
  form.merchantId = undefined;
  form.merchantCode = '';
  form.merchantName = '';
  form.merchantType = 1;
  form.providerCode = '';
  form.platform = 'go88';
  form.currency = 'VND';
  form.apiUrl = '';
  form.apiKey = '';
  form.apiSecret = '';
  form.notifyUrl = '';
  form.extParams = '';
  form.feeRate = 0;
  form.amountMin = 0;
  form.amountMax = 0;
  form.dailyLimit = 0;
  form.priorityNo = 0;
  form.riskLevel = 3;
  form.status = 1;
  form.remark = '';
};

const handleAdd = () => {
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row: FinanceMerchantVO) => {
  resetForm();
  Object.assign(form, {
    merchantId: row.merchantId,
    merchantCode: row.merchantCode,
    merchantName: row.merchantName,
    merchantType: row.merchantType,
    providerCode: row.providerCode ?? '',
    platform: row.platform ?? 'go88',
    currency: row.currency ?? 'VND',
    apiUrl: row.apiUrl ?? '',
    apiKey: row.apiKey ?? '',
    apiSecret: '',
    notifyUrl: row.notifyUrl ?? '',
    extParams: row.extParams ?? '',
    feeRate: row.feeRate ?? 0,
    amountMin: row.amountMin ?? 0,
    amountMax: row.amountMax ?? 0,
    dailyLimit: row.dailyLimit ?? 0,
    priorityNo: row.priorityNo ?? 0,
    riskLevel: row.riskLevel ?? 3,
    status: row.status ?? 1,
    remark: row.remark ?? ''
  });
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  submitting.value = true;
  try {
    await saveMerchant({ ...form });
    modal.msgSuccess('保存成功');
    dialogVisible.value = false;
    getList();
  } finally {
    submitting.value = false;
  }
};

const handleToggle = async (row: FinanceMerchantVO) => {
  const next = row.status === 1 ? 0 : 1;
  await modal.confirm(`确认${next === 1 ? '启用' : '停用'}商户「${row.merchantName}」？`);
  await changeMerchantStatus(row.merchantId, next);
  modal.msgSuccess('操作成功');
  getList();
};

const handleDelete = async (row: FinanceMerchantVO) => {
  await modal.confirm(`确认删除商户「${row.merchantName}」？已被通道路由引用时会被拒绝。`);
  await deleteMerchant(row.merchantId);
  modal.msgSuccess('删除成功');
  getList();
};

getList();
</script>
