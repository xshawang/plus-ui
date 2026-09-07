<template>
  <div class="p-2 app-container ops-message-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>消息通知</h3>
            <p>维护站内通知模板并管理发送任务与发送记录。</p>
          </div>
          <div class="toolbar-actions">
            <el-button
              v-if="activeTab === 'template'"
              v-hasPermi="['ops:message:template:add']"
              type="primary"
              plain
              icon="Plus"
              @click="handleTemplateAdd"
            >新增模板</el-button>
            <el-button
              v-else
              v-hasPermi="['ops:message:task:add']"
              type="primary"
              plain
              icon="Plus"
              @click="handleTaskAdd"
            >新增任务</el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="消息模板" name="template">
          <el-form :inline="true" class="query-form mb-2">
            <el-form-item label="状态">
              <el-select v-model="templateQuery.status" clearable style="width: 110px" @change="handleTemplateQuery">
                <el-option label="启用" :value="1" />
                <el-option label="禁用" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item label="关键词">
              <el-input v-model="templateQuery.keyword" clearable @keyup.enter="handleTemplateQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleTemplateQuery">搜索</el-button>
            </el-form-item>
          </el-form>
          <el-table v-loading="templateLoading" border :data="templateRows">
            <el-table-column label="编码" prop="templateCode" width="140" />
            <el-table-column label="名称" prop="templateName" min-width="150" />
            <el-table-column label="类型" align="center" width="100">
              <template #default="{ row }">{{ msgTypeText(row.msgType) }}</template>
            </el-table-column>
            <el-table-column label="标题模板" prop="titleTemplate" min-width="180" :show-overflow-tooltip="true" />
            <el-table-column label="状态" align="center" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="160" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleTemplateEdit(row)">编辑</el-button>
                <el-button v-if="row.status === 1" link type="info" @click="handleTemplateStatus(row, 0)">禁用</el-button>
                <el-button v-else link type="success" @click="handleTemplateStatus(row, 1)">启用</el-button>
                <el-button link type="danger" @click="handleTemplateDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination
            v-show="templateTotal > 0"
            v-model:page="templateQuery.pageNum"
            v-model:limit="templateQuery.pageSize"
            :total="templateTotal"
            @pagination="getTemplateList"
          />
        </el-tab-pane>

        <el-tab-pane label="发送任务" name="task">
          <el-form :inline="true" class="query-form mb-2">
            <el-form-item label="状态">
              <el-select v-model="taskQuery.status" clearable style="width: 130px" @change="handleTaskQuery">
                <el-option label="草稿" :value="0" />
                <el-option label="待发送" :value="1" />
                <el-option label="发送中" :value="2" />
                <el-option label="成功" :value="3" />
                <el-option label="部分成功" :value="4" />
                <el-option label="失败" :value="5" />
                <el-option label="已取消" :value="6" />
              </el-select>
            </el-form-item>
            <el-form-item label="任务名">
              <el-input v-model="taskQuery.taskName" clearable @keyup.enter="handleTaskQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleTaskQuery">搜索</el-button>
            </el-form-item>
          </el-form>
          <el-table v-loading="taskLoading" border :data="taskRows">
            <el-table-column label="任务名" prop="taskName" min-width="150" />
            <el-table-column label="模板" prop="templateName" min-width="110">
              <template #default="{ row }">{{ row.templateName || '—' }}</template>
            </el-table-column>
            <el-table-column label="标题" prop="title" min-width="160" :show-overflow-tooltip="true" />
            <el-table-column label="目标" align="center" width="90">
              <template #default="{ row }">{{ scopeText(row.targetScope) }}</template>
            </el-table-column>
            <el-table-column label="方式" align="center" width="90">
              <template #default="{ row }">{{ row.sendType === 2 ? '定时' : '立即' }}</template>
            </el-table-column>
            <el-table-column label="计划时间" align="center" width="170">
              <template #default="{ row }">{{ fmt(row.scheduledAt) }}</template>
            </el-table-column>
            <el-table-column label="状态" align="center" width="100">
              <template #default="{ row }">
                <el-tag :type="taskStatusType(row.status)">{{ taskStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="成功/失败" align="center" width="110">
              <template #default="{ row }">
                <span class="text-green-500">{{ row.successCount }}</span> /
                <span class="text-red-500">{{ row.failCount }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="270" fixed="right">
              <template #default="{ row }">
                <el-button v-if="row.status === 0" link type="primary" @click="handleTaskEdit(row)">编辑</el-button>
                <el-button v-if="row.status === 0 || row.status === 1" link type="success" @click="handleSend(row)">发送</el-button>
                <el-button v-if="row.status === 0" link type="warning" @click="handleSchedule(row)">定时</el-button>
                <el-button v-if="row.status === 1" link type="info" @click="handleCancel(row)">取消</el-button>
                <el-button v-if="row.status === 5" link type="warning" @click="handleRetry(row)">重试</el-button>
                <el-button link type="primary" @click="handleRecords(row)">记录</el-button>
                <el-button v-if="row.status === 0 || row.status === 6" link type="danger" @click="handleTaskDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination
            v-show="taskTotal > 0"
            v-model:page="taskQuery.pageNum"
            v-model:limit="taskQuery.pageSize"
            :total="taskTotal"
            @pagination="getTaskList"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="templateDialog.visible" :title="templateDialog.title" width="680px" append-to-body destroy-on-close>
      <el-form :model="templateForm" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="模板编码" prop="templateCode">
              <el-input v-model="templateForm.templateCode" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模板名称" prop="templateName">
              <el-input v-model="templateForm.templateName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="消息类型">
              <el-select v-model="templateForm.msgType" style="width: 100%">
                <el-option label="站内信" :value="1" />
                <el-option label="App推送" :value="2" />
                <el-option label="两者" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="标题模板">
              <el-input v-model="templateForm.titleTemplate" placeholder="支持 {变量}，如 活动通知" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="内容模板">
              <el-input v-model="templateForm.contentTemplate" type="textarea" :rows="4" placeholder="支持 {变量}" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="变量说明">
              <el-input v-model="templateForm.variablesJson" type="textarea" :rows="2" placeholder='{"nickname":"玩家昵称"}' />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="templateForm.remark" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitTemplate">确 定</el-button>
        <el-button @click="templateDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="taskDialog.visible" :title="taskDialog.title" width="760px" append-to-body destroy-on-close>
      <el-form :model="taskForm" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="任务名称" prop="taskName">
              <el-input v-model="taskForm.taskName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="使用模板">
              <el-select v-model="taskForm.templateId" clearable filterable style="width: 100%">
                <el-option v-for="tpl in templateRows" :key="tpl.templateId" :label="tpl.templateName" :value="tpl.templateId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发送标题" prop="title">
              <el-input v-model="taskForm.title" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发送方式">
              <el-radio-group v-model="taskForm.sendType">
                <el-radio :value="1">立即</el-radio>
                <el-radio :value="2">定时</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col v-if="taskForm.sendType === 2" :span="12">
            <el-form-item label="定时时间">
              <el-date-picker
                v-model="taskForm.scheduledAt"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="发送内容" prop="content">
              <el-input v-model="taskForm.content" type="textarea" :rows="4" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目标范围">
              <el-select v-model="taskForm.targetScope" style="width: 100%">
                <el-option label="全部玩家" :value="1" />
                <el-option label="VIP区间" :value="2" />
                <el-option label="指定UID" :value="3" />
                <el-option label="渠道" :value="4" />
                <el-option label="注册时间" :value="5" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="目标参数(JSON)">
              <el-input
                v-model="taskForm.scopeParamsJson"
                type="textarea"
                :rows="2"
                placeholder='VIP: {"minVip":1,"maxVip":5} / UID: {"uids":[1001,1002]} / 渠道: {"channelIds":[1]} / 注册时间: {"registerStart":"2026-01-01","registerEnd":"2026-02-01"}'
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitTask">确 定</el-button>
        <el-button @click="taskDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="recordDrawer.visible" title="发送记录" size="600px">
      <div class="mb-2">
        <el-form :inline="true">
          <el-form-item label="UID">
            <el-input v-model="recordQuery.uid" placeholder="按UID过滤" clearable style="width: 180px" @keyup.enter="handleRecordQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleRecordQuery">搜索</el-button>
          </el-form-item>
        </el-form>
      </div>
      <el-table v-loading="recordLoading" border :data="recordRows" size="small">
        <el-table-column label="UID" prop="uid" width="170" />
        <el-table-column label="状态" align="center" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '成功' : '失败' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="mailId" prop="mailId" width="180" />
        <el-table-column label="原因" prop="failReason" min-width="140" :show-overflow-tooltip="true" />
        <el-table-column label="发送时间" align="center" width="170">
          <template #default="{ row }">{{ fmt(row.sentAt) }}</template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="recordTotal > 0"
        v-model:page="recordQuery.pageNum"
        v-model:limit="recordQuery.pageSize"
        :total="recordTotal"
        @pagination="getRecordList"
      />
    </el-drawer>
  </div>
</template>

<script setup name="OpsMessage" lang="ts">
import { onMounted, reactive, ref, toRefs } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import {
  addMessageTask,
  addMessageTemplate,
  cancelMessageTask,
  delMessageTask,
  delMessageTemplate,
  listMessageRecord,
  listMessageTask,
  listMessageTemplate,
  retryMessageTask,
  scheduleMessageTask,
  sendMessageTask,
  updateMessageTask,
  updateMessageTemplate,
  updateMessageTemplateStatus
} from '@/api/ops/message';
import type {
  MessageRecordQuery,
  MessageRecordVO,
  MessageTaskForm,
  MessageTaskQuery,
  MessageTaskVO,
  MessageTemplateForm,
  MessageTemplateQuery,
  MessageTemplateVO
} from '@/api/ops/message/types';

const activeTab = ref('template');
const { loading: templateLoading, withLoading: withTemplateLoading } = useLoading(true);
const { loading: taskLoading, withLoading: withTaskLoading } = useLoading(true);
const { loading: recordLoading, withLoading: withRecordLoading } = useLoading(true);

const templateRows = ref<MessageTemplateVO[]>([]);
const templateTotal = ref(0);
const taskRows = ref<MessageTaskVO[]>([]);
const taskTotal = ref(0);
const recordRows = ref<MessageRecordVO[]>([]);
const recordTotal = ref(0);
const templateDialog = reactive({ visible: false, title: '' });
const taskDialog = reactive({ visible: false, title: '' });
const recordDrawer = reactive({ visible: false });
const templateEditFlag = ref(false);
const taskEditFlag = ref(false);
const currentTaskId = ref<number>();

const data = reactive<{
  templateQuery: MessageTemplateQuery;
  taskQuery: MessageTaskQuery;
  recordQuery: MessageRecordQuery;
  templateForm: MessageTemplateForm;
  taskForm: MessageTaskForm;
}>({
  templateQuery: { pageNum: 1, pageSize: 10 },
  taskQuery: { pageNum: 1, pageSize: 10 },
  recordQuery: { pageNum: 1, pageSize: 10 },
  templateForm: { msgType: 1 },
  taskForm: { channel: 1, sendType: 1, targetScope: 1 }
});
const { templateQuery, taskQuery, recordQuery, templateForm, taskForm } = toRefs(data);

const msgTypeText = (t?: number) => (t === 1 ? '站内信' : t === 2 ? 'App推送' : t === 3 ? '两者' : '—');
const scopeText = (s?: number) =>
  s === 1 ? '全部' : s === 2 ? 'VIP' : s === 3 ? '指定UID' : s === 4 ? '渠道' : s === 5 ? '注册时间' : '—';
const taskStatusText = (s?: number) =>
  s === 0 ? '草稿' : s === 1 ? '待发送' : s === 2 ? '发送中' : s === 3 ? '成功' : s === 4 ? '部分成功' : s === 5 ? '失败' : s === 6 ? '已取消' : '—';
const taskStatusType = (s?: number) =>
  s === 3 ? 'success' : s === 5 ? 'danger' : s === 6 ? 'info' : s === 4 ? 'warning' : s === 2 ? 'primary' : 'info';
const fmt = (value?: string) => (value ? value.replace('T', ' ').slice(0, 19) : '—');

const getTemplateList = async (all = false) => {
  await withTemplateLoading(async () => {
    const query = all ? { pageNum: 1, pageSize: 1000 } : templateQuery.value;
    const res = await listMessageTemplate(query);
    templateRows.value = res.data?.rows || [];
    templateTotal.value = res.data?.total || 0;
  });
};
const handleTemplateQuery = () => {
  templateQuery.value.pageNum = 1;
  getTemplateList();
};
const getTaskList = async () => {
  await withTaskLoading(async () => {
    const res = await listMessageTask(taskQuery.value);
    taskRows.value = res.data?.rows || [];
    taskTotal.value = res.data?.total || 0;
  });
};
const handleTaskQuery = () => {
  taskQuery.value.pageNum = 1;
  getTaskList();
};
const getRecordList = async () => {
  await withRecordLoading(async () => {
    if (!currentTaskId.value) return;
    recordQuery.value.taskId = currentTaskId.value;
    const res = await listMessageRecord(recordQuery.value);
    recordRows.value = res.data?.rows || [];
    recordTotal.value = res.data?.total || 0;
  });
};
const handleRecordQuery = () => {
  recordQuery.value.pageNum = 1;
  getRecordList();
};

const handleTemplateAdd = () => {
  templateEditFlag.value = false;
  templateForm.value = { msgType: 1 } as MessageTemplateForm;
  templateDialog.title = '新增模板';
  templateDialog.visible = true;
};
const handleTemplateEdit = (row: MessageTemplateVO) => {
  templateEditFlag.value = true;
  templateForm.value = {
    templateId: row.templateId,
    templateCode: row.templateCode,
    templateName: row.templateName,
    msgType: row.msgType,
    titleTemplate: row.titleTemplate,
    contentTemplate: row.contentTemplate,
    variablesJson: row.variablesJson,
    remark: row.remark
  };
  templateDialog.title = '编辑模板';
  templateDialog.visible = true;
};
const submitTemplate = async () => {
  if (!templateForm.value.templateCode || !templateForm.value.templateName) {
    modal.msgWarning('模板编码与名称必填');
    return;
  }
  if (templateEditFlag.value) {
    await updateMessageTemplate(templateForm.value);
  } else {
    await addMessageTemplate(templateForm.value);
  }
  modal.msgSuccess('操作成功');
  templateDialog.visible = false;
  getTemplateList(true);
  getTemplateList();
};
const handleTemplateStatus = async (row: MessageTemplateVO, value: number) => {
  await updateMessageTemplateStatus({ id: row.templateId, value });
  modal.msgSuccess('操作成功');
  getTemplateList();
};
const handleTemplateDelete = async (row: MessageTemplateVO) => {
  await modal.confirm('确认删除该模板吗？');
  await delMessageTemplate(row.templateId);
  modal.msgSuccess('删除成功');
  getTemplateList(true);
  getTemplateList();
};

const handleTaskAdd = () => {
  taskEditFlag.value = false;
  taskForm.value = { channel: 1, sendType: 1, targetScope: 1 } as MessageTaskForm;
  taskDialog.title = '新增任务';
  taskDialog.visible = true;
};
const handleTaskEdit = (row: MessageTaskVO) => {
  taskEditFlag.value = true;
  taskForm.value = {
    taskId: row.taskId,
    templateId: row.templateId || undefined,
    taskName: row.taskName,
    channel: row.channel,
    title: row.title,
    content: row.content,
    targetScope: row.targetScope,
    scopeParamsJson: row.scopeParamsJson,
    sendType: row.sendType,
    scheduledAt: row.scheduledAt
  };
  taskDialog.title = '编辑任务';
  taskDialog.visible = true;
};
const submitTask = async () => {
  if (!taskForm.value.taskName || !taskForm.value.title) {
    modal.msgWarning('任务名称与标题必填');
    return;
  }
  if (taskEditFlag.value) {
    await updateMessageTask(taskForm.value);
  } else {
    await addMessageTask(taskForm.value);
  }
  modal.msgSuccess('已保存为草稿');
  taskDialog.visible = false;
  getTaskList();
};
const handleSend = async (row: MessageTaskVO) => {
  await modal.confirm('确认立即发送该任务吗？发送过程可能较慢');
  await sendMessageTask({ id: row.taskId });
  modal.msgSuccess('发送完成');
  getTaskList();
};
const handleSchedule = async (row: MessageTaskVO) => {
  const result = await modal.prompt('请输入定时发送时间(YYYY-MM-DD HH:mm:ss)', '定时发送');
  const time = new Date(String(result?.value ?? ''));
  if (Number.isNaN(time.getTime())) {
    modal.msgWarning('时间格式错误');
    return;
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  const localTime =
    time.getFullYear() + '-' + pad(time.getMonth() + 1) + '-' + pad(time.getDate()) + 'T' +
    pad(time.getHours()) + ':' + pad(time.getMinutes()) + ':' + pad(time.getSeconds());
  await scheduleMessageTask({
    id: row.taskId,
    scheduledAt: localTime
  });
  modal.msgSuccess('已设置定时');
  getTaskList();
};
const handleCancel = async (row: MessageTaskVO) => {
  await modal.confirm('确认取消该任务吗？');
  await cancelMessageTask({ id: row.taskId });
  modal.msgSuccess('已取消');
  getTaskList();
};
const handleRetry = async (row: MessageTaskVO) => {
  await modal.confirm('确认重试失败记录吗？');
  await retryMessageTask({ id: row.taskId });
  modal.msgSuccess('重试完成');
  getTaskList();
};
const handleRecords = (row: MessageTaskVO) => {
  currentTaskId.value = row.taskId;
  recordQuery.value = { pageNum: 1, pageSize: 10, taskId: row.taskId } as MessageRecordQuery;
  recordDrawer.visible = true;
  getRecordList();
};
const handleTaskDelete = async (row: MessageTaskVO) => {
  await modal.confirm('确认删除该任务吗？');
  await delMessageTask(row.taskId);
  modal.msgSuccess('删除成功');
  getTaskList();
};
onMounted(() => {
  getTemplateList(true);
  getTemplateList();
  getTaskList();
});
</script>
