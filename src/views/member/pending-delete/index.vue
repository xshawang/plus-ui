<template>
  <div class="p-2 app-container member-pending-delete-page">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="待删除会员" name="queue">
        <el-card shadow="hover" class="search-panel">
          <el-form :inline="true" class="query-form">
            <el-form-item label="操作时间">
              <el-date-picker
                v-model="queryParams.planTimeRange"
                type="datetimerange"
                value-format="YYYY-MM-DDTHH:mm:ss"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                style="width: 360px"
              />
            </el-form-item>
            <el-form-item label="会员ID">
              <el-input v-model="queryParams.uid" placeholder="会员ID" clearable style="width: 170px" @keyup.enter="getList" />
            </el-form-item>
            <el-form-item label="会员账号">
              <el-input v-model="queryParams.loginName" placeholder="会员账号" clearable style="width: 160px" @keyup.enter="getList" />
            </el-form-item>
            <el-form-item label="账号类型">
              <el-select v-model="queryParams.accountType" placeholder="全部" clearable style="width: 130px">
                <el-option v-for="item in accountTypeOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 130px">
                <el-option label="待删除" :value="1" />
                <el-option label="已删除" :value="2" />
                <el-option label="已取消" :value="3" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="getList">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
          <div class="text-gray-400 text-sm">
            口径：执行删除 = 资金校验（余额为 0 且无未完成提现）→ 队列标记已删除 → 账号状态置「已删除(3)」→ 写删除审计；
            <span class="text-orange-500">平台内不做物理清除</span>，物理清理由运维按审计记录离线执行。
          </div>
        </el-card>

        <el-card shadow="hover" class="table-panel">
          <template #header>
            <div class="toolbar-shell">
              <div class="table-heading">
                <h3>待删除会员</h3>
                <p>共 {{ total }} 条</p>
              </div>
              <div class="toolbar-actions">
                <el-button v-hasPermi="['member:pending-delete:edit']" type="primary" plain icon="Plus" @click="openEnqueue">人工入队</el-button>
                <el-button v-hasPermi="['member:pending-delete:edit']" type="warning" plain icon="MagicStick" @click="openAuto">自动删除无效会员</el-button>
                <el-button v-hasPermi="['member:pending-delete:edit']" type="danger" plain icon="Delete" :disabled="!selection.length" @click="batchExecute">批量执行删除</el-button>
                <el-button v-hasPermi="['member:pending-delete:clear']" type="danger" icon="WarningFilled" @click="openClear">清空站点全部数据</el-button>
                <el-button icon="Download" @click="exportReport">导出报表</el-button>
                <el-button icon="QuestionFilled" @click="tutorial.visible = true">操作教程</el-button>
              </div>
            </div>
          </template>
          <el-table v-loading="loading" border :data="rows" @selection-change="(val: any) => (selection = val)">
            <el-table-column type="selection" width="46" />
            <el-table-column label="将删除时间" prop="deletePlanTime" align="center" width="170" />
            <el-table-column label="会员ID" prop="uid" align="center" width="170" show-overflow-tooltip />
            <el-table-column label="会员账号(层级)" align="center" min-width="170" show-overflow-tooltip>
              <template #default="{ row }">{{ row.loginName }}<span class="text-gray-400">（{{ row.levelName ?? '未分层' }}）</span></template>
            </el-table-column>
            <el-table-column label="账号状态" align="center" width="100">
              <template #default="{ row }">{{ accountStatusLabel(row.accountStatus) }}</template>
            </el-table-column>
            <el-table-column label="账号类型" prop="accountType" align="center" width="110" />
            <el-table-column label="姓名" prop="realName" align="center" width="110" show-overflow-tooltip />
            <el-table-column label="邀请人(ID)" align="center" width="150" show-overflow-tooltip>
              <template #default="{ row }">{{ row.inviteName ?? '-' }}<span v-if="row.inviteUid">({{ row.inviteUid }})</span></template>
            </el-table-column>
            <el-table-column label="顶层代理(ID)" align="center" width="150" show-overflow-tooltip>
              <template #default="{ row }">{{ row.topAgentName ?? '-' }}<span v-if="row.topAgentUid">({{ row.topAgentUid }})</span></template>
            </el-table-column>
            <el-table-column label="上级代理(ID)" align="center" width="150" show-overflow-tooltip>
              <template #default="{ row }">{{ row.parentAgentName ?? '-' }}<span v-if="row.parentAgentUid">({{ row.parentAgentUid }})</span></template>
            </el-table-column>
            <el-table-column label="币种" prop="currency" align="center" width="90" />
            <el-table-column label="总余额(奖励钱包)" align="right" width="160">
              <template #default="{ row }">{{ row.totalBalance ?? 0 }}<span class="text-gray-400">({{ row.bonusBalance ?? 0 }})</span></template>
            </el-table-column>
            <el-table-column label="总充值金额(次数)" align="right" width="160">
              <template #default="{ row }">{{ row.totalRechargeAmount ?? 0 }}<span class="text-gray-400">({{ row.totalRechargeCount ?? 0 }})</span></template>
            </el-table-column>
            <el-table-column label="总提现金额(次数)" align="right" width="160">
              <template #default="{ row }">{{ row.totalWithdrawAmount ?? 0 }}<span class="text-gray-400">({{ row.totalWithdrawCount ?? 0 }})</span></template>
            </el-table-column>
            <el-table-column label="总充提差额(首充金额)" align="right" width="180">
              <template #default="{ row }">{{ row.balanceDiff ?? 0 }}<span class="text-gray-400">({{ row.firstDepositAmount ?? 0 }})</span></template>
            </el-table-column>
            <el-table-column label="注册方式(验证方式)" align="center" width="160">
              <template #default="{ row }">{{ row.registerType ?? '-' }}({{ row.verifyType ?? '-' }})</template>
            </el-table-column>
            <el-table-column label="注册时间(来源)" align="center" width="200">
              <template #default="{ row }">{{ row.registerAt ?? '-' }}<span class="text-gray-400">({{ row.registerChannel ?? '-' }})</span></template>
            </el-table-column>
            <el-table-column label="入队来源" align="center" width="110">
              <template #default="{ row }">{{ row.source === 2 ? '自动规则' : '人工' }}</template>
            </el-table-column>
            <el-table-column label="资金校验" prop="fundCheckResult" align="left" min-width="220" show-overflow-tooltip />
            <el-table-column label="状态" align="center" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 2 ? 'danger' : row.status === 3 ? 'info' : 'warning'">{{ queueStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作人" prop="operatorId" align="center" width="120" show-overflow-tooltip />
            <el-table-column label="操作" align="center" width="170" fixed="right">
              <template #default="{ row }">
                <el-button v-hasPermi="['member:pending-delete:edit']" link type="danger" :disabled="row.status !== 1" @click="executeOne(row as PendingDeleteVO)">执行删除</el-button>
                <el-button v-hasPermi="['member:pending-delete:edit']" link type="primary" :disabled="row.status !== 1" @click="cancelOne(row as PendingDeleteVO)">取消</el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="删除审计" name="log">
        <el-card shadow="hover" class="search-panel">
          <el-form :inline="true" class="query-form">
            <el-form-item label="会员ID">
              <el-input v-model="logQueryParams.uid" placeholder="会员ID" clearable style="width: 190px" @keyup.enter="getLogList" />
            </el-form-item>
            <el-form-item label="会员账号">
              <el-input v-model="logQueryParams.loginName" placeholder="会员账号" clearable style="width: 160px" @keyup.enter="getLogList" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="getLogList">搜索</el-button>
              <el-button icon="Refresh" @click="resetLogQuery">重置</el-button>
            </el-form-item>
          </el-form>
          <div class="text-gray-400 text-sm">口径：每条审计包含删除范围、清理方式与删除前快照摘要，供事后复核与恢复。</div>
        </el-card>
        <el-card shadow="hover" class="table-panel">
          <el-table v-loading="logLoading" border :data="logRows">
            <el-table-column label="审计ID" prop="id" align="center" width="180" show-overflow-tooltip />
            <el-table-column label="会员ID" prop="uid" align="center" width="180" show-overflow-tooltip />
            <el-table-column label="会员账号" prop="loginName" align="center" min-width="120" show-overflow-tooltip />
            <el-table-column label="清理方式" prop="purgeMode" align="center" width="110" />
            <el-table-column label="删除范围" prop="scope" align="left" min-width="200" show-overflow-tooltip />
            <el-table-column label="原因" prop="reason" align="left" min-width="180" show-overflow-tooltip />
            <el-table-column label="快照摘要" prop="snapshotJson" align="left" min-width="260" show-overflow-tooltip />
            <el-table-column label="执行人" prop="operatorId" align="center" width="120" show-overflow-tooltip />
            <el-table-column label="执行时间" prop="createdAt" align="center" width="170" />
          </el-table>
          <pagination v-show="logTotal > 0" v-model:page="logQueryParams.pageNum" v-model:limit="logQueryParams.pageSize" :total="logTotal" @pagination="getLogList" />
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="enqueueDialog.visible" title="人工入队（待删除）" width="620px" append-to-body destroy-on-close>
      <el-form ref="enqueueFormRef" :model="enqueueForm" :rules="enqueueRules" label-width="140px">
        <el-form-item label="会员ID" prop="uids">
          <el-input
            v-model="enqueueUidText"
            type="textarea"
            :rows="4"
            placeholder="支持中文/英文逗号与换行分隔，单次最多 200 个"
          />
        </el-form-item>
        <el-form-item label="计划删除天数">
          <el-input-number v-model="enqueueForm.planDays" :min="1" :max="365" controls-position="right" />
        </el-form-item>
        <el-form-item label="入队原因">
          <el-input v-model="enqueueForm.reason" type="textarea" :rows="2" maxlength="255" />
        </el-form-item>
        <el-alert type="info" :closable="false" title="入队不删除数据；到期后由运营在列表执行删除（仍需通过资金校验）。" />
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="saving" @click="submitEnqueue">确 定</el-button>
        <el-button @click="enqueueDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="autoDialog.visible" title="自动删除无效会员（按规则入队）" width="640px" append-to-body destroy-on-close>
      <el-form :model="autoForm" label-width="170px">
        <el-form-item label="未登录天数阈值">
          <el-input-number v-model="autoForm.inactiveDays" :min="1" :max="3650" controls-position="right" />
        </el-form-item>
        <el-form-item label="账号类型">
          <el-input v-model="autoForm.accountType" placeholder="TEST（逗号分隔，可多选）" />
        </el-form-item>
        <el-form-item label="要求从未充值">
          <el-switch v-model="autoForm.requireNoDeposit" />
        </el-form-item>
        <el-form-item label="排除已验证账号">
          <el-switch v-model="autoForm.excludeVerified" />
        </el-form-item>
        <el-form-item label="计划删除天数">
          <el-input-number v-model="autoForm.planDays" :min="1" :max="365" controls-position="right" />
        </el-form-item>
        <el-form-item label="单次最多入队">
          <el-input-number v-model="autoForm.limit" :min="1" :max="1000" controls-position="right" />
        </el-form-item>
        <el-alert type="warning" :closable="false" title="规则自带零余额过滤：有余额或有未完成提现的账号不会被入队，也不会被删除。" />
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="saving" @click="submitAuto">执行扫描并入队</el-button>
        <el-button @click="autoDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="clearDialog.visible" title="高危操作：清空站点全部数据" width="620px" append-to-body destroy-on-close>
      <el-alert type="error" :closable="false" title="该操作将移除待删除队列中的所有账号，请在确认资金已结清后执行。" />
      <el-form :model="clearForm" label-width="140px" class="mt-4">
        <el-form-item label="执行范围">
          <span class="text-gray-500">仅限「待删除队列」内账号（状态=待删除），不做全库删除</span>
        </el-form-item>
        <el-form-item label="单次最多处理">
          <el-input-number v-model="clearForm.limit" :min="1" :max="500" controls-position="right" />
        </el-form-item>
        <el-form-item label="确认词">
          <el-input v-model="clearForm.confirmWord" placeholder="请输入 CLEAR-SITE-ALL" />
        </el-form-item>
        <el-form-item label="执行原因">
          <el-input v-model="clearForm.reason" type="textarea" :rows="2" maxlength="255" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="danger" :loading="saving" @click="submitClear">确认执行</el-button>
        <el-button @click="clearDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="tutorial.visible" title="操作教程" width="640px" append-to-body destroy-on-close>
      <ol class="tutorial-list">
        <li>自动删除无效会员：按「未登录天数 + 未充值 + 未验证 + 零余额」筛选候选，仅入队，不删除数据。</li>
        <li>人工入队：粘贴会员ID（逗号或换行分隔，单次 ≤200）设置计划删除天数（默认 7 天）。</li>
        <li>取消：入队后在列表点「取消」，状态置「已取消」，不影响账号。</li>
        <li>执行删除：逐条校验资金（余额=0 且无未完成提现）；通过后队列置「已删除」、账号状态置「已删除(3)」并写审计。</li>
        <li>清空站点全部数据：高危入口，需手输确认词 <code>CLEAR-SITE-ALL</code>，仅处理队列内账号。</li>
        <li>删前请确认：无未结算注单、无进行中提现、余额已结清；物理清理由运维按删除审计离线执行。</li>
      </ol>
    </el-dialog>
  </div>
