<template>
  <div class="p-2 app-container system-currency-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form" @submit.prevent>
        <el-form-item label="币种">
          <el-input v-model="queryParams.keyword" placeholder="币种名称/代码/国家" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="币种类型">
          <el-select v-model="queryParams.value" clearable placeholder="全部类型" style="width: 140px">
            <el-option
              v-for="item in options.currencyTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="开关">
          <el-select v-model="switchFilter" clearable placeholder="全部" style="width: 150px">
            <el-option label="币种总开关-开" value="master:1" />
            <el-option label="币种总开关-关" value="master:0" />
            <el-option label="大厅展示开关-开" value="lobby:1" />
            <el-option label="大厅展示开关-关" value="lobby:0" />
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
            <h3>币种管理</h3>
            <p>
              共 {{ total }} 条记录；「大厅展示开关」关闭后新用户不可见，老用户不受影响。
            </p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['system:currency:add']" type="primary" plain icon="Plus" @click="handleAdd">
              新增币种
            </el-button>
            <el-button
              v-hasPermi="['system:currency:edit']"
              type="success"
              plain
              icon="Edit"
              :disabled="single"
              @click="handleUpdate(rows.find(item => item.currencyId === selectedId) as CurrencyVO)"
            >
              修改
            </el-button>
            <el-button
              v-hasPermi="['system:currency:remove']"
              type="danger"
              plain
              icon="Delete"
              :disabled="multiple"
              @click="handleDelete()"
            >
              删除
            </el-button>
          </div>
        </div>
      </template>

      <el-table v-loading="loading" border :data="rows" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="排序" align="center" width="110">
          <template #default="{ row }">
            <el-button v-hasPermi="['system:currency:top']" link type="primary" @click="handleTop(row)">
              {{ row.isTop === 1 ? '取消顶置' : '+顶置' }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="币种名称" prop="currencyName" min-width="120" :show-overflow-tooltip="true" />
        <el-table-column label="币种国家" prop="currencyCountry" align="center" width="110" />
        <el-table-column label="币种代码" prop="currencyCode" align="center" width="100" />
        <el-table-column label="币种图标" align="center" width="90">
          <template #default="{ row }">
            <el-avatar :size="26" shape="circle" :src="row.currencyIcon">{{ row.currencyCode?.slice(0, 1) }}</el-avatar>
          </template>
        </el-table-column>
        <el-table-column label="千分位符号" prop="thousandSep" align="center" width="100" />
        <el-table-column label="币种符号" prop="currencySymbol" align="center" width="90" />
        <el-table-column label="币种比例" prop="currencyRatio" align="center" width="100" />
        <el-table-column label="币种类别" prop="currencyType" align="center" width="100" />
        <el-table-column label="币种总开关" align="center" width="110">
          <template #default="{ row }">
            <el-switch
              :model-value="row.masterSwitch === 1"
              :disabled="!canSwitch()"
              @change="(value: boolean) => handleSwitch(row, 'master', value)"
            />
          </template>
        </el-table-column>
        <el-table-column label="大厅展示开关" align="center" width="130">
          <template #header>
            <div>
              大厅展示开关
              <el-tooltip
                content="若关闭已开启的币种，新用户不可见，老用户不受影响"
                placement="top"
              >
                <el-icon class="ml-1"><QuestionFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <template #default="{ row }">
            <el-switch
              :model-value="row.lobbySwitch === 1"
              :disabled="!canSwitch()"
              @change="(value: boolean) => handleSwitch(row, 'lobby', value)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作人" prop="operatorId" align="center" width="90" />
        <el-table-column label="操作时间" align="center" width="170">
          <template #default="{ row }">{{ fmt(row.updatedAt) }}</template>
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

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="620px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="币种名称" prop="currencyName">
              <el-input v-model="form.currencyName" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="币种代码" prop="currencyCode">
              <el-input v-model="form.currencyCode" maxlength="16" placeholder="如 VND" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="币种国家">
              <el-input v-model="form.currencyCountry" maxlength="64" placeholder="无归属国填 -" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="币种比例" prop="currencyRatio">
              <el-input v-model="form.currencyRatio" maxlength="32" placeholder="如 1000:1" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="币种类型" prop="currencyType">
              <el-select v-model="form.currencyType" style="width: 100%">
                <el-option
                  v-for="item in options.currencyTypes"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="千分位符号">
              <el-input v-model="form.thousandSep" maxlength="8" placeholder="默认 ." />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="币种符号">
              <el-input v-model="form.currencySymbol" maxlength="16" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序号">
              <el-input-number v-model="form.sortNo" :min="0" :max="9999" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="币种图标">
              <el-input v-model="form.currencyIcon" placeholder="图标 URL，如 /profile/currency/VND.png" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="币种总开关">
              <el-switch v-model="form.masterSwitch" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="大厅展示开关">
              <el-switch v-model="form.lobbySwitch" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" maxlength="255" />
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

<script setup name="SystemCurrency" lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { checkPermi } from '@/utils/permission';
import {
  addCurrency,
  delCurrency,
  getCurrency,
  getCurrencyOptions,
  listCurrency,
  switchCurrency,
  topCurrency,
  updateCurrency
} from '@/api/system/currency';
import type { CurrencyForm, CurrencyQuery, CurrencyVO } from '@/api/system/currency/types';

const { loading, withLoading } = useLoading(true);
const rows = ref<CurrencyVO[]>([]);
const total = ref(0);
const ids = ref<string[]>([]);
const selectedId = ref<string>();
const multiple = ref(true);
const single = ref(true);
const switchFilter = ref<string>();
const dialog = reactive({ visible: false, title: '' });
const formRef = ref<ElFormInstance>();
const options = reactive<{ currencyTypes: { label: string; value: string }[] }>({ currencyTypes: [] });

const queryParams = ref<CurrencyQuery>({ pageNum: 1, pageSize: 20 });
const form = ref<CurrencyForm>({});
const rules = {
  currencyName: [{ required: true, message: '请输入币种名称', trigger: 'blur' }],
  currencyCode: [{ required: true, message: '请输入币种代码', trigger: 'blur' }],
  currencyType: [{ required: true, message: '请选择币种类型', trigger: 'change' }],
  currencyRatio: [{ required: true, message: '请输入币种比例', trigger: 'blur' }]
};

/**
 * 开关权限判断：行内开关按权限「禁用」而不是隐藏，保持列结构稳定；
 * 口径与 v-hasPermi 指令同源（checkPermi 读同一个 userStore.permissions）。
 */
const canSwitch = () => checkPermi(['system:currency:status']);

const fmt = (value?: string) => (value ? value.replace('T', ' ').slice(0, 19) : '—');

const getList = async () => {
  try {
    await withLoading(async () => {
      const [field, value] = (switchFilter.value || '').split(':');
      const res = await listCurrency({
        ...queryParams.value,
        field: switchFilter.value ? field : queryParams.value.value ? 'currencyType' : undefined,
        value: switchFilter.value ? undefined : queryParams.value.value,
        status: switchFilter.value ? Number(value) : undefined
      });
      rows.value = res.data?.rows ?? [];
      total.value = res.data?.total ?? 0;
    });
  } catch (error) {
    modal.msgError('币种列表加载失败，请稍后重试');
  }
};

const loadOptions = async () => {
  const res = await getCurrencyOptions();
  options.currencyTypes = res.data?.currencyTypes ?? [];
  if (res.data?.pageSize) {
    queryParams.value.pageSize = res.data.pageSize;
  }
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: queryParams.value.pageSize };
  switchFilter.value = undefined;
  getList();
};

