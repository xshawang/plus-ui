<template>
  <div>
    <el-form inline class="query-bar">
      <el-form-item label="批次名称">
        <el-input v-model="keyword" clearable placeholder="搜索批次" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="load">搜索</el-button>
        <el-button type="primary" plain icon="Plus" @click="openDialog()">新增批次</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" border :data="rows">
      <el-table-column prop="batchId" label="批次ID" width="180" />
      <el-table-column prop="batchName" label="批次名称" min-width="180" />
      <el-table-column prop="titleVi" label="客户端标题" min-width="180" />
      <el-table-column label="奖励" width="180">
        <template #default="{ row }">
          {{ row.rewardMode === 'RANDOM' ? `${money(row.minAmount)} ~ ${money(row.maxAmount)}` : money(row.rewardValue) }}
        </template>
      </el-table-column>
      <el-table-column label="使用情况" width="130">
        <template #default="{ row }">{{ row.usedCount }} / {{ row.totalCount }}</template>
      </el-table-column>
      <el-table-column prop="perUserLimit" label="每用户上限" width="110" />
      <el-table-column prop="expireAt" label="过期时间" width="180" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="310" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openDialog(row as PromoGiftCodeBatch)">修改</el-button>
          <el-button link type="primary" @click="generate(row as PromoGiftCodeBatch)">生成1000</el-button>
          <el-button link type="primary" @click="openImport(row as PromoGiftCodeBatch)">导入</el-button>
          <el-button link type="primary" @click="showCodes(row as PromoGiftCodeBatch)">码列表</el-button>
          <el-button link :type="row.status === 1 ? 'warning' : 'success'" @click="toggle(row as PromoGiftCodeBatch)">
            {{ row.status === 1 ? '停用' : '启用' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="form.batchId ? '修改礼包码批次' : '新增礼包码批次'" width="720px" append-to-body>
      <el-form :model="form" label-width="130px">
        <el-form-item label="批次名称"><el-input v-model="form.batchName" /></el-form-item>
        <el-form-item label="中文标题"><el-input v-model="form.titleZh" /></el-form-item>
        <el-form-item label="越南语标题"><el-input v-model="form.titleVi" /></el-form-item>
        <el-form-item label="币种"><el-input v-model="form.currency" /></el-form-item>
        <el-form-item label="奖励模式">
          <el-radio-group v-model="form.rewardMode">
            <el-radio value="FIXED">固定金额</el-radio>
            <el-radio value="RANDOM">随机金额</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.rewardMode === 'FIXED'" label="固定奖励">
          <el-input-number v-model="form.rewardValue" :min="1" :controls="false" />
        </el-form-item>
        <template v-else>
          <el-form-item label="最小金额"><el-input-number v-model="form.minAmount" :min="1" :controls="false" /></el-form-item>
          <el-form-item label="最大金额"><el-input-number v-model="form.maxAmount" :min="1" :controls="false" /></el-form-item>
        </template>
        <el-form-item label="每用户上限"><el-input-number v-model="form.perUserLimit" :min="1" :controls="false" /></el-form-item>
        <el-form-item label="适用终端"><el-input v-model="form.applyTerminals" placeholder="留空不限制；多个用逗号" /></el-form-item>
        <el-form-item label="稽核倍数"><el-input-number v-model="form.auditMultiple" :min="0" :precision="2" :controls="false" /></el-form-item>
        <el-form-item label="生效时间">
          <el-date-picker v-model="form.validStartAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="过期时间">
          <el-date-picker v-model="form.expireAt" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
        <el-button @click="dialogVisible = false">取消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="codesVisible" title="礼包码列表" width="780px" append-to-body>
      <el-alert type="info" :closable="false" title="码内容只对具备活动查看权限的后台账号可见。" />
      <el-table :data="codes" border max-height="520" class="mt">
        <el-table-column prop="code" label="礼包码" min-width="170" />
        <el-table-column prop="rewardAmount" label="奖励金额" width="130" />
        <el-table-column prop="status" label="状态" width="90" />
        <el-table-column prop="usedByUid" label="领取UID" width="180" />
        <el-table-column prop="claimOrderNo" label="发放单号" min-width="240" />
      </el-table>
    </el-dialog>

    <el-dialog v-model="importVisible" title="导入礼包码" width="600px" append-to-body>
      <el-input v-model="importText" type="textarea" :rows="12" placeholder="每行一个 6-32 位字母数字码" />
      <template #footer>
        <el-button type="primary" :loading="saving" @click="submitImport">导入</el-button>
        <el-button @click="importVisible = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import modal from '@/plugins/modal';
import {
  generateGiftCodes,
  importGiftCodes,
  listGiftCodeBatches,
  listGiftCodes,
  saveGiftCodeBatch,
  setGiftCodeBatchStatus,
  type PromoGiftCodeBatch
} from '@/api/promotion/activity/gift-code';

const loading = ref(false);
const saving = ref(false);
const keyword = ref('');
const rows = ref<PromoGiftCodeBatch[]>([]);
const codes = ref<Array<Record<string, unknown>>>([]);
const codesVisible = ref(false);
const importVisible = ref(false);
const importText = ref('');
const importBatchId = ref<number>();
const dialogVisible = ref(false);
const form = reactive<Partial<PromoGiftCodeBatch>>({});

const empty = (): Partial<PromoGiftCodeBatch> => ({
  batchName: '', titleZh: '礼包码奖励', titleVi: 'Quà tặng', currency: 'VND',
  rewardMode: 'FIXED', rewardValue: 10000, minAmount: 1000, maxAmount: 50000,
  perUserLimit: 1, applyTerminals: '', auditMultiple: 1, status: 1
});

const load = async () => {
  loading.value = true;
  try {
    const response = await listGiftCodeBatches({ keyword: keyword.value, pageNum: 1, pageSize: 100 });
    rows.value = (response as unknown as { rows?: PromoGiftCodeBatch[] }).rows ?? [];
  } finally {
    loading.value = false;
  }
};

const openDialog = (row?: PromoGiftCodeBatch) => {
  Object.assign(form, row ?? empty());
  dialogVisible.value = true;
};

const save = async () => {
  saving.value = true;
  try {
    await saveGiftCodeBatch(form);
    modal.msgSuccess('保存成功');
    dialogVisible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
};

const generate = async (row: PromoGiftCodeBatch) => {
  await modal.confirm(`为「${row.batchName}」生成 1000 个礼包码？`);
  const response = await generateGiftCodes(row.batchId, 1000);
  modal.msgSuccess(`已生成 ${response.data?.length ?? 0} 个礼包码`);
  await load();
};

const toggle = async (row: PromoGiftCodeBatch) => {
  await setGiftCodeBatchStatus(row.batchId, row.status === 1 ? 0 : 1);
  await load();
};

const showCodes = async (row: PromoGiftCodeBatch) => {
  const response = await listGiftCodes(row.batchId);
  codes.value = response.data ?? [];
  codesVisible.value = true;
};

const openImport = (row: PromoGiftCodeBatch) => {
  importBatchId.value = row.batchId;
  importText.value = '';
  importVisible.value = true;
};

const submitImport = async () => {
  if (!importBatchId.value) return;
  const values = importText.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  saving.value = true;
  try {
    const response = await importGiftCodes(importBatchId.value, values);
    modal.msgSuccess(`实际导入 ${response.data ?? 0} 个`);
    importVisible.value = false;
    await load();
  } finally {
    saving.value = false;
  }
};

const money = (value?: number) => Number(value ?? 0).toLocaleString('en-US');

onMounted(load);
</script>

<style scoped>
.mt {
  margin-top: 12px;
}
</style>
