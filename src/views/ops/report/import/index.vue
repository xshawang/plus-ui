<template>
  <div class="p-2 app-container ops-report-import-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item>
          <el-radio-group v-model="quickRange" @change="handleQuickRange">
            <el-radio-button label="day">日</el-radio-button>
            <el-radio-button label="week">周</el-radio-button>
            <el-radio-button label="month">月</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="导入时间">
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
        <el-form-item label="所属模块">
          <el-select v-model="queryParams.module" clearable placeholder="全部模块" style="width: 160px">
            <el-option v-for="item in options.modules" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行状态">
          <el-select v-model="queryParams.status" clearable placeholder="全部状态" style="width: 150px">
            <el-option v-for="item in options.statuses" :key="item.value" :label="item.label" :value="Number(item.value)" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
        <el-form-item>
          <el-upload
            v-hasPermi="['ops:report:import:add']"
            :show-file-list="false"
            :http-request="handleUpload"
            accept=".csv,.xlsx,.xls"
          >
            <el-button type="primary" plain icon="Upload">上传导入文件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <el-table v-loading="loading" border :data="rows" empty-text="暂无数据" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="导入时间" prop="importedAt" align="center" width="180" />
        <el-table-column label="所属模块" prop="moduleName" align="center" width="110" />
        <el-table-column label="模块内容" prop="moduleContent" align="center" min-width="160" show-overflow-tooltip />
        <el-table-column label="文件名" prop="fileName" min-width="220" show-overflow-tooltip />
        <el-table-column label="文件大小" align="center" width="110">
          <template #default="{ row }">{{ formatSize(row.fileSize) }}</template>
        </el-table-column>
        <el-table-column label="文件自动删除时间" prop="autoDeleteAt" align="center" width="180" />
        <el-table-column label="执行状态" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="执行结果" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.resultSummary || '—' }}</span>
            <el-button v-if="row.failCount > 0" link type="primary" class="ml-2" @click="openResult(row)">查看失败明细</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="220" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['ops:report:import:execute']" :disabled="row.status !== 0" link type="primary" @click="handleExecute(row)">执行</el-button>
            <el-button v-hasPermi="['ops:report:import:download']" :disabled="!row.failCount" link type="success" @click="handleFailFile(row)">下载失败明细</el-button>
            <el-button v-hasPermi="['ops:report:import:remove']" link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作人" prop="operatorName" align="center" width="110" />
        <el-table-column label="操作时间" prop="updatedAt" align="center" width="180" />
      </el-table>

      <div class="table-footer-bar">
        <div class="footer-left">
          <el-checkbox v-model="selectAllCurrent" @change="handleSelectAllCurrent">全选当前页</el-checkbox>
          <el-select v-model="batchAction" placeholder="批量操作" style="width: 150px" class="ml-2">
            <el-option label="批量执行" value="execute" />
            <el-option label="批量下载失败明细" value="fail-file" />
            <el-option label="批量删除" value="remove" />
          </el-select>
          <el-button type="primary" plain class="ml-2" :disabled="!selectedIds.length" @click="handleBatch">执行</el-button>
          <span class="ml-3">已选择 {{ selectedIds.length }} 条数据</span>
          <span class="ml-3">共 {{ total }} 条</span>
        </div>
      </div>
      <pagination v-show="total > 0" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" :total="total" @pagination="getList" />
    </el-card>

    <!-- 执行结果详情（含失败明细） -->
    <el-dialog v-model="resultVisible" title="执行结果" width="760px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="任务号">{{ result.taskNo }}</el-descriptions-item>
        <el-descriptions-item label="执行状态">{{ statusText(result.status) }}</el-descriptions-item>
        <el-descriptions-item label="总行数">{{ result.totalCount }}</el-descriptions-item>
        <el-descriptions-item label="成功/失败">{{ result.successCount }} / {{ result.failCount }}</el-descriptions-item>
        <el-descriptions-item label="执行结果" :span="2">{{ result.resultSummary || '—' }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="result.failures" border class="mt-3" empty-text="无失败明细" max-height="320">
        <el-table-column label="行号" prop="row" align="center" width="80" />
        <el-table-column label="字段" prop="column" align="center" width="140" />
        <el-table-column label="错误原因" prop="message" min-width="260" show-overflow-tooltip />
        <el-table-column label="原始值" prop="value" min-width="140" show-overflow-tooltip />
      </el-table>
      <template #footer>
        <el-button @click="resultVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="OpsReportImport" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import {
  downloadImportFailFile,
  executeImportTask,
  getImportOptions,
  getImportResult,
  listImportTasks,
  removeImportTasks,
  uploadImportFile
} from '@/api/ops/report/import';
import type { ImportResult, ImportTaskRow } from '@/api/ops/report/import/types';

