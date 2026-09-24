<template>
  <div class="p-2 app-container game-type-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading"><h3>类型管理</h3></div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['game:type:edit']" type="primary" plain icon="Plus" @click="openAdd">新增类型</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="币种" align="center" prop="currency" width="120" />
        <el-table-column label="类型名称" align="center" prop="typeName" width="120" />
        <el-table-column label="类型开关" align="center" width="110">
          <template #default="{ row }">
            <el-switch :model-value="row.typeStatus === 1" @change="v => switchField(row, 'typeStatus', v)" />
          </template>
        </el-table-column>
        <el-table-column label="并入到更多" align="center" width="120">
          <template #default="{ row }">
            <el-switch :model-value="row.mergeToMore === 1" @change="v => switchField(row, 'mergeToMore', v)" />
          </template>
        </el-table-column>
        <el-table-column label="类别" align="center" prop="category" width="110" />
        <el-table-column label="打开方式" align="center" width="110">
          <template #default="{ row }">{{ openModeText(row.openMode) }}</template>
        </el-table-column>
        <el-table-column label="icon" align="center" width="90">
          <template #default="{ row }">
            <el-image v-if="row.iconUrl" :src="row.iconUrl" style="width: 28px; height: 28px" />
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="链接地址" align="center" prop="linkUrl" min-width="140" />
        <el-table-column label="首页显示行数" align="center" prop="firstPageRows" width="130" />
        <el-table-column label="二级页面显示行数" align="center" prop="secondPageRows" width="150" />
        <el-table-column label="备注" align="center" prop="remark" min-width="100" />
        <el-table-column label="操作" align="center" width="160" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['game:type:edit']" link type="primary" @click="openEdit(row, true)">显示行数</el-button>
            <el-button v-hasPermi="['game:type:edit']" link type="primary" @click="openEdit(row, false)">修改</el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作时间" align="center" prop="updateTime" width="170" />
      </el-table>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="560px" append-to-body>
      <el-form ref="formRef" :model="form" label-width="140px">
        <el-form-item label="币种" prop="currency">
          <el-input v-model="form.currency" disabled />
        </el-form-item>
        <el-form-item label="类型名称" prop="typeName">
          <el-input v-model="form.typeName" placeholder="如 热门/电子/棋牌" />
        </el-form-item>
        <el-form-item label="类型编码" prop="typeCode">
          <el-input-number v-model="form.typeCode" :min="0" controls-position="right" />
        </el-form-item>
        <el-form-item label="类型开关">
          <el-switch v-model="form.typeStatus" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="并入到更多">
          <el-switch v-model="form.mergeToMore" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="打开方式">
          <el-select v-model="form.openMode" style="width: 100%">
            <el-option label="未设置" :value="0" />
            <el-option label="内嵌" :value="1" />
            <el-option label="外链" :value="2" />
            <el-option label="新窗口" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="链接地址">
          <el-input v-model="form.linkUrl" placeholder="外链类型必填" />
        </el-form-item>
        <el-form-item label="icon">
          <el-input v-model="form.iconUrl" placeholder="图片地址" />
        </el-form-item>
        <el-form-item label="首页显示行数">
          <el-input-number v-model="form.firstPageRows" :min="0" :max="50" controls-position="right" />
        </el-form-item>
        <el-form-item label="二级页面显示行数">
          <el-input-number v-model="form.secondPageRows" :min="0" :max="50" controls-position="right" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="dialog.loading" @click="submitForm">确 定</el-button>
        <el-button @click="dialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { listGameType, addGameType, updateGameType, switchGameTypeField } from '@/api/game/manage';

defineOptions({ name: 'GameType' });

const CURRENCY = 'VND1000:1';
const loading = ref(false);
const rows = ref<any[]>([]);
const dialog = reactive({ visible: false, title: '', loading: false });
const form = reactive<any>({ currency: CURRENCY });

const openModeText = (mode: number) => (['未设置', '内嵌', '外链', '新窗口'][mode] ?? '—');

async function getList() {
  loading.value = true;
  try {
    // FIX 2026-09-23：R<List> 接口需取 .data（原实现把包装对象当数组，表格渲染失败导致 v-loading 不消失）
    rows.value = ((await listGameType(CURRENCY)) as unknown as any)?.data ?? [];
  } finally {
    loading.value = false;
  }
}

function openAdd() {
  Object.keys(form).forEach((key) => delete form[key]);
  Object.assign(form, {
    currency: CURRENCY,
    typeStatus: 1,
    mergeToMore: 0,
    openMode: 0,
    firstPageRows: 6,
    secondPageRows: 10
  });
  dialog.title = '新增类型';
  dialog.visible = true;
}

function openEdit(row: any, onlyRows: boolean) {
  Object.assign(form, { ...row });
  dialog.title = onlyRows ? '显示行数' : '修改类型';
  dialog.visible = true;
}

async function submitForm() {
  if (!form.typeName) {
    ElMessage.warning('类型名称不能为空');
    return;
  }
  if (form.openMode === 2 && !form.linkUrl) {
    ElMessage.warning('外链类型必须填写链接地址');
    return;
  }
  dialog.loading = true;
  try {
    if (form.id) {
      await updateGameType(form);
    } else {
      await addGameType(form);
    }
    ElMessage.success('保存成功');
    dialog.visible = false;
    getList();
  } finally {
    dialog.loading = false;
  }
}

async function switchField(row: any, field: string, value: any) {
  await switchGameTypeField({ id: row.id, field, value: value ? 1 : 0 });
  row[field] = value ? 1 : 0;
  ElMessage.success('操作成功');
}

onMounted(getList);
</script>

<style scoped>
.toolbar-shell {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.table-heading h3 {
  margin: 0;
  font-size: 15px;
}
</style>