</template>

<script setup name="MemberPendingDelete" lang="ts">
import { onMounted, reactive, ref, toRefs } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import {
  autoPendingDelete,
  cancelPendingDelete,
  clearSitePendingDelete,
  enqueuePendingDelete,
  executePendingDelete,
  listDeleteLog,
  listPendingDelete
} from '@/api/member/pending-delete';
import type {
  DeleteLogVO,
  PendingDeleteAutoForm,
  PendingDeleteClearForm,
  PendingDeleteQuery,
  PendingDeleteVO
} from '@/api/member/pending-delete/types';

type PageBody<T> = { rows?: T[]; total?: number };
type DataBody<T> = { data?: T };

const activeTab = ref('queue');
const { loading, withLoading } = useLoading(true);
const { loading: saveLoading, withLoading: withSaving } = useLoading(false);
const { loading: logLoading, withLoading: withLogLoading } = useLoading(false);
const rows = ref<PendingDeleteVO[]>([]);
const total = ref(0);
const logRows = ref<DeleteLogVO[]>([]);
const logTotal = ref(0);
const selection = ref<PendingDeleteVO[]>([]);
const enqueueFormRef = ref();
const enqueueDialog = reactive({ visible: false });
const autoDialog = reactive({ visible: false });
const clearDialog = reactive({ visible: false });
const tutorial = reactive({ visible: false });
const enqueueUidText = ref('');
const saving = saveLoading;

