<template>
  <div class="p-2 app-container gateway-attr-page">
    <el-card shadow="hover">
      <template #header>
        <div class="head">
          <div>
            <h3>网关属性</h3>
            <p>只修改 go88.ws-gateway.risk 白名单键；保存后写入 Nacos，网关最多 30 秒热更新。</p>
          </div>
          <el-button type="primary" :loading="saving" @click="save">保存并发布</el-button>
        </div>
      </template>
      <el-alert type="warning" :closable="false" show-icon
                title="修改风控开关/阈值会直接影响线上连接与下注。保存前请确认推荐值与当前值差异，并填写变更原因。" />
      <el-table v-loading="loading" border :data="rows" max-height="650" style="margin-top: 12px">
        <el-table-column label="键" prop="key" width="300" show-overflow-tooltip />
        <el-table-column label="当前值" min-width="280">
          <template #default="{ row }">
            <el-switch v-if="row.type === 'bool'" v-model="row.editValue" />
            <el-input-number v-else-if="row.type === 'int' || row.type === 'long'" v-model="row.editValue"
                             :controls="false" style="width: 100%" />
            <el-input v-else-if="row.type === 'string'" v-model="row.editValue" />
            <el-input v-else v-model="row.editText" type="textarea" :rows="3" />
          </template>
        </el-table-column>
        <el-table-column label="推荐值" min-width="220">
          <template #default="{ row }">{{ format(row.recommendedValue) }}</template>
        </el-table-column>
        <el-table-column label="说明" prop="description" min-width="320" show-overflow-tooltip />
      </el-table>
      <el-form label-width="90px" style="margin-top: 12px">
        <el-form-item label="变更原因" required>
          <el-input v-model="reason" placeholder="例：按运营要求恢复单 IP 连接上限" />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { listGatewayAttrs, saveGatewayAttrs, type GatewayAttrRow } from '@/api/risk/gateway';

defineOptions({ name: 'GatewayAttr' });

const loading = ref(false);
const saving = ref(false);
const rows = ref<Array<GatewayAttrRow & { editValue?: any; editText?: string }>>([]);
const reason = ref('');

const format = (v: unknown) => (typeof v === 'string' ? v : JSON.stringify(v));

function hydrate(row: GatewayAttrRow) {
  const item: any = { ...row };
  if (row.type === 'bool') item.editValue = Boolean(row.value);
  else if (row.type === 'int' || row.type === 'long') item.editValue = Number(row.value ?? 0);
  else if (row.type === 'string') item.editValue = String(row.value ?? '');
  else item.editText = JSON.stringify(row.value ?? (row.type === 'string-list' ? [] : {}), null, 2);
  return item;
}

async function load() {
  loading.value = true;
  try {
    const res: any = await listGatewayAttrs();
    rows.value = (res.data ?? []).map(hydrate);
  } finally {
    loading.value = false;
  }
}

function valueOf(row: any) {
  if (row.type === 'bool' || row.type === 'int' || row.type === 'long' || row.type === 'string') {
    return row.editValue;
  }
  try {
    return JSON.parse(row.editText);
  } catch {
    throw new Error(`${row.key} 不是合法 JSON`);
  }
}

async function save() {
  if (!reason.value.trim()) {
    ElMessage.warning('请填写变更原因');
    return;
  }
  saving.value = true;
  try {
    const items = rows.value.map((row) => ({ key: row.key, value: valueOf(row) }));
    await saveGatewayAttrs(items, reason.value.trim());
    ElMessage.success('已写入 Nacos，网关最多 30 秒生效');
    reason.value = '';
    await load();
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.head { display: flex; align-items: center; justify-content: space-between; }
.head h3 { margin: 0; }
.head p { margin: 4px 0 0; color: #909399; font-size: 12px; }
</style>
