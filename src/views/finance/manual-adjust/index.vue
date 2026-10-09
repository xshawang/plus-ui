<template>
  <div class="p-2 app-container finance-manual-adjust-page">
    <!-- 一、单会员资产看板 -->
    <el-card shadow="hover" class="search-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>人工拉回修正 · 会员资产看板</h3>
            <p>仅支持单账号精准查询；合计总余额 = 账户余额 + 利息宝余额</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['finance:manual-adjust:edit']" type="primary" :disabled="!member" @click="openAddDialog">手动加款</el-button>
            <el-button v-hasPermi="['finance:manual-adjust:edit']" type="danger" :disabled="!member" @click="openDeductDialog">手动扣除</el-button>
          </div>
        </div>
      </template>
      <el-form :inline="true" class="query-form">
        <el-form-item :label="queryDimension === 'uid' ? '会员ID' : '会员账号'">
          <el-input
            v-model="memberKeyword"
            :placeholder="queryDimension === 'uid' ? '请输入会员ID' : '请输入会员账号，仅支持精准搜索'"
            clearable
            style="width: 260px"
            @keyup.enter="searchMember"
          />
        </el-form-item>
        <el-form-item label="检索维度">
          <el-radio-group v-model="queryDimension" @change="resetMember">
            <el-radio value="account">会员账号</el-radio>
            <el-radio value="uid">会员ID</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" :loading="memberLoading" @click="searchMember">搜索</el-button>
          <el-button icon="Refresh" @click="resetMember">重置</el-button>
        </el-form-item>
      </el-form>
      <el-row v-if="member" :gutter="12">
        <el-col :span="4">
          <div class="stat-card">
            <p class="stat-label">会员ID</p>
            <p class="stat-value">{{ member.uid }}</p>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card">
            <p class="stat-label">会员账号</p>
            <p class="stat-value">{{ member.account }}</p>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-card">
            <p class="stat-label">真实姓名</p>
            <p class="stat-value">{{ member.realName || '-' }}</p>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="stat-card">
            <p class="stat-label">VIP</p>
            <p class="stat-value">V{{ member.vipLevel ?? 0 }}</p>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="stat-card">
            <p class="stat-label">账户余额</p>
            <p class="stat-value">{{ formatMoney(member.available ?? 0) }}</p>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="stat-card">
            <p class="stat-label">利息宝</p>
            <p class="stat-value">{{ formatMoney(member.extra ?? 0) }}</p>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="stat-card">
            <p class="stat-label">合计总余额</p>
            <p class="stat-value text-blue-500">{{ formatMoney(member.total ?? 0) }}</p>
          </div>
        </el-col>
      </el-row>
      <el-empty v-else :image-size="60" description="请输入会员账号并搜索后查看各钱包余额" />
    </el-card>

    <!-- 一之二、三方场馆余额与资金拉回 -->
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>三方场馆余额</h3>
            <p>未接入厂商接口的场馆显示"未接入"，只能走人工确认拉回（需填场馆转出流水号与凭证）</p>
          </div>
          <div class="toolbar-actions">
            <el-button :disabled="!member" @click="loadVendors">刷新场馆余额</el-button>
            <el-button v-hasPermi="['finance:manual-adjust:edit']" type="primary" :disabled="!member" @click="openPullBack">
              场馆资金拉回
            </el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="vendorLoading" border :data="vendorRows" size="small">
        <el-table-column label="场馆编码" prop="vendorCode" align="center" width="120" />
        <el-table-column label="场馆名称" prop="vendorName" align="left" min-width="140" />
        <el-table-column label="接入状态" align="center" width="130">
          <template #default="{ row }">
            <el-tag :type="(row as VendorWalletVO).integrated ? 'success' : 'info'">
              {{ (row as VendorWalletVO).integrated ? '已接入' : '未接入' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="场馆余额" align="right" width="150">
          <template #default="{ row }">
            {{
              (row as VendorWalletVO).balance === null || (row as VendorWalletVO).balance === undefined
                ? '-'
                : formatMoney((row as VendorWalletVO).balance)
            }}
          </template>
        </el-table-column>
        <el-table-column label="说明" prop="note" align="left" min-width="280" show-overflow-tooltip />
      </el-table>
      <el-empty v-if="!vendorRows.length" :image-size="50" description="请先搜索会员后刷新场馆余额" />
    </el-card>

    <!-- 二、全部人工记录 -->
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>全部人工记录</h3>
            <p>共 {{ total }} 条 · 资金变动均写入 user_wallet_ledger（biz_type=6 人工调账），幂等键 requestId</p>
          </div>
          <div class="toolbar-actions">
            <el-button icon="Refresh" @click="getRecords">刷新</el-button>
          </div>
        </div>
      </template>
      <el-form :inline="true" class="query-form">
        <el-form-item label="会员账号">
          <el-input v-model="recordQuery.account" placeholder="多账号空格/逗号分隔" clearable style="width: 220px" @keyup.enter="getRecords" />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="recordQuery.adjustType" placeholder="全部" clearable style="width: 150px">
            <el-option label="手动加款" :value="1" />
            <el-option label="手动扣除" :value="2" />
            <el-option label="扣除全部资产" :value="3" />
            <el-option label="追缴扣除" :value="4" />
            <el-option label="人工拉回" :value="5" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="recordQuery.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="待审核" :value="0" />
            <el-option label="已发放" :value="1" />
            <el-option label="已拒绝" :value="2" />
            <el-option label="已扣除" :value="3" />
            <el-option label="已追缴" :value="4" />
            <el-option label="失败" :value="6" />
          </el-select>
        </el-form-item>
        <el-form-item label="工单号">
          <el-input v-model="recordQuery.adjustNo" placeholder="工单号模糊" clearable style="width: 180px" @keyup.enter="getRecords" />
        </el-form-item>
        <el-form-item label="创建时间">
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
          <el-button type="primary" icon="Search" @click="getRecords">搜索</el-button>
          <el-button icon="Refresh" @click="resetRecordQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="工单号" prop="adjustNo" align="center" width="200" show-overflow-tooltip />
        <el-table-column label="会员ID" prop="uid" align="center" width="170" show-overflow-tooltip />
        <el-table-column label="会员账号" prop="account" align="center" min-width="130" show-overflow-tooltip />
        <el-table-column label="VIP" align="center" width="80">
          <template #default="{ row }">V{{ row.vipLevel ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="120">
          <template #default="{ row }">{{ typeText(row.adjustType) }}</template>
        </el-table-column>
        <el-table-column label="加款" align="right" width="120">
          <template #default="{ row }">{{ row.adjustType === 1 ? formatMoney(row.adjustAmount) : '-' }}</template>
        </el-table-column>
        <el-table-column label="扣除" align="right" width="120">
          <template #default="{ row }">{{ isDeduct(row.adjustType) ? formatMoney(row.adjustAmount) : '-' }}</template>
        </el-table-column>
        <el-table-column label="追缴" align="right" width="110">
          <template #default="{ row }">{{ row.chaseAmount ? formatMoney(row.chaseAmount) : '-' }}</template>
        </el-table-column>
        <el-table-column label="未追缴" align="right" width="120">
          <template #default="{ row }">{{ row.unchasedAmount ? formatMoney(row.unchasedAmount) : '-' }}</template>
        </el-table-column>
        <el-table-column label="稽核倍数" prop="turnoverMultiple" align="right" width="100" />
        <el-table-column label="状态" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="补单说明" prop="adjustReason" align="left" min-width="150" show-overflow-tooltip />
        <el-table-column label="备注" align="center" width="100">
          <template #default="{ row }">
            <el-button link type="primary" @click="showRemark(row as FinanceManualAdjustVO)">备注详情</el-button>
          </template>
        </el-table-column>
        <el-table-column label="创建人" prop="operatorId" align="center" width="110" show-overflow-tooltip />
        <el-table-column label="创建时间" prop="createdAt" align="center" width="180" show-overflow-tooltip />
        <el-table-column label="审核人" prop="auditOperatorId" align="center" width="110" show-overflow-tooltip />
        <el-table-column label="审核时间" prop="auditedAt" align="center" width="180" show-overflow-tooltip />
        <el-table-column label="操作" align="center" fixed="right" width="150">
          <template #default="{ row }">
            <template v-if="row.status === 0">
              <el-button v-hasPermi="['finance:manual-adjust:edit']" link type="primary" @click="handleApprove(row as FinanceManualAdjustVO)">通过</el-button>
              <el-button v-hasPermi="['finance:manual-adjust:edit']" link type="danger" @click="handleReject(row as FinanceManualAdjustVO)">拒绝</el-button>
            </template>
            <span v-else class="text-gray-400">-</span>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-model:page="recordQuery.pageNum" v-model:limit="recordQuery.pageSize" :total="total" @pagination="getRecords" />
    </el-card>

    <!-- 三、加款 / 扣除弹窗 -->
    <el-dialog v-model="adjustDialog" :title="dialogTitle" width="720px" append-to-body>
      <el-form ref="adjustFormRef" :model="adjustForm" :rules="adjustRules" label-width="150px">
        <el-form-item label="会员账号">
          <el-input :model-value="member?.account ?? ''" disabled style="width: 260px" />
        </el-form-item>
        <el-form-item label="会员ID">
          <el-input :model-value="member?.uid ?? ''" disabled style="width: 260px" />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input :model-value="member?.realName ?? ''" disabled style="width: 260px" />
        </el-form-item>
        <el-form-item label="账户余额">
          <el-input :model-value="formatMoney(member?.available ?? 0)" disabled style="width: 260px" />
        </el-form-item>
        <el-form-item v-if="adjustForm.adjustType !== 1" label="合计总余额">
          <el-input :model-value="formatMoney(member?.total ?? 0)" disabled style="width: 260px" />
        </el-form-item>
        <el-form-item label="类型" prop="adjustType">
          <el-radio-group v-model="adjustForm.adjustType">
            <template v-if="adjustForm.adjustType === 1">
              <el-radio :value="1">手动加款</el-radio>
            </template>
            <template v-else>
              <el-radio :value="2">手动扣除</el-radio>
              <el-radio :value="3">扣除全部资产</el-radio>
              <el-radio :value="4">追缴扣除</el-radio>
            </template>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="订单金额" prop="adjustAmount">
          <el-input-number
            v-model="adjustForm.adjustAmount"
            :min="0"
            :disabled="adjustForm.adjustType === 3"
            controls-position="right"
            style="width: 260px"
          />
          <span v-if="adjustForm.adjustType === 3" class="ml-2 text-gray-400 text-sm">扣除全部资产：金额按实时可用余额计算</span>
          <span v-else-if="adjustForm.adjustType === 4" class="ml-2 text-gray-400 text-sm">追缴扣除：超出可用余额部分转入未追缴</span>
        </el-form-item>
        <el-form-item label="稽核倍数">
          <el-input-number
            v-model="adjustForm.turnoverMultiple"
            :min="0"
            :precision="2"
            :disabled="adjustForm.adjustType !== 1"
            controls-position="right"
            style="width: 260px"
          />
          <span class="ml-2 text-gray-400 text-sm">加款时按 金额 × 倍数 生成稽核任务（0=不生成）</span>
        </el-form-item>
        <el-form-item label="补单说明" prop="adjustReason">
          <el-input v-model="adjustForm.adjustReason" placeholder="请输入补单事件说明" style="width: 420px" />
        </el-form-item>
        <el-form-item label="前台备注">
          <el-input v-model="adjustForm.frontRemark" type="textarea" :rows="2" placeholder="展示在客户端账变明细" style="width: 420px" />
        </el-form-item>
        <el-form-item label="后台备注">
          <el-input v-model="adjustForm.backRemark" type="textarea" :rows="2" placeholder="仅后台可见" style="width: 420px" />
        </el-form-item>
        <el-alert
          type="warning"
          :closable="false"
          title="资金操作提示：重复提交同一 requestId 只会计账一次；扣除全部资产与追缴扣除不可逆，请核对金额与说明。"
        />
      </el-form>
      <template #footer>
        <el-button @click="adjustDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitAdjust">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="pullBackOpen" title="三方场馆资金拉回" width="680px" append-to-body>
      <el-form ref="pullBackFormRef" :model="pullBackForm" :rules="pullBackRules" label-width="150px">
        <el-form-item label="会员账号">
          <el-input :model-value="member?.account ?? ''" disabled style="width: 260px" />
        </el-form-item>
        <el-form-item label="场馆" prop="vendorCode">
          <el-select v-model="pullBackForm.vendorCode" placeholder="请选择场馆" style="width: 260px">
            <el-option v-for="item in vendorRows" :key="item.vendorCode" :label="`${item.vendorName}（${item.vendorCode}）`" :value="item.vendorCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="拉回金额" prop="amount">
          <el-input-number v-model="pullBackForm.amount" :min="0" controls-position="right" style="width: 260px" />
        </el-form-item>
        <el-form-item label="场馆转出流水号" prop="externalTxnNo">
          <el-input v-model="pullBackForm.externalTxnNo" placeholder="场馆侧转出凭证号，用于对账" style="width: 320px" />
        </el-form-item>
        <el-form-item label="凭证URL" prop="voucherUrl">
          <el-input v-model="pullBackForm.voucherUrl" placeholder="转账/下分截图地址" style="width: 420px" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="pullBackForm.remark" type="textarea" :rows="2" style="width: 420px" />
        </el-form-item>
        <el-alert
          type="warning"
          :closable="false"
          title="资金口径：已接入厂商会先调厂商下分接口（场馆先扣）再给平台入账；未接入厂商走人工确认登记，平台按填写金额入账并落工单，请务必核对场馆侧确已转出。"
        />
      </el-form>
      <template #footer>
        <el-button @click="pullBackOpen = false">取消</el-button>
        <el-button type="primary" :loading="pullBackSubmitting" @click="submitPullBack">确认拉回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="FinanceManualAdjust" lang="ts">
import { computed, reactive, ref } from 'vue';
import { ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import modal from '@/plugins/modal';
import {
  approveManualAdjust,
  getMemberAsset,
  listManualAdjust,
  rejectManualAdjust,
  submitManualAdjust
} from '@/api/finance/manual-adjust';
import type {
  FinanceManualAdjustForm,
  FinanceManualAdjustQuery,
  FinanceManualAdjustVO,
  FinanceMemberAssetVO
} from '@/api/finance/manual-adjust/types';
import { listVendorWallets, pullBackVendor } from '@/api/finance/vendor';
import type { VendorPullBackForm, VendorWalletVO } from '@/api/finance/vendor';
import { formatMoney } from '@/utils/money';

/**
 * 人工拉回修正页（需求文档 2_财务/12）。
 *
 * 资金链路：提交 → 后端按 finance-recharge-setting 的审核配置判定免审/待审核 →
 * 免审直接调用钱包 manualCredit/manualDebit 并回写工单；待审核走"通过/拒绝"。
 */
const memberKeyword = ref('');
const queryDimension = ref<'account' | 'uid'>('account');
const memberLoading = ref(false);
const member = ref<FinanceMemberAssetVO>();

/** 三方场馆余额看板与拉回（需求文档 2_财务/12） */
const vendorRows = ref<VendorWalletVO[]>([]);
const vendorLoading = ref(false);
const pullBackOpen = ref(false);
const pullBackSubmitting = ref(false);
const pullBackFormRef = ref<FormInstance>();
const pullBackForm = reactive<VendorPullBackForm>({
  uid: undefined,
  vendorCode: '',
  amount: 0,
  externalTxnNo: '',
  voucherUrl: '',
  remark: '',
  requestId: ''
});
const pullBackRules: FormRules = {
  vendorCode: [{ required: true, message: '请选择场馆', trigger: 'change' }],
  amount: [{ required: true, message: '拉回金额不能为空', trigger: 'blur' }],
  externalTxnNo: [{ required: true, message: '场馆转出流水号必填（人工确认模式）', trigger: 'blur' }],
  voucherUrl: [{ required: true, message: '凭证必填（人工确认模式）', trigger: 'blur' }]
};

const loading = ref(false);
const submitting = ref(false);
const rows = ref<FinanceManualAdjustVO[]>([]);
const total = ref(0);
const dateRange = ref<[string, string] | undefined>();

const adjustDialog = ref(false);
const adjustFormRef = ref<FormInstance>();

const recordQuery = reactive<FinanceManualAdjustQuery>({
  account: '',
  adjustType: undefined,
  status: undefined,
  adjustNo: '',
  pageNum: 1,
  pageSize: 10
});

/**
 * 幂等请求号在"对话框打开时"生成一次并复用：
 * 网络超时后用户重新点击确认会复用同一 requestId，后端据此保证只计账一次。
 */
const adjustForm = reactive<FinanceManualAdjustForm>({
  uid: undefined,
  account: '',
  adjustType: 1,
  adjustAmount: 0,
  turnoverMultiple: 1,
  adjustReason: '',
  frontRemark: '',
  backRemark: '',
  requestId: ''
});

const adjustRules: FormRules = {
  adjustType: [{ required: true, message: '操作类型不能为空', trigger: 'change' }],
  adjustAmount: [{ required: true, message: '订单金额不能为空', trigger: 'blur' }],
  adjustReason: [{ required: true, message: '补单说明不能为空', trigger: 'blur' }]
};

const dialogTitle = computed(() => (adjustForm.adjustType === 1 ? '新增手动加款' : '新增手动扣除'));
const isDeduct = (adjustType?: number) => adjustType === 2 || adjustType === 3 || adjustType === 4;

const typeText = (adjustType?: number) =>
  adjustType === 1
    ? '手动加款'
    : adjustType === 2
      ? '手动扣除'
      : adjustType === 3
        ? '扣除全部资产'
        : adjustType === 4
          ? '追缴扣除'
          : '人工拉回';

const statusText = (status?: number) =>
  status === 0
    ? '待审核'
    : status === 1
      ? '已发放'
      : status === 2
        ? '已拒绝'
        : status === 3
          ? '已扣除'
          : status === 4
            ? '已追缴'
            : status === 6
              ? '失败'
              : '已拉回';

const statusType = (status?: number) =>
  status === 0 ? 'warning' : status === 2 || status === 6 ? 'danger' : status === 1 ? 'success' : 'info';

const newRequestId = () => {
  const random = Math.random().toString(36).slice(2, 10);
  return `FIN-ADJ-${Date.now()}-${random}`;
};

const searchMember = async () => {
  if (!memberKeyword.value) {
    modal.msgWarning('请输入会员账号');
    return;
  }
  memberLoading.value = true;
  try {
    const params = queryDimension.value === 'uid' ? { uid: Number(memberKeyword.value) } : { account: memberKeyword.value };
    const res = await getMemberAsset(params);
    member.value = res.data;
    await loadVendors();
  } finally {
    memberLoading.value = false;
  }
};

const resetMember = () => {
  memberKeyword.value = '';
  member.value = undefined;
  vendorRows.value = [];
};

/** 拉取该会员在各三方场馆的余额（未接入厂商显示"未接入"）。 */
const loadVendors = async () => {
  if (!member.value) {
    vendorRows.value = [];
    return;
  }
  vendorLoading.value = true;
  try {
    const res = await listVendorWallets({ uid: member.value.uid });
    vendorRows.value = res.data ?? [];
  } finally {
    vendorLoading.value = false;
  }
};

const openPullBack = () => {
  Object.assign(pullBackForm, {
    uid: member.value?.uid,
    vendorCode: vendorRows.value.length ? vendorRows.value[0].vendorCode : '',
    amount: 0,
    externalTxnNo: '',
    voucherUrl: '',
    remark: '',
    // 幂等请求号在弹窗打开时生成一次并复用，网络重试不会重复入账
    requestId: `FIN-PULL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  });
  pullBackOpen.value = true;
};

const submitPullBack = async () => {
  const valid = await pullBackFormRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  if (!pullBackForm.amount || pullBackForm.amount <= 0) {
    modal.msgWarning('拉回金额必须大于 0');
    return;
  }
  pullBackSubmitting.value = true;
  try {
    const res = await pullBackVendor({ ...pullBackForm, uid: member.value?.uid });
    modal.msgSuccess(`拉回完成，工单 ${res.data?.adjustNo ?? ''}`);
    pullBackOpen.value = false;
    await searchMember();
    getRecords();
  } finally {
    pullBackSubmitting.value = false;
  }
};

const getRecords = async () => {
  loading.value = true;
  try {
    const params: FinanceManualAdjustQuery = { ...recordQuery };
    if (dateRange.value && dateRange.value.length === 2) {
      params.params = { beginTime: dateRange.value[0], endTime: dateRange.value[1] };
    }
    const res = await listManualAdjust(params);
    rows.value = res.data?.rows ?? [];
    total.value = res.data?.total ?? 0;
  } finally {
    loading.value = false;
  }
};

const resetRecordQuery = () => {
  recordQuery.account = '';
  recordQuery.adjustType = undefined;
  recordQuery.status = undefined;
  recordQuery.adjustNo = '';
  dateRange.value = undefined;
  recordQuery.pageNum = 1;
  getRecords();
};

const resetAdjustForm = (adjustType: number) => {
  adjustForm.uid = member.value?.uid;
  adjustForm.account = member.value?.account ?? '';
  adjustForm.adjustType = adjustType;
  adjustForm.adjustAmount = adjustType === 3 ? 0 : 0;
  adjustForm.turnoverMultiple = adjustType === 1 ? 1 : 0;
  adjustForm.adjustReason = '';
  adjustForm.frontRemark = '';
  adjustForm.backRemark = '';
  adjustForm.requestId = newRequestId();
};

const openAddDialog = () => {
  resetAdjustForm(1);
  adjustDialog.value = true;
};

const openDeductDialog = () => {
  resetAdjustForm(2);
  adjustDialog.value = true;
};

const submitAdjust = async () => {
  const valid = await adjustFormRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  if (adjustForm.adjustType !== 3 && (!adjustForm.adjustAmount || adjustForm.adjustAmount <= 0)) {
    modal.msgWarning('订单金额必须大于 0');
    return;
  }
  submitting.value = true;
  try {
    const res = await submitManualAdjust({ ...adjustForm, uid: member.value?.uid });
    const result = res.data;
    modal.msgSuccess(result?.status === 0 ? '已提交，等待二级审核' : `执行成功（工单 ${result?.adjustNo}）`);
    adjustDialog.value = false;
    getRecords();
    if (member.value) {
      await searchMember();
    }
  } finally {
    submitting.value = false;
  }
};

const handleApprove = async (row: FinanceManualAdjustVO) => {
  await modal.confirm(`确认审核通过工单 ${row.adjustNo} 并立即执行资金变动？`);
  await approveManualAdjust(row.adjustId);
  modal.msgSuccess('审核通过并已执行');
  getRecords();
};

const handleReject = async (row: FinanceManualAdjustVO) => {
  const result = await ElMessageBox.prompt('请输入拒绝原因', `拒绝工单 ${row.adjustNo}`, {
    inputPlaceholder: '如：金额与凭证不符',
    inputValidator: (value: string) => (value ? true : '拒绝原因不能为空')
  });
  await rejectManualAdjust(row.adjustId, result.value);
  modal.msgSuccess('已拒绝');
  getRecords();
};

const showRemark = async (row: FinanceManualAdjustVO) => {
  modal.alert(
    `工单号：${row.adjustNo}\n类型：${typeText(row.adjustType)}\n状态：${statusText(row.status)}\n` +
      `加/扣金额：${row.adjustAmount ?? 0} 分\n稽核倍数：${row.turnoverMultiple ?? 0}（应打码 ${row.turnoverAmount ?? 0} 分）\n` +
      `追缴：${row.chaseAmount ?? 0} / 已追 ${row.chasedAmount ?? 0} / 未追 ${row.unchasedAmount ?? 0}\n` +
      `补单说明：${row.adjustReason || '-'}\n前台备注：${row.frontRemark || '-'}\n后台备注：${row.backRemark || '-'}\n` +
      `失败原因：${row.failReason || '-'}\n钱包流水号：${row.ledgerNo || '-'}`
  );
};

getRecords();
</script>
