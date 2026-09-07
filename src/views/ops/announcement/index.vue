<template>
  <div class="p-2 app-container ops-announcement-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="类型">
          <el-select v-model="queryParams.announceType" placeholder="公告类型" clearable style="width: 140px">
            <el-option label="大厅公告栏" :value="1" />
            <el-option label="大厅弹窗" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="状态" clearable style="width: 120px">
            <el-option label="草稿" :value="0" />
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="queryParams.title" placeholder="请输入标题" clearable @keyup.enter="handleQuery" />
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
            <h3>大厅公告</h3>
            <p>共 {{ total }} 条记录，支持发布、置顶与启用/禁用。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['ops:announcement:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
            <el-button
              v-hasPermi="['ops:announcement:edit']"
              type="primary"
              plain
              icon="Edit"
              :disabled="single"
              @click="handleUpdate()"
            >修改</el-button>
            <el-button
              v-hasPermi="['ops:announcement:remove']"
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
        <el-table-column label="标题" prop="title" min-width="180" :show-overflow-tooltip="true" />
        <el-table-column label="类型" align="center" width="100">
          <template #default="{ row }">
            <el-tag :type="row.announceType === 1 ? 'primary' : 'warning'">
              {{ row.announceType === 1 ? '公告栏' : '弹窗' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="置顶" align="center" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.topFlag === 1" type="danger">置顶</el-tag>
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="90">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="语言" prop="languageCode" align="center" width="70" />
        <el-table-column label="生效时间" align="center" min-width="170">
          <template #default="{ row }">
            <span class="text-xs">{{ fmt(row.startAt) }} ~ {{ fmt(row.endAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" prop="publishedAt" align="center" width="170">
          <template #default="{ row }">{{ fmt(row.publishedAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleUpdate(row)">编辑</el-button>
            <el-button
              v-hasPermi="['ops:announcement:top']"
              link
              type="warning"
              @click="handleTop(row)"
            >{{ row.topFlag === 1 ? '取消置顶' : '置顶' }}</el-button>
            <el-button v-if="row.status !== 1" link type="success" @click="handlePublish(row)">发布</el-button>
            <el-button
              v-if="row.status === 1"
              v-hasPermi="['ops:announcement:status']"
              link
              type="info"
              @click="handleStatus(row, 2)"
            >禁用</el-button>
            <el-button v-if="row.status === 2" link type="success" @click="handleStatus(row, 1)">启用</el-button>
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

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="720px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="90px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="公告类型" prop="announceType">
              <el-select v-model="form.announceType" style="width: 100%">
                <el-option label="大厅公告栏" :value="1" />
                <el-option label="大厅弹窗" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="语言" prop="languageCode">
              <el-select v-model="form.languageCode" style="width: 100%">
                <el-option label="越南语" value="vi" />
                <el-option label="中文" value="zh" />
                <el-option label="英文" value="en" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="标题" prop="title">
              <el-input v-model="form.title" placeholder="请输入标题" maxlength="120" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="正文" prop="content">
              <el-input v-model="form.content" type="textarea" :rows="6" placeholder="正文内容，可包含 HTML" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生效开始">
              <el-date-picker
                v-model="form.startAt"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生效结束">
              <el-date-picker
                v-model="form.endAt"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="form.sortOrder" :min="0" :max="9999" />
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

<script setup name="OpsAnnouncement" lang="ts">
import { onMounted, reactive, ref, toRefs } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import {
  addAnnouncement,
  delAnnouncement,
  listAnnouncement,
  publishAnnouncement,
  updateAnnouncement,
  updateAnnouncementStatus,
  updateAnnouncementTop
} from '@/api/ops/announcement';
import type { AnnouncementForm, AnnouncementQuery, AnnouncementVO } from '@/api/ops/announcement/types';

const { loading, withLoading } = useLoading(true);
const rows = ref<AnnouncementVO[]>([]);
const total = ref(0);
const ids = ref<number[]>([]);
const single = ref(true);
const multiple = ref(true);
const dialog = reactive({ visible: false, title: '' });

const data = reactive<{ queryParams: AnnouncementQuery; form: AnnouncementForm }>({
  queryParams: { pageNum: 1, pageSize: 10, announceType: undefined, status: undefined, title: undefined },
  form: { announceType: 1, languageCode: 'vi', sortOrder: 100 }
});
const { queryParams, form } = toRefs(data);

const fmt = (value?: string) => (value ? value.replace('T', ' ').slice(0, 19) : '—');
const statusText = (s?: number) => (s === 0 ? '草稿' : s === 1 ? '启用' : s === 2 ? '禁用' : '—');
const statusType = (s?: number) => (s === 0 ? 'info' : s === 1 ? 'success' : 'danger');

const getList = async () => {
  await withLoading(async () => {
    const res = await listAnnouncement(queryParams.value);
    rows.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: 10 } as AnnouncementQuery;
  handleQuery();
};

const handleSelectionChange = (selection: AnnouncementVO[]) => {
  ids.value = selection.map(item => item.announcementId);
  single.value = selection.length !== 1;
  multiple.value = selection.length === 0;
};

const resetForm = () => {
  form.value = { announceType: 1, languageCode: 'vi', sortOrder: 100 } as AnnouncementForm;
};

const handleAdd = () => {
  resetForm();
  dialog.title = '新增公告';
  dialog.visible = true;
};

const handleUpdate = (row?: AnnouncementVO) => {
  if (row) {
    form.value = {
      announcementId: row.announcementId,
      announceType: row.announceType,
      title: row.title,
      content: row.content,
      languageCode: row.languageCode,
      startAt: row.startAt,
      endAt: row.endAt,
      sortOrder: row.sortOrder
    };
  } else if (ids.value.length === 1) {
    form.value = { announcementId: ids.value[0] } as AnnouncementForm;
  }
  dialog.title = '编辑公告';
  dialog.visible = true;
};

const submitForm = async () => {
  if (!form.value.title) {
    modal.msgWarning('请输入公告标题');
    return;
  }
  if (form.value.announcementId) {
    await updateAnnouncement(form.value);
  } else {
    await addAnnouncement(form.value);
  }
  modal.msgSuccess('操作成功');
  dialog.visible = false;
  getList();
};

const handlePublish = async (row: AnnouncementVO) => {
  await publishAnnouncement(row.announcementId);
  modal.msgSuccess('已发布');
  getList();
};

const handleTop = async (row: AnnouncementVO) => {
  await updateAnnouncementTop({ id: row.announcementId, value: row.topFlag === 1 ? 0 : 1 });
  modal.msgSuccess('操作成功');
  getList();
};

const handleStatus = async (row: AnnouncementVO, value: number) => {
  await updateAnnouncementStatus({ id: row.announcementId, value });
  modal.msgSuccess('操作成功');
  getList();
};

const handleDelete = async (row?: AnnouncementVO) => {
  const delIds = row ? [row.announcementId] : ids.value;
  if (!delIds.length) return;
  await modal.confirm('确认删除选中的公告吗？');
  await delAnnouncement(delIds.join(','));
  modal.msgSuccess('删除成功');
  getList();
};

onMounted(() => getList());
</script>
