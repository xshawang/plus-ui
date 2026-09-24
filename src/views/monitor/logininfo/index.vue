<template>
  <div class="p-2 app-container monitor-logininfo-page">
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
          <el-form-item label="后台账号">
            <el-input v-model="queryParams.userName" placeholder="请输入后台账号" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="结果">
            <el-select v-model="queryParams.status" placeholder="请选择结果" clearable style="width: 130px">
              <el-option v-for="dict in sys_common_status" :key="dict.value" :label="dict.label" :value="dict.value" />
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
            <span class="panel-kicker">Access Logs</span>
            <h3>登录日志</h3>
            <p>共 {{ total }} 条记录，支持排序、批量清理、导出和账号解锁。</p>
          </div>
          <div class="toolbar-actions">
            <el-button
              v-hasPermi="['monitor:logininfo:remove']"
              type="danger"
              plain
              icon="Delete"
              :disabled="multiple"
              @click="handleDelete()"
            >
              删除
            </el-button>
            <el-button v-hasPermi="['monitor:logininfo:remove']" type="danger" plain icon="Delete" @click="handleClean">
              清空
            </el-button>
            <el-button
              v-hasPermi="['monitor:logininfo:unlock']"
              type="primary"
              plain
              icon="Unlock"
              :disabled="single"
              @click="handleUnlock"
            >
              解锁
            </el-button>
            <el-button
              v-hasPermi="['monitor:logininfo:export']"
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
        ref="loginInfoTableRef"
        v-loading="loading"
        :data="loginInfoList"
        class="data-table"
        :default-sort="defaultSort"
        border
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column
          label="后台账号"
          align="center"
          prop="userName"
          width="130"
          :show-overflow-tooltip="true"
          sortable="custom"
          :sort-orders="['descending', 'ascending']"
        />
        <el-table-column label="登入时间/登录IP/地区" align="center" width="220">
          <template #default="scope">
            <div>{{ parseTime(scope.row.loginTime) }}</div>
            <div class="text-gray-400">{{ scope.row.ipaddr }}</div>
            <div class="text-gray-400">{{ scope.row.loginLocation }}</div>
          </template>
        </el-table-column>
        <el-table-column label="结果" align="center" prop="status" width="90">
          <template #default="scope">
            <span :class="scope.row.status === '0' ? 'text-green-600' : 'text-red-500'">
              {{ scope.row.status === '0' ? '成功' : '失败' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="最后登出时间/最后登出IP/地区" align="center" width="230">
          <template #default="scope">
            <div>{{ scope.row.logoutTime ? parseTime(scope.row.logoutTime) : '—' }}</div>
            <div class="text-gray-400">{{ scope.row.logoutIp || '—' }}</div>
            <div class="text-gray-400">{{ scope.row.logoutLocation || '—' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="在线时长(时)" align="center" width="130">
          <template #default="scope">{{ onlineHours(scope.row.onlineDuration) }}</template>
        </el-table-column>
        <el-table-column label="登录网址" align="center" prop="loginDomain" width="150" :show-overflow-tooltip="true" />
        <el-table-column label="浏览器品牌" align="center" prop="browserBrand" width="150" :show-overflow-tooltip="true" />
        <el-table-column label="操作系统" align="center" prop="os" width="130" :show-overflow-tooltip="true" />
        <el-table-column label="系统版本" align="center" prop="systemVersion" width="100" :show-overflow-tooltip="true" />
        <el-table-column label="设备号" align="center" prop="deviceNo" width="220" :show-overflow-tooltip="true" />
        <el-table-column label="设备指纹" align="center" prop="deviceFingerprint" width="220" :show-overflow-tooltip="true" />
      </el-table>

      <pagination
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>
  </div>
</template>

<script setup name="LoginInfo" lang="ts">
import { list, delLoginInfo, cleanLoginInfo, unlockLoginInfo } from '@/api/monitor/logininfo';
import { LoginInfoQuery, LoginInfoVO } from '@/api/monitor/logininfo/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useTimeScopeQuery } from '@/hooks/form/useTimeScopeQuery';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useSearchToggle } from '@/hooks/form/useSearchToggle';
import { useTableSelection } from '@/hooks/table/useTableSelection';
import { useTableSortQuery } from '@/hooks/table/useTableSortQuery';
import modal from '@/plugins/modal';
import { useDict } from '@/utils/dict';
import { download as requestDownload } from '@/utils/request';
import { parseTime } from '@/utils/ruoyi';

const { sys_device_type } = toRefs<any>(useDict('sys_device_type'));
const { sys_common_status } = toRefs<any>(useDict('sys_common_status'));

const loginInfoList = ref<LoginInfoVO[]>([]);
const { loading, withLoading } = useLoading(true);
const { showSearch } = useSearchToggle();
const total = ref(0);
/** 截图筛选区：「登入时间」支持 日 / 周 / 月 三段按钮联动默认区间 */
const {
  timeScope,
  dateRange,
  monthValue,
  handleScopeChange: handleScopeChangeRaw,
  buildTimeParams,
  applyScopeRange
} = useTimeScopeQuery({ defaultScope: 'day' });

/** 在线时长（秒 → 时，保留 2 位小数；无登出记录显示 —） */
const onlineHours = (seconds?: number) => {
  if (!seconds || seconds <= 0) {
    return '—';
  }
  return (seconds / 3600).toFixed(2);
};

const queryFormRef = ref<ElFormInstance>();
const loginInfoTableRef = ref<ElTableInstance>();
// 查询参数
const queryParams = ref<LoginInfoQuery>({
  pageNum: 1,
  pageSize: 10,
  ipaddr: '',
  userName: '',
  status: '',
  orderByColumn: 'loginTime',
  isAsc: 'descending'
});
const {
  ids,
  selectedRows,
  single,
  multiple,
  handleSelectionChange: handleTableSelectionChange
} = useTableSelection<LoginInfoVO>(item => item.infoId);
const selectName = computed(() => selectedRows.value.map(item => item.userName));

/** 查询登录日志列表 */
const getList = async () => {
  await withLoading(async () => {
    const res = await list({ ...queryParams.value, ...buildTimeParams() });
    loginInfoList.value = res.data?.rows ?? [];
    total.value = res.data?.total ?? 0;
  });
};
/** 粒度切换：重置默认区间并刷新 */
const handleScopeChange = () => {
  handleScopeChangeRaw();
  handleQuery();
};
const { defaultSort, handleSortChange, resetSort } = useTableSortQuery<LoginInfoQuery>({
  queryParams,
  tableRef: loginInfoTableRef,
  defaultSort: { prop: 'loginTime', order: 'descending' },
  onSortChange: getList
});
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
const handleSelectionChange = (selection: LoginInfoVO[]) => {
  handleTableSelectionChange(selection);
};
/** 删除按钮操作 */
const handleDelete = async (row?: LoginInfoVO) => {
  const infoIds = row?.infoId || ids.value;
  await modal.confirm('是否确认删除访问编号为"' + infoIds + '"的数据项?');
  await delLoginInfo(infoIds);
  await getList();
  modal.msgSuccess('删除成功');
};
/** 清空按钮操作 */
const handleClean = async () => {
  await modal.confirm('是否确认清空所有登录日志数据项?');
  await cleanLoginInfo();
  await getList();
  modal.msgSuccess('清空成功');
};
/** 解锁按钮操作 */
const handleUnlock = async () => {
  const username = selectName.value;
  await modal.confirm('是否确认解锁用户"' + username + '"数据项?');
  await unlockLoginInfo(username);
  modal.msgSuccess('用户' + username + '解锁成功');
};
/** 导出按钮操作 */
const handleExport = () => {
  requestDownload(
    'monitor/loginInfo/export',
    {
      ...queryParams.value
    },
    `logininfo_${new Date().getTime()}.xlsx`
  );
};

onMounted(() => {
  getList();
});
</script>

<style lang="scss" scoped>
@use '@/assets/styles/components/page-shell' as pageShell;

@include pageShell.table-crud-page;
</style>
