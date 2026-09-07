<template>
  <div class="p-2 app-container ops-download-page">
    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>下载站管理</h3>
            <p>管理下载资源站、下载链接与可用性监控。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['ops:download-site:check']" type="warning" plain icon="Aim" :loading="checking" @click="handleCheck">
              健康检查
            </el-button>
            <el-button v-if="activeTab === 'site'" v-hasPermi="['ops:download-site:add']" type="primary" plain icon="Plus" @click="handleSiteAdd">
              新增站点
            </el-button>
            <el-button v-if="activeTab === 'link'" v-hasPermi="['ops:download-site:add']" type="primary" plain icon="Plus" @click="handleLinkAdd">
              新增链接
            </el-button>
          </div>
        </div>
      </template>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="资源站" name="site">
          <el-form :inline="true" class="query-form mb-2">
            <el-form-item label="区域">
              <el-select v-model="siteQuery.regionCode" clearable style="width: 120px">
                <el-option label="global" value="global" />
                <el-option label="sea" value="sea" />
                <el-option label="vn" value="vn" />
              </el-select>
            </el-form-item>
            <el-form-item label="站点名">
              <el-input v-model="siteQuery.siteName" clearable @keyup.enter="handleSiteQuery" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleSiteQuery">搜索</el-button>
            </el-form-item>
          </el-form>
          <el-table v-loading="siteLoading" border :data="siteRows">
            <el-table-column label="站点名" prop="siteName" min-width="150" />
            <el-table-column label="基础地址" prop="baseUrl" min-width="220" :show-overflow-tooltip="true" />
            <el-table-column label="区域" prop="regionCode" align="center" width="90" />
            <el-table-column label="权重" prop="weight" align="center" width="80" />
            <el-table-column label="状态" align="center" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="200" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleSiteEdit(row)">编辑</el-button>
                <el-button v-if="row.status === 1" link type="info" @click="handleSiteStatus(row, 0)">禁用</el-button>
                <el-button v-else link type="success" @click="handleSiteStatus(row, 1)">启用</el-button>
                <el-button link type="danger" @click="handleSiteDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination
            v-show="siteTotal > 0"
            v-model:page="siteQuery.pageNum"
            v-model:limit="siteQuery.pageSize"
            :total="siteTotal"
            @pagination="getSiteList"
          />
        </el-tab-pane>

        <el-tab-pane label="下载链接" name="link">
          <el-form :inline="true" class="query-form mb-2">
            <el-form-item label="站点">
              <el-select v-model="linkQuery.siteId" clearable filterable style="width: 200px" @change="handleLinkQuery">
                <el-option v-for="site in siteRows" :key="site.siteId" :label="site.siteName" :value="site.siteId" />
              </el-select>
            </el-form-item>
            <el-form-item label="平台">
              <el-select v-model="linkQuery.platform" clearable style="width: 110px" @change="handleLinkQuery">
                <el-option label="Android" :value="1" />
                <el-option label="iOS" :value="2" />
                <el-option label="H5" :value="3" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleLinkQuery">搜索</el-button>
            </el-form-item>
          </el-form>
          <el-table v-loading="linkLoading" border :data="linkRows">
            <el-table-column label="站点" prop="siteName" min-width="130" />
            <el-table-column label="平台" align="center" width="90">
              <template #default="{ row }">{{ platformText(row.platform) }}</template>
            </el-table-column>
            <el-table-column label="文件名" prop="fileName" min-width="150" />
            <el-table-column label="App版本" prop="appVersion" align="center" width="110">
              <template #default="{ row }">{{ row.appVersion || '最新' }}</template>
            </el-table-column>
            <el-table-column label="大小" align="right" width="100">
              <template #default="{ row }">{{ fmtSize(row.fileSize) }}</template>
            </el-table-column>
            <el-table-column label="状态" align="center" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="170" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" @click="handleLinkEdit(row)">编辑</el-button>
                <el-button v-if="row.status === 1" link type="info" @click="handleLinkStatus(row, 0)">禁用</el-button>
                <el-button v-else link type="success" @click="handleLinkStatus(row, 1)">启用</el-button>
                <el-button link type="danger" @click="handleLinkDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <pagination
            v-show="linkTotal > 0"
            v-model:page="linkQuery.pageNum"
            v-model:limit="linkQuery.pageSize"
            :total="linkTotal"
            @pagination="getLinkList"
          />
        </el-tab-pane>

        <el-tab-pane label="健康日志" name="health">
          <el-form :inline="true" class="query-form mb-2">
            <el-form-item label="结果">
              <el-select v-model="healthQuery.checkResult" clearable style="width: 110px" @change="handleHealthQuery">
                <el-option label="成功" :value="1" />
                <el-option label="失败" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Search" @click="handleHealthQuery">搜索</el-button>
            </el-form-item>
          </el-form>
          <el-table v-loading="healthLoading" border :data="healthRows">
            <el-table-column label="站点" prop="siteName" min-width="150" />
            <el-table-column label="检查地址" prop="targetUrl" min-width="220" :show-overflow-tooltip="true" />
            <el-table-column label="结果" align="center" width="80">
              <template #default="{ row }">
                <el-tag :type="row.checkResult === 1 ? 'success' : 'danger'">{{ row.checkResult === 1 ? '成功' : '失败' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="HTTP" prop="httpCode" align="center" width="80" />
            <el-table-column label="延迟(ms)" prop="latencyMs" align="center" width="100" />
            <el-table-column label="原因" prop="errorMsg" min-width="160" :show-overflow-tooltip="true" />
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

    <el-dialog v-model="siteDialog.visible" :title="siteDialog.title" width="620px" append-to-body destroy-on-close>
      <el-form :model="siteForm" label-width="100px">
        <el-form-item label="站点名称" prop="siteName">
          <el-input v-model="siteForm.siteName" />
        </el-form-item>
        <el-form-item label="基础地址" prop="baseUrl">
          <el-input v-model="siteForm.baseUrl" placeholder="https://cdn.example.com" />
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="区域">
              <el-select v-model="siteForm.regionCode" style="width: 100%">
                <el-option label="global" value="global" />
                <el-option label="sea" value="sea" />
                <el-option label="vn" value="vn" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="权重">
              <el-input-number v-model="siteForm.weight" :min="1" :max="10000" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="siteForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitSite">确 定</el-button>
        <el-button @click="siteDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="linkDialog.visible" :title="linkDialog.title" width="640px" append-to-body destroy-on-close>
      <el-form :model="linkForm" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="资源站" prop="siteId">
              <el-select v-model="linkForm.siteId" filterable style="width: 100%">
                <el-option v-for="site in siteRows" :key="site.siteId" :label="site.siteName" :value="site.siteId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="平台">
              <el-select v-model="linkForm.platform" style="width: 100%">
                <el-option label="Android" :value="1" />
                <el-option label="iOS" :value="2" />
                <el-option label="H5" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="文件名">
              <el-input v-model="linkForm.fileName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="App版本">
              <el-input v-model="linkForm.appVersion" placeholder="留空=最新" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="文件大小">
              <el-input-number v-model="linkForm.fileSize" :min="0" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="linkForm.sortOrder" :min="0" :max="9999" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="下载地址" prop="fileUrl">
              <el-input v-model="linkForm.fileUrl" placeholder="完整 URL" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="MD5">
              <el-input v-model="linkForm.fileMd5" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitLink">确 定</el-button>
        <el-button @click="linkDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="OpsDownloadSite" lang="ts">
import { onMounted, reactive, ref, toRefs } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import {
  addDownloadLink,
  addDownloadSite,
  checkDownloadSite,
  delDownloadLink,
  delDownloadSite,
  listDownloadHealth,
  listDownloadLink,
  listDownloadSite,
  updateDownloadLink,
  updateDownloadSite,
  updateDownloadLinkStatus,
  updateDownloadSiteStatus
} from '@/api/ops/download-site';
import type {
  DownloadHealthQuery,
  DownloadHealthVO,
  DownloadLinkForm,
  DownloadLinkQuery,
  DownloadLinkVO,
  DownloadSiteForm,
  DownloadSiteQuery,
  DownloadSiteVO
} from '@/api/ops/download-site/types';

const activeTab = ref('site');
const { loading: siteLoading, withLoading: withSiteLoading } = useLoading(true);
const { loading: linkLoading, withLoading: withLinkLoading } = useLoading(true);
const { loading: healthLoading, withLoading: withHealthLoading } = useLoading(true);
const checking = ref(false);
const siteRows = ref<DownloadSiteVO[]>([]);
const siteTotal = ref(0);
const linkRows = ref<DownloadLinkVO[]>([]);
const linkTotal = ref(0);
const healthRows = ref<DownloadHealthVO[]>([]);
const healthTotal = ref(0);
const siteDialog = reactive({ visible: false, title: '' });
const linkDialog = reactive({ visible: false, title: '' });
const siteEditFlag = ref(false);
const linkEditFlag = ref(false);

const data = reactive<{
  siteQuery: DownloadSiteQuery;
  linkQuery: DownloadLinkQuery;
  healthQuery: DownloadHealthQuery;
  siteForm: DownloadSiteForm;
  linkForm: DownloadLinkForm;
}>({
  siteQuery: { pageNum: 1, pageSize: 10 },
  linkQuery: { pageNum: 1, pageSize: 10 },
  healthQuery: { pageNum: 1, pageSize: 10 },
  siteForm: { regionCode: 'global', weight: 100 },
  linkForm: { platform: 1, sortOrder: 100 }
});
const { siteQuery, linkQuery, healthQuery, siteForm, linkForm } = toRefs(data);

const platformText = (p?: number) => (p === 1 ? 'Android' : p === 2 ? 'iOS' : p === 3 ? 'H5' : '—');
const fmt = (value?: string) => (value ? value.replace('T', ' ').slice(0, 19) : '—');
const fmtSize = (size?: number) => {
  if (!size) return '—';
  if (size > 1024 * 1024 * 1024) return (size / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  return (size / 1024 / 1024).toFixed(1) + ' MB';
};

const getSiteList = async (all = false) => {
  await withSiteLoading(async () => {
    const query = all ? { pageNum: 1, pageSize: 200 } : siteQuery.value;
    const res = await listDownloadSite(query);
    siteRows.value = res.data?.rows || [];
    siteTotal.value = res.data?.total || 0;
  });
};
const handleSiteQuery = () => {
  siteQuery.value.pageNum = 1;
  getSiteList();
};
const getLinkList = async () => {
  await withLinkLoading(async () => {
    const res = await listDownloadLink(linkQuery.value);
    linkRows.value = res.data?.rows || [];
    linkTotal.value = res.data?.total || 0;
  });
};
const handleLinkQuery = () => {
  linkQuery.value.pageNum = 1;
  getLinkList();
};
const getHealthList = async () => {
  await withHealthLoading(async () => {
    const res = await listDownloadHealth(healthQuery.value);
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
    const res = await checkDownloadSite();
    modal.msgSuccess('已检查站点：' + (res.data || []).join(', '));
    getHealthList();
  } finally {
    checking.value = false;
  }
};
const handleSiteAdd = () => {
  siteEditFlag.value = false;
  siteForm.value = { regionCode: 'global', weight: 100 } as DownloadSiteForm;
  siteDialog.title = '新增资源站';
  siteDialog.visible = true;
};
const handleSiteEdit = (row: DownloadSiteVO) => {
  siteEditFlag.value = true;
  siteForm.value = {
    siteId: row.siteId,
    siteName: row.siteName,
    baseUrl: row.baseUrl,
    regionCode: row.regionCode,
    weight: row.weight,
    remark: row.remark
  };
  siteDialog.title = '编辑资源站';
  siteDialog.visible = true;
};
const submitSite = async () => {
  if (!siteForm.value.siteName || !siteForm.value.baseUrl) {
    modal.msgWarning('站点名与地址必填');
    return;
  }
  if (siteEditFlag.value) {
    await updateDownloadSite(siteForm.value);
  } else {
    await addDownloadSite(siteForm.value);
  }
  modal.msgSuccess('操作成功');
  siteDialog.visible = false;
  getSiteList();
};
const handleSiteStatus = async (row: DownloadSiteVO, value: number) => {
  await updateDownloadSiteStatus({ id: row.siteId, value });
  modal.msgSuccess('操作成功');
  getSiteList();
};
const handleSiteDelete = async (row: DownloadSiteVO) => {
  await modal.confirm('确认删除该资源站吗？');
  await delDownloadSite(row.siteId);
  modal.msgSuccess('删除成功');
  getSiteList();
};
const handleLinkAdd = () => {
  if (!siteRows.length) {
    modal.msgWarning('请先在「资源站」页签创建站点');
    return;
  }
  linkEditFlag.value = false;
  linkForm.value = { siteId: siteRows.value[0].siteId, platform: 1, sortOrder: 100 } as DownloadLinkForm;
  linkDialog.title = '新增下载链接';
  linkDialog.visible = true;
};
const handleLinkEdit = (row: DownloadLinkVO) => {
  linkEditFlag.value = true;
  linkForm.value = {
    linkId: row.linkId,
    siteId: row.siteId,
    platform: row.platform,
    fileName: row.fileName,
    fileUrl: row.fileUrl,
    fileMd5: row.fileMd5,
    fileSize: row.fileSize,
    appVersion: row.appVersion,
    sortOrder: row.sortOrder
  };
  linkDialog.title = '编辑下载链接';
  linkDialog.visible = true;
};
const submitLink = async () => {
  if (!linkForm.value.siteId || !linkForm.value.fileUrl) {
    modal.msgWarning('站点与下载地址必填');
    return;
  }
  if (linkEditFlag.value) {
    await updateDownloadLink(linkForm.value);
  } else {
    await addDownloadLink(linkForm.value);
  }
  modal.msgSuccess('操作成功');
  linkDialog.visible = false;
  getLinkList();
};
const handleLinkStatus = async (row: DownloadLinkVO, value: number) => {
  await updateDownloadLinkStatus({ id: row.linkId, value });
  modal.msgSuccess('操作成功');
  getLinkList();
};
const handleLinkDelete = async (row: DownloadLinkVO) => {
  await modal.confirm('确认删除该下载链接吗？');
  await delDownloadLink(row.linkId);
  modal.msgSuccess('删除成功');
  getLinkList();
};
onMounted(() => {
  getSiteList(true);
  getSiteList();
  getLinkList();
  getHealthList();
});
</script>
