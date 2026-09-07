<template>
  <div class="p-2 app-container ops-domain-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>域名管理</h3>
            <p>配置玩家侧访问域名，支持主备切换与手动健康检查。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['ops:domain:check']" type="warning" plain icon="Aim" :loading="checking" @click="handleCheck">
              健康检查
            </el-button>
            <el-button v-hasPermi="['ops:domain:add']" type="primary" plain icon="Plus" @click="handleAdd">新增域名</el-button>
          </div>
        </div>
      </template>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="域名列表" name="list">
          <el-form :inline="true" class="query-form mb-2">
            <el-form-item label="类型">
              <el-select v-model="queryParams.domainType" clearable placeholder="域名类型" style="width: 140px">
                <el-option v-for="(label, key) in domainTypeMap" :key="key" :label="label" :value="Number(key)" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="queryParams.status" clearable style="width: 110px">
                <el-option label="启用" :value="1" />
                <el-option label="禁用" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
          <el-table v-loading="loading" border :data="rows">
            <el-table-column label="域名" prop="domainName" min-width="200" />
            <el-table-column label="类型" align="center" width="110">
              <template #default="{ row }">{{ domainTypeMap[row.domainType] || row.domainType }}</template>
            </el-table-column>
            <el-table-column label="区域" prop="regionCode" align="center" width="90" />
            <el-table-column label="主域名" align="center" width="90">
              <template #default="{ row }">
                <el-tag v-if="row.isPrimary === 1" type="danger">主</el-tag>
                <span v-else class="text-gray-400">备</span>
              </template>
            </el-table-column>
            <el-table-column label="权重" prop="weight" align="center" width="70" />
            <el-table-column label="策略" align="center" width="110">
              <template #default="{ row }">{{ row.switchMode === 2 ? '自动检查' : '手动' }}</template>
            </el-table-column>
            <el-table-column label="状态" align="center" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="250" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleUpdate(row)">编辑</el-button>
                <el-button v-if="row.isPrimary !== 1" link type="warning" @click="handleSwitch(row)">设为主</el-button>
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
        <el-tab-pane label="健康日志" name="health">
          <el-form :inline="true" class="query-form mb-2">
            <el-form-item label="结果">
              <el-select v-model="healthQuery.checkResult" clearable style="width: 110px">
                <el-option label="成功" :value="1" />
                <el-option label="失败" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleHealthQuery">搜索</el-button>
            </el-form-item>
          </el-form>
          <el-table v-loading="healthLoading" border :data="healthRows">
            <el-table-column label="域名" prop="domainName" min-width="200" />
            <el-table-column label="结果" align="center" width="90">
              <template #default="{ row }">
                <el-tag :type="row.checkResult === 1 ? 'success' : 'danger'">{{ row.checkResult === 1 ? '成功' : '失败' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="HTTP" prop="httpCode" align="center" width="90" />
            <el-table-column label="延迟(ms)" prop="latencyMs" align="center" width="100" />
            <el-table-column label="失败原因" prop="errorMsg" min-width="180" :show-overflow-tooltip="true" />
            <el-table-column label="检查时间" align="center" width="180">
              <template #default="{ row }">{{ fmt(row.checkedAt) }}</template>
            </el-table-column>
          </el-table>
          <pagination
            v-show="healthTotal > 0"
            v-model:page="healthQuery.pageNum"
            v-model:limit="healthQuery.pageSize"
            :total="healthTotal"
            @pagination="getHealthList"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="640px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="90px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="域名" prop="domainName">
              <el-input v-model="form.domainName" placeholder="如 play.go88.tg（不带协议）" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="类型">
              <el-select v-model="form.domainType" style="width: 100%">
                <el-option v-for="(label, key) in domainTypeMap" :key="key" :label="label" :value="Number(key)" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="区域">
              <el-select v-model="form.regionCode" style="width: 100%">
                <el-option label="global" value="global" />
                <el-option label="sea" value="sea" />
                <el-option label="vn" value="vn" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="权重">
              <el-input-number v-model="form.weight" :min="1" :max="10000" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="切换策略">
              <el-select v-model="form.switchMode" style="width: 100%">
                <el-option label="手动" :value="1" />
                <el-option label="健康检查自动" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="健康检查路径">
              <el-input v-model="form.healthCheckPath" placeholder="/" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设为主域名">
              <el-switch v-model="primaryFlag" />
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

<script setup name="OpsDomain" lang="ts">
import { onMounted, reactive, ref, toRefs } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import {
  addDomain,
  checkDomain,
  delDomain,
  listDomain,
  listDomainHealth,
  switchDomainPrimary,
  updateDomain,
  updateDomainStatus
} from '@/api/ops/domain';
import type { DomainForm, DomainHealthQuery, DomainHealthVO, DomainQuery, DomainVO } from '@/api/ops/domain/types';

const domainTypeMap: Record<number, string> = {
  1: '玩家H5',
  2: 'API/HTTP',
  3: 'WS网关',
  4: '下载',
  5: '支付回调',
  6: '管理后台'
};

const activeTab = ref('list');
const rows = ref<DomainVO[]>([]);
const total = ref(0);
const healthRows = ref<DomainHealthVO[]>([]);
const healthTotal = ref(0);
const dialog = reactive({ visible: false, title: '' });
const primaryFlag = ref(false);
const checking = ref(false);
const { loading, withLoading } = useLoading(true);
const { loading: healthLoading, withLoading: withHealthLoading } = useLoading(true);

const data = reactive<{ queryParams: DomainQuery; healthQuery: DomainHealthQuery; form: DomainForm }>({
  queryParams: { pageNum: 1, pageSize: 10 },
  healthQuery: { pageNum: 1, pageSize: 10 },
  form: { domainType: 1, regionCode: 'global', weight: 100, healthCheckPath: '/', switchMode: 1 }
});
const { queryParams, healthQuery, form } = toRefs(data);

const fmt = (value?: string) => (value ? value.replace('T', ' ').slice(0, 19) : '—');

const getList = async () => {
  await withLoading(async () => {
    const res = await listDomain(queryParams.value);
    rows.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};
const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: 10 } as DomainQuery;
  handleQuery();
};
const getHealthList = async () => {
  await withHealthLoading(async () => {
    const res = await listDomainHealth(healthQuery.value);
    healthRows.value = res.data?.rows || [];
    healthTotal.value = res.data?.total || 0;
  });
};
const handleHealthQuery = () => {
  healthQuery.value.pageNum = 1;
  getHealthList();
};
const handleCheck = async () => {
  checking.value = true;
  try {
    const res = await checkDomain();
    modal.msgSuccess('已检查域名：' + (res.data || []).join(', '));
    if (activeTab.value === 'health') getHealthList();
  } finally {
    checking.value = false;
  }
};
const handleAdd = () => {
  form.value = { domainType: 1, regionCode: 'global', weight: 100, healthCheckPath: '/', switchMode: 1 } as DomainForm;
  primaryFlag.value = false;
  dialog.title = '新增域名';
  dialog.visible = true;
};
const handleUpdate = (row: DomainVO) => {
  form.value = {
    domainId: row.domainId,
    domainName: row.domainName,
    domainType: row.domainType,
    regionCode: row.regionCode,
    isPrimary: row.isPrimary,
    weight: row.weight,
    healthCheckPath: row.healthCheckPath,
    switchMode: row.switchMode,
    remark: row.remark
  };
  primaryFlag.value = row.isPrimary === 1;
  dialog.title = '编辑域名';
  dialog.visible = true;
};
const submitForm = async () => {
  if (!form.value.domainName) {
    modal.msgWarning('域名不能为空');
    return;
  }
  form.value.isPrimary = primaryFlag.value ? 1 : 0;
  if (form.value.domainId) {
    await updateDomain(form.value);
  } else {
    await addDomain(form.value);
  }
  modal.msgSuccess('操作成功');
  dialog.visible = false;
  getList();
};
const handleSwitch = async (row: DomainVO) => {
  await switchDomainPrimary({ id: row.domainId, value: 1 });
  modal.msgSuccess('已切换为主域名');
  getList();
};
const handleStatus = async (row: DomainVO, value: number) => {
  await updateDomainStatus({ id: row.domainId, value });
  modal.msgSuccess('操作成功');
  getList();
};
const handleDelete = async (row: DomainVO) => {
  await modal.confirm('确认删除该域名吗？');
  await delDomain(row.domainId);
  modal.msgSuccess('删除成功');
  getList();
};
onMounted(() => {
  getList();
  getHealthList();
});
</script>
