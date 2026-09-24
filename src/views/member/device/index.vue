<template>
  <div class="p-2 app-container member-device-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="会员ID">
          <el-input v-model="queryParams.uid" placeholder="会员ID" clearable style="width: 150px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="会员账号">
          <el-input v-model="queryParams.loginName" placeholder="会员账号" clearable style="width: 150px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="设备号/指纹">
          <el-input v-model="queryParams.deviceKeyword" placeholder="设备号或设备指纹" clearable style="width: 220px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="信任设备">
          <el-select v-model="queryParams.isTrustDevice" placeholder="全部" clearable style="width: 110px">
            <el-option label="是" :value="1" />
            <el-option label="否" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户端">
          <el-select v-model="queryParams.clientType" placeholder="全部" clearable style="width: 120px">
            <el-option label="web" value="web" />
            <el-option label="app" value="app" />
            <el-option label="h5" value="h5" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>登录设备管理</h3>
            <p>已选择 {{ selectedIds.length }} 台设备，共 {{ total }} 条</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['member:device:edit']" plain :disabled="selectedIds.length === 0" @click="handleAction('TRUST')">批量信任</el-button>
            <el-button v-hasPermi="['member:device:edit']" plain :disabled="selectedIds.length === 0" @click="handleAction('UNTRUST')">批量解除</el-button>
            <el-button v-hasPermi="['member:device:edit']" type="danger" plain :disabled="selectedIds.length === 0" @click="handleAction('BLACKLIST')">
              批量拉黑
            </el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="45" />
        <el-table-column label="最近登录时间" prop="lastLoginAt" align="center" width="180" />
        <el-table-column label="会员ID" prop="uid" align="center" width="170" show-overflow-tooltip />
        <el-table-column label="会员账号" prop="loginName" align="center" min-width="120" show-overflow-tooltip />
        <el-table-column label="设备号" prop="deviceId" align="center" min-width="180" show-overflow-tooltip />
        <el-table-column label="设备指纹" prop="deviceFingerprint" align="center" min-width="200" show-overflow-tooltip />
        <el-table-column label="客户端" align="center" min-width="130">
          <template #default="{ row }">{{ row.clientType || '—' }} {{ row.appVersion ? '(' + row.appVersion + ')' : '' }}</template>
        </el-table-column>
        <el-table-column label="浏览器" align="center" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.browser ? row.browser + ' ' + (row.browserVersion || '') : '—' }}</template>
        </el-table-column>
        <el-table-column label="操作系统" align="center" min-width="130">
          <template #default="{ row }">{{ row.os || '—' }} {{ row.osVersion || '' }}</template>
        </el-table-column>
        <el-table-column label="设备品牌/型号" align="center" min-width="150">
          <template #default="{ row }">{{ (row.deviceBrand || '') + ' ' + (row.deviceModel || '') || '—' }}</template>
        </el-table-column>
        <el-table-column label="IP/归属地" align="center" min-width="170">
          <template #default="{ row }">
            <div>{{ row.lastLoginIp || '—' }}</div>
            <div class="text-gray-400 text-sm">{{ row.ipRegion || '—' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="使用次数" prop="useCount" align="center" width="100" />
        <el-table-column label="信任设备" align="center" width="110">
          <template #default="{ row }">
            <el-tag v-if="row.isTrustDevice === 1" type="success">是</el-tag>
            <el-tag v-else type="info">否</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.isTrustDevice !== 1" v-hasPermi="['member:device:edit']" link type="primary" @click="handleSingle('TRUST', row.id)">信任</el-button>
            <el-button v-else v-hasPermi="['member:device:edit']" link type="info" @click="handleSingle('UNTRUST', row.id)">解除</el-button>
            <el-button v-hasPermi="['member:device:edit']" link type="danger" @click="handleSingle('BLACKLIST', row.id)">拉黑</el-button>
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

    <el-dialog v-model="reasonDialog.visible" title="请输入处置原因" width="520px" append-to-body destroy-on-close>
      <el-input v-model="reasonDialog.reason" type="textarea" :rows="3" placeholder="将记入审计日志，建议写明依据" />
      <template #footer>
        <el-button type="primary" @click="submitReason">确 定</el-button>
        <el-button @click="reasonDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="MemberDevice" lang="ts">
import { onMounted, reactive, ref, toRefs } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { actionMemberDevice, listMemberDevice } from '@/api/member/device';
import type { MemberDeviceQuery, MemberDeviceVO } from '@/api/member/device/types';

type PageBody<T> = { rows?: T[]; total?: number };
type DataBody<T> = { data?: T };

const { loading, withLoading } = useLoading(true);
const rows = ref<MemberDeviceVO[]>([]);
const total = ref(0);
const selectedIds = ref<number[]>([]);

const data = reactive<{ queryParams: MemberDeviceQuery }>({
  queryParams: { pageNum: 1, pageSize: 10 }
});
const { queryParams } = toRefs(data);

/** 处置动作待提交上下文（原因弹窗确认后提交） */
const reasonDialog = reactive<{ visible: boolean; reason: string; action: string; id?: number }>({
  visible: false,
  reason: '',
  action: '',
  id: undefined
});

/** 二次确认：收敛 ElMessageBox 取消时的 reject，避免控制台报未捕获错误 */
const confirmed = async (content: string) => {
  try {
    await modal.confirm(content);
    return true;
  } catch {
    return false;
  }
};

const getList = async () => {
  await withLoading(async () => {
    const res = (await listMemberDevice(queryParams.value)) as unknown as PageBody<MemberDeviceVO>;
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  });
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: 10 };
  getList();
};

const handleSelectionChange = (selection: MemberDeviceVO[]) => {
  selectedIds.value = selection.map((item) => item.id);
};

const actionLabel = (action: string) => {
  if (action === 'TRUST') {
    return '信任设备';
  }
  if (action === 'UNTRUST') {
    return '解除信任';
  }
  return '拉黑设备';
};

/** 批量处置：先确认动作与数量，再补原因 */
const handleAction = async (action: string) => {
  if (selectedIds.value.length === 0) {
    return;
  }
  if (!(await confirmed(`确认对选中的 ${selectedIds.value.length} 台设备执行「${actionLabel(action)}」？`))) {
    return;
  }
  reasonDialog.action = action;
  reasonDialog.id = undefined;
  reasonDialog.reason = '';
  reasonDialog.visible = true;
};

const handleSingle = async (action: string, id: number) => {
  if (!(await confirmed(`确认对该设备执行「${actionLabel(action)}」？`))) {
    return;
  }
  reasonDialog.action = action;
  reasonDialog.id = id;
  reasonDialog.reason = '';
  reasonDialog.visible = true;
};

const submitReason = async () => {
  const payload = {
    action: reasonDialog.action,
    reason: reasonDialog.reason,
    id: reasonDialog.id,
    ids: reasonDialog.id ? undefined : selectedIds.value
  };
  const res = (await actionMemberDevice(payload)) as unknown as DataBody<number>;
  modal.msgSuccess(`处置完成（影响 ${res.data ?? 0} 条）`);
  reasonDialog.visible = false;
  selectedIds.value = [];
  await getList();
};

onMounted(() => getList());
</script>
