<template>
  <div class="p-2 app-container finance-audit-task-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="会员账号">
          <el-input v-model="queryParams.account" placeholder="多账号空格/逗号分隔，最多200个" clearable style="width: 260px" @keyup.enter="getList" />
        </el-form-item>
        <el-form-item label="稽核来源">
          <el-select v-model="queryParams.sourceType" placeholder="全部" clearable style="width: 150px">
            <el-option label="充值稽核" :value="1" />
            <el-option label="首充奖励" :value="2" />
            <el-option label="活动奖金" :value="3" />
            <el-option label="VIP奖励" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="进行中" :value="0" />
            <el-option label="已达标" :value="1" />
            <el-option label="已过期" :value="2" />
            <el-option label="已手动清除" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联单号">
          <el-input v-model="queryParams.sourceNo" placeholder="单号模糊" clearable style="width: 180px" @keyup.enter="getList" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="getList">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <div class="text-gray-400 text-sm">
        口径：后台只做查询 / 发起 / 手动解除，达标计算由稽核域（player TurnoverService）负责；
        数据源为 user_turnover_task，金额单位：分。
      </div>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>流水稽核任务</h3>
            <p>共 {{ total }} 条</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['finance:audit-task:edit']" type="primary" icon="Plus" @click="handleAdd">新增稽核</el-button>
            <el-button v-hasPermi="['finance:audit-task:edit']" icon="Setting" @click="openSettingDialog">稽核设置</el-button>
            <el-button icon="Refresh" @click="getList">刷新</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="任务ID" prop="taskId" align="center" width="180" show-overflow-tooltip />
        <el-table-column label="会员ID" prop="uid" align="center" width="170" show-overflow-tooltip />
        <el-table-column label="会员账号" prop="account" align="center" min-width="130" show-overflow-tooltip />
        <el-table-column label="VIP" align="center" width="80">
          <template #default="{ row }">V{{ row.vipLevel ?? 0 }}</template>
        </el-table-column>
        <el-table-column label="稽核来源" align="center" width="120">
          <template #default="{ row }">{{ sourceText(row.sourceType) }}</template>
        </el-table-column>
        <el-table-column label="关联单号" prop="sourceNo" align="center" min-width="170" show-overflow-tooltip />
        <el-table-column label="记账金额(分)" prop="sourceAmount" align="right" width="130" />
        <el-table-column label="倍数" prop="rolloverMultiple" align="right" width="90" />
        <el-table-column label="目标流水(分)" prop="targetAmount" align="right" width="140" />
        <el-table-column label="已打码(分)" prop="rolledAmount" align="right" width="130" />
        <el-table-column label="剩余(分)" prop="remainingAmount" align="right" width="130" />
        <el-table-column label="状态" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="过期时间" prop="expireAt" align="center" width="180" show-overflow-tooltip />
        <el-table-column label="创建时间" prop="createdAt" align="center" width="180" show-overflow-tooltip />
        <el-table-column label="操作" align="center" fixed="right" width="150">
          <template #default="{ row }">
            <el-button v-hasPermi="['finance:audit-task:edit']" link type="primary" :disabled="row.status !== 0" @click="handleRelease(row as FinanceAuditTaskVO)">
              手动解除
            </el-button>
            <el-button link type="primary" @click="handleDetail(row as FinanceAuditTaskVO)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <el-dialog v-model="dialogVisible" title="新增稽核" width="620px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="140px">
        <el-form-item label="会员账号" prop="account">
          <el-input v-model="form.account" placeholder="请输入会员账号（精确）" style="width: 260px" />
          <el-button class="ml-2" :loading="memberLoading" @click="searchMember">搜索</el-button>
        </el-form-item>
        <el-form-item label="会员ID">
          <el-input :model-value="member?.uid ?? ''" disabled style="width: 260px" />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input :model-value="member?.realName ?? ''" disabled style="width: 260px" />
        </el-form-item>
        <el-form-item label="账户余额(分)">
          <el-input :model-value="member?.available ?? ''" disabled style="width: 260px" />
        </el-form-item>
        <el-form-item label="稽核来源" prop="sourceType">
          <el-select v-model="form.sourceType" style="width: 260px">
            <el-option label="充值稽核" :value="1" />
            <el-option label="首充奖励" :value="2" />
            <el-option label="活动奖金" :value="3" />
            <el-option label="VIP奖励" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联单号">
          <el-input v-model="form.sourceNo" placeholder="留空自动生成" style="width: 260px" />
        </el-form-item>
        <el-form-item label="记账金额(分)" prop="sourceAmount">
          <el-input-number v-model="form.sourceAmount" :min="0" controls-position="right" style="width: 260px" />
        </el-form-item>
        <el-form-item label="流水倍数">
          <el-input-number v-model="form.rolloverMultiple" :min="0" :precision="2" controls-position="right" style="width: 260px" />
        </el-form-item>
        <el-form-item label="有效天数(0=永久)">
          <el-input-number v-model="form.expireDays" :min="0" controls-position="right" style="width: 260px" />
        </el-form-item>
        <el-form-item label="限定游戏范围">
          <el-input v-model="form.gameScope" placeholder="空=全平台，逗号分隔 game_code" style="width: 320px" />
        </el-form-item>
        <el-alert type="info" :closable="false" title="目标流水 = 记账金额 × 流水倍数（向下取整到分）；同一关联单号只会生成一条任务。" />
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="settingDialog" title="稽核设置" width="720px" append-to-body>
      <el-form v-loading="settingLoading" label-width="240px">
        <el-form-item v-for="control in settingControls" :key="control.key" :label="control.label">
          <el-switch
            v-if="control.type === 'switch'"
            v-model="settingValues[control.key] as number"
            :active-value="1"
            :inactive-value="0"
          />
          <el-input-number
            v-else-if="control.type === 'number'"
            v-model="settingValues[control.key] as number"
            :min="0"
            :max="1000000000"
            controls-position="right"
            style="width: 220px"
          />
          <el-input v-else v-model="settingValues[control.key] as string" style="width: 380px" />
          <span class="ml-2 text-gray-400 text-sm">{{ settingDesc[control.key] }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="settingDialog = false">取消</el-button>
        <el-button type="primary" :loading="settingSaving" @click="saveSetting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="FinanceAuditTask" lang="ts">
import { reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import modal from '@/plugins/modal';
import { createAuditTask, getAuditTaskDetail, listAuditTask, releaseAuditTask } from '@/api/finance/audit-task';
import type { FinanceAuditTaskForm, FinanceAuditTaskQuery, FinanceAuditTaskVO } from '@/api/finance/audit-task/types';
import { getMemberAsset } from '@/api/finance/manual-adjust';
import type { FinanceMemberAssetVO } from '@/api/finance/manual-adjust/types';
import { listAuditSettingConfig, saveAuditSettingConfig } from '@/api/finance/recharge-config';
import type { ConfigItemVO } from '@/api/member/config/types';

/**
 * 流水稽核任务页（需求文档 2_财务/13）。
 *
 * 三层结构：列表（投注/充值/提现稽核）+ 新增稽核（按会员发起）+ 稽核设置（finance-audit-setting 配置分组）。
 */
interface SettingControl {
  key: string;
  label: string;
  type: 'switch' | 'number' | 'text';
}

const settingControls: SettingControl[] = [
  { key: 'default_multiple', label: '默认流水倍数', type: 'text' },
  { key: 'default_expire_days', label: '默认有效天数(0=永久)', type: 'number' },
  { key: 'min_bet_amount', label: '计入有效流水最低单注(分)', type: 'number' },
  { key: 'game_scope', label: '默认限定游戏范围', type: 'text' },
  { key: 'auto_release_enabled', label: '稽核自动解除额度开关', type: 'switch' },
  { key: 'auto_release_threshold', label: '自动解除额度(分)', type: 'number' },
  { key: 'withdraw_block_enabled', label: '未达标阻断提现', type: 'switch' }
];

const loading = ref(false);
const submitting = ref(false);
const memberLoading = ref(false);
const rows = ref<FinanceAuditTaskVO[]>([]);
const total = ref(0);
const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const member = ref<FinanceMemberAssetVO>();

const settingDialog = ref(false);
const settingLoading = ref(false);
const settingSaving = ref(false);
const settingValues = reactive<Record<string, number | string>>({});
const settingDesc = reactive<Record<string, string>>({});

const queryParams = reactive<FinanceAuditTaskQuery>({
  account: '',
  sourceType: undefined,
  status: undefined,
  sourceNo: '',
  pageNum: 1,
  pageSize: 10
});

const form = reactive<FinanceAuditTaskForm>({
  uid: undefined,
  account: '',
  sourceType: 1,
  sourceNo: '',
  sourceAmount: 0,
  rolloverMultiple: 1,
  expireDays: 0,
  gameScope: ''
});

const rules: FormRules = {
  account: [{ required: true, message: '请输入会员账号', trigger: 'blur' }],
  sourceType: [{ required: true, message: '稽核来源不能为空', trigger: 'change' }],
  sourceAmount: [{ required: true, message: '记账金额不能为空', trigger: 'blur' }]
};

const sourceText = (sourceType?: number) =>
  sourceType === 2 ? '首充奖励' : sourceType === 3 ? '活动奖金' : sourceType === 4 ? 'VIP奖励' : '充值稽核';

const statusText = (status?: number) =>
  status === 1 ? '已达标' : status === 2 ? '已过期' : status === 3 ? '已手动清除' : '进行中';

const statusType = (status?: number) => (status === 0 ? 'warning' : status === 1 ? 'success' : 'info');

const getList = async () => {
  loading.value = true;
  try {
    const res = await listAuditTask(queryParams);
    rows.value = res.data?.rows ?? [];
    total.value = res.data?.total ?? 0;
  } finally {
    loading.value = false;
  }
};

const resetQuery = () => {
  queryParams.account = '';
  queryParams.sourceType = undefined;
  queryParams.status = undefined;
  queryParams.sourceNo = '';
  queryParams.pageNum = 1;
  getList();
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
    modal.msgSuccess('会员已确认');
  } finally {
    memberLoading.value = false;
  }
};

const handleAdd = () => {
  Object.assign(form, {
    uid: undefined,
    account: '',
    sourceType: 1,
    sourceNo: '',
    sourceAmount: 0,
    rolloverMultiple: 1,
    expireDays: 0,
    gameScope: ''
  });
  member.value = undefined;
  dialogVisible.value = true;
};

const handleSubmit = async () => {
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
    await createAuditTask({ ...form });
    modal.msgSuccess('稽核任务已创建');
    dialogVisible.value = false;
    getList();
  } finally {
    submitting.value = false;
  }
};

