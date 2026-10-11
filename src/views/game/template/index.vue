<template>
  <div class="p-2 app-container game-template-page">
    <el-card shadow="hover">
      <el-tabs v-if="!embedded" v-model="activeCode" @tab-change="loadItems">
        <el-tab-pane v-for="tpl in templates" :key="tpl.templateCode" :name="tpl.templateCode"
                     :label="tpl.templateName + (tpl.templateStatus === 1 ? '(生效中)' : '')" />
      </el-tabs>
      <div class="toolbar">
        <el-button v-hasPermi="['game:template:edit']" type="primary" icon="Plus" @click="openAddGame">新增游戏</el-button>
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

    <!-- 新增游戏：从子游戏目录中挑选并加入当前模板（后端 source=3 手工添加，幂等） -->
    <el-dialog v-model="addDialog.visible" :title="'新增游戏到「' + activeTemplateName + '」'" width="860px" append-to-body>
      <el-form inline>
        <el-form-item label="平台">
          <el-select v-model="addDialog.providerCode" placeholder="全部平台" clearable style="width: 180px" @change="searchGames">
            <el-option v-for="p in platformList" :key="p.providerCode" :label="p.platformName" :value="p.providerCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="子游戏">
          <el-input v-model="addDialog.keyword" placeholder="子游戏名称/ID" clearable style="width: 200px" @keyup.enter="searchGames" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="searchGames">搜索</el-button>
          <el-button icon="Refresh" @click="resetAddSearch">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="addDialog.loading" border height="360" :data="addDialog.rows" @selection-change="onAddSelectionChange">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="平台名称" align="center" prop="platformName" width="130" />
        <el-table-column label="子游戏ID" align="center" prop="gameCode" width="120" />
        <el-table-column label="子游戏名称" align="center" prop="gameName" min-width="160" />
        <el-table-column label="币种" align="center" prop="currency" width="110" />
        <el-table-column label="状态" align="center" width="90">
          <template #default="{ row }">{{ row.status === 1 ? '启用' : '停用' }}</template>
        </el-table-column>
      </el-table>
      <pagination v-show="addDialog.total > 0" v-model:page="addDialog.query.pageNum" v-model:limit="addDialog.query.pageSize"
                  :total="addDialog.total" @pagination="loadGames" />
      <template #footer>
        <span class="selected-tip">已选 {{ addDialog.selected.length }} 个</span>
        <el-button type="primary" :loading="addDialog.saving" @click="confirmAdd">确 定</el-button>
        <el-button @click="addDialog.visible = false">取 消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  listTemplate, listTemplateItem, setTemplateActive, sortTemplateItem, removeTemplateItem, addTemplateItems,
  listSubGame, platformOptions as fetchPlatformOptions,
} from '@/api/game/manage';

defineOptions({ name: 'GameTemplate' });

/**
 * 嵌入模式（被「游戏管理」页的 4 个模板页签复用）：
 * 传入 templateCode 时隐藏本页自己的页签条，只渲染该模板的内容；设为生效后通知父页刷新页签标题。
 */
const props = defineProps<{ templateCode?: string; embedded?: boolean }>();
const emit = defineEmits<{ (e: 'active-changed'): void }>();

const CURRENCY = 'VND1000:1';
const templates = ref<any[]>([]);
const activeCode = ref(props.templateCode || 'hot_1');
const loading = ref(false);
const rows = ref<any[]>([]);
const total = ref(0);
const query = reactive<any>({ pageNum: 1, pageSize: 10, templateCode: 'hot_1', status: 1 });

const sourceText = (source: number) => (['—', '平台开关', '全网排名添加', '手工添加'][source] ?? '—');

/** 当前页签的模板名（弹窗标题用） */
const activeTemplateName = computed(
  () => templates.value.find((t) => t.templateCode === activeCode.value)?.templateName ?? activeCode.value,
);

/** 新增游戏弹窗状态 */
const platformList = ref<any[]>([]);
const addDialog = reactive<any>({
  visible: false, loading: false, saving: false, providerCode: '', keyword: '',
  rows: [], total: 0, selected: [],
  query: { pageNum: 1, pageSize: 10 },
});

/** 打开弹窗：每次都重新拉平台下拉与首页数据，避免展示过期目录 */
async function openAddGame() {
  addDialog.visible = true;
  addDialog.providerCode = '';
  addDialog.keyword = '';
  addDialog.selected = [];
  addDialog.query.pageNum = 1;
  if (!platformList.value.length) {
    platformList.value = ((await fetchPlatformOptions()) as unknown as any)?.data ?? [];
  }
  await loadGames();
}

/** 子游戏目录分页（复用「子游戏管理」列表接口，字段口径天然一致） */
async function loadGames() {
  addDialog.loading = true;
  try {
    const res: any = await listSubGame({
      pageNum: addDialog.query.pageNum,
      pageSize: addDialog.query.pageSize,
      providerCode: addDialog.providerCode || undefined,
      gameField: 'GAME_NAME',
      gameValue: addDialog.keyword || undefined,
    });
    addDialog.rows = res.rows ?? [];
    addDialog.total = res.total ?? 0;
  } finally {
    addDialog.loading = false;
  }
}

function searchGames() {
  addDialog.query.pageNum = 1;
  loadGames();
}

function resetAddSearch() {
  addDialog.providerCode = '';
  addDialog.keyword = '';
  searchGames();
}

function onAddSelectionChange(rows: any[]) {
  addDialog.selected = rows;
}

async function confirmAdd() {
  if (!addDialog.selected.length) {
    ElMessage.warning('请先勾选要加入模板的子游戏');
    return;
  }
  addDialog.saving = true;
  try {
    const res: any = await addTemplateItems({
      templateCode: activeCode.value,
      gameCodes: addDialog.selected.map((r: any) => r.gameCode),
    });
    const data = res?.data ?? {};
    ElMessage.success(`已新增 ${data.added ?? 0} 个，已在模板中跳过 ${data.skipped ?? 0} 个`);
    addDialog.visible = false;
    await loadItems();
  } finally {
    addDialog.saving = false;
  }
}

async function loadTemplates() {
  const list = ((await listTemplate(CURRENCY)) as unknown as any)?.data ?? [];
  templates.value = list;
  // 嵌入模式（被「游戏管理」页的 4 个模板页签复用）：页签由父页管理，
  // 这里只填充模板主数据（弹窗标题 / 设为生效要用），**不能**改写 activeCode，否则会把父页选中的页签顶掉
  if (props.embedded) {
    return;
  }
  if (list.length && !list.some((t: any) => t.templateCode === activeCode.value)) {
    activeCode.value = list[0].templateCode;
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
  if (!tpl) {
    ElMessage.warning('模板不存在，请刷新页面');
    return;
  }
  await setTemplateActive(tpl.id);
  ElMessage.success('已设为生效模板');
  await loadTemplates();
  emit('active-changed');
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

// 页签切换时同一组件实例会被复用（v-else-if 分支不变），必须监听 templateCode 变化重新取数
watch(() => props.templateCode, (code) => {
  if (!code) return;
  activeCode.value = code;
  query.pageNum = 1;
  loadItems();
});
</script>

<style scoped>
.toolbar {
  margin-bottom: 10px;
}

.selected-tip {
  float: left;
  line-height: 32px;
  color: var(--el-text-color-secondary);
}
</style>
