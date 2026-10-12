<template>
  <div class="p-2 app-container system-region-access-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form" @submit.prevent>
        <el-form-item>
          <el-radio-group v-model="timeScope" @change="handleScopeChange">
            <el-radio-button value="day">日</el-radio-button>
            <el-radio-button value="week">周</el-radio-button>
            <el-radio-button value="month">月</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="国家/地区">
          <el-select
            v-model="queryParams.keyword"
            clearable
            filterable
            allow-create
            default-first-option
            placeholder="请选择或输入国家/地区"
            style="width: 200px"
          >
            <el-option v-for="item in countryOptions" :key="item" :label="item" :value="item" />
          </el-select>
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
        <el-form-item label="访问类型">
          <el-select v-model="queryParams.status" clearable placeholder="请选择访问类型" style="width: 140px">
            <el-option
              v-for="item in options.accessTypes"
              :key="item.value"
              :label="item.label"
              :value="Number(item.value)"
            />
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
            <h3>非经营地访问限制</h3>
            <p>共 {{ total }} 条记录；禁止访问后该国家/地区的用户将无法从对应入口进入站点。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['system:regionAccess:add']" type="primary" plain icon="Plus" @click="handleAdd">
              新增
            </el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" border :data="rows" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="国家/地区" prop="country" align="center" min-width="150" />
        <el-table-column label="站点名称" prop="siteName" align="center" width="120" />
        <el-table-column label="访问类型" align="center" width="110">
          <template #default="{ row }">
            <el-tag :type="row.accessType === 1 ? 'danger' : 'success'">{{ row.accessType === 1 ? '禁止' : '允许' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="访问权限" align="center" min-width="240">
          <template #default="{ row }">
            <el-checkbox :model-value="row.permDownload === 1" disabled>下载和推广站</el-checkbox>
            <el-checkbox :model-value="row.permApp === 1" disabled>APP/H5/WEB</el-checkbox>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" min-width="150" :show-overflow-tooltip="true" />
        <el-table-column label="操作人" prop="operatorId" align="center" width="100" />
        <el-table-column label="操作时间" align="center" width="170">
          <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="140" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['system:regionAccess:edit']" link type="primary" @click="handleUpdate(row)">修改</el-button>
            <el-button v-hasPermi="['system:regionAccess:remove']" link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="580px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="国家/地区" prop="country">
          <el-select
            v-model="form.country"
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入国家/地区"
            style="width: 100%"
          >
            <el-option v-for="item in countryOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="站点名称" prop="siteName">
          <el-select v-model="form.siteName" placeholder="选择站点" style="width: 100%">
            <el-option v-for="item in options.sites" :key="item.value" :label="item.label" :value="item.label" />
          </el-select>
        </el-form-item>
        <el-form-item label="访问类型" prop="accessType">
          <el-radio-group v-model="form.accessType">
            <el-radio :value="1">禁止</el-radio>
            <el-radio :value="2">允许</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="访问权限">
          <el-checkbox v-model="form.permDownload" :true-value="1" :false-value="0">下载和推广站</el-checkbox>
          <el-checkbox v-model="form.permApp" :true-value="1" :false-value="0">APP/H5/WEB</el-checkbox>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" maxlength="255" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="dialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="SystemRegionAccess" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import { useTimeScopeQuery } from '@/hooks/form/useTimeScopeQuery';
import modal from '@/plugins/modal';
import {
  addRegionAccess,
  delRegionAccess,
  getRegionAccessOptions,
  listRegionAccess,
  updateRegionAccess
} from '@/api/system/region-access';
import type { RegionAccessForm, RegionAccessQuery, RegionAccessVO } from '@/api/system/region-access/types';

const { loading, withLoading } = useLoading(true);
const { timeScope, dateRange, monthValue, applyScopeRange, handleScopeChange, buildTimeParams } = useTimeScopeQuery({
  defaultScope: 'month'
});

const rows = ref<RegionAccessVO[]>([]);
const total = ref(0);
const ids = ref<string[]>([]);
const dialog = reactive({ visible: false, title: '' });
const formRef = ref<ElFormInstance>();
const options = reactive<{
  sites: { value: string; label: string }[];
  accessTypes: { label: string; value: string }[];
}>({ sites: [], accessTypes: [] });

/** 国家/地区候选（截图现有 6 条 + 常见国家，允许自由输入以覆盖后续新增） */
const countryOptions = [
  '英国',
  '美国',
  '新加坡',
  '中国澳门特别行政区',
  '中国台湾省',
  '中国',
  '越南',
  '马来西亚',
  '泰国',
  '印度尼西亚',
  '菲律宾',
  '印度',
  '日本',
  '韩国',
  '澳大利亚'
];

const queryParams = ref<RegionAccessQuery>({ pageNum: 1, pageSize: 10 });
const form = ref<RegionAccessForm>({ accessType: 1, permDownload: 1, permApp: 1 });
const rules = {
  country: [{ required: true, message: '请选择国家/地区', trigger: 'change' }],
  siteName: [{ required: true, message: '请选择站点名称', trigger: 'change' }],
  accessType: [{ required: true, message: '请选择访问类型', trigger: 'change' }]
};

const fmt = (value?: string) => (value ? value.replace('T', ' ').slice(0, 19) : '—');

const getList = async () => {
  try {
    await withLoading(async () => {
      const res = await listRegionAccess({ ...queryParams.value, ...buildTimeParams() });
      rows.value = res.data?.rows ?? [];
      total.value = res.data?.total ?? 0;
    });
  } catch (error) {
    modal.msgError('列表加载失败，请稍后重试');
  }
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: queryParams.value.pageSize };
  applyScopeRange();
  getList();
};

const handleSelectionChange = (selection: RegionAccessVO[]) => {
  ids.value = selection.map(item => item.id);
};

const handleAdd = () => {
  form.value = { accessType: 1, permDownload: 1, permApp: 1 };
  dialog.title = '新增非经营地访问限制';
  dialog.visible = true;
};

const handleUpdate = (row: any) => {
  form.value = { ...row };
  dialog.title = '修改非经营地访问限制';
  dialog.visible = true;
};

const submitForm = async () => {
  await formRef.value?.validate();
  if (!form.value.permDownload && !form.value.permApp) {
    modal.msgWarning('访问权限至少勾选一项');
    return;
  }
  if (form.value.id) {
    await updateRegionAccess(form.value);
  } else {
    await addRegionAccess(form.value);
  }
  modal.msgSuccess('操作成功');
  dialog.visible = false;
  getList();
};

const handleDelete = async (row?: any) => {
  const delIds = row?.id ? [row.id] : ids.value;
  if (!delIds.length) {
    return;
  }
  await modal.confirm('确认删除所选访问限制吗？');
  await delRegionAccess(delIds);
  modal.msgSuccess('删除成功');
  getList();
};

onMounted(async () => {
  const res = await getRegionAccessOptions();
  options.sites = res.data?.sites ?? [];
  options.accessTypes = res.data?.accessTypes ?? [];
  applyScopeRange();
  getList();
});
</script>

<style scoped>
.system-region-access-page :deep(.el-checkbox) {
  margin-right: 10px;
}
</style>
