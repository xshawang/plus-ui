<template>
  <div class="p-2 app-container ops-apppack-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>App 包管理</h3>
            <p>维护客户端安装包版本、发布状态与强更白名单。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['ops:app-pack:add']" type="primary" plain icon="Plus" @click="handleAdd">新增版本</el-button>
          </div>
        </div>
      </template>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="版本列表" name="list">
          <el-form :inline="true" class="query-form mb-2">
            <el-form-item label="平台">
              <el-select v-model="queryParams.appPlatform" clearable style="width: 110px">
                <el-option label="Android" :value="1" />
                <el-option label="iOS" :value="2" />
                <el-option label="H5" :value="3" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="queryParams.status" clearable style="width: 110px">
                <el-option label="草稿" :value="0" />
                <el-option label="已发布" :value="1" />
                <el-option label="已下线" :value="2" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
              <el-button icon="Refresh" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-form>
          <el-table v-loading="loading" border :data="rows">
            <el-table-column label="平台" align="center" width="90">
              <template #default="{ row }">{{ platformText(row.appPlatform) }}</template>
            </el-table-column>
            <el-table-column label="版本号" prop="versionCode" width="130" />
            <el-table-column label="版本名" prop="versionName" min-width="110" />
            <el-table-column label="强制更新" align="center" width="90">
              <template #default="{ row }">
                <el-tag v-if="row.forceUpdate === 1" type="danger">强制</el-tag>
                <el-tag v-else type="info">可选</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="文件" align="center" min-width="140">
              <template #default="{ row }">
                <div v-if="row.fileName">{{ row.fileName }}</div>
                <span v-else class="text-gray-400">—</span>
              </template>
            </el-table-column>
            <el-table-column label="大小" align="right" width="100">
              <template #default="{ row }">{{ fmtSize(row.fileSize) }}</template>
            </el-table-column>
            <el-table-column label="状态" align="center" width="90">
              <template #default="{ row }">
                <el-tag :type="versionStatusType(row.status)">{{ versionStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="发布时间" align="center" width="170">
              <template #default="{ row }">{{ fmt(row.publishAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="230" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleUpdate(row)">编辑</el-button>
                <el-button v-if="row.status === 0 || row.status === 2" link type="success" @click="handlePublish(row)">发布</el-button>
                <el-button v-if="row.status === 1" link type="warning" @click="handleOffline(row)">下线</el-button>
                <el-button v-if="row.status === 0" link type="danger" @click="handleDelete(row)">删除</el-button>
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
        <el-tab-pane label="强更白名单" name="whitelist">
          <div class="mb-2">
            <el-button v-hasPermi="['ops:app-pack:whitelist']" type="primary" plain icon="Plus" @click="whiteDialog.visible = true">
              添加白名单
            </el-button>
            <el-button
              v-hasPermi="['ops:app-pack:whitelist']"
              type="danger"
              plain
              icon="Delete"
              :disabled="whiteMultiple"
              @click="handleWhiteDelete()"
            >删除</el-button>
          </div>
          <el-table v-loading="whiteLoading" border :data="whiteRows" @selection-change="handleWhiteSelection">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column label="UID" prop="uid" width="180" />
            <el-table-column label="版本号" prop="versionCode" width="150" />
            <el-table-column label="原因" prop="reason" min-width="200" />
            <el-table-column label="创建时间" align="center" width="170">
              <template #default="{ row }">{{ fmt(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="90">
              <template #default="{ row }">
                <el-button link type="danger" @click="handleWhiteDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination
            v-show="whiteTotal > 0"
            v-model:page="whiteQuery.pageNum"
            v-model:limit="whiteQuery.pageSize"
            :total="whiteTotal"
            @pagination="getWhiteList"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="680px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="110px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="平台" prop="appPlatform">
              <el-select v-model="form.appPlatform" style="width: 100%">
                <el-option label="Android" :value="1" />
                <el-option label="iOS" :value="2" />
                <el-option label="H5" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="版本号" prop="versionCode">
              <el-input v-model="form.versionCode" placeholder="如 2.6.2" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="版本名称" prop="versionName">
              <el-input v-model="form.versionName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="强制更新">
              <el-switch v-model="forceUpdateFlag" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="文件名">
              <el-input v-model="form.fileName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="文件大小">
              <el-input-number v-model="form.fileSize" :min="0" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="MD5">
              <el-input v-model="form.fileMd5" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="下载站ID">
              <el-input-number v-model="form.downloadSiteId" :min="0" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="下载地址">
              <el-input v-model="form.updateUrl" placeholder="包下载 URL" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="更新说明">
              <el-input v-model="form.updateDesc" type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="策略JSON">
              <el-input v-model="form.updateStrategyJson" type="textarea" :rows="2" placeholder='可选，如 {"grayRatio":0.1}' />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="dialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="whiteDialog.visible" title="添加强更白名单" width="520px" append-to-body destroy-on-close>
      <el-form :model="whiteForm" label-width="90px">
        <el-form-item label="UID" prop="uid">
          <el-input-number v-model="whiteForm.uid" :min="1" :controls="false" style="width: 100%" />
        </el-form-item>
        <el-form-item label="版本号" prop="versionCode">
          <el-input v-model="whiteForm.versionCode" placeholder="免强更版本号" />
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="whiteForm.reason" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitWhite">确 定</el-button>
        <el-button @click="whiteDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="OpsAppPack" lang="ts">
import { onMounted, reactive, ref, toRefs } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import {
  addAppVersion,
  addWhitelist,
  delAppVersion,
  delWhitelist,
  listAppVersion,
  listWhitelist,
  offlineAppVersion,
  publishAppVersion,
  updateAppVersion
} from '@/api/ops/app-pack';
import type { AppVersionForm, AppVersionQuery, AppVersionVO, WhitelistForm, WhitelistQuery, WhitelistVO } from '@/api/ops/app-pack/types';

const activeTab = ref('list');
const { loading, withLoading } = useLoading(true);
const { loading: whiteLoading, withLoading: withWhiteLoading } = useLoading(true);
const rows = ref<AppVersionVO[]>([]);
const total = ref(0);
const whiteRows = ref<WhitelistVO[]>([]);
const whiteTotal = ref(0);
const whiteIds = ref<number[]>([]);
const whiteMultiple = ref(true);
const isEdit = ref(false);
const forceUpdateFlag = ref(false);
const dialog = reactive({ visible: false, title: '' });
const whiteDialog = reactive({ visible: false });

const data = reactive<{
  queryParams: AppVersionQuery;
  whiteQuery: WhitelistQuery;
  form: AppVersionForm;
  whiteForm: WhitelistForm;
}>({
  queryParams: { pageNum: 1, pageSize: 10 },
  whiteQuery: { pageNum: 1, pageSize: 10 },
  form: { appPlatform: 1, forceUpdate: 0, downloadSiteId: 0 },
  whiteForm: {}
});
const { queryParams, whiteQuery, form, whiteForm } = toRefs(data);

const platformText = (p?: number) => (p === 1 ? 'Android' : p === 2 ? 'iOS' : p === 3 ? 'H5' : '—');
const versionStatusText = (s?: number) => (s === 0 ? '草稿' : s === 1 ? '已发布' : s === 2 ? '已下线' : '—');
const versionStatusType = (s?: number) => (s === 0 ? 'info' : s === 1 ? 'success' : 'danger');
const fmt = (value?: string) => (value ? value.replace('T', ' ').slice(0, 19) : '—');
const fmtSize = (size?: number) => {
  if (!size) return '—';
  if (size > 1024 * 1024 * 1024) return (size / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  if (size > 1024 * 1024) return (size / 1024 / 1024).toFixed(1) + ' MB';
  return (size / 1024).toFixed(0) + ' KB';
};

const getList = async () => {
  await withLoading(async () => {
    const res = await listAppVersion(queryParams.value);
    rows.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};
const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: 10 } as AppVersionQuery;
  handleQuery();
};
const getWhiteList = async () => {
  await withWhiteLoading(async () => {
    const res = await listWhitelist(whiteQuery.value);
    whiteRows.value = res.data?.rows || [];
    whiteTotal.value = res.data?.total || 0;
  });
};
const handleWhiteSelection = (selection: WhitelistVO[]) => {
  whiteIds.value = selection.map(item => item.id);
  whiteMultiple.value = selection.length === 0;
};
const handleAdd = () => {
  isEdit.value = false;
  forceUpdateFlag.value = false;
  form.value = { appPlatform: 1, forceUpdate: 0, downloadSiteId: 0 } as AppVersionForm;
  dialog.title = '新增版本';
  dialog.visible = true;
};
const handleUpdate = (row: AppVersionVO) => {
  isEdit.value = true;
  forceUpdateFlag.value = row.forceUpdate === 1;
  form.value = {
    versionId: row.versionId,
    appPlatform: row.appPlatform,
    versionCode: row.versionCode,
    versionName: row.versionName,
    updateUrl: row.updateUrl,
    updateDesc: row.updateDesc,
    fileName: row.fileName,
    fileSize: row.fileSize,
    fileMd5: row.fileMd5,
    downloadSiteId: row.downloadSiteId,
    updateStrategyJson: row.updateStrategyJson
  };
  dialog.title = '编辑版本';
  dialog.visible = true;
};
const submitForm = async () => {
  if (!form.value.versionCode || !form.value.versionName) {
    modal.msgWarning('版本号与版本名称必填');
    return;
  }
  form.value.forceUpdate = forceUpdateFlag.value ? 1 : 0;
  if (isEdit.value) {
    await updateAppVersion(form.value);
  } else {
    await addAppVersion(form.value);
  }
  modal.msgSuccess('操作成功');
  dialog.visible = false;
  getList();
};
const handlePublish = async (row: AppVersionVO) => {
  await publishAppVersion(row.versionId);
  modal.msgSuccess('已发布');
  getList();
};
const handleOffline = async (row: AppVersionVO) => {
  await offlineAppVersion(row.versionId);
  modal.msgSuccess('已下线');
  getList();
};
const handleDelete = async (row?: AppVersionVO) => {
  if (!row) return;
  await modal.confirm('仅草稿可删除，确认删除该版本吗？');
  await delAppVersion(row.versionId);
  modal.msgSuccess('删除成功');
  getList();
};
const submitWhite = async () => {
  if (!whiteForm.value.uid || !whiteForm.value.versionCode) {
    modal.msgWarning('UID 与版本号必填');
    return;
  }
  await addWhitelist(whiteForm.value);
  modal.msgSuccess('添加成功');
  whiteDialog.visible = false;
  whiteForm.value = {};
  getWhiteList();
};
const handleWhiteDelete = async (row?: WhitelistVO) => {
  const delIds = row ? [row.id] : whiteIds.value;
  if (!delIds.length) return;
  await modal.confirm('确认删除选中的白名单吗？');
  await delWhitelist(delIds.join(','));
  modal.msgSuccess('删除成功');
  getWhiteList();
};
onMounted(() => {
  getList();
  getWhiteList();
});
</script>