const handleRelease = async (row: FinanceAuditTaskVO) => {
  await modal.confirm(`确认手动解除会员 ${row.account ?? row.uid} 的稽核任务？解除后不可恢复。`);
  await releaseAuditTask(row.taskId);
  modal.msgSuccess('已解除');
  getList();
};

const handleDetail = async (row: FinanceAuditTaskVO) => {
  const res = await getAuditTaskDetail(row.taskId);
  const detail = res.data;
  modal.alert(
    `任务ID：${detail.taskId}\n会员：${detail.account ?? detail.uid}（V${detail.vipLevel ?? 0}）\n` +
      `来源：${sourceText(detail.sourceType)} / ${detail.sourceNo}\n` +
      `记账：${detail.sourceAmount ?? 0} 分 × ${detail.rolloverMultiple ?? 1} = 目标 ${detail.targetAmount ?? 0} 分\n` +
      `已打码：${detail.rolledAmount ?? 0} 分，剩余：${detail.remainingAmount ?? 0} 分\n` +
      `状态：${statusText(detail.status)}   限定范围：${detail.gameScope || '全平台'}`
  );
};

const openSettingDialog = async () => {
  settingDialog.value = true;
  settingLoading.value = true;
  try {
    const res = (await listAuditSettingConfig()) as { data?: ConfigItemVO[] };
    const byKey = new Map((res.data ?? []).map((item) => [item.configKey, item]));
    settingControls.forEach((control) => {
      const raw = byKey.get(control.key)?.configValue ?? '';
      settingDesc[control.key] = byKey.get(control.key)?.configDesc ?? '';
      settingValues[control.key] = control.type === 'number' ? Number(raw || 0) : raw;
    });
  } finally {
    settingLoading.value = false;
  }
};

const saveSetting = async () => {
  settingSaving.value = true;
  try {
    await saveAuditSettingConfig({
      items: settingControls.map((control) => ({
        configKey: control.key,
        configValue: String(settingValues[control.key] ?? '')
      }))
    });
    modal.msgSuccess('保存成功');
    settingDialog.value = false;
  } finally {
    settingSaving.value = false;
  }
};

getList();
</script>