const handleSelectionChange = (selection: CurrencyVO[]) => {
  ids.value = selection.map(item => item.currencyId);
  selectedId.value = ids.value.length === 1 ? ids.value[0] : undefined;
  multiple.value = selection.length === 0;
  single.value = selection.length !== 1;
};

type CurrencyRow = Record<string, any>;

const handleAdd = () => {
  form.value = { masterSwitch: 0, lobbySwitch: 0, thousandSep: '.', currencyRatio: '1:1', sortNo: 0 };
  dialog.title = '新增币种';
  dialog.visible = true;
};

const handleUpdate = async (row: CurrencyRow) => {
  if (!row?.currencyId) {
    return;
  }
  const res = await getCurrency(row.currencyId);
  form.value = { ...(res.data as CurrencyForm) };
  dialog.title = '修改币种';
  dialog.visible = true;
};

const submitForm = async () => {
  await formRef.value?.validate();
  if (form.value.currencyId) {
    await updateCurrency(form.value);
  } else {
    await addCurrency(form.value);
  }
  modal.msgSuccess('操作成功');
  dialog.visible = false;
  getList();
};

const handleSwitch = async (row: CurrencyRow, field: string, value: boolean) => {
  try {
    await switchCurrency({ currencyId: row.currencyId, field, value: value ? 1 : 0 });
    modal.msgSuccess('已更新');
    getList();
  } catch (error) {
    modal.msgError('开关更新失败');
  }
};

const handleTop = async (row: CurrencyRow) => {
  await topCurrency({ currencyId: row.currencyId, value: row.isTop === 1 ? 0 : 1 });
  modal.msgSuccess(row.isTop === 1 ? '已取消顶置' : '已顶置');
  getList();
};

const handleDelete = async (row?: CurrencyRow) => {
  const delIds = row?.currencyId ? [row.currencyId] : ids.value;
  if (!delIds.length) {
    return;
  }
  await modal.confirm('确认删除所选币种吗？开关为开启状态的币种需先关闭才能删除。');
  await delCurrency(delIds.join(','));
  modal.msgSuccess('删除成功');
  getList();
};

onMounted(() => {
  loadOptions();
  getList();
});
</script>

<style scoped>
.system-currency-page :deep(.el-avatar) {
  background: #f5f7fa;
}
</style>