const { loading, withLoading } = useLoading(true);
const rows = ref<ImportTaskRow[]>([]);
const total = ref(0);
const quickRange = ref('day');
const timeRange = ref<string[]>([]);
const selectedIds = ref<number[]>([]);
const selectAllCurrent = ref(false);
const batchAction = ref('');
const resultVisible = ref(false);
const result = ref<ImportResult>({
  taskId: 0,
  taskNo: '',
  status: 0,
  totalCount: 0,
  successCount: 0,
  failCount: 0,
  resultSummary: '',
  failures: [],
  failTotal: 0
});

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
  ({ 0: '待执行', 1: '执行中', 2: '执行成功', 3: '执行失败', 4: '部分成功' } as Record<number, string>)[status] || '—';
const statusTagType = (status: number): TagType =>
  ({ 0: 'info', 1: 'primary', 2: 'success', 3: 'danger', 4: 'warning' } as Record<number, TagType>)[status] || 'info';

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
    const res = await listImportTasks({
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

const handleSelectionChange = (selection: ImportTaskRow[]) => {
  selectedIds.value = selection.map((row) => Number(row.taskId));
};

const handleSelectAllCurrent = (checked: boolean) => {
  selectedIds.value = checked ? rows.value.map((row) => Number(row.taskId)) : [];
};

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

/** 上传受理：成功即落「待执行」任务；同一文件按 md5 幂等拦截并提示 */
const handleUpload = async (options2: any) => {
  const form = new FormData();
  form.append('file', options2.file);
  form.append('module', queryParams.module || 'system');
  form.append('content', options2.file?.name || '批量导入');
  const res = await uploadImportFile(form);
  if (res.data?.duplicated) {
    modal.msgWarning('该文件已导入过，请勿重复导入');
  } else {
    modal.msgSuccess('上传成功，请点击「执行」完成导入');
  }
  getList();
};

const handleExecute = async (row: ImportTaskRow) => {
  await modal.confirm(`确认执行导入任务 ${row.taskNo}？`);
  const res = await executeImportTask(Number(row.taskId));
  modal.msgSuccess(res.data?.resultSummary || '执行完成');
  getList();
};

const openResult = async (row: ImportTaskRow) => {
  const res = await getImportResult(Number(row.taskId), 1, 50);
  result.value = res.data as ImportResult;
  resultVisible.value = true;
};

const handleFailFile = async (row: ImportTaskRow) => {
  const res = await downloadImportFailFile(Number(row.taskId));
  saveBlob(res.data as unknown as Blob, `导入失败明细_${row.taskNo}.csv`);
};

const handleDelete = async (row: ImportTaskRow) => {
  await modal.confirm(`确认删除导入任务 ${row.taskNo}？`);
  await removeImportTasks([Number(row.taskId)]);
  modal.msgSuccess('删除成功');
  getList();
};

const handleBatch = async () => {
  if (!batchAction.value) {
    modal.msgWarning('请选择批量操作类型');
    return;
  }
  if (batchAction.value === 'remove') {
    await modal.confirm(`确认删除选中的 ${selectedIds.value.length} 个导入任务？`);
    await removeImportTasks(selectedIds.value);
    modal.msgSuccess('批量删除成功');
  } else if (batchAction.value === 'execute') {
    const targets = rows.value.filter((row) => selectedIds.value.includes(Number(row.taskId)) && row.status === 0);
    if (!targets.length) {
      modal.msgWarning('选中的任务中没有「待执行」任务');
      return;
    }
    for (const row of targets) {
      await executeImportTask(Number(row.taskId));
    }
    modal.msgSuccess(`已执行 ${targets.length} 个任务`);
  } else {
    const targets = rows.value.filter((row) => selectedIds.value.includes(Number(row.taskId)) && row.failCount > 0);
    if (!targets.length) {
      modal.msgWarning('选中的任务中没有失败明细可下载');
      return;
    }
    for (const row of targets) {
      await handleFailFile(row);
    }
  }
  getList();
};

onMounted(async () => {
  const res = await getImportOptions();
  options.modules = res.data?.modules || [];
  options.statuses = res.data?.statuses || [];
  handleQuickRange();
});
</script>
