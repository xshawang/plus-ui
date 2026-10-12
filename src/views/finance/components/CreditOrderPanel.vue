<template>
  <div class="credit-order-panel">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="会员账号">
          <el-input v-model="query.account" placeholder="多账号空格/逗号分隔" clearable style="width: 220px" @keyup.enter="load" />
        </el-form-item>
        <el-form-item label="单号">
          <el-input v-model="query.orderNo" placeholder="单号模糊" clearable style="width: 180px" @keyup.enter="load" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="待审核" :value="0" />
            <el-option label="已入账" :value="1" />
            <el-option label="已驳回" :value="2" />
            <el-option label="已锁定" :value="3" />
            <el-option label="失败" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="渠道">
          <el-input v-model="query.channelCode" placeholder="渠道编码" clearable style="width: 140px" @keyup.enter="load" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="load">搜索</el-button>
          <el-button icon="Refresh" @click="reset">重置</el-button>
          <el-button v-hasPermi="[editPerm]" type="primary" icon="Plus" @click="openCreate">新建单据</el-button>
          <el-button icon="Download" @click="exportOpen = true">导出</el-button>
        </el-form-item>
      </el-form>
      <div class="text-gray-400 text-sm">
        资金口径：金额与赠送均以「分」存储；审核通过才调用钱包 deposit 入账（本金 bizNo 与赠送 bizNo 分开，同单重审不重复加钱）；
        入账后由平台按充值稽核配置自动生成流水稽核任务（本页填写的倍数仅作记录）。
      </div>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>{{ title }}</h3>
            <p>共 {{ total }} 条</p>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="单号" prop="orderNo" align="center" min-width="190" show-overflow-tooltip />
        <el-table-column label="会员账号" prop="account" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="充值金额(分)" prop="amount" align="right" width="130" />
        <el-table-column label="赠送(分)" prop="bonusAmount" align="right" width="110" />
        <el-table-column label="稽核倍数" prop="turnoverMultiple" align="right" width="100" />
        <el-table-column label="渠道" prop="channelCode" align="center" width="110" />
        <el-table-column label="付款人/经办" prop="payerName" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="状态" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="statusType((row as CreditOrderVO).status)">{{ statusText((row as CreditOrderVO).status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="锁定人" prop="lockOperatorId" align="center" width="110" show-overflow-tooltip />
        <el-table-column label="审核人" prop="auditOperatorId" align="center" width="110" show-overflow-tooltip />
        <el-table-column label="失败/驳回原因" prop="failReason" align="left" min-width="150" show-overflow-tooltip />
        <el-table-column label="创建时间" prop="createdAt" align="center" width="180" show-overflow-tooltip />
        <el-table-column label="操作" align="center" fixed="right" width="280">
          <template #default="{ row }">
            <template v-if="[0, 3].includes((row as CreditOrderVO).status)">
              <el-button v-hasPermi="[editPerm]" link type="primary" @click="audit(row as CreditOrderVO, true)">审核入账</el-button>
              <el-button v-hasPermi="[editPerm]" link type="danger" @click="audit(row as CreditOrderVO, false)">驳回</el-button>
            </template>
            <el-button
              v-if="!(row as CreditOrderVO).lockOperatorId"
              v-hasPermi="[editPerm]"
              link
              type="primary"
              @click="lock(row as CreditOrderVO, 1)"
            >
              锁定
            </el-button>
            <el-button
              v-else
              v-hasPermi="[editPerm]"
              link
              type="warning"
              @click="lock(row as CreditOrderVO, 0)"
            >
              解锁
            </el-button>
            <el-button v-hasPermi="[editPerm]" link type="primary" @click="openRemark(row as CreditOrderVO)">备注</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="load" />
    </el-card>

    <el-dialog v-model="createOpen" :title="`新建${title}`" width="680px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="140px">
        <el-form-item label="会员账号" prop="account">
          <el-input v-model="form.account" placeholder="请输入会员账号（精确）" style="width: 260px" />
          <el-button class="ml-2" :loading="memberLoading" @click="searchMember">搜索</el-button>
        </el-form-item>
        <el-form-item label="会员ID">
          <el-input :model-value="member?.uid ?? ''" disabled style="width: 260px" />
        </el-form-item>
        <el-form-item label="账户余额(分)">
          <el-input :model-value="member?.available ?? ''" disabled style="width: 260px" />
        </el-form-item>
        <el-form-item label="充值金额(分)" prop="amount">
          <el-input-number v-model="form.amount" :min="0" controls-position="right" style="width: 260px" />
        </el-form-item>
        <el-form-item label="赠送金额(分)">
          <el-input-number v-model="form.bonusAmount" :min="0" controls-position="right" style="width: 260px" />
        </el-form-item>
        <el-form-item label="稽核倍数">
          <el-input-number v-model="form.turnoverMultiple" :min="0" :precision="2" controls-position="right" style="width: 260px" />
          <span class="ml-2 text-gray-400 text-sm">仅记录：入账后由平台充值稽核配置自动生成流水要求，如需加成请到"稽核任务"页新增</span>
        </el-form-item>
        <el-form-item label="渠道">
          <el-input v-model="form.channelCode" placeholder="如 银行卡 / Momo / USDT / 现金" style="width: 260px" />
        </el-form-item>
        <template v-if="orderType === 'TRANSFER'">
          <el-form-item label="付款人姓名">
            <el-input v-model="form.payerName" style="width: 260px" />
          </el-form-item>
          <el-form-item label="付款人账号">
            <el-input v-model="form.payerAccount" style="width: 320px" />
          </el-form-item>
          <el-form-item label="付款银行">
            <el-input v-model="form.payerBank" style="width: 260px" />
          </el-form-item>
          <el-form-item label="转账流水号">
            <el-input v-model="form.transferNo" style="width: 320px" />
          </el-form-item>
          <el-form-item label="凭证URL">
            <el-input v-model="form.voucherUrl" placeholder="转账凭证图片地址" style="width: 420px" />
          </el-form-item>
          <el-form-item label="转账附言">
            <el-input v-model="form.transferRemark" style="width: 320px" />
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="经办客服">
            <el-input v-model="form.payerName" style="width: 260px" />
          </el-form-item>
          <el-form-item label="凭证说明">
            <el-input v-model="form.proofRemark" style="width: 420px" />
          </el-form-item>
        </template>
        <el-form-item label="直接入账">
          <el-switch v-model="form.creditNow" />
          <span class="ml-2 text-gray-400 text-sm">开启=创建即入账（补单场景）；关闭=生成待审核单据</span>
        </el-form-item>
        <el-form-item label="后台备注">
          <el-input v-model="form.backRemark" type="textarea" :rows="2" style="width: 420px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCreate">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="remarkOpen" title="备注维护" width="560px" append-to-body>
      <el-form label-width="120px">
        <el-form-item label="前台备注">
          <el-input v-model="remarkForm.frontRemark" type="textarea" :rows="2" placeholder="会员端可见" />
        </el-form-item>
        <el-form-item label="后台备注">
          <el-input v-model="remarkForm.backRemark" type="textarea" :rows="2" placeholder="仅后台可见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="remarkOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRemark">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="exportOpen" title="导出字段列表" width="620px" append-to-body>
      <el-checkbox-group v-model="exportProps">
        <el-checkbox v-for="column in allColumns" :key="column.prop" :value="column.prop" class="mr-3">
          {{ column.label }}
        </el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="exportOpen = false">取消</el-button>
        <el-button type="primary" @click="doExport">导出 CSV</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import modal from '@/plugins/modal';
import { getMemberAsset } from '@/api/finance/manual-adjust';
import type { FinanceMemberAssetVO } from '@/api/finance/manual-adjust/types';
import {
  auditCsOrder,
  auditTransferOrder,
  createCsOrder,
  createTransferOrder,
  listCsOrders,
  listTransferOrders,
  lockCsOrder,
  lockTransferOrder,
  remarkCsOrder,
  remarkTransferOrder
} from '@/api/finance/credit-order';
import type { CreditOrderForm, CreditOrderQuery, CreditOrderVO } from '@/api/finance/credit-order';
import { exportCsv, type CsvColumn } from './csvExport';

/**
 * 转账充值单 / 客服代充单共用面板（需求文档 2_财务/06、07）。
 *
 * 两类单据流程一致（创建 → 锁定领单 → 审核入账/驳回 → 备注），差异只在采集字段与接口前缀，
 * 因此抽成一个组件由两个页面按 orderType 复用，避免两份几乎相同的页面各自演进。
 */
const props = defineProps<{
  orderType: 'TRANSFER' | 'CS';
  title: string;
  listPerm: string;
  editPerm: string;
}>();

const loading = ref(false);
const submitting = ref(false);
const memberLoading = ref(false);
const rows = ref<CreditOrderVO[]>([]);
const total = ref(0);
const createOpen = ref(false);
const remarkOpen = ref(false);
const exportOpen = ref(false);
const formRef = ref<FormInstance>();
const member = ref<FinanceMemberAssetVO>();
const remarkTarget = ref<CreditOrderVO>();
const exportProps = ref<string[]>(['orderNo', 'account', 'amount', 'bonusAmount', 'status', 'createdAt']);

const query = reactive<CreditOrderQuery>({
  account: '',
  orderNo: '',
  status: undefined,
  channelCode: '',
  pageNum: 1,
  pageSize: 10
});

const form = reactive<CreditOrderForm>({
  uid: undefined,
  account: '',
  amount: 0,
  bonusAmount: 0,
  turnoverMultiple: 0,
  channelCode: '',
  payerName: '',
  payerAccount: '',
  payerBank: '',
  transferNo: '',
  voucherUrl: '',
  transferRemark: '',
  proofRemark: '',
  creditNow: false,
  backRemark: '',
  requestId: ''
});

const remarkForm = reactive<{ frontRemark?: string; backRemark?: string }>({ frontRemark: '', backRemark: '' });

const rules: FormRules = {
  account: [{ required: true, message: '请输入会员账号', trigger: 'blur' }],
  amount: [{ required: true, message: '充值金额不能为空', trigger: 'blur' }]
};

const allColumns: CsvColumn[] = [
  { label: '单号', prop: 'orderNo' },
  { label: '会员账号', prop: 'account' },
  { label: '充值金额(分)', prop: 'amount' },
  { label: '赠送金额(分)', prop: 'bonusAmount' },
  { label: '稽核倍数', prop: 'turnoverMultiple' },
  { label: '渠道', prop: 'channelCode' },
  { label: '付款人/经办', prop: 'payerName' },
  { label: '状态', prop: 'status', format: (row) => statusText(Number(row.status)) },
  { label: '锁定人', prop: 'lockOperatorId' },
  { label: '审核人', prop: 'auditOperatorId' },
  { label: '失败/驳回原因', prop: 'failReason' },
  { label: '前台备注', prop: 'frontRemark' },
  { label: '后台备注', prop: 'backRemark' },
  { label: '创建时间', prop: 'createdAt' }
];

const selectedColumns = computed(() => allColumns.filter((column) => exportProps.value.includes(column.prop)));

const isTransfer = computed(() => props.orderType === 'TRANSFER');

function statusText(status: number) {
  return status === 1 ? '已入账' : status === 2 ? '已驳回' : status === 3 ? '已锁定' : status === 4 ? '失败' : '待审核';
}

function statusType(status: number) {
  return status === 1 ? 'success' : status === 2 || status === 4 ? 'danger' : status === 3 ? 'warning' : 'info';
}

const load = async () => {
  loading.value = true;
  try {
    const res = isTransfer.value ? await listTransferOrders(query) : await listCsOrders(query);
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
  query.channelCode = '';
  query.pageNum = 1;
  load();
};

const searchMember = async () => {
  if (!form.account) {
    modal.msgWarning('请输入会员账号');
    return;
  }
  memberLoading.value = true;
  try {
    const res = await getMemberAsset({ account: form.account });
    member.value = res.data;
    form.uid = res.data?.uid;
  } finally {
    memberLoading.value = false;
  }
};

const openCreate = () => {
  Object.assign(form, {
    uid: undefined,
    account: '',
    amount: 0,
    bonusAmount: 0,
    turnoverMultiple: 0,
    channelCode: '',
    payerName: '',
    payerAccount: '',
    payerBank: '',
    transferNo: '',
    voucherUrl: '',
    transferRemark: '',
    proofRemark: '',
    creditNow: false,
    backRemark: '',
    // 幂等请求号在打开弹窗时生成一次并复用，网络重试不会重复建单
    requestId: `${props.orderType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  });
  member.value = undefined;
  createOpen.value = true;
};

const submitCreate = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  if (!form.uid) {
    modal.msgWarning('请先搜索并确认有效的会员账号');
    return;
  }
  submitting.value = true;
  try {
    const res = isTransfer.value ? await createTransferOrder({ ...form }) : await createCsOrder({ ...form });
    modal.msgSuccess(`单据已创建：${res.data?.orderNo ?? ''}`);
    createOpen.value = false;
    load();
    if (member.value) {
      await searchMember();
    }
  } finally {
    submitting.value = false;
  }
};

const audit = async (row: CreditOrderVO, approve: boolean) => {
  let remark = '';
  if (!approve) {
    const result = await modal.prompt('请输入驳回原因');
    remark = String(result.value ?? '');
  } else {
    await modal.confirm(`确认审核通过并立即入账 ${row.amount} 分给 ${row.account ?? row.uid}？`);
  }
  if (isTransfer.value) {
    await auditTransferOrder(row.orderId, approve, remark);
  } else {
    await auditCsOrder(row.orderId, approve, remark);
  }
  modal.msgSuccess(approve ? '审核通过并已入账' : '已驳回');
  load();
};

const lock = async (row: CreditOrderVO, value: number) => {
  if (isTransfer.value) {
    await lockTransferOrder(row.orderId, value);
  } else {
    await lockCsOrder(row.orderId, value);
  }
  modal.msgSuccess(value === 1 ? '已锁定领单' : '已解锁');
  load();
};

const openRemark = (row: CreditOrderVO) => {
  remarkTarget.value = row;
  remarkForm.frontRemark = row.frontRemark ?? '';
  remarkForm.backRemark = row.backRemark ?? '';
  remarkOpen.value = true;
};

const submitRemark = async () => {
  const target = remarkTarget.value;
  if (!target) {
    return;
  }
  submitting.value = true;
  try {
    if (isTransfer.value) {
      await remarkTransferOrder(target.orderId, remarkForm.frontRemark, remarkForm.backRemark);
    } else {
      await remarkCsOrder(target.orderId, remarkForm.frontRemark, remarkForm.backRemark);
    }
    modal.msgSuccess('备注已保存');
    remarkOpen.value = false;
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
  exportCsv(`${props.orderType === 'TRANSFER' ? 'transfer-order' : 'cs-recharge'}-${Date.now()}.csv`,
    rows.value as unknown as Array<Record<string, unknown>>, selectedColumns.value);
  exportOpen.value = false;
};

load();
</script>
