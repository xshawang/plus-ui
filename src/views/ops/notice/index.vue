<template>
  <div class="p-2 app-container ops-notice-page">
    <el-card shadow="hover" class="search-panel">
      <el-tabs v-model="activeTab" @tab-change="handleQuery">
        <el-tab-pane name="current">
          <template #label>
            <span>公告</span>
            <el-badge v-if="unreadCount > 0" :value="unreadCount" class="ml-1" />
          </template>
        </el-tab-pane>
        <el-tab-pane label="历史公告" name="history" />
        <el-tab-pane label="全部公告" name="all" />
      </el-tabs>
      <el-form :inline="true" class="query-form">
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
        <el-form-item label="标题">
          <el-select v-model="queryParams.noticeTitle" placeholder="请输入标题" clearable filterable style="width: 200px">
            <el-option v-for="item in titleOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="读取状态">
          <el-select v-model="queryParams.readStatus" clearable placeholder="读取状态" style="width: 130px">
            <el-option label="未读" :value="1" />
            <el-option label="已读" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="公告类型">
          <el-select v-model="queryParams.noticeCategory" clearable placeholder="全部类型" style="width: 150px">
            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
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
            <h3>厅主公告</h3>
            <p>共 {{ total }} 条记录；当前公告按发送时间倒序展示。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['ops:notice:skin']" plain icon="Brush" @click="openSkin">维护公告皮肤</el-button>
            <el-button v-hasPermi="['ops:notice:edit']" type="primary" plain icon="Plus" @click="handleAdd">新增公告</el-button>
            <el-button
              v-hasPermi="['ops:notice:remove']"
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
        <el-table-column label="ID" prop="noticeId" align="center" width="110" />
        <el-table-column label="公告类型" align="center" width="120">
          <template #default="{ row }">
            <el-tag :type="categoryTagType(row.noticeCategory)">【{{ categoryText(row.noticeCategory) }}】</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标题" prop="noticeTitle" min-width="260" :show-overflow-tooltip="true" />
        <el-table-column label="接收对象" align="center" width="110">
          <template #default="{ row }">{{ row.receiverScope || '全部厅主' }}</template>
        </el-table-column>
        <el-table-column label="内容" min-width="260" :show-overflow-tooltip="true">
          <template #default="{ row }">
            <span>{{ plainText(row.noticeContent) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="发送时间" align="center" width="170">
          <template #default="{ row }">{{ fmt(row.sentAt) }}</template>
        </el-table-column>
        <el-table-column label="读取状态" align="center" width="100">
          <template #default="{ row }">
            <span :class="row.readCount > 0 ? 'text-green-600' : 'text-gray-400'">{{ row.readCount > 0 ? '已读' : '未读' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="公告状态" align="center" width="100">
          <template #default="{ row }">
            <span :class="statusClass(row.status)">{{ statusText(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">详情</el-button>
            <el-button v-hasPermi="['ops:notice:remove']" link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <!-- 详情弹窗（截图「厅主公告详情」） -->
    <el-dialog v-model="detail.visible" title="厅主公告详情" width="720px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="标题" :span="2">{{ detail.row?.noticeTitle }}</el-descriptions-item>
        <el-descriptions-item label="公告类型">【{{ categoryText(detail.row?.noticeCategory) }}】</el-descriptions-item>
        <el-descriptions-item label="发送时间">{{ fmt(detail.row?.sentAt) }}</el-descriptions-item>
        <el-descriptions-item label="读取状态">{{ (detail.row?.readCount ?? 0) > 0 ? '已读' : '未读' }}</el-descriptions-item>
        <el-descriptions-item label="公告状态">{{ statusText(detail.row?.status) }}</el-descriptions-item>
        <el-descriptions-item label="内容" :span="2">
          <div class="notice-content" v-html="detail.row?.noticeContent || '—'"></div>
        </el-descriptions-item>
        <el-descriptions-item v-if="detail.row?.attachmentUrl" label="文件" :span="2">
          <el-link type="primary" :href="detail.row?.attachmentUrl" target="_blank">{{ detail.row?.attachmentName || '下载附件' }}</el-link>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detail.visible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑 -->
    <el-dialog v-model="dialog.visible" :title="dialog.title" width="760px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-form-item label="标题" prop="noticeTitle">
          <el-input v-model="form.noticeTitle" maxlength="250" show-word-limit />
        </el-form-item>
        <el-row>
          <el-col :span="12">
            <el-form-item label="公告类型">
              <el-select v-model="form.noticeCategory" style="width: 100%">
                <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="接收对象">
              <el-select v-model="form.receiverScope" style="width: 100%">
                <el-option label="全部厅主" value="全部厅主" />
                <el-option label="指定厅主" value="指定厅主" />
                <el-option label="指定站点" value="指定站点" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="语言">
              <el-select v-model="form.languageCode" style="width: 100%">
                <el-option label="越南语(vi)" value="vi" />
                <el-option label="简体中文(zh)" value="zh" />
                <el-option label="English(en)" value="en" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发送时间">
              <el-date-picker v-model="form.sentAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="附件地址">
              <el-input v-model="form.attachmentUrl" placeholder="选填，图片/文档 URL" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="内容" prop="noticeContent">
              <el-input v-model="form.noticeContent" type="textarea" :rows="6" placeholder="支持 HTML 富文本" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="dialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>

    <!-- 维护公告皮肤 -->
    <el-dialog v-model="skinDialog.visible" title="维护公告皮肤" width="560px" append-to-body destroy-on-close>
      <el-form :model="skinForm" label-width="110px">
        <el-form-item label="皮肤名称">
          <el-input v-model="skinForm.skinName" maxlength="64" />
        </el-form-item>
        <el-form-item label="背景图地址">
          <el-input v-model="skinForm.backgroundUrl" placeholder="选填" />
        </el-form-item>
        <el-form-item label="字号">
          <el-input-number v-model="skinForm.fontSize" :min="10" :max="32" />
        </el-form-item>
        <el-form-item label="主题色">
          <el-color-picker v-model="skinForm.themeColor" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" @click="submitSkin">确 定</el-button>
        <el-button @click="skinDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="OpsNotice" lang="ts">
import { onMounted, reactive, ref, toRefs } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import { useTimeScopeQuery } from '@/hooks/form/useTimeScopeQuery';
import modal from '@/plugins/modal';
import {
  addNotice,
  delNotice,
  getNotice,
  getNoticeSkin,
  getNoticeUnreadCount,
  listNotice,
  markNoticeRead,
  saveNoticeSkin,
  updateNotice
} from '@/api/ops/notice';
import type { NoticeForm, NoticeQuery, NoticeSkinVO, NoticeVO } from '@/api/ops/notice/types';

const { loading, withLoading } = useLoading(true);
const rows = ref<NoticeVO[]>([]);
/** 标题下拉候选（取当前列表已有标题，避免运营手写导致筛选不到；仍可输入过滤） */
const titleOptions = ref<string[]>([]);
/** 截图筛选区：「日 / 周 / 月」联动默认发送时间区间 */
const {
  timeScope,
  dateRange,
  monthValue,
  handleScopeChange: handleScopeChangeRaw,
  buildTimeParams,
  applyScopeRange
} = useTimeScopeQuery({ defaultScope: 'month' });

const total = ref(0);
const unreadCount = ref(0);
const ids = ref<number[]>([]);
const multiple = ref(true);
const activeTab = ref('current');
const detail = reactive<{ visible: boolean; row?: NoticeVO }>({ visible: false });
const dialog = reactive({ visible: false, title: '' });
const skinDialog = reactive({ visible: false });

const categoryOptions = [
  { label: '日常公告', value: 'daily' },
  { label: '维护公告', value: 'maintenance' },
  { label: '紧急公告', value: 'urgent' },
  { label: '活动公告', value: 'activity' },
  { label: '渠道公告', value: 'channel' }
];

const data = reactive<{ queryParams: NoticeQuery; form: NoticeForm; skinForm: NoticeSkinVO }>({
  queryParams: { pageNum: 1, pageSize: 10 },
  form: { noticeType: '2', noticeCategory: 'daily', languageCode: 'vi' },
  skinForm: { skinName: '默认皮肤', fontSize: 14, themeColor: '#409EFF' }
});
const { queryParams, form, skinForm } = toRefs(data);

const fmt = (value?: string) => (value ? value.replace('T', ' ').slice(0, 19) : '—');
/** 内容列：富文本转纯文本预览（避免表格里渲染 HTML） */
const plainText = (html?: string) =>
  (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const categoryText = (value?: string) => categoryOptions.find(item => item.value === value)?.label || '日常公告';
const categoryTagType = (value?: string) =>
  value === 'maintenance' ? 'warning' : value === 'urgent' ? 'danger' : value === 'activity' ? 'success' : 'info';
const statusText = (status?: number) => (status === 1 ? '进行中' : status === 2 ? '已结束' : status === 0 ? '已取消' : '—');
const statusClass = (status?: number) => (status === 1 ? 'text-green-600' : 'text-gray-400');

/** 列表：统一 try/catch，保证接口异常时提示且不留空白表格 */
const getList = async () => {
  try {
    await withLoading(async () => {
      queryParams.value.tab = activeTab.value;
      const res = await listNotice({ ...queryParams.value, ...buildTimeParams() });
      rows.value = res.data?.rows || [];
      total.value = res.data?.total || 0;
      // 标题候选：合并本次结果与已有候选，供下拉筛选
      const titles = rows.value.map(item => item.noticeTitle).filter(Boolean);
      titleOptions.value = Array.from(new Set([...titleOptions.value, ...titles]));
    });
  } catch (error) {
    modal.msgError('公告列表加载失败，请稍后重试');
  }
};

/** 粒度切换：重置默认区间并刷新 */
const handleScopeChange = () => {
  handleScopeChangeRaw();
  handleQuery();
};

const loadUnread = async () => {
  try {
    const res = await getNoticeUnreadCount();
    unreadCount.value = res.data?.count || 0;
  } catch (error) {
    unreadCount.value = 0;
  }
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: 10, tab: activeTab.value };
  applyScopeRange();
  getList();
};

const handleSelectionChange = (selection: NoticeVO[]) => {
  ids.value = selection.map(item => item.noticeId);
  multiple.value = selection.length === 0;
};

/**
 * 表格插槽回传的是 element-plus 的 DefaultRow（弱类型），
 * 因此模板调用入口统一用宽松类型接收后收敛为业务字段，避免为每个页面维护类型断言。
 */
type NoticeRow = Record<string, any>;

const openDetail = async (row: NoticeRow) => {
  const noticeId = row.noticeId as number;
  const res = await getNotice(noticeId);
  detail.row = res.data;
  detail.visible = true;
  if (!res.data?.readCount) {
    await markNoticeRead(noticeId);
    loadUnread();
    getList();
  }
};

const handleAdd = () => {
  form.value = { noticeType: '2', noticeCategory: 'daily', languageCode: 'vi', receiverScope: '全部厅主' };
  dialog.title = '新增公告';
  dialog.visible = true;
};

const handleUpdate = (row: NoticeRow) => {
  form.value = {
    noticeId: row.noticeId,
    noticeTitle: row.noticeTitle,
    noticeType: row.noticeType,
    noticeContent: row.noticeContent,
    languageCode: row.languageCode,
    noticeCategory: row.noticeCategory,
    receiverScope: row.receiverScope,
    attachmentUrl: row.attachmentUrl,
    attachmentName: row.attachmentName,
    sentAt: row.sentAt
  };
  dialog.title = '编辑公告';
  dialog.visible = true;
};

const submitForm = async () => {
  if (!form.value.noticeTitle) {
    modal.msgWarning('请输入公告标题');
    return;
  }
  if (!form.value.noticeContent) {
    modal.msgWarning('请输入公告内容');
    return;
  }
  try {
    if (form.value.noticeId) {
      await updateNotice(form.value);
    } else {
      await addNotice(form.value);
    }
    modal.msgSuccess('操作成功');
    dialog.visible = false;
    getList();
    loadUnread();
  } catch (error) {
    modal.msgError('保存失败，请检查必填项');
  }
};

const handleDelete = async (row?: NoticeRow) => {
  const delIds = row ? [row.noticeId as number] : ids.value;
  if (!delIds.length) {
    return;
  }
  await modal.confirm('确认删除选中的公告吗？删除后不影响已发送记录。');
  await delNotice(delIds.join(','));
  modal.msgSuccess('删除成功');
  getList();
  loadUnread();
};

const openSkin = async () => {
  const res = await getNoticeSkin();
  skinForm.value = res.data || { skinName: '默认皮肤', fontSize: 14, themeColor: '#409EFF' };
  skinDialog.visible = true;
};

const submitSkin = async () => {
  if (!skinForm.value.skinName) {
    modal.msgWarning('请输入皮肤名称');
    return;
  }
  await saveNoticeSkin(skinForm.value);
  modal.msgSuccess('皮肤已保存');
  skinDialog.visible = false;
};

onMounted(() => {
  applyScopeRange();
  getList();
  loadUnread();
});
</script>

<style scoped>
.notice-content {
  max-height: 320px;
  overflow: auto;
  line-height: 1.7;
}
</style>
