<template>
  <div class="recall-panel">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>{{ isSms ? '短信召回规则' : '邮箱召回规则' }}</h3>
            <p>按「币种 + 收件人 + 每天 1~3 个时间点」配置沉默会员召回；自动召回开关由 go88-job 定时读取。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="[editPerm]" type="primary" @click="openDialog()">新增</el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="rules" border>
        <el-table-column prop="ruleId" label="规则ID" width="180" />
        <el-table-column prop="currency" label="币种" width="110" />
        <el-table-column label="收件人" width="140">
          <template #default="{ row }">{{ targetTypeLabel(row.targetType) }}</template>
        </el-table-column>
        <el-table-column prop="dailySendCount" label="每天发送条数" width="120" />
        <el-table-column label="发送时间" width="200">
          <template #default="{ row }">{{ timeText(row) }}</template>
        </el-table-column>
        <el-table-column :label="isSms ? '发送平台(通道ID)' : '邮件发送人(SMTP ID)'" min-width="200">
          <template #default="{ row }">{{ platformText(row) }}</template>
        </el-table-column>
        <el-table-column label="自动召回" width="100">
          <template #default="{ row }">
            <el-tag :type="row.autoRecall === 1 ? 'success' : 'info'">{{ row.autoRecall === 1 ? '开启' : '关闭' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operatorId" label="操作人" width="100" />
        <el-table-column prop="updatedAt" label="操作时间" width="180" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="[editPerm]" link type="primary" @click="openDialog(row)">修改</el-button>
            <el-button v-hasPermi="[editPerm]" link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="hover" class="table-panel mt-3">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>召回进度</h3>
            <p>{{ isSms ? '待安全码解密发送 / 发送中 / 已完成 / 发送失败 / 全部' : '待发送 / 发送中 / 已完成 / 发送失败 / 全部' }}</p>
          </div>
          <div class="toolbar-actions">
            <el-radio-group v-model="statusFilter" @change="reloadAll">
              <el-radio-button label="all">全部</el-radio-button>
              <el-radio-button label="0">待发送</el-radio-button>
              <el-radio-button label="2">已完成</el-radio-button>
              <el-radio-button label="3">发送失败</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" :data="tasks" border>
        <el-table-column prop="taskId" label="任务ID" width="180" />
        <el-table-column prop="ruleId" label="规则ID" width="180" />
        <el-table-column prop="planTime" label="计划发送时间" width="180" />
        <el-table-column prop="targetCount" label="人群快照" width="100" />
        <el-table-column prop="sentCount" label="已发送" width="100" />
        <el-table-column prop="successCount" label="成功" width="90" />
        <el-table-column prop="failCount" label="失败" width="90" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="taskStatusType(row.status)">{{ taskStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openRecords(row)">发送明细</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/修改：只包含截图白色弹框内的字段 -->
    <el-dialog v-model="dialogVisible" :title="form.ruleId ? '修改' : '新增'" width="640px" append-to-body>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="150px">
        <el-form-item label="币种" prop="currency">
          <el-select v-model="form.currency" style="width: 260px">
            <el-option label="越南(VND1000:1)" value="VND" />
          </el-select>
        </el-form-item>
        <el-form-item label="收件人" prop="targetType">
          <el-radio-group v-model="form.targetType">
            <el-radio v-for="item in targetTypes" :key="item.value" :label="item.value">{{ item.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="每天发送条数" prop="dailySendCount">
          <el-radio-group v-model="form.dailySendCount">
            <el-radio :label="1">1条</el-radio>
            <el-radio :label="2">2条</el-radio>
            <el-radio :label="3">3条</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="发送时间" prop="sendTime1">
          <el-time-picker v-model="form.sendTime1" value-format="HH:mm" format="HH:mm" placeholder="选择时间" style="width: 200px" />
          <template v-if="isSms">
            <span class="ml-2">发送平台</span>
            <el-select v-model="form.channelIds1" multiple style="width: 260px" placeholder="选择短信通道">
              <el-option v-for="id in channelOptions" :key="id" :label="'通道' + id" :value="id" />
            </el-select>
          </template>
          <template v-else>
            <span class="ml-2">邮件发送人</span>
            <el-select v-model="form.smtpIds1" multiple style="width: 260px" placeholder="选择邮件发送人">
              <el-option v-for="s in smtpOptions" :key="s.smtpId" :label="s.account || s.host || String(s.smtpId)" :value="String(s.smtpId)" />
            </el-select>
          </template>
        </el-form-item>

        <template v-if="!isSms">
          <el-form-item label="邮件标题" prop="title1">
            <el-input v-model="form.title1" maxlength="80" show-word-limit placeholder="请输入邮件标题" />
          </el-form-item>
          <el-form-item label="邮件内容">
            <el-input v-model="form.content1" type="textarea" :rows="4" placeholder="请输入邮件内容（支持富文本）" />
          </el-form-item>
        </template>

        <template v-if="form.dailySendCount >= 2">
          <el-form-item label="发送时间2">
            <el-time-picker v-model="form.sendTime2" value-format="HH:mm" format="HH:mm" placeholder="选择时间" style="width: 200px" />
            <template v-if="isSms">
              <span class="ml-2">发送平台2</span>
              <el-select v-model="form.channelIds2" multiple style="width: 260px">
                <el-option v-for="id in channelOptions" :key="id" :label="'通道' + id" :value="id" />
              </el-select>
            </template>
            <template v-else>
              <span class="ml-2">邮件发送人2</span>
              <el-select v-model="form.smtpIds2" multiple style="width: 260px">
                <el-option v-for="s in smtpOptions" :key="s.smtpId" :label="s.account || s.host || String(s.smtpId)" :value="String(s.smtpId)" />
              </el-select>
            </template>
          </el-form-item>
          <template v-if="!isSms">
            <el-form-item label="邮件标题2"><el-input v-model="form.title2" maxlength="80" /></el-form-item>
            <el-form-item label="邮件内容2"><el-input v-model="form.content2" type="textarea" :rows="3" /></el-form-item>
          </template>
        </template>

        <template v-if="form.dailySendCount >= 3">
          <el-form-item label="发送时间3">
            <el-time-picker v-model="form.sendTime3" value-format="HH:mm" format="HH:mm" placeholder="选择时间" style="width: 200px" />
            <template v-if="isSms">
              <span class="ml-2">发送平台3</span>
              <el-select v-model="form.channelIds3" multiple style="width: 260px">
                <el-option v-for="id in channelOptions" :key="id" :label="'通道' + id" :value="id" />
              </el-select>
            </template>
            <template v-else>
              <span class="ml-2">邮件发送人3</span>
              <el-select v-model="form.smtpIds3" multiple style="width: 260px">
                <el-option v-for="s in smtpOptions" :key="s.smtpId" :label="s.account || s.host || String(s.smtpId)" :value="String(s.smtpId)" />
              </el-select>
            </template>
          </el-form-item>
          <template v-if="!isSms">
            <el-form-item label="邮件标题3"><el-input v-model="form.title3" maxlength="80" /></el-form-item>
            <el-form-item label="邮件内容3"><el-input v-model="form.content3" type="textarea" :rows="3" /></el-form-item>
          </template>
        </template>

        <el-form-item label="自动召回开关">
          <el-switch v-model="form.autoRecall" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="recordsVisible" :title="`发送明细${currentTaskId ? ' - ' + currentTaskId : ''}`" width="900px" append-to-body>
      <el-table v-loading="recordsLoading" :data="records" border max-height="420">
        <el-table-column prop="uid" label="会员UID" width="180" />
        <el-table-column :prop="isSms ? 'phoneMask' : 'emailMask'" :label="isSms ? '手机号(掩码)' : '邮箱(掩码)'" width="180" />
        <el-table-column v-if="!isSms" prop="title" label="标题" min-width="160" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="recordStatusType(row.sendStatus)">{{ recordStatusLabel(row.sendStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="failReason" label="失败原因" min-width="160" />
        <el-table-column prop="createdAt" label="创建时间" width="180" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup name="RecallRulePanel" lang="ts">
import { computed, reactive, ref } from 'vue';
import modal from '@/plugins/modal';
import {
  addRecallRule,
  delRecallRule,
  listRecallRecords,
  listRecallRules,
  listRecallTasks,
  listSmtpOptions,
  updateRecallRule,
  type RecallRuleForm,
  type RecallRuleVO,
  type RecallSendRecordVO,
  type RecallTaskVO,
  type SmtpOptionVO
} from '@/api/member/recall';

const props = defineProps<{ channel: 'sms' | 'email' }>();

const isSms = computed(() => props.channel === 'sms');
const editPerm = computed(() => (isSms.value ? 'member:sms:edit' : 'member:email:edit'));

/** 收件人枚举与后端 member_*_recall_rule.target_type 注释一致（12 类） */
const targetTypes = [
  { value: 1, label: '全体会员' },
  { value: 2, label: '自定义会员' },
  { value: 3, label: '会员层级' },
  { value: 4, label: 'VIP等级' },
  { value: 5, label: '会员标签' },
  { value: 6, label: '指定上级ID(直属)' },
  { value: 7, label: '指定顶层ID(全部下级)' },
  { value: 8, label: '未登录会员' },
  { value: 9, label: '已充值会员' },
  { value: 10, label: '未充值会员' },
  { value: 11, label: '注册设备' },
  { value: 12, label: '登录设备' }
];

const loading = ref(false);
const saving = ref(false);
const rules = ref<RecallRuleVO[]>([]);
const tasks = ref<RecallTaskVO[]>([]);
const records = ref<RecallSendRecordVO[]>([]);
const recordsLoading = ref(false);
const smtpOptions = ref<SmtpOptionVO[]>([]);
const channelOptions = ref<string[]>([]);
const statusFilter = ref<'all' | '0' | '2' | '3'>('all');
const dialogVisible = ref(false);
const recordsVisible = ref(false);
const currentTaskId = ref<number | string | undefined>(undefined);
const formRef = ref();

const emptyForm = (): RecallRuleForm => ({
  currency: 'VND',
  targetType: 1,
  dailySendCount: 1,
  autoRecall: 1,
  status: 1,
  sendTime1: '',
  channelIds1: '',
  smtpIds1: ''
});
const form = reactive<RecallRuleForm>(emptyForm());

const formRules = {
  targetType: [{ required: true, message: '请选择收件人', trigger: 'change' }],
  dailySendCount: [{ required: true, message: '请选择每天发送条数', trigger: 'change' }],
  sendTime1: [{ required: true, message: '请填写发送时间', trigger: 'change' }]
};

const targetTypeLabel = (value?: number) => targetTypes.find((t) => t.value === value)?.label || '-';
const joinList = (value?: string) => (value ? value.split(',').filter(Boolean) : []);
const joinListStr = (value?: string[] | string) => (Array.isArray(value) ? value.join(',') : value || '');

const timeText = (row: RecallRuleVO) =>
  [row.sendTime1, row.dailySendCount && row.dailySendCount >= 2 ? row.sendTime2 : '', row.dailySendCount && row.dailySendCount >= 3 ? row.sendTime3 : '']
    .filter(Boolean)
    .join(' / ') || '-';

const platformText = (row: RecallRuleVO) =>
  isSms.value
    ? [row.channelIds1, row.dailySendCount >= 2 ? row.channelIds2 : '', row.dailySendCount >= 3 ? row.channelIds3 : ''].filter(Boolean).join(' / ') || '-'
    : [row.smtpIds1, row.dailySendCount >= 2 ? row.smtpIds2 : '', row.dailySendCount >= 3 ? row.smtpIds3 : ''].filter(Boolean).join(' / ') || '-';

const taskStatusLabel = (status: number) => ({ 0: '待发送', 1: '发送中', 2: '已完成', 3: '发送失败' })[status] || '未知';
const taskStatusType = (status: number) => (status === 2 ? 'success' : status === 3 ? 'danger' : 'info');
const recordStatusLabel = (status: number) => ({ 0: '待发送', 1: '成功', 2: '失败' })[status] || '未知';
const recordStatusType = (status: number) => (status === 1 ? 'success' : status === 2 ? 'danger' : 'info');

const reloadAll = async () => {
  loading.value = true;
  try {
    const statusParam = statusFilter.value === 'all' ? undefined : Number(statusFilter.value);
    const [ruleRes, taskRes] = await Promise.all([
      listRecallRules(props.channel),
      listRecallTasks(props.channel, { status: statusParam })
    ]);
    rules.value = (ruleRes as unknown as { data?: RecallRuleVO[] }).data ?? [];
    tasks.value = (taskRes as unknown as { data?: RecallTaskVO[] }).data ?? [];
  } finally {
    loading.value = false;
  }
};

const openDialog = (row?: RecallRuleVO) => {
  Object.assign(form, emptyForm());
  if (row) {
    Object.assign(form, {
      ...row,
      channelIds1: joinListStr(row.channelIds1) as unknown as string,
      channelIds2: joinListStr(row.channelIds2) as unknown as string,
      channelIds3: joinListStr(row.channelIds3) as unknown as string,
      smtpIds1: joinListStr(row.smtpIds1) as unknown as string,
      smtpIds2: joinListStr(row.smtpIds2) as unknown as string,
      smtpIds3: joinListStr(row.smtpIds3) as unknown as string
    });
  }
  // 多选组件需要数组，这里统一转成数组形态绑定
  (form as unknown as Record<string, string[]>).channelIds1 = joinList(row?.channelIds1);
  (form as unknown as Record<string, string[]>).channelIds2 = joinList(row?.channelIds2);
  (form as unknown as Record<string, string[]>).channelIds3 = joinList(row?.channelIds3);
  (form as unknown as Record<string, string[]>).smtpIds1 = joinList(row?.smtpIds1);
  (form as unknown as Record<string, string[]>).smtpIds2 = joinList(row?.smtpIds2);
  (form as unknown as Record<string, string[]>).smtpIds3 = joinList(row?.smtpIds3);
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  await formRef.value?.validate();
  const payload: RecallRuleForm = {
    ...form,
    ruleId: form.ruleId,
    channelIds1: joinListStr(form.channelIds1),
    channelIds2: joinListStr(form.channelIds2),
    channelIds3: joinListStr(form.channelIds3),
    smtpIds1: joinListStr(form.smtpIds1),
    smtpIds2: joinListStr(form.smtpIds2),
    smtpIds3: joinListStr(form.smtpIds3)
  };
  saving.value = true;
  try {
    if (form.ruleId) {
      await updateRecallRule(props.channel, payload);
    } else {
      await addRecallRule(props.channel, payload);
    }
    modal.msgSuccess('保存成功');
    dialogVisible.value = false;
    await reloadAll();
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (row: RecallRuleVO) => {
  await modal.confirm('确认停用该召回规则？历史任务与发送明细会保留。');
  await delRecallRule(props.channel, row.ruleId);
  modal.msgSuccess('已停用');
  await reloadAll();
};

const openRecords = async (row: RecallTaskVO) => {
  currentTaskId.value = row.taskId;
  recordsVisible.value = true;
  recordsLoading.value = true;
  try {
    const res = await listRecallRecords(props.channel, { taskId: row.taskId });
    records.value = (res as unknown as { data?: RecallSendRecordVO[] }).data ?? [];
  } finally {
    recordsLoading.value = false;
  }
};

const loadOptions = async () => {
  if (!isSms.value) {
    const res = await listSmtpOptions();
    smtpOptions.value = (res as unknown as { data?: SmtpOptionVO[] }).data ?? [];
  }
};

loadOptions();
reloadAll();
</script>

<style scoped>
.recall-panel :deep(.el-radio-group) {
  flex-wrap: wrap;
}
</style>