const accountTypeOptions = ['FORMAL', 'TEST', 'STREAMER', 'AGENT'];

const data = reactive({
  queryParams: { pageNum: 1, pageSize: 10 } as PendingDeleteQuery,
  logQueryParams: { pageNum: 1, pageSize: 10 } as PendingDeleteQuery,
  enqueueForm: { uids: [] as (number | string)[], planDays: 7, reason: '' },
  autoForm: {
    inactiveDays: 180,
    accountType: 'TEST',
    requireNoDeposit: true,
    excludeVerified: true,
    planDays: 30,
    limit: 200
  } as PendingDeleteAutoForm,
  clearForm: { confirmWord: '', reason: '', limit: 100 } as PendingDeleteClearForm
});
const { queryParams, logQueryParams, enqueueForm, autoForm, clearForm } = toRefs(data);

const enqueueRules = {
  uids: [{ required: true, message: '请输入会员ID', trigger: 'blur' }]
};

const accountStatusLabel = (status?: number) =>
  ({ 1: '正常', 2: '封禁', 3: '已删除' } as Record<number, string>)[status ?? -1] ?? '—';
const queueStatusLabel = (status?: number) =>
  ({ 1: '待删除', 2: '已删除', 3: '已取消' } as Record<number, string>)[status ?? -1] ?? '—';

