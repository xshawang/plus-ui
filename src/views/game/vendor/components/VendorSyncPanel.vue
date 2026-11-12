<template>
  <el-card shadow="hover">
    <template #header>
      <div class="panel-header">
        <h3>厂商目录同步</h3>
        <div>
          <el-select v-model="language" style="width: 120px"><el-option label="中文名称" value="zh" /><el-option label="越南文名称" value="vi" /></el-select>
          <el-button v-hasPermi="['game:vendor:sync']" type="primary" class="ml8" :loading="loading" @click="load">拉取厂商</el-button>
        </div>
      </div>
    </template>
    <el-alert type="info" :closable="false" show-icon class="mb12"
      title="导入会把厂商写入「平台管理」、游戏写入「子游戏管理」并按默认比例写「有效投注比例」；新导入的平台与游戏默认关闭，请到原页面上架。再次导入只更新名称 / 图标，不覆盖运营字段。" />
    <el-table v-loading="loading" border :data="vendors">
      <el-table-column label="厂商代码" prop="code" width="120" align="center" />
      <el-table-column label="厂商名称" prop="name" min-width="160" />
      <el-table-column label="支持币种" prop="currencyCode" min-width="140" />
      <el-table-column label="类别" prop="categoryCode" min-width="140" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }"><el-tag :type="row.imported ? 'success' : 'info'">{{ row.imported ? '已导入' : '未导入' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="260" align="center" fixed="right">
        <template #default="{ row }">
          <el-button v-hasPermi="['game:vendor:sync']" link type="primary" :loading="importing === row.code" @click="doImport(row)">
            {{ row.imported ? '更新游戏' : '导入游戏' }}
          </el-button>
          <el-button v-if="row.imported" link type="primary" @click="go('platform', row)">平台管理</el-button>
          <el-button v-if="row.imported" link type="primary" @click="go('subgame', row)">子游戏管理</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="resultDialog.visible" title="导入结果" width="620px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="平台代码">{{ resultDialog.data.providerCode }}</el-descriptions-item>
        <el-descriptions-item label="远端游戏数">{{ resultDialog.data.remote }}</el-descriptions-item>
        <el-descriptions-item label="新增">{{ resultDialog.data.inserted }}</el-descriptions-item>
        <el-descriptions-item label="更新">{{ resultDialog.data.updated }}</el-descriptions-item>
      </el-descriptions>
      <div v-if="resultDialog.data.skipped?.length" class="mt12">
        <div class="muted">跳过（{{ resultDialog.data.skipped.length }}）：</div>
        <el-tag v-for="s in resultDialog.data.skipped" :key="s" type="warning" class="tag">{{ s }}</el-tag>
      </div>
      <div v-if="resultDialog.data.unclassified?.length" class="mt12">
        <div class="muted">未识别类别，已按电子归类（{{ resultDialog.data.unclassified.length }}）：</div>
        <el-tag v-for="s in resultDialog.data.unclassified" :key="s" type="info" class="tag">{{ s }}</el-tag>
      </div>
      <template #footer><el-button type="primary" @click="resultDialog.visible = false">知道了</el-button></template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { importVendor, listRemoteVendors } from '@/api/game/vendor';
import type { RemoteVendorVO, VendorImportResult } from '@/api/game/vendor/types';

const router = useRouter();
const loading = ref(false);
const importing = ref('');
const language = ref('zh');
const vendors = ref<RemoteVendorVO[]>([]);
const resultDialog = reactive<{ visible: boolean; data: Partial<VendorImportResult> }>({ visible: false, data: {} });

async function load() {
  loading.value = true;
  try {
    const res: any = await listRemoteVendors(language.value);
    vendors.value = res.data ?? [];
    if (!vendors.value.length) ElMessage.info('OneAPI 未返回可用厂商');
  } finally {
    loading.value = false;
  }
}

async function doImport(row: RemoteVendorVO) {
  importing.value = row.code;
  try {
    const res: any = await importVendor(row.code, row.name);
    resultDialog.data = res.data ?? {};
    resultDialog.visible = true;
    row.imported = true;
  } finally {
    importing.value = '';
  }
}

/** 跳到原有页面维护（子游戏管理按 providerCode 预筛选） */
function go(page: 'platform' | 'subgame', row: RemoteVendorVO) {
  const base = router.currentRoute.value.path.replace(/\/vendor$/, '');
  router.push({ path: `${base}/${page}`, query: { providerCode: `OA_${row.code}` } });
}
</script>

<style scoped>
.panel-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.panel-header h3 { margin: 0; font-size: 15px; }
.muted { color: var(--el-text-color-secondary); font-size: 12px; margin-bottom: 6px; }
.ml8 { margin-left: 8px; }
.mb12 { margin-bottom: 12px; }
.mt12 { margin-top: 12px; }
.tag { margin: 0 6px 6px 0; }
</style>
