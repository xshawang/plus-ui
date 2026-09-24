<template>
  <div class="p-2 app-container ops-report-export-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item>
          <el-radio-group v-model="quickRange" @change="handleQuickRange">
            <el-radio-button label="day">日</el-radio-button>
            <el-radio-button label="week">周</el-radio-button>
            <el-radio-button label="month">月</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="导出时间">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm:ss"
            range-separator="-"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 380px"
          />
        </el-form-item>
        <el-form-item label="一级菜单">
          <el-select v-model="queryParams.module" clearable placeholder="请选择一级菜单" style="width: 170px">
            <el-option v-for="item in options.modules" :key="item.value" :label="item.label" :value="item.label" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" clearable placeholder="全部状态" style="width: 140px">
            <el-option v-for="item in options.statuses" :key="item.value" :label="item.label" :value="Number(item.value)" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <el-table v-loading="loading" border :data="rows" empty-text="暂无数据" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="导出时间" prop="createdAt" align="center" width="180" />
        <el-table-column label="所属模块" prop="moduleName" align="center" width="110" />
        <el-table-column label="模块内容" prop="moduleContent" align="center" min-width="150" show-overflow-tooltip />
        <el-table-column label="文件名" prop="fileName" min-width="220" show-overflow-tooltip />
        <el-table-column label="文件大小" align="center" width="110">
          <template #default="{ row }">{{ formatSize(row.fileSize) }}</template>
        </el-table-column>
        <el-table-column label="文件密码(敏感资料下载后记得删除)" align="center" width="220">
          <template #default="{ row }">
            <span>{{ row.filePassword || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="文件自动删除时间" prop="autoDeleteAt" align="center" width="180" />
        <el-table-column label="状态" align="center" width="110">
          <template #default="{ row }">
            <el-tooltip :disabled="row.status !== 3" :content="row.failReason || '生成失败'">
              <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="140" show-overflow-tooltip />
        <el-table-column label="操作" align="center" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['ops:report:export:download']" :disabled="row.status !== 2" link type="primary" @click="handleDownload(row)">下载</el-button>
            <el-button v-hasPermi="['ops:report:export:retry']" :disabled="row.status !== 3" link type="warning" @click="handleRetry(row)">重新生成</el-button>
            <el-button v-hasPermi="['ops:report:export:remove']" link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作人" prop="operatorName" align="center" width="110" />
      </el-table>

      <div class="table-footer-bar">
        <div class="footer-left">
          <el-checkbox v-model="selectAllCurrent" @change="handleSelectAllCurrent">全选当前页</el-checkbox>
          <el-select v-model="batchAction" placeholder="批量操作" style="width: 150px" class="ml-2">
            <el-option label="批量下载" value="download" />
            <el-option label="批量重新生成" value="retry" />
            <el-option label="批量删除" value="remove" />
          </el-select>
          <el-button type="primary" plain class="ml-2" :disabled="!selectedIds.length" @click="handleBatch">执行</el-button>
          <span class="ml-3">已选择 {{ selectedIds.length }} 条数据</span>
          <span class="ml-3">共 {{ total }} 条</span>
        </div>
      </div>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>
  </div>
</template>

<script setup name="OpsReportExport" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import {
  downloadExportFile,
  getExportOptions,
  listExportTasks,
  removeExportTasks,
  retryExportTasks
} from '@/api/ops/report/export';
import type { ExportTaskRow } from '@/api/ops/report/export/types';

const { loading, withLoading } = useLoading(true);
const rows = ref<ExportTaskRow[]>([]);
const total = ref(0);
const quickRange = ref('day');
const timeRange = ref<string[]>([]);
const selectedIds = ref<number[]>([]);
const selectAllCurrent = ref(false);
const batchAction = ref('');

const queryParams = reactive({
  module: '',
  status: undefined as number | undefined,
  pageNum: 1,
  pageSize: 10
});

const options = reactive({
  modules: [] as Array<{ label: string; value: string }>,
  statuses: [] as Array<{ label: string; value: string }>
});

type TagType = 'primary' | 'success' | 'info' | 'warning' | 'danger';

const statusText = (status: number) =>
  ({ 0: '待生成', 1: '生成中', 2: '已完成', 3: '已失败', 9: '已删除' } as Record<number, string>)[status] || '—';
const statusTagType = (status: number): TagType =>
  ({ 0: 'info', 1: 'primary', 2: 'success', 3: 'danger', 9: 'info' } as Record<number, TagType>)[status] || 'info';

const formatSize = (bytes?: number) => {
  if (!bytes || bytes <= 0) {
    return '—';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const pad = (num: number) => String(num).padStart(2, '0');
const dayText = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const handleQuickRange = () => {
  const now = new Date();
  if (quickRange.value === 'week') {
    const day = now.getDay() === 0 ? 7 : now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day + 1);
    timeRange.value = [`${dayText(start)} 00:00:00`, `${dayText(now)} 23:59:59`];
  } else if (quickRange.value === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    timeRange.value = [`${dayText(start)} 00:00:00`, `${dayText(now)} 23:59:59`];
  } else {
    timeRange.value = [`${dayText(now)} 00:00:00`, `${dayText(now)} 23:59:59`];
  }
  queryParams.pageNum = 1;
  getList();
};

const getList = async () => {
  await withLoading(async () => {
    const res = await listExportTasks({
      ...queryParams,
      startTime: timeRange.value?.[0],
      endTime: timeRange.value?.[1]
    });
    rows.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
    selectAllCurrent.value = false;
  });
};

const handleQuery = () => {
  queryParams.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.module = '';
  queryParams.status = undefined;
  quickRange.value = 'day';
  handleQuickRange();
};

const handleSelectionChange = (selection: ExportTaskRow[]) => {
  selectedIds.value = selection.map((row) => Number(row.taskId));
};

const handleSelectAllCurrent = (checked: boolean) => {
  selectedIds.value = checked ? rows.value.map((row) => Number(row.taskId)) : [];
};

/** 保存二进制响应为文件（导出文件走鉴权接口，不能用裸 <a href> 以免丢 token） */
const saveBlob = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const handleDownload = async (row: ExportTaskRow) => {
  try {
    const res = await downloadExportFile(Number(row.taskId));
    const blob = res.data as unknown as Blob;
    if (blob && blob.type && blob.type.includes('json')) {
      modal.msgError('下载失败：文件已过期或被清理，请重新生成');
      return;
    }
    saveBlob(blob, String(row.fileName || `export_${row.taskId}.csv`));
    if (row.filePassword) {
      modal.msgSuccess(`文件密码：${row.filePassword}（敏感资料下载后记得删除）`);
    }
  } catch (e) {
    modal.msgError('下载失败，请稍后重试');
  }
};

const handleRetry = async (row: ExportTaskRow) => {
  await modal.confirm('确认按原条件重新生成该导出任务？');
  const res = await retryExportTasks([Number(row.taskId)]);
  modal.msgSuccess(`已重新生成 ${res.data} 个任务`);
  getList();
};

const handleDelete = async (row: ExportTaskRow) => {
  await modal.confirm(`确认删除导出任务 ${row.taskNo}？已生成的物理文件将在保留期到期后清理。`);
  await removeExportTasks([Number(row.taskId)]);
  modal.msgSuccess('删除成功');
  getList();
};

const handleBatch = async () => {
  if (!batchAction.value) {
    modal.msgWarning('请选择批量操作类型');
    return;
  }
  if (!selectedIds.value.length) {
    modal.msgWarning('请选择需要操作的数据');
    return;
  }
  if (batchAction.value === 'remove') {
    await modal.confirm(`确认删除选中的 ${selectedIds.value.length} 个导出任务？`);
    await removeExportTasks(selectedIds.value);
    modal.msgSuccess('批量删除成功');
  } else if (batchAction.value === 'retry') {
    await modal.confirm(`确认重新生成选中的 ${selectedIds.value.length} 个失败任务？`);
    const res = await retryExportTasks(selectedIds.value);
    modal.msgSuccess(`已重新生成 ${res.data} 个任务`);
  } else {
    const targets = rows.value.filter((row) => selectedIds.value.includes(Number(row.taskId)) && row.status === 2);
    if (!targets.length) {
      modal.msgWarning('选中的任务中没有可下载的已完成任务');
      return;
    }
    for (const row of targets) {
      await handleDownload(row);
    }
  }
  getList();
};

onMounted(async () => {
  const res = await getExportOptions();
  options.modules = res.data?.modules || [];
  options.statuses = res.data?.statuses || [];
  handleQuickRange();
});
</script>
