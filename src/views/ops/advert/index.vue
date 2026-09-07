<template>
  <div class="p-2 app-container ops-advert-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="类型">
          <el-select v-model="queryParams.adType" clearable style="width: 130px">
            <el-option label="Banner" :value="1" />
            <el-option label="弹窗" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="投放位">
          <el-select v-model="queryParams.positionCode" clearable style="width: 160px">
            <el-option v-for="opt in positionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
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
    </el-card>

    <el-card shadow="hover" class="table-panel">
      <template #header>
        <div class="toolbar-shell">
          <div class="table-heading">
            <h3>营销广告</h3>
            <p>共 {{ total }} 条记录，管理 Banner / 弹窗与投放排期。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['ops:advert:add']" type="primary" plain icon="Plus" @click="handleAdd">新增广告</el-button>
            <el-button
              v-hasPermi="['ops:advert:remove']"
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
        <el-table-column label="预览" align="center" width="90">
          <template #default="{ row }">
            <el-image
              v-if="row.imageUrl"
              :src="row.imageUrl"
              fit="cover"
              style="width: 64px; height: 36px; border-radius: 4px"
            />
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>
        <el-table-column label="标题" prop="title" min-width="160" :show-overflow-tooltip="true" />
        <el-table-column label="类型" align="center" width="90">
          <template #default="{ row }">
            <el-tag :type="row.adType === 1 ? 'primary' : 'warning'">{{ row.adType === 1 ? 'Banner' : '弹窗' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="投放位" align="center" width="120">
          <template #default="{ row }">{{ positionLabel(row.positionCode) }}</template>
        </el-table-column>
        <el-table-column label="目标人群" align="center" width="100">
          <template #default="{ row }">{{ scopeText(row.targetScope) }}</template>
        </el-table-column>
        <el-table-column label="投放时间" align="center" min-width="180">
          <template #default="{ row }">
            <span class="text-xs">{{ fmt(row.startAt) }} ~ {{ fmt(row.endAt) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="排序" prop="sortOrder" align="center" width="70" />
        <el-table-column label="状态" align="center" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleUpdate(row)">编辑</el-button>
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

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="760px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="广告类型">
              <el-radio-group v-model="form.adType">
                <el-radio :value="1">Banner</el-radio>
                <el-radio :value="2">弹窗</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="投放位">
              <el-select v-model="form.positionCode" style="width: 100%">
                <el-option v-for="opt in positionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="标题" prop="title">
              <el-input v-model="form.title" maxlength="120" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="图片地址" prop="imageUrl">
              <el-input v-model="form.imageUrl" placeholder="图片 URL" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="跳转地址">
              <el-input v-model="form.linkUrl" placeholder="可选" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开始时间">
              <el-date-picker
                v-model="form.startAt"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间">
              <el-date-picker
                v-model="form.endAt"
                type="datetime"
                value-format="YYYY-MM-DDTHH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <template v-if="form.adType === 2">
            <el-col :span="12">
              <el-form-item label="每日上限(次)">
                <el-input-number v-model="form.popupFrequency" :min="1" :max="99" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="延迟(毫秒)">
                <el-input-number v-model="form.popupDelayMs" :min="0" :max="60000" :step="500" />
              </el-form-item>
            </el-col>
          </template>
          <el-col :span="12">
            <el-form-item label="目标人群">
              <el-select v-model="form.targetScope" style="width: 100%">
                <el-option label="全部" :value="1" />
                <el-option label="新用户" :value="2" />
                <el-option label="VIP" :value="3" />
                <el-option label="渠道" :value="4" />
                <el-option label="指定UID" :value="5" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="form.sortOrder" :min="0" :max="9999" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="目标参数(JSON)">
              <el-input
                v-model="form.scopeParamsJson"
                type="textarea"
                :rows="2"
                placeholder='按目标人群填写，如 {"minVip":1,"maxVip":5} / {"channelIds":[1,2]} / {"uids":[1001]}'
              />
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

<script setup name="OpsAdvert" lang="ts">
import { onMounted, reactive, ref, toRefs } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { addAdvert, delAdvert, listAdvert, updateAdvert, updateAdvertStatus } from '@/api/ops/advert';
import type { AdvertForm, AdvertQuery, AdvertVO } from '@/api/ops/advert/types';

const positionOptions = [
  { label: '大厅首页', value: 'lobby' },
  { label: '主页横幅', value: 'home' },
  { label: '个人中心', value: 'member' },
  { label: '充值页', value: 'recharge' },
  { label: '登录弹窗', value: 'login' }
];
const positionLabel = (code: string) => positionOptions.find(o => o.value === code)?.label || code;
const scopeText = (s?: number) =>
  s === 1 ? '全部' : s === 2 ? '新用户' : s === 3 ? 'VIP' : s === 4 ? '渠道' : s === 5 ? '指定UID' : '—';

const { loading, withLoading } = useLoading(true);
const rows = ref<AdvertVO[]>([]);
const total = ref(0);
const ids = ref<number[]>([]);
const multiple = ref(true);
const dialog = reactive({ visible: false, title: '' });

const data = reactive<{ queryParams: AdvertQuery; form: AdvertForm }>({
  queryParams: { pageNum: 1, pageSize: 10 },
  form: { adType: 1, positionCode: 'lobby', targetScope: 1, sortOrder: 100, popupFrequency: 1, popupDelayMs: 0 }
});
const { queryParams, form } = toRefs(data);

const fmt = (value?: string) => (value ? value.replace('T', ' ').slice(0, 19) : '—');

const getList = async () => {
  await withLoading(async () => {
    const res = await listAdvert(queryParams.value);
    rows.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};
const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: 10 } as AdvertQuery;
  handleQuery();
};
const handleSelectionChange = (selection: AdvertVO[]) => {
  ids.value = selection.map(item => item.adId);
  multiple.value = selection.length === 0;
};
const handleAdd = () => {
  form.value = {
    adType: 1,
    positionCode: 'lobby',
    targetScope: 1,
    sortOrder: 100,
    popupFrequency: 1,
    popupDelayMs: 0,
    platformJson: '["android","ios","h5"]'
  } as AdvertForm;
  dialog.title = '新增广告';
  dialog.visible = true;
};
const handleUpdate = (row: AdvertVO) => {
  form.value = { ...row } as unknown as AdvertForm;
  dialog.title = '编辑广告';
  dialog.visible = true;
};
const submitForm = async () => {
  if (!form.value.title || !form.value.imageUrl) {
    modal.msgWarning('标题与图片必填');
    return;
  }
  if (form.value.adId) {
    await updateAdvert(form.value);
  } else {
    await addAdvert(form.value);
  }
  modal.msgSuccess('操作成功');
  dialog.visible = false;
  getList();
};
const handleStatus = async (row: AdvertVO, value: number) => {
  await updateAdvertStatus({ id: row.adId, value });
  modal.msgSuccess('操作成功');
  getList();
};
const handleDelete = async (row?: AdvertVO) => {
  const delIds = row ? [row.adId] : ids.value;
  if (!delIds.length) return;
  await modal.confirm('确认删除选中的广告吗？');
  await delAdvert(delIds.join(','));
  modal.msgSuccess('删除成功');
  getList();
};
onMounted(() => getList());
</script>
