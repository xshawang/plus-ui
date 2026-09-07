<template>
  <div class="p-2 app-container ops-avatar-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="分类">
          <el-select v-model="queryParams.category" placeholder="头像分类" clearable style="width: 130px">
            <el-option label="男" :value="1" />
            <el-option label="女" :value="2" />
            <el-option label="活动" :value="3" />
            <el-option label="自定义" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 110px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="queryParams.keyword" placeholder="编码/名称" clearable @keyup.enter="handleQuery" />
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
            <h3>头像库</h3>
            <p>共 {{ total }} 个头像，支持分类默认头像与启停。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['ops:avatar:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
            <el-button
              v-hasPermi="['ops:avatar:edit']"
              type="primary"
              plain
              icon="Edit"
              :disabled="single"
              @click="handleUpdate()"
            >修改</el-button>
            <el-button
              v-hasPermi="['ops:avatar:remove']"
              type="danger"
              plain
              icon="Delete"
              :disabled="multiple"
              @click="handleDelete()"
            >删除</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="预览" align="center" width="80">
          <template #default="{ row }">
            <el-avatar :size="42" :src="row.imageUrl || undefined">{{ row.avatarCode?.slice(0, 2) }}</el-avatar>
          </template>
        </el-table-column>
        <el-table-column label="编码" prop="avatarCode" width="130" />
        <el-table-column label="名称" prop="avatarName" min-width="140" />
        <el-table-column label="分类" align="center" width="90">
          <template #default="{ row }">{{ categoryText(row.category) }}</template>
        </el-table-column>
        <el-table-column label="默认" align="center" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.isDefault === 1" type="danger">默认</el-tag>
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="排序" prop="sortOrder" align="center" width="70" />
        <el-table-column label="创建时间" align="center" width="170">
          <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleUpdate(row)">编辑</el-button>
            <el-button link type="warning" @click="handleDefault(row)">{{ row.isDefault === 1 ? '取消默认' : '设默认' }}</el-button>
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
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="620px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="90px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="头像编码" prop="avatarCode">
              <el-input v-model="form.avatarCode" placeholder="如 Avatar27" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="头像名称">
              <el-input v-model="form.avatarName" placeholder="请输入名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类">
              <el-select v-model="form.category" style="width: 100%">
                <el-option label="男" :value="1" />
                <el-option label="女" :value="2" />
                <el-option label="活动" :value="3" />
                <el-option label="自定义" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="form.sortOrder" :min="0" :max="9999" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="图片地址" prop="imageUrl">
              <el-input v-model="form.imageUrl" placeholder="图片 URL" />
            </el-form-item>
          </el-col>
          <el-col v-if="form.imageUrl" :span="24" class="mb-2">
            <el-image :src="form.imageUrl" fit="cover" style="width: 64px; height: 64px" />
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

<script setup name="OpsAvatar" lang="ts">
import { onMounted, reactive, ref, toRefs } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { addAvatar, delAvatar, listAvatar, updateAvatar, updateAvatarDefault, updateAvatarStatus } from '@/api/ops/avatar';
import type { AvatarForm, AvatarQuery, AvatarVO } from '@/api/ops/avatar/types';

const { loading, withLoading } = useLoading(true);
const rows = ref<AvatarVO[]>([]);
const total = ref(0);
const ids = ref<number[]>([]);
const single = ref(true);
const multiple = ref(true);
const dialog = reactive({ visible: false, title: '' });

const data = reactive<{ queryParams: AvatarQuery; form: AvatarForm }>({
  queryParams: { pageNum: 1, pageSize: 10 },
  form: { category: 1, sortOrder: 100 }
});
const { queryParams, form } = toRefs(data);

const fmt = (value?: string) => (value ? value.replace('T', ' ').slice(0, 19) : '—');
const categoryText = (c?: number) => (c === 1 ? '男' : c === 2 ? '女' : c === 3 ? '活动' : c === 4 ? '自定义' : '—');

const getList = async () => {
  await withLoading(async () => {
    const res = await listAvatar(queryParams.value);
    rows.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};
const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: 10 } as AvatarQuery;
  handleQuery();
};
const handleSelectionChange = (selection: AvatarVO[]) => {
  ids.value = selection.map(item => item.avatarId);
  single.value = selection.length !== 1;
  multiple.value = selection.length === 0;
};
const resetForm = () => {
  form.value = { category: 1, sortOrder: 100 } as AvatarForm;
};
const handleAdd = () => {
  resetForm();
  dialog.title = '新增头像';
  dialog.visible = true;
};
const handleUpdate = (row?: AvatarVO) => {
  if (row) {
    form.value = {
      avatarId: row.avatarId,
      avatarCode: row.avatarCode,
      avatarName: row.avatarName,
      imageUrl: row.imageUrl,
      category: row.category,
      sortOrder: row.sortOrder
    };
  }
  dialog.title = '编辑头像';
  dialog.visible = true;
};
const submitForm = async () => {
  if (!form.value.avatarCode || !form.value.imageUrl) {
    modal.msgWarning('头像编码与图片地址必填');
    return;
  }
  if (form.value.avatarId) {
    await updateAvatar(form.value);
  } else {
    await addAvatar(form.value);
  }
  modal.msgSuccess('操作成功');
  dialog.visible = false;
  getList();
};
const handleDefault = async (row: AvatarVO) => {
  await updateAvatarDefault({ id: row.avatarId, value: row.isDefault === 1 ? 0 : 1 });
  modal.msgSuccess('操作成功');
  getList();
};
const handleStatus = async (row: AvatarVO, value: number) => {
  await updateAvatarStatus({ id: row.avatarId, value });
  modal.msgSuccess('操作成功');
  getList();
};
const handleDelete = async (row?: AvatarVO) => {
  const delIds = row ? [row.avatarId] : ids.value;
  if (!delIds.length) return;
  await modal.confirm('确认删除选中的头像吗？');
  await delAvatar(delIds.join(','));
  modal.msgSuccess('删除成功');
  getList();
};
onMounted(() => getList());
</script>
