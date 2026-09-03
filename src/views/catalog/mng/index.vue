<template>
  <div class="p-2 app-container catalog-mng-page">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- ============ 游戏目录 ============ -->
      <el-tab-pane label="游戏目录" name="game">
        <div class="search-wrap">
          <el-card shadow="hover" class="search-panel">
            <el-form ref="queryFormRef" :model="queryParams" :inline="true" class="query-form">
              <el-form-item label="游戏名称" prop="gameName">
                <el-input v-model="queryParams.gameName" placeholder="游戏名称" clearable @keyup.enter="handleQuery" />
              </el-form-item>
              <el-form-item label="游戏编码" prop="gameCode">
                <el-input v-model="queryParams.gameCode" placeholder="如 kts_9848" clearable @keyup.enter="handleQuery" />
              </el-form-item>
              <el-form-item label="类型" prop="gameType">
                <el-select v-model="queryParams.gameType" placeholder="全部" clearable style="width: 140px">
                  <el-option v-for="(label, value) in gameTypeMap" :key="value" :label="label" :value="Number(value)" />
                </el-select>
              </el-form-item>
              <el-form-item label="状态" prop="status">
                <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 100px">
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
        </div>

        <el-card shadow="hover" class="table-panel">
          <template #header>
            <div class="toolbar-shell">
              <div class="table-heading">
                <h3>游戏目录列表</h3>
              </div>
              <div class="toolbar-actions">
                <el-button v-hasPermi="['catalog:game:add']" type="primary" plain icon="Plus" @click="handleAdd">新增</el-button>
                <el-button v-hasPermi="['catalog:game:edit']" type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()">
                  修改
                </el-button>
                <el-button v-hasPermi="['catalog:game:remove']" type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()">
                  删除
                </el-button>
                <right-toolbar v-model:show-search="showSearch" :search="false" @query-table="getList" />
              </div>
            </div>
          </template>

          <el-table v-loading="loading" border class="data-table" :data="gameList" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column label="ID" align="center" prop="id" width="80" />
            <el-table-column label="业务ID" align="center" prop="gameId" width="90" />
            <el-table-column label="编码" align="center" prop="gameCode" min-width="130" />
            <el-table-column label="中文名" align="center" prop="gameName" min-width="120" />
            <el-table-column label="越南文" align="center" prop="gameNameVn" min-width="120" />
            <el-table-column label="类型" align="center" width="80">
              <template #default="{ row }">{{ gameTypeMap[row.gameType] || row.gameType }}</template>
            </el-table-column>
            <el-table-column label="提供商" align="center" prop="providerCode" width="120" />
            <el-table-column label="排序" align="center" prop="sortOrder" width="80" />
            <el-table-column label="状态" align="center" width="90">
              <template #default="{ row }">
                <el-switch :model-value="row.status === 1" @change="val => handleStatusChange(row, val)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="130" fixed="right">
              <template #default="{ row }">
                <el-tooltip content="修改" placement="top">
                  <el-button v-hasPermi="['catalog:game:edit']" link type="primary" icon="Edit" @click="handleUpdate(row)" />
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-button v-hasPermi="['catalog:game:remove']" link type="primary" icon="Delete" @click="handleDelete(row)" />
                </el-tooltip>
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

        <el-dialog v-model="dialog.visible" :title="dialog.title" width="640px" append-to-body>
          <el-form ref="gameFormRef" :model="form" :rules="rules" label-width="110px">
            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="业务ID" prop="gameId">
                  <el-input-number v-model="form.gameId" :min="1" controls-position="right" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="游戏编码" prop="gameCode">
                  <el-input v-model="form.gameCode" placeholder="如 kts_9848" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="中文名称" prop="gameName">
                  <el-input v-model="form.gameName" placeholder="中文名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="越南文名称" prop="gameNameVn">
                  <el-input v-model="form.gameNameVn" placeholder="越南文名称" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="游戏类型" prop="gameType">
                  <el-select v-model="form.gameType" style="width: 100%">
                    <el-option v-for="(label, value) in gameTypeMap" :key="value" :label="label" :value="Number(value)" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="提供商" prop="providerCode">
                  <el-input v-model="form.providerCode" placeholder="INHOUSE / EVO ..." />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="NGame ID" prop="ngameId">
                  <el-input v-model="form.ngameId" placeholder="第三方游戏ID" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="启动模式" prop="launchMode">
                  <el-select v-model="form.launchMode" style="width: 100%">
                    <el-option label="H5" :value="1" />
                    <el-option label="APP" :value="2" />
                    <el-option label="两者" :value="3" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="客户端掩码" prop="clientTypeMask">
                  <el-input-number v-model="form.clientTypeMask" :min="0" controls-position="right" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="排序权重" prop="sortOrder">
                  <el-input-number v-model="form.sortOrder" :min="0" controls-position="right" style="width: 100%" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="状态" prop="status">
                  <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
          <template #footer>
            <div class="dialog-footer">
              <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
              <el-button @click="cancel">取 消</el-button>
            </div>
          </template>
        </el-dialog>
      </el-tab-pane>

      <!-- ============ 8go88 客户端配置 ============ -->
      <el-tab-pane label="8go88 客户端配置" name="config">
        <el-card shadow="hover" class="table-panel">
          <template #header>
            <div class="toolbar-shell">
              <div class="table-heading">
                <h3>8go88.bin 配置项</h3>
                <span class="text-gray-400 text-sm">{{ info.filePath }}</span>
              </div>
              <div class="toolbar-actions">
                <el-button type="warning" plain icon="Refresh" :loading="syncing" @click="handleSync">从 8go88.bin 同步</el-button>
                <el-button v-hasPermi="['catalog:client-config:save']" type="primary" icon="Check" :loading="savingFile" @click="handleSaveFile">
                  保存并加密回写
                </el-button>
              </div>
            </div>
          </template>

          <div class="mb-3 flex flex-wrap items-center gap-4 text-sm">
            <el-tag :type="info.exists ? 'success' : 'danger'">{{ info.exists ? '文件存在' : '文件不存在' }}</el-tag>
            <span>大小：{{ info.size ?? '-' }}</span>
            <span>库内配置项：{{ items.length }}</span>
          </div>

          <el-table v-loading="configLoading" border class="data-table" :data="items" max-height="600">
            <el-table-column label="键" align="left" prop="configKey" min-width="220" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="font-mono">{{ row.configKey }}</span>
              </template>
            </el-table-column>
            <el-table-column label="类型" align="center" width="90">
              <template #default="{ row }">
                <el-tag size="small">{{ row.valueType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="属性说明" align="left" prop="description" min-width="260" show-overflow-tooltip />
            <el-table-column label="值预览" align="left" min-width="260">
              <template #default="{ row }">
                <span class="font-mono text-xs">{{ preview(row.configValue) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="120" fixed="right">
              <template #default="{ row }">
                <el-tooltip content="编辑值/说明" placement="top">
                  <el-button link type="primary" icon="Edit" @click="openConfigDialog(row as ClientConfigItem)" />
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-dialog v-model="configDialog.visible" :title="'配置项 - ' + configDialog.row?.configKey" width="720px" append-to-body top="6vh">
          <el-form label-width="80px">
            <el-form-item label="类型">
              <el-tag>{{ configDialog.row?.valueType }}</el-tag>
            </el-form-item>
            <el-form-item label="属性说明">
              <el-input v-model="configText.description" type="textarea" :rows="2" placeholder="该配置的作用说明（结合客户端代码确认后维护）" />
            </el-form-item>
            <el-form-item label="配置值">
              <el-input v-model="configText.value" type="textarea" :rows="16" class="font-mono" />
            </el-form-item>
          </el-form>
          <template #footer>
            <div class="dialog-footer">
              <el-button @click="formatConfigValue">格式化</el-button>
              <el-button type="primary" @click="confirmConfigDialog">确 定</el-button>
              <el-button @click="configDialog.visible = false">取 消</el-button>
            </div>
          </template>
        </el-dialog>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup name="CatalogMng" lang="ts">
import {
  addGameCatalog,
  changeGameCatalogStatus,
  delGameCatalog,
  getGameCatalog,
  listGameCatalog,
  updateGameCatalog
} from '@/api/catalog/game';
import type { GameCatalogForm, GameCatalogQuery, GameCatalogVO } from '@/api/catalog/game/types';
import {
  getClientConfigInfo,
  listClientConfigItems,
  saveClientConfig,
  syncClientConfig
} from '@/api/catalog/client-config';
import type { ClientConfigInfo, ClientConfigItem } from '@/api/catalog/client-config/types';
import { useLoading } from '@/hooks/async/useLoading';
import { useFormDialog } from '@/hooks/dialog/useFormDialog';
import { useSearchReset } from '@/hooks/form/useSearchReset';
import { useTableSelection } from '@/hooks/table/useTableSelection';
import modal from '@/plugins/modal';
import { reactive, ref } from 'vue';

const gameTypeMap: Record<string, string> = {
  1: '棋牌',
  2: '彩票',
  3: '真人',
  4: '电子',
  5: '体育',
  6: '捕鱼'
};

const activeTab = ref('game');
const showSearch = ref(true);
const gameList = ref<GameCatalogVO[]>([]);
const total = ref(0);
const buttonLoading = ref(false);
const { loading, withLoading } = useLoading(true);
const queryFormRef = ref();
const gameFormRef = ref();

const initFormData: GameCatalogForm = {
  id: undefined,
  gameId: undefined,
  gameCode: undefined,
  gameName: undefined,
  gameNameVn: undefined,
  ngameId: undefined,
  gameType: 4,
  providerCode: 'INHOUSE',
  status: 1,
  clientTypeMask: 0,
  launchMode: 3,
  sortOrder: 0
};
const data = reactive<{ queryParams: GameCatalogQuery; form: GameCatalogForm; rules: any }>({
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    gameName: undefined,
    gameCode: undefined,
    gameType: undefined,
    providerCode: undefined,
    status: undefined,
    params: undefined
  },
  form: { ...initFormData },
  rules: {
    gameId: [{ required: true, message: '业务ID不能为空', trigger: 'blur' }],
    gameCode: [{ required: true, message: '游戏编码不能为空', trigger: 'blur' }],
    gameName: [{ required: true, message: '中文名称不能为空', trigger: 'blur' }],
    gameType: [{ required: true, message: '游戏类型不能为空', trigger: 'change' }]
  }
});
const { queryParams, form, rules } = toRefs(data);
const { ids, single, multiple, handleSelectionChange } = useTableSelection<GameCatalogVO>(item => item.id);
const {
  dialog,
  resetForm: reset,
  openDialog,
  showDialog,
  closeDialog
} = useFormDialog({
  form,
  formRef: gameFormRef,
  initialFormData: initFormData
});

const getList = async () => {
  await withLoading(async () => {
    const res = await listGameCatalog(queryParams.value);
    gameList.value = res.data?.rows || [];
    total.value = res.data?.total || 0;
  });
};

const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
};

const { resetQuery } = useSearchReset({
  queryFormRef,
  queryParams,
  pageNumKey: 'pageNum',
  afterReset: () => handleQuery()
});

const handleAdd = () => {
  openDialog('添加游戏');
};

const handleUpdate = async (row?: Partial<GameCatalogVO>) => {
  reset();
  const gameId = row?.id || ids.value[0];
  if (!gameId) return;
  const res = await getGameCatalog(gameId);
  Object.assign(form.value, res.data);
  showDialog('修改游戏');
};

const submitForm = () => {
  gameFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return;
    buttonLoading.value = true;
    try {
      if (form.value.id) {
        await updateGameCatalog(form.value);
      } else {
        await addGameCatalog(form.value);
      }
      modal.msgSuccess('操作成功');
      closeDialog();
      await getList();
    } finally {
      buttonLoading.value = false;
    }
  });
};

