<template>
  <div class="p-2 app-container system-admin-account-page">
    <el-card shadow="hover" class="search-panel">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="账号管理" name="account" />
        <el-tab-pane label="权限管理" name="permission" />
      </el-tabs>

      <div v-if="activeTab === 'account'" class="account-layout">
        <aside class="dept-tree">
          <div class="dept-tree__title">全部部门</div>
          <el-tree
            ref="deptTreeRef"
            :data="deptTree"
            :props="{ label: 'label', children: 'children' }"
            node-key="id"
            default-expand-all
            highlight-current
            @node-click="handleDeptClick"
          />
        </aside>
        <div class="account-main">
          <el-form :inline="true" class="query-form" @submit.prevent>
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
              <el-input
                v-model="queryParams.userName"
                placeholder="多个后台账号需用空格或换行分隔"
                clearable
                style="width: 220px"
              />
            </el-form-item>
            <el-form-item label="创建来源">
              <el-select v-model="queryParams.createSource" clearable placeholder="创建来源" style="width: 150px">
                <el-option v-for="item in options.createSources" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="账号状态">
              <el-select v-model="queryParams.status" clearable placeholder="账号状态" style="width: 130px">
                <el-option label="正常" value="0" />
                <el-option label="冻结" value="1" />
              </el-select>
            </el-form-item>
            <el-form-item label="在线状态">
              <el-select v-model="queryParams.onlineStatus" clearable placeholder="在线状态" style="width: 130px">
                <el-option label="在线" :value="1" />
                <el-option label="离线" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item label="最后登录方式">
              <el-select v-model="queryParams.lastLoginMethod" clearable placeholder="登录方式" style="width: 150px">
                <el-option v-for="item in options.loginMethods" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>{{ activeTab === 'account' ? '账号管理' : '权限管理' }}</h3>
            <p>
              {{ activeTab === 'account' ? `共 ${total} 个后台账号` : `共 ${permissionRows.length} 个角色` }}
            </p>
          </div>
          <div class="toolbar-actions">
            <template v-if="activeTab === 'account'">
              <el-button v-hasPermi="['system:adminAccount:wg']" type="primary" plain icon="ChatDotRound" @click="handleWgLogin">
                登录WG群发系统
              </el-button>
              <el-button v-hasPermi="['system:adminAccount:add']" type="success" plain icon="Plus" @click="handleAdd">
                新增
              </el-button>
            </template>
          </div>
        </div>
      </template>

      <el-table v-if="activeTab === 'account'" v-loading="loading" border :data="rows">
        <el-table-column label="后台账号" prop="userName" width="140" :show-overflow-tooltip="true" />
        <el-table-column label="后台昵称" prop="nickName" width="140" :show-overflow-tooltip="true" />
        <el-table-column label="创建来源" prop="createSource" width="160" :show-overflow-tooltip="true" />
        <el-table-column label="站点权限" align="center" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.stationLabel" size="small">{{ row.stationLabel }}</el-tag>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="所属部门" prop="deptName" width="120" :show-overflow-tooltip="true" />
        <el-table-column label="账号状态" align="center" width="100">
          <template #default="{ row }">
            <span :class="row.status === '0' ? 'text-green-600' : 'text-red-500'">
              {{ row.status === '0' ? '正常' : '冻结' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="在线状态" align="center" width="100">
          <template #default="{ row }">
            <span :class="row.online ? 'text-green-600' : 'text-gray-400'">{{ row.online ? '在线' : '离线' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="120" :show-overflow-tooltip="true" />
        <el-table-column label="最后登录方式" prop="lastLoginMethod" align="center" width="130" />
        <el-table-column label="最后登录ip" align="center" width="200" :show-overflow-tooltip="true">
          <template #default="{ row }">IP：{{ row.loginIp || '—' }}</template>
        </el-table-column>
        <el-table-column label="最后登录时间" align="center" width="170">
          <template #default="{ row }">{{ fmt(row.loginDate) }}</template>
        </el-table-column>
        <el-table-column label="操作人" prop="operatorName" align="center" width="110" />
        <el-table-column label="操作时间" align="center" width="170">
          <template #default="{ row }">{{ fmt(row.operateTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button
              v-hasPermi="['system:adminAccount:freeze']"
              link
              type="warning"
              @click="handleFreeze(row)"
            >
              {{ row.status === '0' ? '冻结' : '解冻' }}
            </el-button>
            <el-button v-hasPermi="['system:adminAccount:log']" link type="primary" @click="openLogs(row)">日志</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-table v-else v-loading="loading" border :data="permissionRows">
        <el-table-column label="角色ID" prop="roleId" width="200" />
        <el-table-column label="角色名称" prop="roleName" width="180" />
        <el-table-column label="权限字符" prop="roleKey" width="180" />
        <el-table-column label="显示顺序" prop="roleSort" align="center" width="100" />
        <el-table-column label="数据范围" prop="dataScope" align="center" width="140" />
        <el-table-column label="已授权菜单数" prop="menuCount" align="center" width="130" />
        <el-table-column label="状态" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '0' ? 'success' : 'info'">{{ row.status === '0' ? '正常' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" width="170">
          <template #default="{ row }">{{ fmt(row.createTime) }}</template>
        </el-table-column>
      </el-table>

      <pagination
        v-if="activeTab === 'account'"
        v-show="total > 0"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        :total="total"
        @pagination="getList"
      />
    </el-card>

    <!-- 详情 -->
    <el-dialog v-model="detail.visible" title="账号详情" width="720px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="后台账号">{{ detail.account?.userName }}</el-descriptions-item>
        <el-descriptions-item label="后台昵称">{{ detail.account?.nickName }}</el-descriptions-item>
        <el-descriptions-item label="创建来源">{{ detail.account?.createSource || '—' }}</el-descriptions-item>
        <el-descriptions-item label="站点权限">{{ detail.account?.stationLabel || '—' }}</el-descriptions-item>
        <el-descriptions-item label="所属部门">{{ detail.account?.deptName || '—' }}</el-descriptions-item>
        <el-descriptions-item label="账号状态">{{ detail.account?.status === '0' ? '正常' : '冻结' }}</el-descriptions-item>
        <el-descriptions-item label="在线状态">{{ detail.account?.online ? '在线' : '离线' }}</el-descriptions-item>
        <el-descriptions-item label="最后登录方式">{{ detail.account?.lastLoginMethod || '—' }}</el-descriptions-item>
        <el-descriptions-item label="角色" :span="2">
          <el-tag v-for="role in detail.roles" :key="role.roleId" class="mr-1">{{ role.roleName }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detail.account?.remark || '—' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detail.visible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 日志 -->
    <el-dialog v-model="logDialog.visible" title="账号日志" width="860px" append-to-body>
      <el-tabs v-model="logTab">
        <el-tab-pane label="登录日志" name="login">
          <el-table :data="logDialog.loginLogs" border max-height="360">
            <el-table-column label="登录IP" prop="ipaddr" width="150" />
            <el-table-column label="地区" prop="loginLocation" width="150" />
            <el-table-column label="浏览器" prop="browserBrand" width="150" />
            <el-table-column label="登录网址" prop="loginDomain" width="150" />
            <el-table-column label="结果" width="90">
              <template #default="{ row }">{{ row.status === '0' ? '成功' : '失败' }}</template>
            </el-table-column>
            <el-table-column label="登录时间" width="170">
              <template #default="{ row }">{{ fmt(row.loginTime) }}</template>
            </el-table-column>
            <el-table-column label="最后登出时间" width="170">
              <template #default="{ row }">{{ fmt(row.logoutTime) }}</template>
            </el-table-column>
            <el-table-column label="在线时长(秒)" prop="onlineDuration" width="110" />
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="操作日志" name="oper">
          <el-table :data="logDialog.operLogs" border max-height="360">
            <el-table-column label="模块" prop="title" width="180" />
            <el-table-column label="操作行为" prop="operBehavior" min-width="200" :show-overflow-tooltip="true" />
            <el-table-column label="IP" prop="operIp" width="140" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">{{ row.status === 0 ? '成功' : '失败' }}</template>
            </el-table-column>
            <el-table-column label="操作时间" width="170">
              <template #default="{ row }">{{ fmt(row.operTime) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="logDialog.visible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="SystemAdminAccount" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import { useTimeScopeQuery } from '@/hooks/form/useTimeScopeQuery';
import modal from '@/plugins/modal';
import router from '@/router';
import {
  changeAdminAccountStatus,
  getAdminAccountDeptTree,
  getAdminAccountDetail,
  getAdminAccountLogs,
  getAdminAccountOptions,
  getWgUrl,
  listAdminAccount,
  listAdminPermission
} from '@/api/system/admin-account';
import type { AdminAccountOptions, AdminAccountQuery, AdminAccountVO, PermissionRow } from '@/api/system/admin-account/types';

const { loading, withLoading } = useLoading(true);
const { timeScope, dateRange, monthValue, applyScopeRange, handleScopeChange, buildTimeParams } = useTimeScopeQuery({
  defaultScope: 'month'
});

const activeTab = ref('account');
const rows = ref<AdminAccountVO[]>([]);
const total = ref(0);
const permissionRows = ref<PermissionRow[]>([]);
const deptTree = ref<any[]>([]);
const deptTreeRef = ref<InstanceType<any>>();
const logTab = ref('login');
const options = reactive<AdminAccountOptions>({ sites: [], createSources: [], loginMethods: [] });
const detail = reactive<{ visible: boolean; account?: AdminAccountVO; roles: any[] }>({
  visible: false,
  roles: []
});
const logDialog = reactive<{ visible: boolean; loginLogs: any[]; operLogs: any[] }>({
  visible: false,
  loginLogs: [],
  operLogs: []
});

const queryParams = ref<AdminAccountQuery>({ pageNum: 1, pageSize: 10 });

const fmt = (value?: string) => (value ? value.replace('T', ' ').slice(0, 19) : '—');

const getList = async () => {
  try {
    await withLoading(async () => {
      const res = await listAdminAccount({ ...queryParams.value, ...buildTimeParams() });
      rows.value = res.data?.rows ?? [];
      total.value = res.data?.total ?? 0;
    });
  } catch (error) {
    modal.msgError('账号列表加载失败，请稍后重试');
  }
};

const getPermissions = async () => {
  await withLoading(async () => {
    const res = await listAdminPermission();
    permissionRows.value = res.data ?? [];
  });
};

const handleTabChange = () => {
  if (activeTab.value === 'account') {
    getList();
  } else {
    getPermissions();
  }
};

const handleDeptClick = (node: any) => {
  queryParams.value.deptId = node.id ?? node.deptId;
  handleQuery();
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: queryParams.value.pageSize };
  deptTreeRef.value?.setCurrentKey?.(undefined);
  applyScopeRange();
  getList();
};

const handleAdd = () => {
  // 新增账号沿用框架「用户管理」的表单（含密码/角色/岗位校验），保证只有一套写入口
  router.push('/system/user');
  modal.msgWarning('新增后台账号请在「系统管理 → 用户管理」中完成（本页只做账号与权限总览）');
};

const handleWgLogin = async () => {
  const res = await getWgUrl();
  const url = res.data?.url;
  if (!url) {
    modal.msgWarning('未配置 WG 群发系统地址（sys_config: system.admin.wg-url）');
    return;
  }
  window.open(url, '_blank');
};

/**
 * el-table 插槽回传的行类型由 Element Plus 推断为 DefaultRow（弱类型），
 * 这里统一用宽松类型接收后在方法内收敛为业务字段，避免为每个页面维护类型断言。
 */
type AccountRow = Record<string, any>;

const openDetail = async (row: AccountRow) => {
  const res = await getAdminAccountDetail(row.userId);
  detail.account = res.data?.account as AdminAccountVO;
  detail.roles = res.data?.roles ?? [];
  detail.visible = true;
};

const openLogs = async (row: AccountRow) => {
  const res = await getAdminAccountLogs(row.userId);
  logDialog.loginLogs = res.data?.loginLogs ?? [];
  logDialog.operLogs = res.data?.operLogs ?? [];
  logTab.value = 'login';
  logDialog.visible = true;
};

const handleFreeze = async (row: AccountRow) => {
  const next = row.status === '0' ? '1' : '0';
  await modal.confirm(next === '1' ? `确认冻结账号「${row.userName}」吗？` : `确认解冻账号「${row.userName}」吗？`);
  await changeAdminAccountStatus({ userId: row.userId, status: next });
  modal.msgSuccess('操作成功');
  getList();
};

onMounted(async () => {
  const [optionRes, deptRes] = await Promise.all([getAdminAccountOptions(), getAdminAccountDeptTree()]);
  Object.assign(options, optionRes.data ?? {});
  deptTree.value = deptRes.data ?? [];
  applyScopeRange();
  getList();
});
</script>

<style scoped>
.account-layout {
  display: flex;
  gap: 12px;
}

.dept-tree {
  width: 200px;
  border-right: 1px solid var(--el-border-color-lighter);
  padding-right: 8px;
}

.dept-tree__title {
  font-weight: 600;
  margin-bottom: 8px;
}

.account-main {
  flex: 1;
}
</style>