// modal.confirm 取消会 reject，统一包一层避免未捕获的 Promise 异常
const confirmed = async (content: string) => {
  try {
    await modal.confirm(content);
    return true;
  } catch {
    return false;
  }
};

// FIX(2026-10-10): 同上——会员UID 是 19 位雪花ID，超出 JS 安全整数范围，
// 用 Number() 转换会丢精度导致后端查不到会员；这里保持字符串。
const parseUids = (text: string): string[] =>
  text
    .split(/[\s,，;；]+/)
    .map((item) => item.trim().replace(/[^\d]/g, ''))
    .filter((item) => item.length > 0);

const getList = async () => {
  await withLoading(async () => {
    const res = (await listPendingDelete(queryParams.value)) as unknown as PageBody<PendingDeleteVO>;
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  });
};

const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: 10 };
  getList();
};

const openEnqueue = () => {
  enqueueUidText.value = '';
  Object.assign(enqueueForm.value, { uids: [], planDays: 7, reason: '' });
  enqueueDialog.visible = true;
};

const submitEnqueue = () => {
  const uids = parseUids(enqueueUidText.value);
  if (!uids.length) {
    modal.msgError('请输入有效的会员ID');
    return;
  }
  if (uids.length > 200) {
    modal.msgError('单次最多 200 个会员ID');
    return;
  }
  enqueueForm.value.uids = uids;
  withSaving(async () => enqueuePendingDelete(enqueueForm.value)).then(() => {
    modal.msgSuccess(`已入队 ${uids.length} 个会员`);
    enqueueDialog.visible = false;
    getList();
  });
};