const cancel = () => {
  reset();
  closeDialog();
};

const handleDelete = async (row?: Partial<GameCatalogVO>) => {
  const delIds = row?.id || ids.value;
  await modal.confirm('是否确认删除选中的游戏目录？');
  await delGameCatalog(delIds);
  modal.msgSuccess('删除成功');
  await getList();
};

const handleStatusChange = async (row: GameCatalogVO, val: string | number | boolean) => {
  const status = val ? 1 : 0;
  try {
    await changeGameCatalogStatus(row.id as string | number, status);
    modal.msgSuccess('操作成功');
    row.status = status;
  } catch (e) {
    modal.msgError('操作失败');
  }
};

// ---------- 8go88 客户端配置 ----------
const info = reactive<ClientConfigInfo>({ filePath: '', exists: false });
const items = ref<ClientConfigItem[]>([]);
const syncing = ref(false);
const savingFile = ref(false);
const configLoading = ref(false);
const configDialog = reactive<{ visible: boolean; row: ClientConfigItem | null }>({ visible: false, row: null });
const configText = reactive<{ description: string; value: string }>({ description: '', value: '' });

const loadConfigInfo = async () => {
  const res = await getClientConfigInfo();
  Object.assign(info, res.data);
};

const loadConfigItems = async () => {
  configLoading.value = true;
  try {
    const res = await listClientConfigItems();
    items.value = res.data || [];
  } finally {
    configLoading.value = false;
  }
};

