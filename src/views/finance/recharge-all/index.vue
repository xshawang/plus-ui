<template>
  <div class="p-2 app-container finance-recharge-all-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="会员账号">
          <el-input v-model="query.account" placeholder="多账号空格/逗号分隔" clearable style="width: 220px" @keyup.enter="load" />
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="query.orderNo" placeholder="订单号模糊" clearable style="width: 170px" @keyup.enter="load" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部状态" clearable style="width: 140px">
            <el-option label="待支付" :value="0" />
            <el-option label="处理中" :value="1" />
            <el-option label="成功" :value="2" />
            <el-option label="失败" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付渠道">
          <el-select v-model="query.channel" placeholder="全部" clearable style="width: 140px">
            <el-option label="银行卡" value="banks" />
            <el-option label="电子钱包" value="ewallet" />
            <el-option label="数字货币" value="crypto" />
            <el-option label="卡类" value="card" />
            <el-option label="提现转充值" value="d2r" />
          </el-select>
        </el-form-item>
        <el-form-item label="三方订单号">
          <el-input v-model="query.thirdPartyOrderNo" placeholder="三方单号模糊" clearable style="width: 180px" @keyup.enter="load" />
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 340px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="load">搜索</el-button>
          <el-button icon="Refresh" @click="reset">重置</el-button>
          <el-button v-hasPermi="['finance:recharge-all:edit']" type="primary" icon="Plus" @click="openCreate(false)">创建订单</el-button>
          <el-button v-hasPermi="['finance:recharge-all:edit']" type="warning" icon="Wallet" @click="openCreate(true)">创建补单</el-button>
          <el-button icon="Download" @click="exportOpen = true">导出</el-button>
        </el-form-item>
      </el-form>
      <div class="text-gray-400 text-sm">
        口径：本页为**全渠道全状态**充值总流水（payment_order.type=1）；「创建补单」会立即调用钱包 deposit 入账，
        bizNo 为 <code>RC:订单号</code>，同单重复提交不会重复加钱。成功口径 = status 2。
      </div>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>全部充值</h3>
            <p>共 {{ total }} 条 · 金额单位：分</p>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="订单号" prop="orderNo" align="center" min-width="200" show-overflow-tooltip />
        <el-table-column label="会员ID" prop="uid" align="center" width="170" show-overflow-tooltip />
        <el-table-column label="会员账号" prop="account" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="充值金额" prop="amount" align="right" width="140" :formatter="moneyColumnFormatter" />
        <el-table-column label="状态" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="statusType((row as RechargeOrderVO).status)">{{ statusText((row as RechargeOrderVO).status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="支付渠道" prop="channel" align="center" width="110" />
        <el-table-column label="通道编码" prop="bankCode" align="center" width="120" show-overflow-tooltip />
        <el-table-column label="三方订单号" prop="thirdPartyOrderNo" align="center" min-width="170" show-overflow-tooltip />
        <el-table-column label="回调时间" prop="callbackAt" align="center" width="180" show-overflow-tooltip />
        <el-table-column label="下单时间" prop="createdAt" align="center" width="180" show-overflow-tooltip />
      </el-table>
      <pagination v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="load" />
    </el-card>

    <el-dialog v-model="createOpen" :title="createForm.creditNow ? '创建补单（直接入账）' : '创建在线充值订单'" width="640px" append-to-body>
      <el-form ref="formRef" :model="createForm" :rules="rules" label-width="140px">
        <el-form-item label="会员账号" prop="account">
          <el-input v-model="createForm.account" placeholder="请输入会员账号（精确）" style="width: 260px" />
          <el-button class="ml-2" :loading="memberLoading" @click="searchMember">搜索</el-button>
        </el-form-item>
        <el-form-item label="会员ID">
          <el-input :model-value="member?.uid ?? ''" disabled style="width: 260px" />
        </el-form-item>
        <el-form-item label="账户余额">
          <el-input :model-value="formatMoney(member?.available)" disabled style="width: 260px" />
        </el-form-item>
        <el-form-item label="充值金额" prop="amount">
          <el-input-number v-model="createForm.amount" :min="0" controls-position="right" style="width: 260px" />
        </el-form-item>
        <el-form-item label="支付渠道">
          <el-select v-model="createForm.channel" style="width: 260px">
            <el-option label="银行卡" value="banks" />
            <el-option label="电子钱包" value="ewallet" />
            <el-option label="数字货币" value="crypto" />
            <el-option label="卡类" value="card" />
          </el-select>
        </el-form-item>
        <el-form-item label="通道编码">
          <el-input v-model="createForm.bankCode" placeholder="对应 finance_channel_route.route_code" style="width: 320px" />
        </el-form-item>
        <el-form-item label="三方订单号">
          <el-input v-model="createForm.thirdPartyOrderNo" placeholder="补单时填写，便于与三方对账" style="width: 320px" />
        </el-form-item>
        <el-form-item label="稽核倍数">
          <el-input-number v-model="createForm.turnoverMultiple" :min="0" :precision="2" controls-position="right" style="width: 260px" />
        </el-form-item>
        <el-form-item v-if="createForm.creditNow" label="补单说明" prop="remark">
          <el-input v-model="createForm.remark" type="textarea" :rows="2" placeholder="必填：说明补单原因或关联三方单号" style="width: 420px" />
        </el-form-item>
        <el-alert
          v-if="createForm.creditNow"
          type="warning"
          :closable="false"
          title="补单会立即给会员主钱包入账（钱包 deposit，bizNo=RC:订单号），请核对金额后再提交。"
        />
      </el-form>
      <template #footer>
        <el-button @click="createOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCreate">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="exportOpen" title="导出字段列表" width="620px" append-to-body>
      <el-checkbox-group v-model="exportProps">
        <el-checkbox v-for="column in allColumns" :key="column.prop" :value="column.prop" class="mr-3">{{ column.label }}</el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="exportOpen = false">取消</el-button>
        <el-button type="primary" @click="doExport">导出 CSV</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="FinanceRechargeAll" lang="ts">
import { computed, reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import modal from '@/plugins/modal';
import { getMemberAsset } from '@/api/finance/manual-adjust';
import type { FinanceMemberAssetVO } from '@/api/finance/manual-adjust/types';
import { createRechargeOrder, listRechargeOrders } from '@/api/finance/recharge-admin';
import type { RechargeAdminQuery, RechargeOrderForm, RechargeOrderVO } from '@/api/finance/recharge-admin';
import { exportCsv, type CsvColumn } from '../components/csvExport';
import { formatMoney, moneyColumnFormatter } from '@/utils/money';

/**
 * 全部充值页（需求文档 2_财务/04、05）。
 *
 * 覆盖：全渠道全状态充值流水、创建在线订单（待支付）、创建补单（立即入账）、按勾选字段导出。
 */
const loading = ref(false);
const submitting = ref(false);
const memberLoading = ref(false);
const rows = ref<RechargeOrderVO[]>([]);
const total = ref(0);
const createOpen = ref(false);
const exportOpen = ref(false);
const dateRange = ref<[string, string] | undefined>();
const formRef = ref<FormInstance>();
const member = ref<FinanceMemberAssetVO>();
const exportProps = ref<string[]>(['orderNo', 'account', 'amount', 'status', 'channel', 'createdAt']);

const query = reactive<RechargeAdminQuery>({
  account: '',
  orderNo: '',
  status: undefined,
  channel: undefined,
  thirdPartyOrderNo: '',
  pageNum: 1,
  pageSize: 10
});

const createForm = reactive<RechargeOrderForm & { creditNow: boolean }>({
  uid: undefined,
  account: '',
  amount: 0,
  channel: 'banks',
  bankCode: '',
  thirdPartyOrderNo: '',
  turnoverMultiple: 0,
  creditNow: false,
  remark: '',
  requestId: ''
});

const rules: FormRules = {
  account: [{ required: true, message: '请输入会员账号', trigger: 'blur' }],
  amount: [{ required: true, message: '充值金额不能为空', trigger: 'blur' }]
};

const allColumns: CsvColumn[] = [
  { label: '订单号', prop: 'orderNo' },
  { label: '会员ID', prop: 'uid' },
  { label: '会员账号', prop: 'account' },
  { label: '充值金额', prop: 'amount' },
  { label: '状态', prop: 'status', format: (row) => statusText(Number(row.status)) },
  { label: '支付渠道', prop: 'channel' },
  { label: '通道编码', prop: 'bankCode' },
  { label: '三方订单号', prop: 'thirdPartyOrderNo' },
  { label: '回调时间', prop: 'callbackAt' },
  { label: '下单时间', prop: 'createdAt' }
];

const selectedColumns = computed(() => allColumns.filter((column) => exportProps.value.includes(column.prop)));

function statusText(status: number) {
  return status === 2 ? '成功' : status === 1 ? '处理中' : status === 3 ? '失败' : status === 4 ? '已取消' : '待支付';
}

function statusType(status: number) {
  return status === 2 ? 'success' : status === 3 ? 'danger' : status === 4 ? 'info' : 'warning';
}

const load = async () => {
  loading.value = true;
  try {
    const params: RechargeAdminQuery = { ...query };
    if (dateRange.value && dateRange.value.length === 2) {
      params.params = { beginTime: dateRange.value[0], endTime: dateRange.value[1] };
    }
    const res = await listRechargeOrders(params);
    rows.value = res.data?.rows ?? [];
    total.value = res.data?.total ?? 0;
  } finally {
    loading.value = false;
  }
};

const reset = () => {
  query.account = '';
  query.orderNo = '';
  query.status = undefined;
  query.channel = undefined;
  query.thirdPartyOrderNo = '';
  dateRange.value = undefined;
  query.pageNum = 1;
  load();
};

const searchMember = async () => {
  if (!createForm.account) {
    modal.msgWarning('请输入会员账号');
    return;
  }
  memberLoading.value = true;
  try {
    const res = await getMemberAsset({ account: createForm.account });
    member.value = res.data;
    createForm.uid = res.data?.uid;
  } finally {
    memberLoading.value = false;
  }
};

const openCreate = (creditNow: boolean) => {
  Object.assign(createForm, {
    uid: undefined,
    account: '',
    amount: 0,
    channel: 'banks',
    bankCode: '',
    thirdPartyOrderNo: '',
    turnoverMultiple: 0,
    creditNow,
    remark: '',
    requestId: `RC-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  });
  member.value = undefined;
  createOpen.value = true;
};

const submitCreate = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  if (!createForm.uid) {
    modal.msgWarning('请先搜索并确认有效的会员账号');
    return;
  }
  if (createForm.creditNow && !createForm.remark) {
    modal.msgWarning('补单必须填写补单说明');
    return;
  }
  submitting.value = true;
  try {
    const res = await createRechargeOrder({ ...createForm });
    modal.msgSuccess(`${createForm.creditNow ? '补单已入账' : '订单已创建'}：${res.data?.orderNo ?? ''}`);
    createOpen.value = false;
    load();
  } finally {
    submitting.value = false;
  }
};

const doExport = () => {
  if (selectedColumns.value.length === 0) {
    modal.msgWarning('请至少选择一个导出字段');
    return;
  }
  exportCsv(`recharge-all-${Date.now()}.csv`, rows.value as unknown as Array<Record<string, unknown>>, selectedColumns.value);
  exportOpen.value = false;
};

load();
</script>