const openAuto = () => {
  autoDialog.visible = true;
};

const submitAuto = async () => {
  const res = (await withSaving(async () => autoPendingDelete(autoForm.value))) as unknown as DataBody<{
    candidates?: number;
    enqueued?: number;
  }>;
  modal.msgSuccess(`扫描候选 ${res?.data?.candidates ?? 0} 个，入队 ${res?.data?.enqueued ?? 0} 个`);
  autoDialog.visible = false;
  await getList();
};

const openClear = () => {
  Object.assign(clearForm.value, { confirmWord: '', reason: '', limit: 100 });
  clearDialog.visible = true;
};

const submitClear = async () => {
  const res = (await withSaving(async () => clearSitePendingDelete(clearForm.value))) as unknown as DataBody<{
    executed?: number;
    blockedCount?: number;
  }>;
  modal.msgSuccess(`执行完成：成功 ${res?.data?.executed ?? 0} 个，被拦截 ${res?.data?.blockedCount ?? 0} 个`);
  clearDialog.visible = false;
  await getList();
  await getLogList();
};

const execAndReport = async (uids: (number | string)[], reason: string) => {
  const res = (await withSaving(async () => executePendingDelete(uids, reason))) as unknown as DataBody<{
    executed?: number;
    blockedCount?: number;
    blocked?: { uid: string; reason: string }[];
  }>;
  const blocked = res?.data?.blocked ?? [];
  if (blocked.length) {
    modal.msgWarning(`成功 ${res?.data?.executed ?? 0} 个；被拦截 ${blocked.length} 个，原因：${blocked[0].reason}`);
  } else {
    modal.msgSuccess(`执行完成：成功 ${res?.data?.executed ?? 0} 个`);
  }
  await getList();
  await getLogList();
};

const executeOne = async (row: PendingDeleteVO) => {
  if (!(await confirmed(`确认执行删除会员 ${row.loginName ?? row.uid}？执行后账号状态将置为「已删除」，并写入删除审计。`))) {
    return;
  }
  await execAndReport([row.uid], '列表行内执行删除');
};

const batchExecute = async () => {
  const uids = selection.value.filter((row) => row.status === 1).map((row) => row.uid);
  if (!uids.length) {
    modal.msgWarning('所选记录中没有「待删除」状态的数据');
    return;
  }
  if (!(await confirmed(`确认批量执行删除 ${uids.length} 个会员？`))) {
    return;
  }
  await execAndReport(uids, '批量执行删除');
};

const cancelOne = async (row: PendingDeleteVO) => {
  if (!(await confirmed(`确认取消会员 ${row.loginName ?? row.uid} 的删除计划？`))) {
    return;
  }
  await cancelPendingDelete(row.uid);
  modal.msgSuccess('已取消');
  await getList();
};

const exportReport = () => {
  const header = ['将删除时间', '会员ID', '会员账号', '层级', '账号类型', '总余额', '总充值', '总提现', '充提差额', '注册方式', '注册时间', '状态'];
  const lines = rows.value.map((row) =>
    [
      row.deletePlanTime,
      row.uid,
      row.loginName,
      row.levelName ?? '',
      row.accountType ?? '',
      row.totalBalance ?? 0,
      row.totalRechargeAmount ?? 0,
      row.totalWithdrawAmount ?? 0,
      row.balanceDiff ?? 0,
      row.registerType ?? '',
      row.registerAt ?? '',
      queueStatusLabel(row.status)
    ].join(',')
  );
  const csv = [header.join(','), ...lines].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `pending-delete-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  modal.msgSuccess(`已导出当前页 ${rows.value.length} 条`);
};

const getLogList = async () => {
  await withLogLoading(async () => {
    const res = (await listDeleteLog(logQueryParams.value)) as unknown as PageBody<DeleteLogVO>;
    logRows.value = res.rows ?? [];
    logTotal.value = res.total ?? 0;
  });
};

const resetLogQuery = () => {
  logQueryParams.value = { pageNum: 1, pageSize: 10 };
  getLogList();
};

onMounted(() => {
  getList();
  getLogList();
});
</script>

<style scoped>
.tutorial-list {
  padding-left: 18px;
  line-height: 2;
}
</style>