const handleSync = async () => {
  syncing.value = true;
  try {
    const res = await syncClientConfig();
    items.value = res.data || [];
    await loadConfigInfo();
    modal.msgSuccess('同步完成');
  } finally {
    syncing.value = false;
  }
};

const preview = (value?: string) => {
  if (!value) return '';
  return value.length > 160 ? value.slice(0, 160) + '...' : value;
};

const openConfigDialog = (row: ClientConfigItem) => {
  configDialog.row = row;
  configText.description = row.description || '';
  configText.value = row.configValue || '';
  configDialog.visible = true;
};

const formatConfigValue = () => {
  try {
    configText.value = JSON.stringify(JSON.parse(configText.value), null, 2);
  } catch (e) {
    modal.msgError('JSON 格式不正确');
  }
};

const confirmConfigDialog = () => {
  try {
    const parsed = JSON.parse(configText.value);
    if (configDialog.row) {
      configDialog.row.configValue = JSON.stringify(parsed);
      configDialog.row.description = configText.description;
      configDialog.row.valueType = Array.isArray(parsed) ? 'array' : parsed === null ? 'null' : typeof parsed;
    }
    configDialog.visible = false;
    modal.msgSuccess('已暂存，点击“保存并加密回写”后生效');
  } catch (e) {
    modal.msgError('JSON 格式不正确');
  }
};

const handleSaveFile = async () => {
  if (!info.exists) {
    await modal.confirm('本地 8go88.bin 不存在，是否仍按库内配置生成新文件？');
  } else {
    await modal.confirm('将加密覆盖 ' + info.filePath + '（自动保留 .bak 备份），确认？');
  }
  savingFile.value = true;
  try {
    const res = await saveClientConfig({
      items: items.value.map(item => ({
        ...item,
        configValue: item.configValue || 'null'
      })),
      writeFile: true
    });
    Object.assign(info, res.data);
    modal.msgSuccess('已加密回写 8go88.bin');
  } finally {
    savingFile.value = false;
  }
};

onMounted(() => {
  getList();
  loadConfigInfo();
  loadConfigItems();
});
</script>
