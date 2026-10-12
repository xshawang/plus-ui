<template>
  <div class="p-2 app-container monitor-operlog-page">
    <div class="search-wrap">
      <el-card shadow="hover" class="search-panel" :class="{ 'is-collapsed': !showSearch }">
        <template #header>
          <div class="panel-heading search-panel-toggle" @click.stop="showSearch = !showSearch">
            <div>
              <span class="panel-kicker">Search Filters</span>
              <h3>筛选条件</h3>
            </div>
          </div>
        </template>
        <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="query-form">
          <el-form-item>
            <el-radio-group v-model="timeScope" @change="handleScopeChange">
              <el-radio-button value="day">日</el-radio-button>
              <el-radio-button value="week">周</el-radio-button>
              <el-radio-button value="month">月</el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="timeScope === 'month'">
            <el-date-picker v-model="monthValue" type="month" value-format="YYYY-MM" placeholder="选择月份" style="width: 150px" />
          </el-form-item>
          <el-form-item v-else>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              value-format="YYYY-MM-DD"
              range-separator="-"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              style="width: 260px"
            />
          </el-form-item>
          <el-form-item label="精准操作人">
            <el-input v-model="queryParams.operName" placeholder="请输入精准操作人" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="模块">
            <el-select v-model="queryParams.title" placeholder="请选择模块" clearable filterable style="width: 200px">
              <el-option v-for="item in moduleOptions" :key="item" :label="item" :value="item" />
            </el-select>
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
            <span class="panel-kicker">Operation Logs</span>
            <h3>操作日志</h3>
            <p>共 {{ total }} 条记录，支持类型过滤、详情查看、批量清空和导出。</p>
          </div>
          <div class="toolbar-actions">
            <el-button
              v-hasPermi="['monitor:operlog:remove']"
              type="danger"
              plain
              icon="Delete"
              :disabled="multiple"
              @click="handleDelete()"
            >
              删除
            </el-button>
            <el-button
              v-hasPermi="['monitor:operlog:remove']"
              type="danger"
              plain
              icon="WarnTriangleFilled"
              @click="handleClean"
            >
              清空
            </el-button>
            <el-button
              v-hasPermi="['monitor:operlog:export']"
              type="warning"
              plain
              icon="Download"
              @click="handleExport"
            >
              导出
            </el-button>
            <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList"></right-toolbar>
          </div>
        </div>
      </template>

      <el-table
        ref="operLogTableRef"
        v-loading="loading"
        :data="operlogList"
        class="data-table"
        border
        :default-sort="defaultSort"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="模块" align="center" prop="title" width="220" :show-overflow-tooltip="true" />
        <el-table-column label="操作内容" align="center" prop="operParam" min-width="240" :show-overflow-tooltip="true" />
        <el-table-column label="操作行为" align="center" prop="operBehavior" min-width="220" :show-overflow-tooltip="true" />
        <el-table-column label="IP" align="center" width="180" :show-overflow-tooltip="true">
          <template #default="scope">
            <div>{{ scope.row.operIp }}</div>
            <div class="text-gray-400">{{ scope.row.operLocation }}</div>
          </template>
        </el-table-column>
        <el-table-column label="traceId" align="center" prop="traceId" width="180" :show-overflow-tooltip="true" />
        <el-table-column label="浏览器品牌" align="center" prop="browserBrand" width="150" :show-overflow-tooltip="true" />
        <el-table-column label="操作系统" align="center" prop="os" width="140" :show-overflow-tooltip="true" />
        <el-table-column label="系统版本" align="center" prop="systemVersion" width="100" :show-overflow-tooltip="true" />
        <el-table-column label="设备号" align="center" prop="deviceNo" width="220" :show-overflow-tooltip="true" />
        <el-table-column label="设备指纹" align="center" prop="deviceFingerprint" width="220" :show-overflow-tooltip="true" />
        <el-table-column
          label="操作人"
          align="center"
          width="110"
          prop="operName"
          :show-overflow-tooltip="true"
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        />
        <el-table-column
          label="操作时间"
          align="center"
          prop="operTime"
          width="180"
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        >
          <template #default="scope">
            <span>{{ parseTime(scope.row.operTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作状态" align="center" prop="status" width="110">
          <template #default="scope">
            <dict-tag :options="sys_common_status" :value="scope.row.status" />
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="详细" placement="top">
              <el-button
                v-hasPermi="['monitor:operlog:query']"
                link
                type="primary"
                icon="View"
                @click="handleView(scope.row)"
              ></el-button>
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
    <!-- 操作日志详细 -->
    <OperInfoDialog ref="operInfoDialogRef" />
  </div>
</template>

<script setup name="Operlog" lang="ts">
import { list, delOperlog, cleanOperlog } from '@/api/monitor/operlog';
import { listModules } from '@/api/monitor/operlog';
import { OperLogForm, OperLogQuery, OperLogVO } from '@/api/monitor/operlog/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useTimeScopeQuery } from '@/hooks/form/useTimeScopeQuery';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useTableSelection } from '@/hooks/table/useTableSelection';
import { useTableSortQuery } from '@/hooks/table/useTableSortQuery';
import modal from '@/plugins/modal';
import { useDict } from '@/utils/dict';
import { download as requestDownload } from '@/utils/request';
import { parseTime, selectDictLabel } from '@/utils/ruoyi';
import OperInfoDialog from './operInfoDialog.vue';

const { sys_oper_type, sys_common_status, sys_device_type } = toRefs<any>(
  useDict('sys_oper_type', 'sys_common_status', 'sys_device_type')
);

const operlogList = ref<OperLogVO[]>([]);
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const total = ref(0);
/** 截图筛选区：「日 / 周 / 月」三段按钮联动默认时间区间（模块下拉候选来自后端 distinct title） */
const {
  timeScope,
  dateRange,
  monthValue,
  handleScopeChange: handleScopeChangeRaw,
  buildTimeParams,
  applyScopeRange
} = useTimeScopeQuery({ defaultScope: 'month' });
const moduleOptions = ref<string[]>([]);

const operLogTableRef = ref<ElTableInstance>();
const queryFormRef = ref<ElFormInstance>();

const data = reactive<PageData<OperLogForm, OperLogQuery>>({
  form: {
    operId: undefined,
    tenantId: undefined,
    title: '',
    businessType: 0,
    businessTypes: undefined,
    method: '',
    requestMethod: '',
    operatorType: 0,
    operName: '',
    userId: undefined,
    deptId: undefined,
    deptName: '',
    clientKey: '',
    deviceType: '',
    browser: '',
    os: '',
    operUrl: '',
    operIp: '',
    operLocation: '',
    operParam: '',
    jsonResult: '',
    status: 0,
    errorMsg: '',
    operTime: '',
    costTime: 0
  },
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    operIp: '',
    title: '',
    operName: '',
    userId: '',
    deptId: '',
    clientKey: '',
    deviceType: '',
    browser: '',
    os: '',
    businessType: '',
    status: '',
    orderByColumn: 'operTime',
    isAsc: 'descending'
  },
  rules: {}
});

const { queryParams, form } = toRefs(data);
const {
  ids,
  multiple,
  handleSelectionChange: handleTableSelectionChange
} = useTableSelection<OperLogVO>(item => item.operId);

/** 查询登录日志 */
const getList = async () => {
  await withLoading(async () => {
    // 时间区间以「日/周/月」联动结果为准（截图口径），不再走旧的 daterange 参数拼装
    const res = await list({ ...queryParams.value, ...buildTimeParams() });
    operlogList.value = res.data?.rows ?? [];
    total.value = res.data?.total ?? 0;
  });
};
/** 粒度切换：重置默认区间并按月/日周刷新列表 */
const handleScopeChange = () => {
  handleScopeChangeRaw();
  handleQuery();
};
const { defaultSort, handleSortChange, resetSort } = useTableSortQuery<OperLogQuery>({
  queryParams,
  tableRef: operLogTableRef,
  defaultSort: { prop: 'operTime', order: 'descending' },
  onSortChange: getList
});
/** 操作日志类型字典翻译 */
const typeFormat = (row: OperLogForm) => {
  return selectDictLabel(sys_oper_type.value, row.businessType);
};
/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};
const { resetQuery } = useSearchReset({
  queryFormRef,
  queryParams,
  pageNumKey: 'pageNum',
  resetExtras: () => {
    applyScopeRange();
  },
  afterReset: () => {
    resetSort();
  }
});
const handleSelectionChange = (selection: OperLogVO[]) => {
  handleTableSelectionChange(selection);
};

const operInfoDialogRef = ref<InstanceType<typeof OperInfoDialog>>();
/** 详细按钮操作 */
const handleView = (row: Partial<OperLogVO>) => {
  operInfoDialogRef.value.openDialog(row as OperLogForm);
};

/** 删除按钮操作 */
const handleDelete = async (row?: Partial<OperLogVO>) => {
  const operIds = row?.operId || ids.value;
  await modal.confirm('是否确认删除日志编号为"' + operIds + '"的数据项?');
  await delOperlog(operIds);
  await getList();
  modal.msgSuccess('删除成功');
};

/** 清空按钮操作 */
const handleClean = async () => {
  await modal.confirm('是否确认清空所有操作日志数据项?');
  await cleanOperlog();
  await getList();
  modal.msgSuccess('清空成功');
};

/** 导出按钮操作 */
const handleExport = () => {
  requestDownload(
    'monitor/operlog/export',
    {
      ...queryParams.value
    },
    `operlog_${new Date().getTime()}.xlsx`
  );
};
onMounted(() => {
  // 模块下拉候选：后端按 sys_oper_log.title 去重返回（与各控制器 @Log(title) 同源）
  listModules()
    .then(res => {
      moduleOptions.value = res.data ?? [];
    })
    .catch(() => {
      moduleOptions.value = [];
    });
  getList();
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.table-crud-page;
</style>
