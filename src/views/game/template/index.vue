<template>
  <div class="p-2 app-container game-template-page">
    <el-card shadow="hover">
      <el-tabs v-model="activeCode" @tab-change="loadItems">
        <el-tab-pane v-for="tpl in templates" :key="tpl.templateCode" :name="tpl.templateCode"
                     :label="tpl.templateName + (tpl.templateStatus === 1 ? '(生效中)' : '')" />
      </el-tabs>
      <div class="toolbar">
        <el-button v-hasPermi="['game:template:edit']" type="primary" plain icon="Check" @click="setActive">设为生效</el-button>
        <el-button v-hasPermi="['game:template:edit']" type="primary" plain icon="Sort" @click="saveSort">保存排序</el-button>
      </div>
      <el-table v-loading="loading" border :data="rows">
        <el-table-column label="排序" align="center" width="110">
          <template #default="{ row }">
            <el-input-number v-model="row.sortOrder" :min="0" size="small" controls-position="right" style="width: 90px" />
          </template>
        </el-table-column>
        <el-table-column label="平台名称" align="center" prop="platformName" width="140" />
        <el-table-column label="子游戏ID" align="center" prop="gameCode" width="130" />
        <el-table-column label="子游戏名称" align="center" prop="gameName" min-width="180" />
        <el-table-column label="icon" align="center" width="90">
          <template #default="{ row }">
            <el-image v-if="row.iconUrl" :src="row.iconUrl" style="width: 36px; height: 36px" />
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="来源" align="center" width="120">
          <template #default="{ row }">{{ sourceText(row.source) }}</template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '有效' : '已移出' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="100" fixed="right">
          <template #default="{ row }">
            <el-button v-hasPermi="['game:template:edit']" link type="danger" @click="removeItem(row)">移出模板</el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadItems" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { listTemplate, listTemplateItem, setTemplateActive, sortTemplateItem, removeTemplateItem } from '@/api/game/manage';

defineOptions({ name: 'GameTemplate' });

const CURRENCY = 'VND1000:1';
const templates = ref<any[]>([]);
const activeCode = ref('hot_1');
const loading = ref(false);
const rows = ref<any[]>([]);
const total = ref(0);
const query = reactive<any>({ pageNum: 1, pageSize: 10, templateCode: 'hot_1', status: 1 });

const sourceText = (source: number) => (['—', '平台开关', '全网排名添加', '手工添加'][source] ?? '—');

async function loadTemplates() {
  templates.value = ((await listTemplate(CURRENCY)) as unknown as any)?.data ?? [];
  if (templates.value.length && !templates.value.some((t) => t.templateCode === activeCode.value)) {
    activeCode.value = templates.value[0].templateCode;
  }
  query.templateCode = activeCode.value;
}

async function loadItems() {
  query.templateCode = activeCode.value;
  loading.value = true;
  try {
    const res: any = await listTemplateItem(query);
    rows.value = res.rows ?? [];
    total.value = res.total ?? 0;
  } finally {
    loading.value = false;
  }
}

async function setActive() {
  const tpl = templates.value.find((t) => t.templateCode === activeCode.value);
  if (!tpl) return;
  await setTemplateActive(tpl.id);
  ElMessage.success('已设为生效模板');
  await loadTemplates();
}

async function saveSort() {
  await sortTemplateItem(rows.value.map((r) => ({ id: r.id, sortOrder: r.sortOrder })));
  ElMessage.success('排序已保存');
}

async function removeItem(row: any) {
  await removeTemplateItem({ templateCode: activeCode.value, gameCode: row.gameCode });
  ElMessage.success('已移出模板');
  loadItems();
}

onMounted(async () => {
  await loadTemplates();
  loadItems();
});
</script>

<style scoped>
.toolbar {
  margin-bottom: 10px;
}
</style>
