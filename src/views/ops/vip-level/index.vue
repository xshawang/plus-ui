<template>
  <div class="p-2 app-container ops-vip-page">
    <el-card shadow="hover" class="search-panel">
      <el-form :inline="true" class="query-form">
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" clearable style="width: 110px">
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="queryParams.keyword" placeholder="等级名称" clearable @keyup.enter="handleQuery" />
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
            <h3>会员等级</h3>
            <p>共 {{ total }} 个等级，配置升级阈值与权益。</p>
          </div>
          <div class="toolbar-actions">
            <el-button v-hasPermi="['ops:vip-level:add']" type="primary" plain icon="Plus" @click="handleAdd">新增等级</el-button>
          </div>
        </div>
      </template>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="等级" prop="vipLevel" align="center" width="70" />
        <el-table-column label="图标" align="center" width="70">
          <template #default="{ row }">
            <el-avatar v-if="row.iconUrl" :size="36" :src="row.iconUrl" />
            <span v-else class="text-gray-400">—</span>
          </template>
        </el-table-column>
        <el-table-column label="名称" prop="levelName" min-width="110" />
        <el-table-column label="累计充值(万VND)" align="center" width="150">
          <template #default="{ row }">{{ fmtMoney(row.minPayTotal) }}</template>
        </el-table-column>
        <el-table-column label="日礼金(万VND)" align="center" width="120">
          <template #default="{ row }">{{ fmtMoney(row.dailyGift) }}</template>
        </el-table-column>
        <el-table-column label="费率折扣" align="center" width="100">
          <template #default="{ row }">{{ Number(row.feeDiscountRate ?? 0).toFixed(4) }}</template>
        </el-table-column>
        <el-table-column label="用户数" prop="userCount" align="center" width="90" />
        <el-table-column label="状态" align="center" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleUpdate(row)">编辑</el-button>
            <el-button v-if="row.status === 1" link type="info" @click="handleStatus(row, 0)">停用</el-button>
            <el-button v-else link type="success" @click="handleStatus(row, 1)">启用</el-button>
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

    <el-dialog v-model="dialog.visible" :title="dialog.title" width="680px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="130px">
        <el-row>
          <el-col :span="12">
            <el-form-item label="等级值" prop="vipLevel">
              <el-input-number v-model="form.vipLevel" :min="0" :max="30" :disabled="!!form.vipLevel && !!isEdit" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="等级名称" prop="levelName">
              <el-input v-model="form.levelName" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="图标URL">
              <el-input v-model="form.iconUrl" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <el-input-number v-model="form.sortOrder" :min="0" :max="999" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="累计充值(VND)">
              <el-input-number v-model="form.minPayTotal" :min="0" :precision="2" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效局数">
              <el-input-number v-model="form.minRounds" :min="0" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="日礼金(VND)">
              <el-input-number v-model="form.dailyGift" :min="0" :precision="2" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="费率折扣(0~1)">
              <el-input-number v-model="form.feeDiscountRate" :min="0" :max="1" :precision="4" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="日提现上限(VND)">
              <el-input-number v-model="form.withdrawDailyLimit" :min="0" :precision="2" :controls="false" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="等级描述">
              <el-input v-model="form.levelDesc" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="权益(JSON)">
              <el-input v-model="form.benefitsJson" type="textarea" :rows="3" placeholder='[{"type":"gift","name":"生日礼包"}]' />
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

<script setup name="OpsVipLevel" lang="ts">
import { onMounted, reactive, ref, toRefs } from 'vue';
import { useLoading } from '@/hooks/async/useLoading';
import modal from '@/plugins/modal';
import { addVipLevel, listVipLevel, updateVipLevel, updateVipLevelStatus } from '@/api/ops/vip-level';
import type { VipLevelForm, VipLevelQuery, VipLevelVO } from '@/api/ops/vip-level/types';

const { loading, withLoading } = useLoading(true);
const rows = ref<VipLevelVO[]>([]);
const total = ref(0);
const isEdit = ref(false);
const dialog = reactive({ visible: false, title: '' });

const data = reactive<{ queryParams: VipLevelQuery; form: VipLevelForm }>({
  queryParams: { pageNum: 1, pageSize: 10 },
  form: { sortOrder: 0 }
});
const { queryParams, form } = toRefs(data);

const fmtMoney = (value?: string | number) =>
  value === undefined || value === null || value === '' ? '0' : Number(value).toLocaleString('en-US');

const getList = async () => {
  await withLoading(async () => {
    const res = await listVipLevel(queryParams.value);
    rows.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};
const resetQuery = () => {
  queryParams.value = { pageNum: 1, pageSize: 10 } as VipLevelQuery;
  handleQuery();
};
const handleAdd = () => {
  isEdit.value = false;
  form.value = { sortOrder: 0, minRounds: 0 } as VipLevelForm;
  dialog.title = '新增等级';
  dialog.visible = true;
};
const handleUpdate = (row: VipLevelVO) => {
  isEdit.value = true;
  form.value = {
    vipLevel: row.vipLevel,
    levelName: row.levelName,
    iconUrl: row.iconUrl,
    levelDesc: row.levelDesc,
    minPayTotal: row.minPayTotal,
    minRounds: row.minRounds,
    dailyGift: row.dailyGift,
    feeDiscountRate: row.feeDiscountRate,
    withdrawDailyLimit: row.withdrawDailyLimit,
    benefitsJson: row.benefitsJson,
    sortOrder: row.sortOrder
  };
  dialog.title = '编辑等级';
  dialog.visible = true;
};
const submitForm = async () => {
  if (form.value.vipLevel === undefined || form.value.vipLevel === null || !form.value.levelName) {
    modal.msgWarning('等级值与名称必填');
    return;
  }
  if (isEdit.value) {
    await updateVipLevel(form.value);
  } else {
    await addVipLevel(form.value);
  }
  modal.msgSuccess('操作成功');
  dialog.visible = false;
  getList();
};
const handleStatus = async (row: VipLevelVO, value: number) => {
  await updateVipLevelStatus({ id: row.vipLevel, value });
  modal.msgSuccess('操作成功');
  getList();
};
onMounted(() => getList());
</script>
