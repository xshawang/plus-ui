<template>
  <div class="p-2 app-container finance-withdraw-admin-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="会员账号">
          <el-input v-model="query.account" placeholder="多账号空格/逗号分隔，最多200个" clearable style="width: 240px" @keyup.enter="load" />
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="query.orderNo" placeholder="订单号模糊" clearable style="width: 180px" @keyup.enter="load" />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 150px">
            <el-option label="待风控审核" :value="0" />
            <el-option label="待出款" :value="1" />
            <el-option label="已付款" :value="2" />
            <el-option label="已驳回" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="提现方式">
          <el-input v-model="query.withdrawChannelCode" placeholder="渠道编码" clearable style="width: 140px" @keyup.enter="load" />
        </el-form-item>
        <el-form-item label="三方代付">
          <el-input v-model="query.payMerchantCode" placeholder="代付商户编码" clearable style="width: 160px" @keyup.enter="load" />
        </el-form-item>
        <el-form-item label="锁定筛选">
          <el-select v-model="lockFilter" placeholder="全部" clearable style="width: 140px" @change="applyLockFilter">
            <el-option label="由我锁定" value="mine" />
            <el-option label="未锁定" value="free" />
          </el-select>
        </el-form-item>
        <el-form-item label="大额提现">
          <el-checkbox v-model="onlyLarge" @change="applyLargeFilter">仅看大额</el-checkbox>
        </el-form-item>
        <el-form-item label="申请时间">
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
          <el-button icon="Download" @click="exportOpen = true">导出</el-button>
        </el-form-item>
      </el-form>
      <div class="text-gray-400 text-sm">
        资金口径：提现申请时资金已被钱包冻结（withdrawFreeze）；**驳回**会调 withdrawCancel 退回可用余额，
        **财务出款/免审出款**调 withdrawCommit 确认出账，**提现转充值**=退回后按同额充值入账（净额不变）。
      </div>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>提现管理（财务）</h3>
            <p>共 {{ total }} 条 · 金额单位：分</p>
          </div>
          <div class="toolbar-actions">
            <el-button icon="Refresh" @click="load">刷新</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="订单号" prop="orderNo" align="center" min-width="200" show-overflow-tooltip />
        <el-table-column label="会员ID" prop="uid" align="center" width="170" show-overflow-tooltip />
        <el-table-column label="会员账号" prop="account" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="VIP" align="center" width="80">
          <template #default="{ row }">V{{ (row as WithdrawAdminVO).vipLevel ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="提现金额" prop="amount" align="right" width="140" :formatter="moneyColumnFormatter" />
        <el-table-column label="手续费" prop="feeAmount" align="right" width="130" :formatter="moneyColumnFormatter" />
        <el-table-column label="到账" prop="arriveAmount" align="right" width="130" :formatter="moneyColumnFormatter" />
        <el-table-column label="提现方式" prop="withdrawChannelCode" align="center" width="120" show-overflow-tooltip />
        <el-table-column label="收款账户" prop="beneficiaryMask" align="center" min-width="150" show-overflow-tooltip />
        <el-table-column label="三方代付" prop="payMerchantCode" align="center" width="130" show-overflow-tooltip />
        <el-table-column label="状态" align="center" width="120">
          <template #default="{ row }">
            <el-tag :type="statusType((row as WithdrawAdminVO).status)">{{ statusText((row as WithdrawAdminVO).status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="大额" align="center" width="80">
          <template #default="{ row }">
            <el-tag v-if="(row as WithdrawAdminVO).largeAmount === 1" type="danger">大额</el-tag>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
        <el-table-column label="锁定人" prop="lockOperatorId" align="center" width="110" show-overflow-tooltip />
        <el-table-column label="审核人" prop="auditOperatorId" align="center" width="110" show-overflow-tooltip />
        <el-table-column label="出款人" prop="payOperatorId" align="center" width="110" show-overflow-tooltip />
        <el-table-column label="重付次数" prop="payRetryCount" align="center" width="100" />
        <el-table-column label="后台备注" prop="backRemark" align="left" min-width="140" show-overflow-tooltip />
        <el-table-column label="失败原因" prop="failMsg" align="left" min-width="140" show-overflow-tooltip />
        <el-table-column label="申请时间" prop="applyAt" align="center" width="180" show-overflow-tooltip />
        <el-table-column label="完成时间" prop="finishAt" align="center" width="180" show-overflow-tooltip />
        <el-table-column label="操作" align="center" fixed="right" width="300">
          <template #default="{ row }">
            <el-button
              v-if="(row as WithdrawAdminVO).status === 0"
              v-hasPermi="['finance:withdraw-admin:edit']"
              link
              type="primary"
              @click="run('audit', row as WithdrawAdminVO)"
            >
              风控审核
            </el-button>
            <el-button
              v-if="[0, 1].includes((row as WithdrawAdminVO).status)"
              v-hasPermi="['finance:withdraw-admin:edit']"
              link
              type="danger"
              @click="run('reject', row as WithdrawAdminVO)"
            >
              驳回
            </el-button>
            <el-button
              v-if="(row as WithdrawAdminVO).status === 1"
              v-hasPermi="['finance:withdraw-admin:edit']"
              link
              type="success"
              @click="run('pay', row as WithdrawAdminVO)"
            >
              财务出款
            </el-button>
            <el-button
              v-if="[0, 1].includes((row as WithdrawAdminVO).status)"
              v-hasPermi="['finance:withdraw-admin:edit']"
              link
              type="warning"
              @click="run('noAuditPay', row as WithdrawAdminVO)"
            >
              免审出款
            </el-button>
            <el-button
              v-if="(row as WithdrawAdminVO).status === 1"
              v-hasPermi="['finance:withdraw-admin:edit']"
              link
              type="primary"
              @click="run('rePay', row as WithdrawAdminVO)"
            >
              重新代付
            </el-button>
            <el-button
              v-if="[0, 1].includes((row as WithdrawAdminVO).status)"
              v-hasPermi="['finance:withdraw-admin:edit']"
              link
              type="info"
              @click="run('transferToRecharge', row as WithdrawAdminVO)"
            >
              转充值
            </el-button>
            <el-button v-hasPermi="['finance:withdraw-admin:edit']" link type="primary" @click="openRemark(row as WithdrawAdminVO)">
              备注
            </el-button>
            <el-button
              v-hasPermi="['finance:withdraw-admin:edit']"
              link
              :type="(row as WithdrawAdminVO).lockOperatorId ? 'warning' : 'primary'"
              @click="toggleLock(row as WithdrawAdminVO)"
            >
              {{ (row as WithdrawAdminVO).lockOperatorId ? '解锁' : '锁定' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="load" />
    </el-card>

    <el-dialog v-model="remarkOpen" title="备注维护" width="560px" append-to-body>
      <el-form label-width="120px">
        <el-form-item label="前台备注">
          <el-input v-model="remarkForm.frontRemark" type="textarea" :rows="2" placeholder="会员端可见" />
        </el-form-item>
        <el-form-item label="后台备注">
          <el-input v-model="remarkForm.remark" type="textarea" :rows="2" placeholder="仅后台可见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="remarkOpen = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRemark">保存</el-button>
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

<script setup name="FinanceWithdrawAdmin" lang="ts">
import { computed, reactive, ref } from 'vue';
import modal from '@/plugins/modal';
import {
  auditWithdraw,
  listWithdrawAdmin,
  lockWithdraw,
  noAuditPayWithdraw,
  payWithdraw,
  rePayWithdraw,
  rejectWithdraw,
  transferWithdrawToRecharge,
  updateWithdrawRemark
} from '@/api/finance/withdraw-admin';
import type { WithdrawActionForm, WithdrawAdminQuery, WithdrawAdminVO } from '@/api/finance/withdraw-admin';
import { exportCsv, type CsvColumn } from '../components/csvExport';
import { moneyColumnFormatter } from '@/utils/money';

/**
 * 财务侧提现管理页（需求文档 2_财务/09、10、11）。
 *
 * 覆盖：风控审核、财务出款、免审出款、重新代付、提现转充值、前后台备注、认领锁定、大额提现筛选、导出字段自定义。
 */
const loading = ref(false);
const submitting = ref(false);
const rows = ref<WithdrawAdminVO[]>([]);
const total = ref(0);
const dateRange = ref<[string, string] | undefined>();
const lockFilter = ref<string | undefined>();
const onlyLarge = ref(false);
const remarkOpen = ref(false);
const exportOpen = ref(false);
const remarkTarget = ref<WithdrawAdminVO>();
const remarkForm = reactive<WithdrawActionForm>({ frontRemark: '', remark: '' });
const exportProps = ref<string[]>(['orderNo', 'account', 'amount', 'status', 'payMerchantCode', 'applyAt']);

const query = reactive<WithdrawAdminQuery>({
  account: '',
  orderNo: '',
  status: undefined,
  withdrawChannelCode: '',
  payMerchantCode: '',
  pageNum: 1,
  pageSize: 10
});

const allColumns: CsvColumn[] = [
  { label: '订单号', prop: 'orderNo' },
  { label: '会员ID', prop: 'uid' },
  { label: '会员账号', prop: 'account' },
  { label: '提现金额', prop: 'amount' },
  { label: '手续费', prop: 'feeAmount' },
  { label: '到账', prop: 'arriveAmount' },
  { label: '提现方式', prop: 'withdrawChannelCode' },
  { label: '收款账户', prop: 'beneficiaryMask' },
  { label: '三方代付', prop: 'payMerchantCode' },
  { label: '状态', prop: 'status', format: (row) => statusText(Number(row.status)) },
  { label: '大额', prop: 'largeAmount' },
  { label: '锁定人', prop: 'lockOperatorId' },
  { label: '审核人', prop: 'auditOperatorId' },
  { label: '出款人', prop: 'payOperatorId' },
  { label: '前台备注', prop: 'frontRemark' },
  { label: '后台备注', prop: 'backRemark' },
  { label: '失败原因', prop: 'failMsg' },
  { label: '申请时间', prop: 'applyAt' },
  { label: '完成时间', prop: 'finishAt' }
];

const selectedColumns = computed(() => allColumns.filter((column) => exportProps.value.includes(column.prop)));

function statusText(status: number) {
  return status === 2 ? '已付款' : status === 1 ? '待出款' : status === 3 ? '已驳回' : status === 4 ? '已取消' : '待风控审核';
}

function statusType(status: number) {
  return status === 2 ? 'success' : status === 3 ? 'danger' : status === 4 ? 'info' : 'warning';
}

const applyLockFilter = () => {
  query.lockedByMe = lockFilter.value === 'mine' ? 1 : undefined;
  query.unlockedOnly = lockFilter.value === 'free' ? 1 : undefined;
  load();
};

const applyLargeFilter = () => {
  query.largeAmount = onlyLarge.value ? 1 : undefined;
  load();
};

const load = async () => {
  loading.value = true;
  try {
    const params: WithdrawAdminQuery = { ...query };
    if (dateRange.value && dateRange.value.length === 2) {
      params.params = { beginTime: dateRange.value[0], endTime: dateRange.value[1] };
    }
    const res = await listWithdrawAdmin(params);
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
  query.withdrawChannelCode = '';
  query.payMerchantCode = '';
  query.lockedByMe = undefined;
  query.unlockedOnly = undefined;
  query.largeAmount = undefined;
  lockFilter.value = undefined;
  onlyLarge.value = false;
  dateRange.value = undefined;
  query.pageNum = 1;
  load();
};

const run = async (action: string, row: WithdrawAdminVO) => {
  const body: WithdrawActionForm = { orderId: row.orderId };
  if (action === 'audit') {
    await modal.confirm(`确认风控审核通过订单 ${row.orderNo}（${row.amount} 分）？`);
    await auditWithdraw(body);
    modal.msgSuccess('已审核通过，进入待出款');
  } else if (action === 'reject') {
    const reason = await modal.prompt('请输入驳回原因（资金将退回会员可用余额）');
    body.remark = String(reason.value ?? '');
    await rejectWithdraw(body);
    modal.msgSuccess('已驳回并退回余额');
  } else if (action === 'pay') {
    await modal.confirm(`确认对订单 ${row.orderNo} 执行财务出款（确认出账，不再退回）？`);
    await payWithdraw(body);
    modal.msgSuccess('出款成功');
  } else if (action === 'noAuditPay') {
    await modal.confirm(`确认对订单 ${row.orderNo} 免审出款（跳过风控审核，直接确认出账）？`);
    await noAuditPayWithdraw(body);
    modal.msgSuccess('免审出款成功');
  } else if (action === 'rePay') {
    const remark = await modal.prompt('请输入重新代付说明（可指定新的三方代付商户编码）');
    body.remark = String(remark.value ?? '');
    await rePayWithdraw(body);
    modal.msgSuccess('已重新发起代付，重试次数 +1');
  } else if (action === 'transferToRecharge') {
    await modal.confirm(`确认把订单 ${row.orderNo} 转为充值？资金先退回可用余额、再按同额充值入账（净额不变）。`);
    const remark = await modal.prompt('请输入转充值说明（可选）');
    body.remark = String(remark.value ?? '');
    const res = await transferWithdrawToRecharge(body);
    modal.msgSuccess(`已转充值，生成充值单 ${res.data?.rechargeOrderNo ?? ''}`);
  }
  load();
};

const toggleLock = async (row: WithdrawAdminVO) => {
  const lock = row.lockOperatorId ? 0 : 1;
  await lockWithdraw(row.orderId, lock);
  modal.msgSuccess(lock === 1 ? '已锁定领单' : '已解锁');
  load();
};

const openRemark = (row: WithdrawAdminVO) => {
  remarkTarget.value = row;
  remarkForm.frontRemark = row.frontRemark ?? '';
  remarkForm.remark = row.backRemark ?? '';
  remarkOpen.value = true;
};

const submitRemark = async () => {
  const target = remarkTarget.value;
  if (!target) {
    return;
  }
  submitting.value = true;
  try {
    await updateWithdrawRemark({ orderId: target.orderId, frontRemark: remarkForm.frontRemark, remark: remarkForm.remark });
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
  exportCsv(`withdraw-admin-${Date.now()}.csv`, rows.value as unknown as Array<Record<string, unknown>>, selectedColumns.value);
  exportOpen.value = false;
};

load();
</script>
