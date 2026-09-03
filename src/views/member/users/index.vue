<template>
  <div class="p-2 app-container member-user-page">
    <div class="search-wrap">
      <el-card shadow="hover" class="search-panel">
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="query-form">
          <el-form-item label="UID" prop="uid">
            <el-input v-model="queryParams.uid" placeholder="用户UID" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="登录名" prop="loginName">
            <el-input v-model="queryParams.loginName" placeholder="登录名" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="昵称" prop="nickName">
            <el-input v-model="queryParams.nickName" placeholder="昵称" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="queryParams.phone" placeholder="手机号" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="状态" prop="status">
            <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 110px">
              <el-option v-for="(label, value) in userStatusMap" :key="value" :label="label" :value="Number(value)" />
            </el-select>
          </el-form-item>
          <el-form-item label="注册时间" prop="dateRange">
            <el-date-picker
              v-model="dateRange"
              type="datetimerange"
              range-separator="-"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>用户列表</h3>
            <span class="text-gray-400 text-sm">余额默认展示 VND 账户</span>
          </div>
          <div class="toolbar-actions">
            <el-button type="primary" plain icon="Refresh" @click="handleQuery">刷新</el-button>
            <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList" />
          </div>
        </div>
      </template>

      <el-table v-loading="loading" border class="data-table" :data="userList">
        <el-table-column label="UID" align="left" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="handleGoLedger(row)">{{ row.uid }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="登录名" align="center" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="handleUpdate(row)">{{ row.loginName }}</el-link>
          </template>
        </el-table-column>
        <el-table-column label="头像" align="center" width="90">
          <template #default="{ row }">
            <el-avatar v-if="row.avatarUrl" shape="square" :size="40" :src="row.avatarUrl" />
            <el-avatar v-else shape="square" :size="40" icon="User" />
          </template>
        </el-table-column>
        <el-table-column label="昵称" align="center" prop="nickName" min-width="120" show-overflow-tooltip />
        <el-table-column label="手机号" align="center" prop="phone" min-width="120" show-overflow-tooltip />
        <el-table-column label="状态" align="center" width="90">
          <template #default="{ row }">
            <el-tag :type="userStatusType(row.status)">{{ userStatusMap[row.status] ?? row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="账户余额（VND）" align="right" width="160">
          <template #default="{ row }">
            <el-link type="primary" :underline="false" @click="handleAdjustBalance(row)">
              {{ formatMoneyInt(row.availableBalance) }}
            </el-link>
            <el-tooltip v-if="Number(row.frozenBalance) > 0" :content="'冻结 ' + formatMoneyInt(row.frozenBalance)" placement="top">
              <el-tag class="ml-1" size="small" type="warning">冻</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="累计充值" align="right" width="140">
          <template #default="{ row }">
            <el-link type="success" :underline="false" @click="handleGoRecharge(row)">
              {{ formatMoney(row.totalRechargeAmount) }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="累计提现" align="right" width="140">
          <template #default="{ row }">
            <el-link type="warning" :underline="false" @click="handleGoWithdraw(row)">
              {{ formatMoney(row.totalWithdrawAmount) }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column label="注册IP" align="center" prop="registerIp" min-width="130" show-overflow-tooltip />
        <el-table-column label="注册时间" align="center" prop="registerAt" width="170">
          <template #default="{ row }">{{ row.registerAt }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="90" fixed="right">
          <template #default="{ row }">
            <el-tooltip content="修改用户信息" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(row)" />
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>

    <!-- 用户信息修改 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="900px" append-to-body top="4vh">
      <el-form ref="userFormRef" :model="form" :rules="rules" label-width="130px">
        <el-divider content-position="left">账号</el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="UID">
              <el-input v-model="form.uid" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="登录名">
              <el-input v-model="form.loginName" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Game UID">
              <el-input v-model="form.gameUid" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="昵称" prop="nickName">
              <el-input v-model="form.nickName" placeholder="昵称" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="form.phone" placeholder="手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="手机已验证">
              <el-switch v-model="form.phoneVerified" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="头像">
              <el-input v-model="form.avatarUrl" placeholder="头像地址" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="头像预览">
              <el-avatar v-if="form.avatarUrl" shape="square" :size="40" :src="form.avatarUrl" />
              <el-avatar v-else shape="square" :size="40" icon="User" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="账号状态" prop="status">
              <el-select v-model="form.status" style="width: 100%">
                <el-option v-for="(label, value) in userStatusMap" :key="value" :label="label" :value="Number(value)" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">等级与风控</el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="VIP等级">
              <el-input-number v-model="form.vipLevel" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="俱乐部等级">
              <el-input-number v-model="form.clubLevel" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="风控等级">
              <el-input-number v-model="form.riskLevel" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">注册与登录限制</el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="注册IP">
              <el-input v-model="form.registerIp" placeholder="注册IP" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="注册设备">
              <el-input v-model="form.registerDevice" placeholder="注册设备" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="注册渠道">
              <el-input-number v-model="form.registerChannel" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="允许多端登录">
              <el-switch v-model="form.allowMultiDevice" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="禁止Web登录">
              <el-switch v-model="form.blockWebLogin" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="TOTP二次验证">
              <el-switch v-model="form.totpEnabled" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">密码（留空不修改）</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="登录密码" prop="password">
              <el-input v-model="form.password" type="password" show-password placeholder="留空则不修改" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资金密码" prop="payPassword">
              <el-input v-model="form.payPassword" type="password" show-password placeholder="留空则不修改" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 余额调整（敏感操作：需后台账户密码） -->
    <el-dialog v-model="balanceDialog.visible" :title="'调整余额 - ' + balanceDialog.loginName" width="520px" append-to-body>
      <el-form ref="balanceFormRef" :model="balanceForm" :rules="balanceRules" label-width="130px">
        <el-form-item label="用户UID">
          <el-input :model-value="String(balanceForm.uid)" disabled />
        </el-form-item>
        <el-form-item label="当前余额(VND)">
          <span class="font-mono">{{ formatMoneyInt(balanceForm.currentBalance) }}</span>
        </el-form-item>
        <el-form-item label="币种">
          <el-tag>{{ balanceForm.currency }}</el-tag>
        </el-form-item>
        <el-form-item label="目标余额(VND)" prop="targetBalance">
          <el-input-number
            v-model="balanceForm.targetBalance"
            :min="0"
            :step="10000"
            :precision="0"
            controls-position="right"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="balanceForm.remark" type="textarea" :rows="2" maxlength="200" show-word-limit placeholder="调整原因，便于审计" />
        </el-form-item>
        <el-form-item label="后台密码" prop="password">
          <el-input v-model="balanceForm.password" type="password" show-password placeholder="请输入当前后台账户密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="balanceSaving" type="primary" @click="submitBalance">确 定</el-button>
          <el-button @click="balanceDialog.visible = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MemberUser" lang="ts">
import { getMemberUser, listMemberUser, updateMemberBalance, updateMemberUser } from '@/api/member/users';
import type { MemberBalanceAdjustForm, MemberUserForm, MemberUserQuery, MemberUserVO } from '@/api/member/users/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useFormDialog } from '@/hooks/dialog/useFormDialog';
import { useDateRangeQuery } from '@/hooks/form/useDateRangeQuery';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import modal from '@/plugins/modal';
import { reactive, ref, toRefs } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

/** 账号状态：1正常 2锁定 3注销（player_account.status） */
const userStatusMap: Record<number, string> = {
  1: '正常',
  2: '锁定',
  3: '注销'
};

const userStatusType = (status?: number) => {
  if (status === 1) return 'success';
  if (status === 2) return 'warning';
  if (status === 3) return 'danger';
  return 'info';
};

const showSearch = ref(true);
const userList = ref<MemberUserVO[]>([]);
const total = ref(0);
const buttonLoading = ref(false);
const { loading, withLoading } = useLoading(true);
const { dateRange, applyDateRange, resetDateRange } = useDateRangeQuery();
const queryFormRef = ref<ElFormInstance>();
const userFormRef = ref<ElFormInstance>();

const initFormData: MemberUserForm = {
  uid: undefined,
  loginName: undefined,
  gameUid: undefined,
  nickName: undefined,
  avatarUrl: undefined,
  phone: undefined,
  phoneVerified: 0,
  status: 1,
  vipLevel: 0,
  clubLevel: 0,
  riskLevel: 0,
  registerIp: undefined,
  registerDevice: undefined,
  registerChannel: 0,
  allowMultiDevice: 1,
  blockWebLogin: 0,
  totpEnabled: 0,
  password: undefined,
  payPassword: undefined
};

const data = reactive<{ queryParams: MemberUserQuery; form: MemberUserForm; rules: any }>({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    uid: undefined,
    loginName: undefined,
    nickName: undefined,
    phone: undefined,
    status: undefined,
    registerChannel: undefined,
    currency: 'VND',
    params: undefined
  },
  form: { ...initFormData },
  rules: {
    nickName: [{ required: true, message: '昵称不能为空', trigger: 'blur' }]
  }
});
const { queryParams, form, rules } = toRefs(data);

const {
  dialog,
  resetForm: reset,
  openDialog,
  showDialog,
  closeDialog
} = useFormDialog({
  form,
  formRef: userFormRef,
  initialFormData: initFormData
});

const formatMoney = (value?: number) => {
  if (value === null || value === undefined) return '0.00';
  return (Number(value)).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/** 余额整数展示（VND 无小数，不展示两位小数） */
const formatMoneyInt = (value?: number) => {
  if (value === null || value === undefined) return '0';
  return Math.round(Number(value)).toLocaleString('en-US');
};

const getList = async () => {
  await withLoading(async () => {
    const res = await listMemberUser(applyDateRange(queryParams.value));
    userList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const { resetQuery } = useSearchReset({
  queryFormRef,
  queryParams,
  pageNumKey: 'pageNum',
  resetExtras: () => {
    resetDateRange();
    queryParams.value.currency = 'VND';
  },
  afterReset: () => handleQuery()
});

/** 点击登录名：打开单个用户全部属性修改弹窗 */
const handleUpdate = async (row?: Partial<MemberUserVO>) => {
  reset();
  const uid = row?.uid;
  if (!uid) return;
  const res = await getMemberUser(uid);
  Object.assign(form.value, res.data);
  form.value.password = undefined;
  form.value.payPassword = undefined;
  showDialog('修改用户 - ' + (res.data?.loginName || uid));
};

const submitForm = () => {
  userFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    buttonLoading.value = true;
    try {
      await updateMemberUser(form.value);
      modal.msgSuccess('操作成功');
      closeDialog();
      await getList();
    } finally {
      buttonLoading.value = false;
    }
  });
};

const cancel = () => {
  reset();
  closeDialog();
};

/** 余额调整弹窗状态 */
const balanceFormRef = ref<ElFormInstance>();
const balanceSaving = ref(false);
const balanceDialog = reactive<{ visible: boolean; loginName: string }>({ visible: false, loginName: '' });
const balanceForm = reactive<{
  uid?: string | number;
  currency: string;
  currentBalance: number;
  targetBalance: number;
  remark: string;
  password: string;
}>({
  uid: undefined,
  currency: 'VND',
  currentBalance: 0,
  targetBalance: 0,
  remark: '',
  password: ''
});
const balanceRules = {
  targetBalance: [{ required: true, message: '目标余额不能为空', trigger: 'blur' }],
  password: [{ required: true, message: '请输入后台账户密码', trigger: 'blur' }]
};

/** 点击余额：打开调整弹窗 */
const handleAdjustBalance = (row: Partial<MemberUserVO>) => {
  balanceForm.uid = row.uid;
  balanceForm.currency = 'VND';
  balanceForm.currentBalance = Number(row.availableBalance || 0);
  balanceForm.targetBalance = Math.round(balanceForm.currentBalance);
  balanceForm.remark = '';
  balanceForm.password = '';
  balanceDialog.loginName = row.loginName || String(row.uid ?? '');
  balanceDialog.visible = true;
};

/** 提交余额调整（前端按 VND 整数输入，转分后提交） */
const submitBalance = () => {
  balanceFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    balanceSaving.value = true;
    try {
      const payload: MemberBalanceAdjustForm = {
        uid: balanceForm.uid,
        currency: balanceForm.currency,
        balance: Math.round(balanceForm.targetBalance),
        remark: balanceForm.remark || '',
        password: balanceForm.password
      };
      await updateMemberBalance(payload);
      modal.msgSuccess('余额调整成功');
      balanceDialog.visible = false;
      await getList();
    } finally {
      balanceSaving.value = false;
    }
  });
};

/** 点击 UID：进入该用户的账户流水列表 */
const handleGoLedger = (row: MemberUserVO) => {
  router.push({ path: '/member/ledger', query: { uid: String(row.uid) } });
};

/** 点击累计充值：进入充值列表并按 uid 查询 */
const handleGoRecharge = (row: MemberUserVO) => {
  router.push({ path: '/member/recharge', query: { uid: String(row.uid) } });
};

/** 点击累计提现：进入提现列表并按 uid 查询 */
const handleGoWithdraw = (row: MemberUserVO) => {
  router.push({ path: '/member/withdraw', query: { uid: String(row.uid) } });
};

onMounted(() => {
  getList();
});
</script>
