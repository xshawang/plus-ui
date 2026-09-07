<template>
  <div class="p-2 app-container ops-channel-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>渠道管理</h3>
            <p>维护推广渠道并查看 channel_daily_stat 聚合统计。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['ops:channel:add']" type="primary" plain icon="Plus" @click="handleAdd">新增渠道</el-button>
          </div>
        </div>
      </template>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="渠道列表" name="list">
          <el-form :inline="true" class="query-form mb-2">
            <el-form-item label="类型">
              <el-select v-model="queryParams.channelType" clearable style="width: 120px">
                <el-option label="直营" :value="1" />
                <el-option label="代理" :value="2" />
                <el-option label="广告" :value="3" />
                <el-option label="其它" :value="4" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="queryParams.status" clearable style="width: 110px">
                <el-option label="启用" :value="1" />
                <el-option label="禁用" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item label="名称">
              <el-input v-model="queryParams.channelName" clearable @keyup.enter="handleQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
          <el-table v-loading="loading" border :data="rows">
            <el-table-column label="编码" prop="channelCode" width="120" />
            <el-table-column label="名称" prop="channelName" min-width="150" />
            <el-table-column label="类型" align="center" width="90">
              <template #default="{ row }">{{ channelTypeText(row.channelType) }}</template>
            </el-table-column>
            <el-table-column label="父渠道ID" prop="parentChannelId" align="center" width="110" />
            <el-table-column label="状态" align="center" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="备注" prop="remark" min-width="150" :show-overflow-tooltip="true" />
            <el-table-column label="创建时间" align="center" width="170">
              <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="180" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleUpdate(row)">编辑</el-button>
                <el-button v-if="row.status === 1" link type="info" @click="handleStatus(row, 0)">禁用</el-button>
                <el-button v-else link type="success" @click="handleStatus(row, 1)">启用</el-button>
                <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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
        </el-tab-pane>
        <el-tab-pane label="渠道统计" name="stats">
          <el-form :inline="true" class="query-form mb-2">
            <el-form-item label="开始日期">
              <el-date-picker v-model="statQuery.startDate" type="date" value-format="YYYY-MM-DD" style="width: 150px" />
            </el-form-item>
            <el-form-item label="结束日期">
              <el-date-picker v-model="statQuery.endDate" type="date" value-format="YYYY-MM-DD" style="width: 150px" />
            </el-form-item>
            <el-form-item label="渠道">
              <el-input v-model="statQuery.keyword" placeholder="编码/名称" clearable style="width: 150px" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="loadStats">查询</el-button>
            </el-form-item>
          </el-form>
          <el-table v-loading="statsLoading" border :data="statsRows">
            <el-table-column label="渠道编码" prop="channelCode" width="120" />
            <el-table-column label="渠道名称" prop="channelName" min-width="150" />
            <el-table-column label="注册" prop="registerCount" align="right" width="90" />
            <el-table-column label="登录" prop="loginCount" align="right" width="90" />
            <el-table-column label="付费人数" prop="payUserCount" align="right" width="100" />
            <el-table-column label="付费额(分)" align="right" min-width="120">
              <template #default="{ row }">{{ row.payAmount?.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column label="提现人数" prop="withdrawUserCount" align="right" width="100" />
            <el-table-column label="游戏局数" prop="gameRounds" align="right" width="100" />
            <el-table-column label="营收(分)" align="right" min-width="120">
              <template #default="{ row }">{{ row.revenueAmount?.toLocaleString() }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="600px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="90px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="渠道编码" prop="channelCode">
              <el-input v-model="form.channelCode" placeholder="唯一编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="渠道名称" prop="channelName">
              <el-input v-model="form.channelName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="渠道类型">
              <el-select v-model="form.channelType" style="width: 100%">
                <el-option label="直营" :value="1" />
                <el-option label="代理" :value="2" />
                <el-option label="广告" :value="3" />
                <el-option label="其它" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="父渠道ID">
              <el-input-number v-model="form.parentChannelId" :min="0" :controls="false" style="width: 100%" />
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
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="dialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="OpsChannel" lang="ts">
import { onMounted, reactive, ref, toRefs } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { addChannel, delChannel, getChannelStats, listChannel, updateChannel, updateChannelStatus } from '@/api/ops/channel';
import type { ChannelForm, ChannelQuery, ChannelStatQuery, ChannelStatVO, ChannelVO } from '@/api/ops/channel/types';

const channelTypeText = (t?: number) => (t === 1 ? '直营' : t === 2 ? '代理' : t === 3 ? '广告' : t === 4 ? '其它' : '—');
const activeTab = ref('list');
const { loading, withLoading } = useLoading(true);
const { loading: statsLoading, withLoading: withStatsLoading } = useLoading(true);
const rows = ref<ChannelVO[]>([]);
const total = ref(0);
const statsRows = ref<ChannelStatVO[]>([]);
const dialog = reactive({ visible: false, title: '' });
const isEdit = ref(false);

const data = reactive<{ queryParams: ChannelQuery; statQuery: ChannelStatQuery; form: ChannelForm }>({
  queryParams: { pageNum: 1, pageSize: 10 },
  statQuery: {},
  form: { channelType: 1, parentChannelId: 0 }
});
const { queryParams, statQuery, form } = toRefs(data);

const fmt = (value?: string) => (value ? value.replace('T', ' ').slice(0, 19) : '—');

const getList = async () => {
  await withLoading(async () => {
    const res = await listChannel(queryParams.value);
    rows.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};
const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: 10 } as ChannelQuery;
  handleQuery();
};
const loadStats = async () => {
  await withStatsLoading(async () => {
    const res = await getChannelStats(statQuery.value);
    statsRows.value = res.data || [];
  });
};
const handleAdd = () => {
  isEdit.value = false;
  form.value = { channelType: 1, parentChannelId: 0 } as ChannelForm;
  dialog.title = '新增渠道';
  dialog.visible = true;
};
const handleUpdate = (row: ChannelVO) => {
  isEdit.value = true;
  form.value = {
    channelId: row.channelId,
    channelCode: row.channelCode,
    channelName: row.channelName,
    channelType: row.channelType,
    parentChannelId: row.parentChannelId,
    remark: row.remark
  };
  dialog.title = '编辑渠道';
  dialog.visible = true;
};
const submitForm = async () => {
  if (!form.value.channelCode || !form.value.channelName) {
    modal.msgWarning('编码与名称必填');
    return;
  }
  if (isEdit.value) {
    await updateChannel(form.value);
  } else {
    await addChannel(form.value);
  }
  modal.msgSuccess('操作成功');
  dialog.visible = false;
  getList();
};
const handleStatus = async (row: ChannelVO, value: number) => {
  await updateChannelStatus({ id: row.channelId, value });
  modal.msgSuccess('操作成功');
  getList();
};
const handleDelete = async (row: ChannelVO) => {
  await modal.confirm('确认删除该渠道吗？');
  await delChannel(row.channelId);
  modal.msgSuccess('删除成功');
  getList();
};
onMounted(() => {
  getList();
  loadStats();
});
</script>
